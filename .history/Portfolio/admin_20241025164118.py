from django.contrib import admin
from django.utils.html import format_html
from .models import *

@admin.register(ContactInformation)
class ContactInformationAdmin(admin.ModelAdmin):
    list_display = ('email', 'phone', 'location')
    
    def has_add_permission(self, request):
        # Only allow one contact information instance
        if self.model.objects.exists():
            return False
        return True

@admin.register(ArtCategory)
class ArtCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(PortfolioItem)
class PortfolioItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'display_image', 'created_date', 'is_featured')
    list_filter = ('category', 'created_date', 'is_featured')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ('is_featured',)
    date_hierarchy = 'created_date'
    
    def display_image(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover;" />',
                obj.image.url
            )
        return "No Image"
    display_image.short_description = 'Thumbnail'

@admin.register(EventPackage)
class EventPackageAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'duration', 'is_custom')
    list_filter = ('is_custom',)
    search_fields = ('name', 'description')
    list_editable = ('price',)

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'venue', 'status', 'display_image', 'capacity', 'price')
    list_filter = ('status', 'date')
    search_fields = ('title', 'description', 'venue')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'date'
    list_editable = ('status', 'price')
    
    def display_image(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover;" />',
                obj.image.url
            )
        return "No Image"
    display_image.short_description = 'Event Image'

@admin.register(EventBooking)
class EventBookingAdmin(admin.ModelAdmin):
    list_display = ('name', 'event', 'number_of_tickets', 'total_amount', 
                   'booking_date', 'status', 'mpesa_transaction_id')
    list_filter = ('status', 'booking_date', 'event')
    search_fields = ('name', 'email', 'phone', 'mpesa_transaction_id')
    readonly_fields = ('booking_date', 'mpesa_transaction_id')
    date_hierarchy = 'booking_date'
    
    def has_add_permission(self, request):
        # Bookings should only be created through the website
        return False

@admin.register(CustomEventRequest)
class CustomEventRequestAdmin(admin.ModelAdmin):
    list_display = ('name', 'event_type', 'event_date', 'status', 'created_at')
    list_filter = ('status', 'event_date', 'event_type')
    search_fields = ('name', 'email', 'phone', 'event_type')
    readonly_fields = ('created_at',)
    date_hierarchy = 'event_date'
    list_editable = ('status',)

@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'service_type', 'rating', 
                   'display_image', 'is_featured', 'date')
    list_filter = ('service_type', 'rating', 'is_featured')
    search_fields = ('name', 'company', 'testimonial')
    list_editable = ('is_featured',)
    
    def display_image(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 25px;" />',
                obj.image.url
            )
        return "No Image"
    display_image.short_description = 'Photo'

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'display_image', 'author', 'published_date', 'is_published')
    list_filter = ('is_published', 'categories', 'published_date')
    search_fields = ('title', 'content')
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('categories', 'tags')
    date_hierarchy = 'published_date'
    list_editable = ('is_published',)
    
    def display_image(self, obj):
        if obj.featured_image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover;" />',
                obj.featured_image.url
            )
        return "No Image"
    display_image.short_description = 'Featured Image'

@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(BlogTag)
class BlogTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ('email', 'date_subscribed', 'is_active')
    list_filter = ('is_active', 'date_subscribed')
    search_fields = ('email',)
    date_hierarchy = 'date_subscribed'
    list_editable = ('is_active',)
    
    def has_add_permission(self, request):
        # Subscribers should only be added through the website
        return False

# Customize admin site header and title
admin.site.site_header = "Susan Abong'o Administration"
admin.site.site_title = "Susan Abong'o Admin Portal"
admin.site.index_title = "Welcome to Susan Abong'o Admin Portal"