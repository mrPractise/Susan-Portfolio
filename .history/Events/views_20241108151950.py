from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib import messages
from django.urls import reverse
from django.views.decorators.http import require_http_methods, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from decimal import Decimal
import calendar
import json
import logging
from datetime import datetime, timedelta

from .models import Event, TicketType, Booking, BookingTicket, GalleryCategory, MediaItem
from .credentials import MpesaCredential
from .mpesa_utils import format_phone_number, MpesaPaymentHandler, handle_mpesa_callback


from django.core.paginator import Paginator


logger = logging.getLogger(__name__)

def events(request):
    """View for displaying events with calendar integration."""
    try:
        today = timezone.now().date()
        current_month = int(request.GET.get('month', today.month))
        current_year = int(request.GET.get('year', today.year))
        
        cal = calendar.monthcalendar(current_year, current_month)
        month_name = calendar.month_name[current_month]
        
        month_start = datetime(current_year, current_month, 1).date()
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        calendar_events = Event.objects.filter(
            date__range=[month_start, month_end],
            is_active=True
        ).values(
            'id', 'title', 'slug', 'date', 'start_time', 'end_time', 'venue'
        )
        
        calendar_data = []
        for week in cal:
            week_data = []
            for day in week:
                if day != 0:
                    current_date = datetime(current_year, current_month, day).date()
                    day_events = [
                        {
                            'id': event['id'],
                            'title': event['title'],
                            'slug': event['slug'],
                            'start_time': event['start_time'].strftime('%I:%M %p'),
                            'end_time': event['end_time'].strftime('%I:%M %p'),
                            'venue': event['venue']
                        }
                        for event in calendar_events
                        if event['date'] == current_date
                    ]
                    week_data.append({
                        'day': day,
                        'events': day_events,
                        'is_today': current_date == today,
                        'is_past': current_date < today
                    })
                else:
                    week_data.append({'day': 0, 'events': []})
            calendar_data.append(week_data)

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'success',
                'calendar_data': calendar_data,
                'month_name': month_name,
                'year': current_year
            })

        upcoming_events = Event.objects.filter(
            is_active=True,
            date__gte=today
        ).select_related().prefetch_related('ticket_types').order_by('date', 'start_time')
        
        context = {
            'upcoming_events': upcoming_events,
            'calendar_data': calendar_data,
            'month_name': month_name,
            'year': current_year,
            'month': current_month
        }
        
        return render(request, 'events/events.html', context)

    except Exception as e:
        print(f"Error in events view: {str(e)}")
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to update calendar'
            }, status=500)
        
        messages.error(request, 'An error occurred while loading the events page.')
        return redirect('home')

def event_detail(request, slug):
    """View for displaying event details."""
    try:
        event = Event.objects.prefetch_related('ticket_types').get(
            slug=slug,
            is_active=True
        )
        
        ticket_types = event.ticket_types.all()
        
        total_sold = sum(tt.capacity - tt.available_tickets for tt in ticket_types)
        total_remaining = event.max_capacity - total_sold
        
        is_past = event.date < timezone.now().date()
        
        context = {
            'event': event,
            'ticket_types': ticket_types,
            'is_sold_out': event.is_sold_out,
            'is_past': is_past,
            'total_sold': total_sold,
            'total_remaining': total_remaining,
            'capacity_percentage': (total_sold / event.max_capacity * 100) 
                                 if event.max_capacity > 0 else 0
        }
        
        return render(request, 'events/event-detail.html', context)
        
    except Event.DoesNotExist:
        messages.error(request, "Event not found.")
        return redirect('events')

def process_booking(request, slug):
    """Handle the ticket booking process."""
    event = get_object_or_404(Event, slug=slug, is_active=True)
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                if event.is_sold_out:
                    raise ValidationError("Sorry, this event is sold out.")
                
                if event.date < timezone.now().date():
                    raise ValidationError("This event has already taken place.")
                
                selected_tickets = {}
                total_amount = Decimal('0.00')
                
                for key, value in request.POST.items():
                    if key.startswith('ticket_') and int(value) > 0:
                        ticket_id = int(key.replace('ticket_', ''))
                        quantity = int(value)
                        
                        ticket_type = get_object_or_404(TicketType, id=ticket_id, event=event)
                        
                        if quantity > ticket_type.available_tickets:
                            raise ValidationError(
                                f"Sorry, only {ticket_type.available_tickets} tickets "
                                f"remaining for {ticket_type.name}"
                            )
                        
                        if quantity < ticket_type.minimum_purchase:
                            raise ValidationError(
                                f"Minimum purchase for {ticket_type.name} is "
                                f"{ticket_type.minimum_purchase} tickets"
                            )
                        
                        if quantity > ticket_type.maximum_purchase:
                            raise ValidationError(
                                f"Maximum purchase for {ticket_type.name} is "
                                f"{ticket_type.maximum_purchase} tickets"
                            )
                        
                        selected_tickets[ticket_type] = quantity
                        total_amount += ticket_type.price * quantity
                
                if not selected_tickets:
                    raise ValidationError("Please select at least one ticket.")
                
                request.session['booking_info'] = {
                    'event_id': event.id,
                    'tickets': {str(tt.id): qty for tt, qty in selected_tickets.items()},
                    'total_amount': str(total_amount)
                }
                
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': True,
                        'redirect_url': reverse('events:payment', kwargs={'slug': slug})
                    })
                
                return redirect('payment', slug=slug)
                
        except ValidationError as e:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': str(e)
                })
            messages.error(request, str(e))
            return redirect('event-detail', slug=slug)
        
        except Exception as e:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'message': "An error occurred. Please try again."
                })
            messages.error(request, "An error occurred. Please try again.")
            return redirect('event-detail', slug=slug)
    
    return redirect('event-detail', slug=slug)

