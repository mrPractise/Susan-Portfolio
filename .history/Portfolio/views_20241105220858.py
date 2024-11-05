from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.db.models import Q
from .models import *
from datetime import datetime
import json
from django.views.generic import ListView, DetailView
from django.utils import timezone

from .forms import ContactForm
import calendar
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
import logging
from django.contrib import messages
from django.core.mail import send_mail, EmailMultiAlternatives
from django.http import JsonResponse
from django.utils.html import strip_tags
from django.http import HttpResponseRedirect
from django.views.decorators.csrf import csrf_protect
from django.core.exceptions import ValidationError

from django.core.paginator import Paginator
from django.shortcuts import render
from django.db.models import F
from django.db.models import Count
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db import transaction
from django.urls import reverse
from decimal import Decimal


from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .credentials import MpesaCredential
from .utils import format_phone_number,MpesaPaymentHandler, handle_mpesa_callback
import requests


# Add this at the start of your views.py or in a convenient place
from pyngrok import ngrok
# Start ngrok
public_url = ngrok.connect(8000)
print(f"Public URL: {public_url}")  # Copy this URL




logger = logging.getLogger(__name__)

def home(request):
    return render(request, 'home.html')


def portfolio(request):
    form = ContactForm()
    return render(request, 'portfolio.html',{'form': form})

def project_list(request):
    """View for displaying projects with filtering and pagination."""
    # Get parameters with defaults
    category_slug = request.GET.get('category')
    view_type = request.GET.get('view', 'grid')
    page = request.GET.get('page', 1)
    
    # Base queryset with optimized loading
    projects = (Project.objects
               .select_related('category')
               .defer('video_duration')  # Defer heavy fields not needed for listing
               .distinct())
    
    # Filter by category if specified
    if category_slug and category_slug != 'all':
        projects = projects.filter(category__slug=category_slug)
    
    # Add debug logging
    if settings.DEBUG:
        print(f"Query SQL: {projects.query}")
        print(f"Total projects before pagination: {projects.count()}")
        print("Project IDs:", list(projects.values_list('id', flat=True)))
    
    # Pagination with error handling
    paginator = Paginator(projects, 12)
    try:
        page_obj = paginator.page(page)
    except PageNotAnInteger:
        page_obj = paginator.page(1)
    except EmptyPage:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'html': '', 'has_next': False})
        page_obj = paginator.page(paginator.num_pages)
    
    # Get categories with accurate counts
    categories = (ProjectCategory.objects
                 .annotate(project_count=Count('projects', distinct=True))
                 .order_by('order', 'name'))
    
    context = {
        'categories': categories,
        'projects': page_obj,
        'current_category': category_slug or 'all',
        'current_view': view_type,
        'is_paginated': paginator.num_pages > 1,
        'current_page': page_obj.number,
        'total_pages': paginator.num_pages
    }
    
    # Handle AJAX requests
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        html = render_to_string(
            'partials/project_grid.html',
            {'projects': page_obj},
            request=request
        )
        
        response_data = {
            'html': html,
            'has_next': page_obj.has_next(),
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages
        }
        
        if settings.DEBUG:
            response_data['debug'] = {
                'total_projects': projects.count(),
                'page_number': page_obj.number,
                'project_ids': [p.id for p in page_obj],
                'project_types': [{'id': p.id, 'type': p.media_type} for p in page_obj]
            }
        
        return JsonResponse(response_data)
    
    return render(request, 'projects.html', context)


def check_for_duplicates():
    """Utility function to check for duplicate projects in the database"""
    duplicates = (Project.objects
                 .values('title', 'category')
                 .annotate(count=Count('id'))
                 .filter(count__gt=1))
    
    if duplicates.exists():
        print("Warning: Duplicate projects found:")
        for dup in duplicates:
            print(f"Title: {dup['title']}, Category: {dup['category']}, Count: {dup['count']}")
        
        # Get the actual duplicate records
        for dup in duplicates:
            dups = Project.objects.filter(title=dup['title'], category=dup['category'])
            print(f"\nDetails for {dup['title']}:")
            for p in dups:
                print(f"ID: {p.id}, Created: {p.created_date}, Featured: {p.featured}")
    
    return duplicates.exists()


