from django.contrib import admin
from .models import Event, TicketType, Booking, BookingTicket

class TicketTypeInline(admin.TabularInline):
    model = TicketType
    extra = 1

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'venue', 'is_active')
    list_filter = ('is_active', 'date')
    search_fields = ('title', 'description', 'venue')
    inlines = [TicketTypeInline]

class BookingTicketInline(admin.TabularInline):
    model = BookingTicket
    readonly_fields = ('unit_price',)
    extra = 0

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('name', 'event', 'status', 'total_amount', 'booking_date')
    list_filter = ('status', 'booking_date', 'event')
    search_fields = ('name', 'email', 'phone', 'mpesa_transaction_id')
    inlines = [BookingTicketInline]