@require_http_methods(["POST"])
def check_ticket_availability(request, event_id):
    """AJAX view for checking ticket availability."""
    try:
        event = Event.objects.get(id=event_id, is_active=True)
        ticket_types = event.ticket_types.all()
        
        availability_data = {
            str(tt.id): {
                'available': tt.available_tickets,
                'is_sold_out': tt.is_sold_out
            }
            for tt in ticket_types
        }
        
        return JsonResponse({
            'status': 'success',
            'data': availability_data
        })
    except Event.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Event not found'
        }, status=404)

def payment_page(request, slug):
    """Display the payment page with order summary."""
    event = get_object_or_404(Event, slug=slug, is_active=True)
    
    booking_info = request.session.get('booking_info')
    if not booking_info:
        messages.error(request, "No booking information found.")
        return redirect('events:event-detail', slug=slug)
    
    selected_tickets = []
    total_amount = Decimal('0.00')
    
    for ticket_id, quantity in booking_info['tickets'].items():
        ticket_type = get_object_or_404(TicketType, id=ticket_id)
        subtotal = ticket_type.price * int(quantity)
        selected_tickets.append({
            'ticket_type': ticket_type,
            'quantity': quantity,
            'subtotal': subtotal
        })
        total_amount += subtotal
    
    context = {
        'event': event,
        'selected_tickets': selected_tickets,
        'total_amount': total_amount
    }
    
    return render(request, 'mpesa/payment.html', context)

def process_payment(request, slug):
    """Handle the M-PESA payment initiation."""
    if request.method != 'POST':
        return redirect('payment', slug=slug)
    
    try:
        event = get_object_or_404(Event, slug=slug)
        booking_info = request.session.get('booking_info')
        
        if not booking_info:
            messages.error(request, "No booking information found.")
            return redirect('event-detail', slug=slug)
        
        phone = request.POST.get('phone')
        if not phone:
            messages.error(request, "Please provide a phone number.")
            return redirect('payment', slug=slug)
        
        formatted_phone = format_phone_number(phone)
        
        with transaction.atomic():
            booking = Booking.objects.create(
                event=event,
                phone=formatted_phone,
                status='pending',
                total_amount=Decimal(booking_info['total_amount'])
            )
            
            for ticket_id, quantity in booking_info['tickets'].items():
                ticket_type = TicketType.objects.get(id=ticket_id)
                BookingTicket.objects.create(
                    booking=booking,
                    ticket_type=ticket_type,
                    quantity=quantity,
                    unit_price=ticket_type.price
                )

            payment_handler = MpesaPaymentHandler(request, MpesaCredential())
            response = payment_handler.prepare_stk_push(booking, formatted_phone)
            
            del request.session['booking_info']
            
            return payment_handler.handle_response(response, booking, slug)
            
    except Exception as e:
        error_message = str(e) if str(e) else "An error occurred. Please try again."
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': False,
                'message': error_message
            })
        
        messages.error(request, error_message)
        return redirect('payment', slug=slug)

@require_POST
def initiate_stk_push(request, booking_id):
    """Initiate M-Pesa STK Push payment"""
    try:
        booking = get_object_or_404(Booking, id=booking_id, status='pending')
        phone = format_phone_number(request.POST.get('phone', '').strip())
        
        payment_handler = MpesaPaymentHandler(request, MpesaCredential())
        response = payment_handler.prepare_stk_push(booking, phone)
        
        request.session[f'mpesa_booking_{booking.id}'] = {
            'phone': phone,
            'amount': str(booking.total_amount)
        }
        
        return payment_handler.handle_response(response, booking)

    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        })

@csrf_exempt
def callback(request):
    """Handle M-Pesa callback"""
    try:
        data = json.loads(request.body)
        result = data['Body']['stkCallback']
        
        booking_id = result['AccountReference'].replace('EVENT', '')
        booking = get_object_or_404(Booking, id=booking_id)
        
        response = handle_mpesa_callback(booking, result)
        
        request.session.pop(f'mpesa_booking_{booking.id}', None)
        
        return JsonResponse(response)
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })

def booking_confirmation(request, booking_id):
    """Display booking confirmation page."""
    booking = get_object_or_404(Booking, id=booking_id)
    return render(request, 'events/booking-confirmation.html', {
        'booking': booking,
        'event': booking.event,
        'tickets': booking.tickets.all()
    })
    
    
    
# Gallery Pages


def events_gallery(request):
    # Get active categories
    categories = GalleryCategory.objects.all()
    default_category = categories.filter(is_default=True).first()

    # Get selected category from query params
    category_slug = request.GET.get('category', default_category.slug if default_category else None)
    
    # Base queryset
    media_items = MediaItem.objects.filter(is_active=True)
    
    # Apply category filter if specified
    if category_slug and category_slug != 'all':
        media_items = media_items.filter(categories__slug=category_slug)

    # Pagination
    page = request.GET.get('page', 1)
    items_per_page = 12
    paginator = Paginator(media_items, items_per_page)
    current_page = paginator.get_page(page)

    context = {
        'categories': categories,
        'media_items': current_page,
        'current_category': category_slug,
        'has_next': current_page.has_next(),
    }

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        # Return JSON for AJAX requests (load more functionality)
        items_data = [{
            'id': item.id,
            'title': item.title,
            'date': item.event_date.strftime('%B %d, %Y'),
            'media_type': item.media_type,
            'thumbnail_url': item.thumbnail.url if item.thumbnail else item.file.url,
            'file_url': item.file.url,
        } for item in current_page]

        return JsonResponse({
            'items': items_data,
            'has_next': current_page.has_next(),
            'next_page': current_page.next_page_number() if current_page.has_next() else None,
        })

    return render(request, 'events/event-gallery.html', context)