from django.shortcuts import render
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.conf import settings
from django.db.models import Count
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from django.http import HttpResponseRedirect
from django.views.decorators.csrf import csrf_protect
from django.contrib import messages
import logging

from .models import Project, ProjectCategory
from .forms import ContactForm

logger = logging.getLogger(__name__)

def home(request):
    return render(request, 'portfolio/home.html')

def portfolio(request):
    form = ContactForm()
    return render(request, 'portfolio/portfolio.html', {'form': form})

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
                
                html_content = render_to_string('portfolio/contact-email.html', email_context)
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
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'errors': form.errors,
                    'message': 'Please correct the errors below.'
                }, status=400)
            else:
                messages.error(request, 'Please correct the errors below.')
                return render(request, 'index.html', {'form': form})
    
    return HttpResponseRedirect('/')

def project_list(request):
    """View for displaying projects with filtering and pagination."""
    category_slug = request.GET.get('category')
    view_type = request.GET.get('view', 'grid')
    page = request.GET.get('page', 1)
    
    projects = (Project.objects
               .select_related('category')
               .defer('video_duration')
               .distinct())
    
    if category_slug and category_slug != 'all':
        projects = projects.filter(category__slug=category_slug)
    
    if settings.DEBUG:
        print(f"Query SQL: {projects.query}")
        print(f"Total projects before pagination: {projects.count()}")
        print("Project IDs:", list(projects.values_list('id', flat=True)))
    
    paginator = Paginator(projects, 12)
    try:
        page_obj = paginator.page(page)
    except PageNotAnInteger:
        page_obj = paginator.page(1)
    except EmptyPage:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'html': '', 'has_next': False})
        page_obj = paginator.page(paginator.num_pages)
    
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
    
    return render(request, 'portfolio/projects.html', context)

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
        
        for dup in duplicates:
            dups = Project.objects.filter(title=dup['title'], category=dup['category'])
            print(f"\nDetails for {dup['title']}:")
            for p in dups:
                print(f"ID: {p.id}, Created: {p.created_date}, Featured: {p.featured}")
    
    return duplicates.exists()