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
from django.http import JsonResponse
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

from django.db import transaction

from decimal import Decimal







logger = logging.getLogger(__name__)

def home(request):
    return render(request, 'home.html')


def portfolio(request):
    form = ContactForm()
    return render(request, 'portfolio.html',{'form': form})



def project_list(request):
    """View for displaying projects with filtering and pagination."""
    # Get parameters
    category_slug = request.GET.get('category')
    view_type = request.GET.get('view', 'grid')
    page = request.GET.get('page', 1)
    
    # Base queryset with optimization
    projects = Project.objects.select_related('category').prefetch_related('category')
    
    # Filter by category if specified
    if category_slug and category_slug != 'all':
        projects = projects.filter(category__slug=category_slug)
    
    # Always put featured projects first
    projects = projects.order_by('-featured', '-created_date')
    
    # Pagination
    paginator = Paginator(projects, 12)  # Show 12 projects per page
    page_obj = paginator.get_page(page)
    
    # Get all categories with project counts
    categories = ProjectCategory.objects.annotate(
        project_count=Count('projects')
    ).order_by('order')
    
    context = {
        'categories': categories,
        'projects': page_obj,
        'current_category': category_slug or 'all',
        'current_view': view_type,
        'is_paginated': paginator.num_pages > 1
    }
    
    # Handle AJAX requests for infinite scroll or filtering
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        html = render_to_string(
            f'partials/project_{view_type}.html',
            {'projects': page_obj}
        )
        return JsonResponse({
            'html': html,
            'has_next': page_obj.has_next()
        })
    
    return render(request, 'projects.html', context)



def project_detail(request, slug):
    """View for displaying project details."""
    try:
        project = Project.objects.select_related('category').get(slug=slug)
        
        # Increment view count atomically
        Project.objects.filter(pk=project.pk).update(view_count=F('view_count') + 1)
        
        # Get related projects from same category
        related_projects = Project.objects.filter(
            category=project.category
        ).exclude(
            id=project.id
        ).order_by('-featured', '-created_date')[:3]
        
        data = {
            'title': project.title,
            'description': project.description,
            'category': project.category.name,
            'created_date': project.created_date.strftime('%B %d, %Y'),
            'media_type': project.media_type,
            'media_url': project.video.url if project.video else project.image.url,
            'thumbnail_url': project.video_thumbnail.url if project.video_thumbnail else None,
            'duration': str(project.video_duration) if project.video_duration else None,
            'related_projects': [
                {
                    'title': p.title,
                    'slug': p.slug,
                    'thumbnail': p.image.url if p.image else p.video_thumbnail.url,
                } for p in related_projects
            ]
        }
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse(data)
            
        return render(request, 'project_detail.html', {'project': project, 'related_projects': related_projects})
        
    except Project.DoesNotExist:
        return JsonResponse({'error': 'Project not found'}, status=404)





def events(request):
    """View for displaying events with calendar integration."""
    # Get current date info
    today = timezone.now().date()
    current_month = int(request.GET.get('month', today.month))
    current_year = int(request.GET.get('year', today.year))
    
    # Get upcoming events for the list view
    upcoming_events = Event.objects.filter(
        is_active=True,
        date__gte=today
    ).select_related().prefetch_related('ticket_types').order_by('date', 'start_time')
    
    # Get calendar data
    cal = calendar.monthcalendar(current_year, current_month)
    month_name = calendar.month_name[current_month]
    
    # Get first and last day of month
    month_start = datetime(current_year, current_month, 1).date()
    month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    
    # Modify this section to include slug
    calendar_events = Event.objects.filter(
        date__range=[month_start, month_end],
        is_active=True
    ).values('id', 'title', 'date', 'is_active', 'slug')  # Added slug here
    
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
                        'is_active': event['is_active'],
                        'slug': event['slug']  # Make sure to include slug here
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
    
    context = {
        'upcoming_events': upcoming_events,
        'calendar_data': calendar_data,
        'month_name': month_name,
        'year': current_year,
        'month': current_month,
        'today': today,
        'prev_month': (month_start - timedelta(days=1)).month,
        'prev_year': (month_start - timedelta(days=1)).year,
        'next_month': (month_start + timedelta(days=32)).month,
        'next_year': (month_start + timedelta(days=32)).year,
    }
    
    return render(request, 'events.html', context)



















