from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.db.models import Q
from .models import *
from datetime import datetime
import json

def home(request):
    """Home page view"""
    return render(request, 'index.html')

def events_view(request):
    """Events page view"""
    return render(request, 'events.html')