def events(request):
    """View for displaying events with calendar integration."""
    try:
        # Get current date info
        today = timezone.now().date()
        current_month = int(request.GET.get('month', today.month))
        current_year = int(request.GET.get('year', today.year))
        
        # Get calendar data
        cal = calendar.monthcalendar(current_year, current_month)
        month_name = calendar.month_name[current_month]
        
        # Get first and last day of month
        month_start = datetime(current_year, current_month, 1).date()
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        # Get events for the month
        calendar_events = Event.objects.filter(
            date__range=[month_start, month_end],
            is_active=True
        ).values(
            'id', 
            'title', 
            'slug', 
            'date', 
            'start_time', 
            'end_time',
            'venue'
        )
        
        # Create calendar data structure
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

        # Handle AJAX requests for calendar navigation
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'success',
                'calendar_data': calendar_data,
                'month_name': month_name,
                'year': current_year
            })

        # For regular page load, get upcoming events
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
        
        return render(request, 'events.html', context)

    except Exception as e:
        # Log the error for debugging
        print(f"Error in events view: {str(e)}")
        
        # If it's an AJAX request, return error response
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to update calendar'
            }, status=500)
        
        # For regular requests, you might want to render an error page
        # or redirect to a different page
        messages.error(request, 'An error occurred while loading the events page.')
        return redirect('home')  # or render an error template



















def process_booking(request, slug):
    """Handle the ticket booking process."""
    event = get_object_or_404(Event, slug=slug, is_active=True)
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Validate event is still available
                if event.is_sold_out:
                    raise ValidationError("Sorry, this event is sold out.")
                
                if event.date < timezone.now().date():
                    raise ValidationError("This event has already taken place.")
                
                # Process ticket selections
                selected_tickets = {}
                total_amount = Decimal('0.00')
                
                # Get all ticket types and their quantities from the form
                for key, value in request.POST.items():
                    if key.startswith('ticket_') and int(value) > 0:
                        ticket_id = int(key.replace('ticket_', ''))
                        quantity = int(value)
                        
                        ticket_type = get_object_or_404(TicketType, id=ticket_id, event=event)
                        
                        # Validate availability
                        if quantity > ticket_type.available_tickets:
                            raise ValidationError(
                                f"Sorry, only {ticket_type.available_tickets} tickets "
                                f"remaining for {ticket_type.name}"
                            )
                        
                        # Validate purchase limits
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
                
                # Store booking info in session for payment processing
                request.session['booking_info'] = {
                    'event_id': event.id,
                    'tickets': {str(tt.id): qty for tt, qty in selected_tickets.items()},
                    'total_amount': str(total_amount)
                }
                
                # Handle AJAX and regular requests differently
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': True,
                        'redirect_url': reverse('payment', kwargs={'slug': slug})
                    })
                
                # Redirect to payment page for regular form submission
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
    
    # If not POST, redirect back to event detail
    return redirect('event-detail', slug=slug)

def event_detail(request, slug):
    """View for displaying event details."""
    try:
        event = Event.objects.prefetch_related('ticket_types').get(
            slug=slug,
            is_active=True
        )
        
        # Get available ticket types
        ticket_types = event.ticket_types.all()
        
        # Calculate totals
        total_sold = sum(tt.capacity - tt.available_tickets for tt in ticket_types)
        total_remaining = event.max_capacity - total_sold
        
        # Check if event has passed
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
        
        return render(request, 'event-detail.html', context)
        
    except Event.DoesNotExist:
        messages.error(request, "Event not found.")
        return redirect('events')


    
    
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
    # Get event
    event = get_object_or_404(Event, slug=slug, is_active=True)
    
    # Get booking info from session
    booking_info = request.session.get('booking_info')
    if not booking_info:
        messages.error(request, "No booking information found.")
        return redirect('event-detail', slug=slug)
    
    # Get selected tickets
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


