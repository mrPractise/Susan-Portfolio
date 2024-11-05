
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('events', views.events, name='events'),
    path('event/<int:event_id>/', views.event_detail, name='event-detail'),
]