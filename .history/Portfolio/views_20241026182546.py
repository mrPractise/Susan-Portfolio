from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.db.models import Q
from .models import *
from datetime import datetime
import json

def home(request):
    """Home page view"""
    featured_works = PortfolioItem.objects.filter(is_featured=True)[:4]
    upcoming_events = Event.objects.filter(
        status='upcoming',
        date__gte=datetime.now().date()
    )[:3]
    testimonials = Testimonial.objects.filter(is_featured=True)[:3]
    recent_posts = BlogPost.objects.filter(is_published=True)[:3]
    
    context = {
        'featured_works': featured_works,
        'upcoming_events': upcoming_events,
        'testimonials': testimonials,
        'recent_posts': recent_posts,
    }
    return render(request, 'index.html', context)



def portfolio_list(request):
    """Portfolio page with filtering"""
    # Get all portfolio items
    portfolio_items = PortfolioItem.objects.all()
    
    # Filter by category if specified
    category = request.GET.get('category')
    if category:
        portfolio_items = portfolio_items.filter(category__slug=category)
    
    # Pagination
    paginator = Paginator(portfolio_items, 12)  # 12 items per page
    page = request.GET.get('page')
    portfolio_items = paginator.get_page(page)
    
    context = {
        'portfolio_items': portfolio_items,
        'categories': ArtCategory.objects.all(),
    }
    return render(request, 'portfolio.html', context)

def portfolio_detail(request, slug):
    """Single portfolio item view"""
    portfolio_item = get_object_or_404(PortfolioItem, slug=slug)
    related_items = PortfolioItem.objects.filter(
        category=portfolio_item.category
    ).exclude(id=portfolio_item.id)[:3]
    
    context = {
        'portfolio_item': portfolio_item,
        'related_items': related_items
    }
    return render(request, 'portfolio.html', context)

def about(request):
    """About page view"""
    contact_info = ContactInformation.objects.first()
    featured_works = PortfolioItem.objects.filter(is_featured=True)[:3]
    
    context = {
        'contact_info': contact_info,
        'featured_works': featured_works
    }
    return render(request, 'about.html', context)

def events_list(request):
    """Events listing page"""
    # Get upcoming events
    events = Event.objects.filter(
        date__gte=datetime.now().date()
    ).order_by('date')
    
    # Pagination
    paginator = Paginator(events, 9)
    page = request.GET.get('page')
    events = paginator.get_page(page)
    
    context = {
        'events': events,
        'packages': EventPackage.objects.all()
    }
    return render(request, 'events.html', context)

def event_detail(request, slug):
    """Single event page"""
    event = get_object_or_404(Event, slug=slug)
    
    if request.method == 'POST':
        # Handle booking submission
        name = request.POST.get('name')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        tickets = int(request.POST.get('tickets', 1))
        
        # Create booking
        booking = EventBooking.objects.create(
            event=event,
            name=name,
            email=email,
            phone=phone,
            number_of_tickets=tickets,
            total_amount=event.price * tickets
        )
        
        return JsonResponse({
            'status': 'success',
            'booking_id': booking.id,
            'amount': booking.total_amount
        })
    
    context = {
        'event': event
    }
    return render(request, 'events.html', context)

def testimonials(request):
    """Testimonials page"""
    testimonials_list = Testimonial.objects.all()
    
    # Filter by service type if specified
    service_type = request.GET.get('service_type')
    if service_type:
        testimonials_list = testimonials_list.filter(service_type=service_type)
    
    # Pagination
    paginator = Paginator(testimonials_list, 9)
    page = request.GET.get('page')
    testimonials = paginator.get_page(page)
    
    context = {
        'testimonials': testimonials
    }
    return render(request, 'testimonials.html', context)

def contact(request):
    """Contact page"""
    if request.method == 'POST':
        # Handle contact form submission
        name = request.POST.get('name')
        email = request.POST.get('email')
        message = request.POST.get('message')
        
        # Here you would typically send an email or save to database
        # For now, just return success response
        return JsonResponse({'status': 'success'})
    
    contact_info = ContactInformation.objects.first()
    context = {
        'contact_info': contact_info
    }
    return render(request, 'contact.html', context)





def newsletter_signup(request):
    """Handle newsletter subscriptions"""
    if request.method == 'POST':
        email = request.POST.get('email')
        if email:
            try:
                subscriber, created = NewsletterSubscriber.objects.get_or_create(
                    email=email
                )
                if created:
                    return JsonResponse({
                        'status': 'success',
                        'message': 'Successfully subscribed!'
                    })
                return JsonResponse({
                    'status': 'error',
                    'message': 'You are already subscribed!'
                })
            except:
                return JsonResponse({
                    'status': 'error',
                    'message': 'An error occurred. Please try again.'
                })
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request'
    })

