from django.urls import path
from . import views

app_name = 'events'

urlpatterns = [
    path('events/', views.events, name='events'),
    path('events/<slug:slug>/', views.event_detail, name='event-detail'),
    path('events/<slug:slug>/book/', views.process_booking, name='process-booking'),
    path('events/<slug:slug>/payment/', views.payment_page, name='payment'),
    path('events/<slug:slug>/process-payment/', views.process_payment, name='process-payment'),
    path('events/check-availability/<int:event_id>/', views.check_ticket_availability, name='check-availability'),
    path('events/booking/<int:booking_id>/confirmation/', views.booking_confirmation, name='booking-confirmation'),
    path('events/booking/<int:booking_id>/payment/', views.initiate_stk_push, name='initiate-payment'),
    path('mpesa/callback/', views.callback, name='mpesa-callback'),
    path('gallery/', views.event_gallery, name='event-gallery'),
]