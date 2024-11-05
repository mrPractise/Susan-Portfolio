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
    return render(request, 'home.html', context)

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
    return render(request, 'portfolio_detail.html', context)

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
    return render(request, 'event_detail.html', context)

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

def blog_list(request):
    """Blog listing page"""
    # Get all published posts
    posts = BlogPost.objects.filter(is_published=True)
    
    # Handle search
    search_query = request.GET.get('q')
    if search_query:
        posts = posts.filter(
            Q(title__icontains=search_query) |
            Q(content__icontains=search_query) |
            Q(tags__name__icontains=search_query)
        ).distinct()
    
    # Filter by category
    category = request.GET.get('category')
    if category:
        posts = posts.filter(categories__slug=category)
    
    # Pagination
    paginator = Paginator(posts, 6)
    page = request.GET.get('page')
    posts = paginator.get_page(page)
    
    context = {
        'posts': posts,
        'categories': BlogCategory.objects.all(),
        'recent_posts': BlogPost.objects.filter(
            is_published=True
        ).order_by('-published_date')[:5],
        'tags': BlogTag.objects.all()
    }
    return render(request, 'blog.html', context)

def blog_detail(request, slug):
    """Single blog post page"""
    post = get_object_or_404(BlogPost, slug=slug)
    related_posts = BlogPost.objects.filter(
        categories__in=post.categories.all()
    ).exclude(id=post.id).distinct()[:3]
    
    context = {
        'post': post,
        'related_posts': related_posts
    }
    return render(request, 'blog_detail.html', context)

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

# Admin views (requires login)
@login_required
def admin_dashboard(request):
    """Admin dashboard for Susan"""
    context = {
        'total_portfolio_items': PortfolioItem.objects.count(),
        'upcoming_events': Event.objects.filter(status='upcoming').count(),
        'total_bookings': EventBooking.objects.count(),
        'recent_bookings': EventBooking.objects.order_by('-booking_date')[:5],
        'pending_requests': CustomEventRequest.objects.filter(
            status='pending'
        ).count()
    }
    return render(request, 'admin/dashboard.html', context)

@login_required
def manage_portfolio(request):
    """Manage portfolio items"""
    if request.method == 'POST':
        # Handle new portfolio item creation
        title = request.POST.get('title')
        category_id = request.POST.get('category')
        description = request.POST.get('description')
        image = request.FILES.get('image')
        
        PortfolioItem.objects.create(
            title=title,
            category_id=category_id,
            description=description,
            image=image
        )
        return redirect('manage_portfolio')
    
    portfolio_items = PortfolioItem.objects.all().order_by('-created_at')
    context = {
        'portfolio_items': portfolio_items,
        'categories': ArtCategory.objects.all()
    }
    return render(request, 'admin/manage_portfolio.html', context)

@login_required
def manage_events(request):
    """Manage events"""
    events = Event.objects.all().order_by('date')
    context = {
        'upcoming_events': events.filter(status='upcoming'),
        'ongoing_events': events.filter(status='ongoing'),
        'completed_events': events.filter(status='completed')
    }
    return render(request, 'admin/manage_events.html', context)

# MPesa Integration
def initiate_mpesa_payment(request):
    """Start MPesa payment process"""
    if request.method == 'POST':
        phone_number = request.POST.get('phone_number')
        amount = request.POST.get('amount')
        booking_id = request.POST.get('booking_id')
        
        try:
            # Here you would integrate with MPesa API
            # This is a placeholder
            payment_response = {
                'MerchantRequestID': 'mock-id',
                'CheckoutRequestID': 'mock-checkout-id',
                'ResponseDescription': 'Success'
            }
            
            # Update booking with transaction ID
            booking = EventBooking.objects.get(id=booking_id)
            booking.mpesa_transaction_id = payment_response['CheckoutRequestID']
            booking.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Payment initiated'
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            })
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request'
    })

def mpesa_callback(request):
    """Handle MPesa payment callback"""
    if request.method == 'POST':
        try:
            # Process the MPesa callback data
            callback_data = json.loads(request.body)
            
            # Update booking status
            booking = EventBooking.objects.get(
                mpesa_transaction_id=callback_data['CheckoutRequestID']
            )
            booking.status = 'confirmed'
            booking.save()
            
            return JsonResponse({'status': 'success'})
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            })
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request'
    })