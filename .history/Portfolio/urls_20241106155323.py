from django.urls import path
from . import views

app_name = 'portfolio'

urlpatterns = [
    path('', views.home, name='home'),
    path('portfolio/', views.portfolio, name='portfolio'),
    path('projects/', views.project_list, name='projects'),
    path('contact/send/', views.send_contact_email, name='send-contact'),
]