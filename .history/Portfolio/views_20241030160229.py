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







logger = logging.getLogger(__name__)

def home(request):
    return render(request, 'home.html')


def portfolio(request):
    form = ContactForm()
    return render(request, 'portfolio.html',{'form': form})




def project_list(request):
    """Main view for displaying projects"""
    # Get all categories for the filter buttons
    categories = Category.objects.all()
    
    # Get filter parameters
    category = request.GET.get('category')
    view = request.GET.get('view', 'grid')  # grid or masonry
    
    # Base queryset
    projects = Project.objects.select_related('category').prefetch_related('tools').all()
    
    # Apply category filter if specified
    if category and category != 'all':
        projects = projects.filter(category__slug=category)
    
    # Handle AJAX requests for filtering
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        html = render_to_string('partials/project_grid.html', {
            'projects': projects,
            'view': view
        })
        return JsonResponse({'html': html})
    
    # Regular page load
    context = {
        'categories': categories,
        'projects': projects,
        'current_category': category or 'all',
        'current_view': view
    }
    return render(request, 'projects.html', context)



@require_http_methods(['GET'])
def project_detail(request, slug):
    try:
        project = Project.objects.select_related('category').prefetch_related('tools').get(slug=slug)
        
        # Increment view count atomically
        Project.objects.filter(pk=project.pk).update(view_count=F('view_count') + 1)
        
        data = {
            'id': project.id,
            'title': project.title,
            'description': project.description,
            'category': project.category.name,
            'tools': project.get_tools_list(),
            'created_date': project.created_date.strftime('%B %d, %Y'),
            'media_type': project.media_type,
            'media_url': project.video.url if project.video else project.image.url,
            'thumbnail_url': project.video_thumbnail.url if project.video_thumbnail else None,
            'view_count': project.view_count + 1,
        }
        
        # Get next and previous projects
        next_project = Project.objects.filter(
            created_date__gte=project.created_date,
            id__gt=project.id
        ).order_by('created_date', 'id').first()
        
        prev_project = Project.objects.filter(
            created_date__lte=project.created_date,
            id__lt=project.id
        ).order_by('-created_date', '-id').first()
        
        data.update({
            'next_project': {
                'slug': next_project.slug,
                'title': next_project.title
            } if next_project else None,
            'prev_project': {
                'slug': prev_project.slug,
                'title': prev_project.title
            } if prev_project else None
        })
        
        response = JsonResponse(data)
        response["Access-Control-Allow-Origin"] = "*"
        return response
        
    except Project.DoesNotExist:
        return JsonResponse({'error': 'Project not found'}, status=404)



def load_more_projects(request):
    """AJAX view for infinite scroll functionality"""
    page = int(request.GET.get('page', 2))  # Start from page 2
    category = request.GET.get('category')
    
    # Base queryset
    projects = Project.objects.select_related('category').prefetch_related('tools')
    
    # Apply category filter if specified
    if category and category != 'all':
        projects = projects.filter(category__slug=category)
    
    # Paginate projects
    paginator = Paginator(projects, 12)  # 12 projects per page
    
    try:
        projects_page = paginator.page(page)
        has_next = projects_page.has_next()
        
        html = render_to_string('partials/project_grid.html', {
            'projects': projects_page
        })
        
        return JsonResponse({
            'html': html,
            'has_next': has_next,
            'next_page': page + 1 if has_next else None
        })
    except:
        return JsonResponse({'error': 'No more projects'}, status=404)










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