from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
from datetime import timedelta
from django.utils import timezone
from django.utils.html import format_html
from django.contrib import admin

def validate_video_extension(value):
    valid_extensions = ['.mp4', '.webm', '.mov']
    ext = str(value.name).lower()[-4:]
    if not any(ext.endswith(x) for x in valid_extensions):
        raise ValidationError('Unsupported video format')

class ProjectCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, help_text="Optional description of this category")
    order = models.IntegerField(default=0, help_text="Order in which category appears")

    class Meta:
        verbose_name = "Project Category"
        verbose_name_plural = "Project Categories"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class Project(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    category = models.ForeignKey(ProjectCategory, on_delete=models.CASCADE, related_name='projects')
    created_date = models.DateField(auto_now_add=True)
    featured = models.BooleanField(default=False, help_text="Feature this project in listings")
    
    image = models.ImageField(
        upload_to='projects/images/', 
        null=True, 
        blank=True,
        help_text='Supported formats: jpg, png, gif'
    )    
    video = models.FileField(
        upload_to='projects/videos/', 
        null=True, 
        blank=True,
        validators=[validate_video_extension],
        help_text='Supported formats: mp4, webm, mov'
    )
    video_thumbnail = models.ImageField(
        upload_to='projects/thumbnails/', 
        null=True, 
        blank=True
    )
    video_duration = models.DurationField(null=True, blank=True)
    
    class Meta:
        ordering = ['-featured', '-created_date']

    def clean(self):
        if not self.image and not self.video:
            raise ValidationError('Either image or video must be provided')
        if self.image and self.video:
            raise ValidationError('Project can only have either image or video, not both')

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
            
        if self.video:
            try:
                from moviepy.editor import VideoFileClip
                clip = VideoFileClip(self.video.path)
                self.video_duration = timedelta(seconds=int(clip.duration))
                
                if not self.video_thumbnail:
                    from django.core.files.base import ContentFile
                    import io
                    from PIL import Image
                    
                    thumbnail_time = clip.duration / 2
                    thumbnail_frame = clip.get_frame(thumbnail_time)
                    image = Image.fromarray(thumbnail_frame)
                    thumb_io = io.BytesIO()
                    image.save(thumb_io, format='JPEG')
                    
                    thumbnail_name = f'{self.slug}_thumb.jpg'
                    self.video_thumbnail.save(
                        thumbnail_name,
                        ContentFile(thumb_io.getvalue()),
                        save=False
                    )
                clip.close()
            except Exception as e:
                print(f"Error processing video: {e}")
        
        super().save(*args, **kwargs)

    @property
    def media_type(self):
        return 'video' if self.video else 'image'

    def __str__(self):
        return self.title

class Event(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    venue = models.CharField(max_length=200)
    venue_address = models.TextField(blank=True, help_text="Full address of the venue")
    image = models.ImageField(upload_to='events/')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    max_capacity = models.PositiveIntegerField(help_text="Maximum total capacity for the event")

    class Meta:
        ordering = ['date', 'start_time']

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError('End time must be after start time')
        
        # Check if total tickets across all types exceed max capacity
        if self.id:  # Only check for existing events
            total_capacity = sum(tt.capacity for tt in self.ticket_types.all())
            if total_capacity > self.max_capacity:
                raise ValidationError('Total ticket capacity exceeds event maximum capacity')

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    @property
    def is_upcoming(self):
        return self.date >= timezone.now().date()

    @property
    def is_sold_out(self):
        return all(ticket_type.is_sold_out for ticket_type in self.ticket_types.all())

    def __str__(self):
        return f"{self.title} - {self.date}"

class TicketType(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='ticket_types')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.PositiveIntegerField()
    available_tickets = models.PositiveIntegerField()
    minimum_purchase = models.PositiveIntegerField(default=1)
    maximum_purchase = models.PositiveIntegerField()
    display_order = models.IntegerField(default=0, help_text="Order in which ticket type appears")
    
    class Meta:
        ordering = ['display_order', 'price']
        unique_together = ['event', 'name']

    def clean(self):
        if self.minimum_purchase > self.maximum_purchase:
            raise ValidationError('Minimum purchase cannot be greater than maximum purchase')
        if self.maximum_purchase > self.capacity:
            raise ValidationError('Maximum purchase cannot exceed capacity')
        if self.available_tickets > self.capacity:
            raise ValidationError('Available tickets cannot exceed capacity')

    @property
    def is_sold_out(self):
        return self.available_tickets <= 0

    def __str__(self):
        return f"{self.name} - {self.event.title}"

