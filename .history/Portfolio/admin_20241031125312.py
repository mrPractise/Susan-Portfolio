# Admin Configuration
from Portfolio.models import Project,ProjectCategory,TicketType,Event
from django.contrib import admin
from django.utils.html import format_html


@admin.register(ProjectCategory)
class ProjectCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    ordering = ['order', 'name']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'created_date', 'featured', 'media_type', 'preview')
    list_filter = ('category', 'created_date', 'featured')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('video_duration', 'video_thumbnail')
    actions = ['toggle_featured']

    def preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.image.url)
        elif obj.video_thumbnail:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.video_thumbnail.url)
        return "-"
    
    def toggle_featured(self, request, queryset):
        for project in queryset:
            project.featured = not project.featured
            project.save()
    toggle_featured.short_description = "Toggle featured status"

class TicketTypeInline(admin.TabularInline):
    model = TicketType
    extra = 1
    fields = ('name', 'price', 'capacity', 'available_tickets', 'minimum_purchase', 
              'maximum_purchase', 'display_order', 'is_sold_out')
    readonly_fields = ('is_sold_out',)

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'venue', 'is_active', 'is_upcoming', 'is_sold_out', 
                   'total_tickets_sold', 'max_capacity')
    list_filter = ('is_active', 'date')
    search_fields = ('title', 'description', 'venue')
    readonly_fields = ('created_at', 'updated_at')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [TicketTypeInline]
    date_hierarchy = 'date'

    def total_tickets_sold(self, obj):
        total = sum([tt.capacity - tt.available_tickets for tt in obj.ticket_types.all()])
        return f"{total}/{obj.max_capacity}"
    total_tickets_sold.short_description = "Tickets Sold"