def event_gallery(request):
    return render(request,'event-gallery.html')




def process_payment(request, slug):
    """Handle the M-PESA payment initiation."""
    if request.method != 'POST':
        return redirect('payment', slug=slug)
    
    try:
        # Get event and booking info
        event = get_object_or_404(Event, slug=slug)
        booking_info = request.session.get('booking_info')
        
        if not booking_info:
            messages.error(request, "No booking information found.")
            return redirect('event-detail', slug=slug)
        
        # Get phone number from form
        phone = request.POST.get('phone')
        if not phone:
            messages.error(request, "Please provide a phone number.")
            return redirect('payment', slug=slug)
        
        # Format the phone number using the utility function
        formatted_phone = format_phone_number(phone)
        
        with transaction.atomic():
            # Create booking
            booking = Booking.objects.create(
                event=event,
                name="", # You might want to add a name field to the form
                email="", # You might want to add an email field to the form
                phone=formatted_phone,
                status='pending',
                total_amount=Decimal(booking_info['total_amount'])
            )
            
            # Create booking tickets
            for ticket_id, quantity in booking_info['tickets'].items():
                ticket_type = TicketType.objects.get(id=ticket_id)
                BookingTicket.objects.create(
                    booking=booking,
                    ticket_type=ticket_type,
                    quantity=quantity,
                    unit_price=ticket_type.price
                )

            # Initialize M-Pesa payment
            mpesa = MpesaCredential()
            access_token = mpesa.get_access_token()
            
            if not access_token:
                raise Exception("Could not get M-Pesa access token")

            # Generate password and timestamp
            password, timestamp = mpesa.generate_password()
            
            # Prepare STK Push request
            stk_push_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            }
            
            callback_url = f"{settings.BASE_URL}/mpesa/callback/"
            
            stk_payload = {
                'BusinessShortCode': mpesa.business_shortcode,
                'Password': password,
                'Timestamp': timestamp,
                'TransactionType': 'CustomerBuyGoodsOnline',
                'Amount': int(booking.total_amount),
                'PartyA': formatted_phone,
                'PartyB': mpesa.business_shortcode,
                'PhoneNumber': formatted_phone,
                'CallBackURL': callback_url,
                'AccountReference': f'EVENT{booking.id}',
                'TransactionDesc': f'Payment for {booking.event.title}'
            }

            # Make STK Push request
            response = requests.post(
                stk_push_url,
                json=stk_payload,
                headers=headers
            )
            
            if response.status_code == 200:
                response_data = response.json()
                
                # Store checkout details in session
                request.session['mpesa_checkout'] = {
                    'booking_id': booking.id,
                    'checkout_request_id': response_data.get('CheckoutRequestID')
                }
                
                # Clear booking info from session
                del request.session['booking_info']
                
                # Handle AJAX request
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': True,
                        'message': 'Please check your phone for the M-PESA prompt',
                        'redirect_url': reverse('booking_confirmation', args=[booking.id])
                    })
                
                # Handle regular form submission
                messages.success(
                    request, 
                    "Please check your phone for the M-PESA payment prompt."
                )
                return redirect('booking_confirmation', booking_id=booking.id)
            
            else:
                # M-Pesa request failed
                error_message = "Failed to initiate M-Pesa payment. Please try again."
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': False,
                        'message': error_message
                    })
                messages.error(request, error_message)
                return redirect('payment', slug=slug)
            
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
        # Get booking
        booking = get_object_or_404(Booking, id=booking_id, status='pending')
        
        # Get and format phone number
        phone = format_phone_number(request.POST.get('phone', '').strip())
        
        # Initialize M-Pesa API
        mpesa = MpesaCredential()
        access_token = mpesa.get_access_token()
        
        if not access_token:
            return JsonResponse({
                'success': False,
                'message': 'Unable to connect to M-Pesa. Please try again.'
            })

        # Generate password and timestamp
        password, timestamp = mpesa.generate_password()
        
        # Prepare STK Push request
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        callback_url = f"{settings.BASE_URL}/mpesa/callback/"
        
        payload = {
            'BusinessShortCode': mpesa.business_shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerBuyGoodsOnline',
            'Amount': int(booking.total_amount),
            'PartyA': phone,
            'PartyB': mpesa.business_shortcode,
            'PhoneNumber': phone,
            'CallBackURL': callback_url,
            'AccountReference': f'EVENT{booking.id}',
            'TransactionDesc': f'Payment for {booking.event.title}'
        }

        # Make STK Push request
        response = requests.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            json=payload,
            headers=headers
        )

        if response.status_code == 200:
            # Store checkout_request_id in session for callback verification
            request.session[f'mpesa_booking_{booking.id}'] = {
                'phone': phone,
                'amount': str(booking.total_amount)
            }
            
            return JsonResponse({
                'success': True,
                'message': 'Please check your phone for the M-Pesa prompt'
            })
            
        return JsonResponse({
            'success': False,
            'message': 'Failed to initiate payment. Please try again.'
        })

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
        
        # Extract booking ID from AccountReference
        booking_id = result['AccountReference'].replace('EVENT', '')
        booking = get_object_or_404(Booking, id=booking_id)
        
        if result['ResultCode'] == 0:
            # Payment successful
            booking.status = 'confirmed'
            booking.save()
            
            # Clean up session data
            request.session.pop(f'mpesa_booking_{booking.id}', None)
            
        else:
            # Payment failed
            booking.status = 'cancelled'
            booking.save()
        
        return JsonResponse({'status': 'success'})
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })


