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
    
    # Get events for the calendar
    month_start = datetime(current_year, current_month, 1).date()
    month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    
    calendar_events = Event.objects.filter(
        date__range=[month_start, month_end],
        is_active=True
    ).values('id', 'title', 'date', 'is_active')
    
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
                        'is_active': event['is_active']
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





















def event_detail(request, slug):
    """View for displaying event details and handling ticket booking."""
    event = get_object_or_404(Event.objects.prefetch_related('ticket_types'), 
                             slug=slug, is_active=True)
    
    # Get available ticket types with remaining capacity
    ticket_types = event.ticket_types.all()
    
    # Calculate total tickets sold and remaining
    total_sold = sum(tt.capacity - tt.available_tickets for tt in ticket_types)
    total_remaining = event.max_capacity - total_sold
    
    # Check if event date has passed
    is_past = event.date < timezone.now().date()
    
    context = {
        'event': event,
        'ticket_types': ticket_types,
        'is_sold_out': event.is_sold_out,
        'is_past': is_past,
        'total_sold': total_sold,
        'total_remaining': total_remaining,
        'capacity_percentage': (total_sold / event.max_capacity) * 100,
    }
    
    return render(request, 'event-detail.html', context)


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