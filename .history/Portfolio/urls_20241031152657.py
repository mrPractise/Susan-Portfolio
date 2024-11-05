
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('events', views.events, name='events'),
    path('portfolio', views.portfolio, name='portfolio'),
    path('projects/', views.project_list, name='projects'),
    path('projects/<slug:slug>/', views.project_detail, name='project_detail'),
    path('events/<slug:slug>/', views.event_detail, name='event-detail'),
     path('events/<slug:slug>/book/', views.process_booking, name='process_booking'),
    path('send-contact-email/', views.send_contact_email, name='send_contact_email'),
]