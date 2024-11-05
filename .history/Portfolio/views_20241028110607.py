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
import calendar


def home(request):
    """Home page view"""
    return render(request, 'index.html')







def event_list(request):
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
    event = get_object_or_404(Event, id=event_id, is_active=True)
    
    context = {
        'event': event,
        'is_sold_out': event.is_sold_out
    }
    
    return render(request, 'events/event_detail.html', context)

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
        return render(request, 'events/sold_out.html', {'event': event})
    
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
    
    return render(request, 'events/booking_form.html', context)

def payment_page(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id)
    
    context = {
        'booking': booking,
        'event': booking.event
    }
    
    return render(request, 'events/payment.html', context)

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

