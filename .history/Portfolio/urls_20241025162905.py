
from django.urls import path
from . import views


urlpatterns = [
    path('', views.home, name='home'),
    path('blog/', views.blog, name='blog'),
    path('blog/<slug:slug>/', views.blog_detail, name='blog_detail'),
    path('newsletter-signup/', views.newsletter_signup, name='newsletter_signup'),
]