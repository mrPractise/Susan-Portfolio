
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('events', views.events, name='events'),
    path('portfolio', views.portfolio, name='portfolio'),
    path('projects/', views.project_list, name='projects'),
    path('events/<slug:slug>/', views.event_detail, name='event-detail'),
    path('events/<slug:slug>/book/', views.process_booking, name='process_booking'),
    path('events/<slug:slug>/payment/', views.payment_page, name='payment'),
    path('events/<slug:slug>/process-payment/', views.process_payment, name='process_payment'),
    path('event-gallery', views.event_gallery, name='event-gallery'),
    path('initiate/<int:booking_id>/', views.initiate_stk_push, name='initiate_stk_push'),
    path('callback/', views.callback, name='mpesa_callback'),
    path('booking/confirmation/<int:booking_id>/', views.booking_confirmation, name='booking_confirmation'),
    path('send-contact-email/', views.send_contact_email, name='send_contact_email'),
]