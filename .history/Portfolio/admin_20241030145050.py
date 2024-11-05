from django.contrib import admin
from .models import Event, TicketType, Booking, BookingTicket,Category, Tool, Project
from django.utils.html import format_html


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'order']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['order']

@admin.register(Tool)
class ToolAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'created_date', 'is_featured', 'view_count', 'media_preview']
    list_filter = ['category', 'is_featured', 'created_date']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ['tools']
    ordering = ['-created_date', 'order']
    
    def media_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" height="50"/>', obj.image.url)
        elif obj.video_thumbnail:
            return format_html('<img src="{}" height="50"/>', obj.video_thumbnail.url)
        return "No preview"
    
    media_preview.short_description = 'Preview'







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