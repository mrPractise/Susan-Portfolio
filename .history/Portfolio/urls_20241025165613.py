
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('portfolio/', views.portfolio_list, name='portfolio_list'),
    path('portfolio/<slug:slug>/', views.portfolio_detail, name='portfolio_detail'),
    path('about/', views.about, name='about'),
    path('events/', views.events_list, name='events_list'),
    path('events/<slug:slug>/', views.event_detail, name='event_detail'),
    path('testimonials/', views.testimonials, name='testimonials'),
    path('contact/', views.contact, name='contact'),
    path('works/', views.works, name='works'),
    path('blog/', views.blog_list, name='blog_list'),
    path('blog/<slug:slug>/', views.blog_detail, name='blog_detail'),
    path('newsletter-signup/', views.newsletter_signup, name='newsletter_signup'),
    path('initiate-payment/', views.initiate_mpesa_payment, name='initiate_mpesa_payment'),
    path('mpesa-callback/', views.mpesa_callback, name='mpesa_callback'),
]