def booking_confirmation(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id)
    return render(request, 'booking-confirmation.html', {
        'booking': booking,
        'event': booking.event,
        'tickets': booking.tickets.all()
    })













@csrf_protect
def send_contact_email(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        if form.is_valid():
            try:
                # Get cleaned and validated data
                clean_data = form.cleaned_data
                
                # Create HTML email content
                email_context = {
                    'name': clean_data['name'],
                    'email': clean_data['email'],
                    'service': dict(form.fields['service'].choices)[clean_data['service']],
                    'message': clean_data['message'],
                }
                
                html_content = render_to_string('contact-email.html', email_context)
                plain_message = strip_tags(html_content)
                
                # Create and send email
                email_message = EmailMultiAlternatives(
                    subject=f'New Contact Message from {clean_data["name"]}',
                    body=plain_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[settings.CONTACT_EMAIL],
                    reply_to=[clean_data['email']]
                )
                
                email_message.attach_alternative(html_content, "text/html")
                email_message.send(fail_silently=False)
                
                logger.info(f"Contact form submitted successfully from {clean_data['email']}")
                
                if is_ajax:
                    return JsonResponse({
                        'success': True,
                        'message': 'Thank you! Your message has been sent successfully.'
                    })
                else:
                    messages.success(request, 'Thank you! Your message has been sent successfully.')
                    return render(request, 'index.html', {'form': ContactForm()})
                    
            except Exception as e:
                logger.error(f"Error in contact form submission: {str(e)}")
                error_message = 'Sorry, there was an error sending your message. Please try again.'
                
                if is_ajax:
                    return JsonResponse({
                        'success': False,
                        'message': error_message
                    }, status=500)
                else:
                    messages.error(request, error_message)
                    return render(request, 'index.html', {'form': form})
        else:
            # Form validation failed
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'errors': form.errors,
                    'message': 'Please correct the errors below.'
                }, status=400)
            else:
                messages.error(request, 'Please correct the errors below.')
                return render(request, 'index.html', {'form': form})
    
    # If not POST, redirect to index
    return HttpResponseRedirect('/')