def process_booking(request, slug):
    """Handle the ticket booking process."""
    event = get_object_or_404(Event, slug=slug, is_active=True)
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Validate the event is still available
                if event.is_sold_out:
                    messages.error(request, "Sorry, this event is sold out.")
                    return redirect('event-detail', slug=slug)
                
                if event.date < timezone.now().date():
                    messages.error(request, "This event has already taken place.")
                    return redirect('event-detail', slug=slug)
                
                # Process ticket selections
                selected_tickets = {}
                total_amount = 0
                
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
                    messages.error(request, "Please select at least one ticket.")
                    return redirect('event-detail', slug=slug)
                
                # Store booking info in session for payment processing
                request.session['booking_info'] = {
                    'event_id': event.id,
                    'tickets': {str(tt.id): qty for tt, qty in selected_tickets.items()},
                    'total_amount': str(total_amount)
                }
                
                # Redirect to payment page
                return redirect('payment', slug=slug)
                
        except ValidationError as e:
            messages.error(request, str(e))
            return redirect('event-detail', slug=slug)
        
        except Exception as e:
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


def get_calendar_data(request):
    """API endpoint for calendar data"""
    try:
        # Get year and month from request, default to current
        year = int(request.GET.get('year', timezone.now().year))
        month = int(request.GET.get('month', timezone.now().month))
        
        # Get first and last day of month
        month_start = datetime(year, month, 1).date()
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        # Get events for the month
        events = Event.objects.filter(
            date__range=[month_start, month_end],
            is_active=True
        ).values('id', 'title', 'slug', 'date', 'start_time', 'end_time')
        
        # Create calendar data structure
        cal = calendar.monthcalendar(year, month)
        calendar_data = []
        
        for week in cal:
            week_data = []
            for day in week:
                if day != 0:
                    current_date = datetime(year, month, day).date()
                    # Get events for this day
                    day_events = [
                        {
                            'id': event['id'],
                            'title': event['title'],
                            'slug': event['slug'],
                            'start_time': event['start_time'].strftime('%H:%M'),
                            'end_time': event['end_time'].strftime('%H:%M')
                        }
                        for event in events
                        if event['date'] == current_date
                    ]
                    week_data.append({
                        'day': day,
                        'events': day_events,
                        'is_today': current_date == timezone.now().date(),
                        'is_past': current_date < timezone.now().date()
                    })
                else:
                    week_data.append({'day': 0, 'events': []})
            calendar_data.append(week_data)
        
        return JsonResponse({
            'status': 'success',
            'calendar_data': calendar_data,
            'month_name': calendar.month_name[month],
            'year': year,
            'prev_month': (month_start - timedelta(days=1)).month,
            'prev_year': (month_start - timedelta(days=1)).year,
            'next_month': (month_end + timedelta(days=1)).month,
            'next_year': (month_end + timedelta(days=1)).year
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)
    
    
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
        
        # Here you would integrate with your M-PESA API
        # For now, we'll just create a pending booking
        
        with transaction.atomic():
            # Create booking
            booking = Booking.objects.create(
                event=event,
                name="", # You might want to add a name field to the form
                email="", # You might want to add an email field to the form
                phone=phone,
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
            
            # Clear booking info from session
            del request.session['booking_info']
            
            # Add success message
            messages.success(
                request, 
                "Please check your phone for the M-PESA payment prompt."
            )
            
            # Redirect to a thank you page or back to events
            return redirect('booking_confirmation', booking_id=booking.id)
            
    except Exception as e:
        messages.error(request, "An error occurred. Please try again.")
        return redirect('payment', slug=slug)






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