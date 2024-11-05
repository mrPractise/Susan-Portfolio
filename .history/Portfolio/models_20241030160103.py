from datetime import timedelta
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.utils.text import slugify
import os


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    order = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['order']

    def __str__(self):
        return self.name

class Tool(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

class Project(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    tools = models.ManyToManyField(Tool)
    created_date = models.DateField()
    
    # Media fields
    image = models.ImageField(upload_to='projects/images/', null=True, blank=True)    
    video = models.FileField(upload_to='projects/videos/', null=True, blank=True)
    video_thumbnail = models.ImageField(upload_to='projects/thumbnails/', null=True, blank=True)
    video_duration = models.DurationField(null=True, blank=True)
    video_format = models.CharField(max_length=20, blank=True)
    
    # Additional fields
    order = models.IntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_date', 'order']

    def save(self, *args, **kwargs):
        if self.video:
            # Get the file extension
            ext = self.video.name.split('.')[-1].lower()
            self.video_format = f'video/{ext}'
            
            # Ensure unique filenames
            if not self.slug:
                self.slug = slugify(self.title)
            self.video.name = f'projects/videos/{self.slug}.{ext}'
            
            # Generate video thumbnail and duration
            if not self.video_thumbnail:
                try:
                    from moviepy.editor import VideoFileClip
                    clip = VideoFileClip(self.video.path)
                    self.video_duration = timedelta(seconds=clip.duration)
                    thumbnail_time = clip.duration / 2
                    thumbnail_path = f'projects/thumbnails/{self.slug}_thumbnail.jpg'
                    clip.save_frame(thumbnail_path, t=thumbnail_time)
                    self.video_thumbnail = thumbnail_path
                    clip.close()
                except Exception as e:
                    print(f"Error processing video: {e}")
                    
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    @property
    def media_type(self):
        if self.video:
            return 'video'
        return 'image'

    def get_tools_list(self):
        return ', '.join([tool.name for tool in self.tools.all()])




















class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    venue = models.CharField(max_length=200)
    image = models.ImageField(upload_to='events/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} - {self.date}"

    @property
    def is_upcoming(self):
        return self.date >= timezone.now().date()

    @property
    def is_sold_out(self):
        return all(ticket_type.is_sold_out for ticket_type in self.ticket_types.all())

class TicketType(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='ticket_types')
    name = models.CharField(max_length=100)  # e.g., "Single", "Couple", "Child"
    description = models.TextField(blank=True)  # Any additional info about the ticket
    price = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.PositiveIntegerField()
    available_tickets = models.PositiveIntegerField()
    minimum_purchase = models.PositiveIntegerField(default=1)
    maximum_purchase = models.PositiveIntegerField()
    
    @property
    def is_sold_out(self):
        return self.available_tickets <= 0

    def __str__(self):
        return f"{self.name} - {self.event.title}"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='bookings')
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    booking_date = models.DateTimeField(auto_now_add=True)
    mpesa_transaction_id = models.CharField(max_length=50, blank=True, null=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.name} - {self.event.title}"

class BookingTicket(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='tickets')
    ticket_type = models.ForeignKey(TicketType, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    @property
    def subtotal(self):
        return self.quantity * self.unit_price