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

def events(request):
    """Events page view"""
    return render(request, 'events.html')





class EventListView(ListView):
    model = Event
    template_name = 'events.html'
    context_object_name = 'events'

    def get_queryset(self):
        return Event.objects.filter(
            is_active=True,
            date__gte=timezone.now().date()
        ).order_by('date')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get current date info
        now = timezone.now()
        current_month = now.month
        current_year = now.year

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

        context.update({
            'calendar_data': calendar_data,
            'month_name': month_name,
            'year': current_year,
        })
        return context

class EventDetailView(DetailView):
    model = Event
    template_name = 'events/event_detail.html'
    context_object_name = 'event'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_sold_out'] = self.object.is_sold_out
        return context

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
    if request.method == 'POST':
        event = get_object_or_404(Event, id=event_id, is_active=True)
        
        # Check if seats are available
        requested_tickets = int(request.POST.get('number_of_tickets', 1))
        if event.available_seats < requested_tickets:
            return JsonResponse({
                'status': 'error',
                'message': 'Not enough seats available'
            })

        # Create booking
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

    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})


