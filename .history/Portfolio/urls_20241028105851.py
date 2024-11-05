
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('events', views.EventListView.as_view(), name='events'),
    path('event/<int:pk>/', views.EventDetailView.as_view(), name='event-detail'),
    path('calendar-data/', views.get_calendar_data, name='calendar-data'),
    path('booking/<int:event_id>/', views.create_booking, name='create-booking'),
]