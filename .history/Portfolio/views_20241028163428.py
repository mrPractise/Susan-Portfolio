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
from .models import Event, Booking
from .forms import ContactForm
import calendar
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
import logging

from django.core.mail import send_mail, EmailMultiAlternatives
from django.http import JsonResponse

from django.utils.html import strip_tags

from django.views.decorators.csrf import csrf_protect
from django.core.exceptions import ValidationError

from ratelimit.decorators import ratelimit






logger = logging.getLogger(__name__)

def home(request):
    """Home page view"""
    return render(request, 'index.html')

def events(request):
    # Get current date info
    now = timezone.now()
    current_month = now.month
    current_year = now.year

    # Get upcoming events
    events = Event.objects.filter(
        is_active=True,
        date__gte=now.date()
    ).order_by('date')

    # Get calendar data
    cal = calendar.monthcalendar(current_year, current_month)
    month_name = calendar.month_name[current_month]

    # Get events for the current month
    events_this_month = Event.objects.filter(
        date__year=current_year,
        date__month=current_month,
        is_active=True
    ).values('id', 'title', 'date')

    # Create calendar data with events
    calendar_data = []
    for week in cal:
        week_data = []
        for day in week:
            if day != 0:
                day_events = [
                    {
                        'id': event['id'],
                        'title': event['title']
                    }
                    for event in events_this_month
                    if event['date'].day == day
                ]
                week_data.append({
                    'day': day,
                    'events': day_events
                })
            else:
                week_data.append({'day': 0, 'events': []})
        calendar_data.append(week_data)

    context = {
        'events': events,
        'calendar_data': calendar_data,
        'month_name': month_name,
        'year': current_year,
    }

    return render(request, 'events.html', context)

def event_detail(request, event_id):
    event = get_object_or_404(Event, pk=event_id, is_active=True)
    
    context = {
        'event': event,
        'is_sold_out': event.is_sold_out
    }
    
    return render(request, 'event-detail.html', context)

def get_calendar_data(request):
    year = int(request.GET.get('year', timezone.now().year))
    month = int(request.GET.get('month', timezone.now().month))

    # Get events for the specified month
    events = Event.objects.filter(
        date__year=year,
        date__month=month,
        is_active=True
    ).values('id', 'title', 'date')

    # Convert to calendar data
    cal = calendar.monthcalendar(year, month)
    calendar_data = []
    
    for week in cal:
        week_data = []
        for day in week:
            if day != 0:
                day_events = [
                    {
                        'id': event['id'],
                        'title': event['title']
                    }
                    for event in events
                    if event['date'].day == day
                ]
                week_data.append({
                    'day': day,
                    'events': day_events
                })
            else:
                week_data.append({'day': 0, 'events': []})
        calendar_data.append(week_data)

    return JsonResponse({
        'calendar_data': calendar_data,
        'month_name': calendar.month_name[month],
        'year': year
    })

def create_booking(request, event_id):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

    event = get_object_or_404(Event, id=event_id, is_active=True)
    
    # Check if seats are available
    requested_tickets = int(request.POST.get('number_of_tickets', 1))
    if event.available_seats < requested_tickets:
        return JsonResponse({
            'status': 'error',
            'message': 'Not enough seats available'
        })

    # Create booking
    try:
        booking = Booking.objects.create(
            event=event,
            name=request.POST.get('name'),
            email=request.POST.get('email'),
            phone=request.POST.get('phone'),
            number_of_tickets=requested_tickets,
            total_amount=event.price * requested_tickets
        )

        # Update available seats
        event.available_seats -= requested_tickets
        event.save()

        return JsonResponse({
            'status': 'success',
            'booking_id': booking.id
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })

def event_booking_form(request, event_id):
    event = get_object_or_404(Event, id=event_id, is_active=True)
    
    if event.is_sold_out:
        return render(request, 'sold_out.html', {'event': event})
    
    if request.method == 'POST':
        # Handle form submission
        try:
            requested_tickets = int(request.POST.get('number_of_tickets', 1))
            if event.available_seats >= requested_tickets:
                booking = Booking.objects.create(
                    event=event,
                    name=request.POST.get('name'),
                    email=request.POST.get('email'),
                    phone=request.POST.get('phone'),
                    number_of_tickets=requested_tickets,
                    total_amount=event.price * requested_tickets
                )
                
                # Update available seats
                event.available_seats -= requested_tickets
                event.save()
                
                # Redirect to payment page
                return redirect('events:payment', booking_id=booking.id)
            else:
                context = {
                    'event': event,
                    'error': 'Not enough seats available'
                }
        except ValueError:
            context = {
                'event': event,
                'error': 'Invalid number of tickets'
            }
    else:
        context = {
            'event': event
        }
    
    return render(request, 'booking_form.html', context)

def payment_page(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id)
    
    context = {
        'booking': booking,
        'event': booking.event
    }
    
    return render(request, 'payment.html', context)

def confirm_payment(request, booking_id):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'})
        
    booking = get_object_or_404(Booking, id=booking_id)
    
    # Here you would integrate with M-PESA API
    # For now, we'll just mark the booking as confirmed
    try:
        booking.status = 'confirmed'
        booking.mpesa_transaction_id = request.POST.get('transaction_id')
        booking.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Payment confirmed'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })




@csrf_protect
@require_http_methods(["POST"])
@ratelimit(key='ip', rate='5/h', method=['POST'])
def send_contact_email(request):
    try:
        # Get data from the form
        data = json.loads(request.body)
        
        # Validate form data
        form = ContactForm(data)
        
        if not form.is_valid():
            return JsonResponse({
                'status': 'error',
                'errors': form.errors
            }, status=400)
            
        # Get cleaned data
        cleaned_data = form.cleaned_data
        name = cleaned_data['name']
        email = cleaned_data['email']
        service = cleaned_data['service']
        message = cleaned_data['message']
        
        # Create HTML email content
        html_content = render_to_string('contact-email.html', {
            'name': name,
            'email': email,
            'service': service,
            'message': message,
        })
        
        # Create plain text version
        plain_message = strip_tags(html_content)
        
        # Create email message
        email_message = EmailMultiAlternatives(
            subject=f'New Contact Message from {name}',
            body=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.CONTACT_EMAIL],
            reply_to=[email]
        )
        
        # Attach HTML version
        email_message.attach_alternative(html_content, "text/html")
        
        # Send email
        email_message.send(fail_silently=False)
        
        # Log successful submission
        logger.info(f"Contact form submitted successfully from {email}")
        
        return JsonResponse({
            'status': 'success',
            'message': 'Thank you! Your message has been sent successfully.'
        })
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in contact form submission")
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid request format.'
        }, status=400)
        
    except ValidationError as e:
        logger.error(f"Validation error in contact form: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)
        
    except Exception as e:
        logger.error(f"Error in contact form submission: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Sorry, there was an error sending your message. Please try again.'
        }, status=500)