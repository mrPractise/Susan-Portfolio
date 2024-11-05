
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('events', views.events, name='events'),
    path('portfolio', views.portfolio, name='portfolio'),
    path('projects/', views.project_list, name='projects'),
    path('projects/<slug:slug>/', views.project_detail, name='project_detail'),
    path('projects/load-more/', views.load_more_projects, name='load_more_projects'),
    path('event/<int:event_id>/', views.event_detail, name='event-detail'),
    path('send-contact-email/', views.send_contact_email, name='send_contact_email'),
]