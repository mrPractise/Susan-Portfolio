from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Project, Event, TicketType, Booking, BookingTicket

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'created_date', 'media_type', 'preview')
    list_filter = ('category', 'created_date')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('video_duration', 'video_thumbnail')

    def preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.image.url)
        elif obj.video_thumbnail:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.video_thumbnail.url)
        return "-"

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'venue', 'is_active', 'is_upcoming', 'is_sold_out')
    list_filter = ('is_active', 'date')
    search_fields = ('title', 'description', 'venue')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'date'

class BookingTicketInline(admin.TabularInline):
    model = BookingTicket
    extra = 1
    readonly_fields = ('subtotal',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('name', 'event', 'status', 'total_amount', 'booking_date')
    list_filter = ('status', 'booking_date', 'event')
    search_fields = ('name', 'email', 'phone', 'mpesa_transaction_id')
    readonly_fields = ('booking_date',)
    inlines = [BookingTicketInline]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('event')

@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'event', 'price', 'capacity', 'available_tickets', 'is_sold_out')
    list_filter = ('event',)
    search_fields = ('name', 'event__title')
    readonly_fields = ('available_tickets',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('event')