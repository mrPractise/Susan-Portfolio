from django.contrib import admin
from django.utils.html import format_html
from .models import ProjectCategory, Project

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
        if obj:  # Editing existing object
            return self.readonly_fields
        return ('video_duration', 'video_thumbnail', 'created_date')

@admin.register(ProjectCategory)
class ProjectCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'project_count', 'order')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    ordering = ['order', 'name']

    def project_count(self, obj):
        return obj.projects.count()
    project_count.short_description = 'Number of Projects'