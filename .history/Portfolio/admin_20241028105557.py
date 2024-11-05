from django.contrib import admin
from .models import Event, Booking

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'venue', 'price', 'available_seats', 'is_active')
    list_filter = ('is_active', 'date')
    search_fields = ('title', 'description', 'venue')
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Event Information', {
            'fields': ('title', 'description', 'image', 'date', 'start_time', 'end_time', 'venue')
        }),
        ('Capacity & Pricing', {
            'fields': ('price', 'capacity', 'available_seats')
        }),
        ('Status', {
            'fields': ('is_active',)
        })
    )

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('name', 'event', 'number_of_tickets', 'total_amount', 'status', 'booking_date')
    list_filter = ('status', 'booking_date', 'event')
    search_fields = ('name', 'email', 'phone', 'mpesa_transaction_id')