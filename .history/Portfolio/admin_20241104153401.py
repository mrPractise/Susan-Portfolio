from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, F
from .models import (
    ProjectCategory, Project, Event, TicketType, 
    Booking, BookingTicket
)

# Inlines
class BookingTicketInline(admin.TabularInline):
    model = BookingTicket
    extra = 0
    readonly_fields = ('get_subtotal',)
    fields = ('ticket_type', 'quantity', 'unit_price', 'get_subtotal')

    def get_subtotal(self, obj):
        if obj.quantity and obj.unit_price:
            return format_html('KES {:,.2f}', obj.quantity * obj.unit_price)
        return format_html('KES 0.00')
    get_subtotal.short_description = 'Subtotal'

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ('ticket_type', 'quantity', 'unit_price')
        return self.readonly_fields

class TicketTypeInline(admin.TabularInline):
    model = TicketType
    extra = 1
    fields = (
        'name', 'price', 'capacity', 'available_tickets',
        'minimum_purchase', 'maximum_purchase', 'display_order'
    )
    readonly_fields = ('available_tickets',)

# Custom Filters
class SoldOutFilter(admin.SimpleListFilter):
    title = 'sold out status'
    parameter_name = 'sold_out'

    def lookups(self, request, model_admin):
        return (
            ('yes', 'Sold Out'),
            ('no', 'Available'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.filter(available_tickets=0)
        if self.value() == 'no':
            return queryset.filter(available_tickets__gt=0)
        return queryset

# Admin Models
@admin.register(ProjectCategory)
class ProjectCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'project_count', 'order')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    ordering = ['order', 'name']

    def project_count(self, obj):
        return obj.projects.count()
    project_count.short_description = 'Number of Projects'

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'created_date', 'featured', 'media_type', 'video_duration_display')
    list_filter = ('category', 'featured', 'created_date')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('video_duration', 'video_thumbnail', 'created_date')
    date_hierarchy = 'created_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'category', 'featured')
        }),
        ('Media', {
            'fields': ('image', 'video', 'video_thumbnail', 'video_duration'),
            'description': 'Upload either an image or video (not both)'
        })
    )

    def video_duration_display(self, obj):
        if obj.video_duration:
            total_seconds = int(obj.video_duration.total_seconds())
            minutes = total_seconds // 60
            seconds = total_seconds % 60
            return f"{minutes:02d}:{seconds:02d}"
        return "-"
    video_duration_display.short_description = "Duration"

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields
        return ('video_duration', 'video_thumbnail', 'created_date')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'date', 'venue', 'is_active', 
        'is_upcoming', 'is_sold_out', 'capacity_display',
        'revenue_display'
    )
    list_filter = ('is_active', 'date', 'venue')
    search_fields = ('title', 'description', 'venue')
    readonly_fields = (
        'created_at', 'updated_at', 'total_tickets_sold', 
        'total_revenue', 'available_capacity'
    )
    prepopulated_fields = {'slug': ('title',)}
    inlines = [TicketTypeInline]
    date_hierarchy = 'date'
    actions = ['activate_events', 'deactivate_events']

    fieldsets = (
        ('Basic Information', {
            'fields': (
                'title', 'slug', 'description', 'image',
                'date', 'start_time', 'end_time'
            )
        }),
        ('Venue Details', {
            'fields': ('venue', 'venue_address')
        }),
        ('Capacity & Status', {
            'fields': (
                'max_capacity', 'available_capacity',
                'is_active', 'total_tickets_sold'
            )
        }),
        ('Financial', {
            'fields': ('total_revenue',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ('max_capacity',)
        return self.readonly_fields

    def capacity_display(self, obj):
        total_sold = sum(
            tt.capacity - tt.available_tickets 
            for tt in obj.ticket_types.all()
        )
        if obj.max_capacity > 0:
            percentage = (total_sold / obj.max_capacity) * 100
            color = '#dc3545' if percentage > 90 else '#28a745'
            percentage_str = str(round(percentage, 1))
            return format_html(
                '<span style="color: {}">{}/{} ({}%)</span>',
                color,
                str(total_sold),
                str(obj.max_capacity),
                percentage_str
            )
        return format_html('0/0 (0%)')
    capacity_display.short_description = "Capacity (Sold/Total)"

    def revenue_display(self, obj):
        total_revenue = obj.bookings.filter(
            status='confirmed'
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        amount_str = "{:,.2f}".format(total_revenue)
        return format_html('KES {}', amount_str)
    revenue_display.short_description = "Revenue"

    def total_tickets_sold(self, obj):
        return sum(
            tt.capacity - tt.available_tickets 
            for tt in obj.ticket_types.all()
        )
    total_tickets_sold.short_description = "Total Tickets Sold"

    def total_revenue(self, obj):
        revenue = obj.bookings.filter(
            status='confirmed'
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        amount_str = "{:,.2f}".format(revenue)
        return format_html('KES {}', amount_str)
    total_revenue.short_description = "Total Revenue"

    def available_capacity(self, obj):
        available = obj.max_capacity - self.total_tickets_sold(obj)
        return str(available)
    available_capacity.short_description = "Available Capacity"

    def activate_events(self, request, queryset):
        queryset.update(is_active=True)
    activate_events.short_description = "Activate selected events"

    def deactivate_events(self, request, queryset):
        queryset.update(is_active=False)
    deactivate_events.short_description = "Deactivate selected events"

@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'event', 'price', 'capacity',
        'available_tickets', 'is_sold_out', 'sales_display'
    )
    list_filter = ('event', SoldOutFilter)
    search_fields = ('name', 'event__title')
    readonly_fields = ('available_tickets',)
    ordering = ['event', 'display_order', 'price']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('event')

    def is_sold_out(self, obj):
        return obj.available_tickets == 0
    is_sold_out.boolean = True
    is_sold_out.short_description = "Sold Out"

    def sales_display(self, obj):
        sold = obj.capacity - obj.available_tickets
        if obj.capacity > 0:
            percentage = (sold / obj.capacity) * 100
            color = '#dc3545' if percentage > 90 else '#28a745'
            percentage_str = str(round(percentage, 1))
            return format_html(
                '<span style="color: {}">{}/{} ({}%)</span>',
                color,
                str(sold),
                str(obj.capacity),
                percentage_str
            )
        return format_html('0/0 (0%)')
    sales_display.short_description = "Sales (Sold/Capacity)"

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'event', 'name', 'email', 'status',
        'total_amount', 'booking_date', 'payment_status'
    )
    list_filter = ('status', 'event', 'booking_date')
    search_fields = ('name', 'email', 'phone', 'mpesa_transaction_id')
    readonly_fields = ('booking_date', 'get_subtotal_amount', 'total_amount')
    inlines = [BookingTicketInline]
    date_hierarchy = 'booking_date'
    actions = ['confirm_bookings', 'cancel_bookings']

    fieldsets = (
        ('Customer Information', {
            'fields': ('name', 'email', 'phone')
        }),
        ('Booking Details', {
            'fields': ('event', 'status', 'booking_date')
        }),
        ('Payment Information', {
            'fields': (
                'mpesa_transaction_id', 'get_subtotal_amount',
                'total_amount'
            )
        })
    )

    def get_subtotal_amount(self, obj):
        subtotal = sum(
            (ticket.quantity or 0) * (ticket.unit_price or 0)
            for ticket in obj.tickets.all()
        )
        return format_html('KES {:,.2f}', subtotal)
    get_subtotal_amount.short_description = "Subtotal Amount"

    def payment_status(self, obj):
        status_map = {
            'confirmed': '<span style="color: #28a745">✓ Paid</span>',
            'cancelled': '<span style="color: #dc3545">✗ Cancelled</span>',
            'pending': '<span style="color: #ffc107">⋯ Pending</span>',
        }
        return format_html(status_map.get(obj.status, '[Invalid Status]'))
    payment_status.short_description = "Payment"

    def save_model(self, request, obj, form, change):
        creating = not obj.pk
        super().save_model(request, obj, form, change)
        
        if creating:
            total = sum(
                (ticket.quantity or 0) * (ticket.unit_price or 0)
                for ticket in obj.tickets.all()
            )
            obj.total_amount = total
            Booking.objects.filter(pk=obj.pk).update(total_amount=total)