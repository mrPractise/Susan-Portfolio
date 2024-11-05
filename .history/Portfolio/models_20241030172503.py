from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
from datetime import timedelta

def validate_video_extension(value):
    valid_extensions = ['.mp4', '.webm', '.mov']
    ext = str(value.name).lower()[-4:]
    if not any(ext.endswith(x) for x in valid_extensions):
        raise ValidationError('Unsupported video format')

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name

class Project(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    created_date = models.DateField(auto_now_add=True)
    
    # Media fields with validators
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
        ordering = ['-created_date']

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
                
                # Generate thumbnail at middle of video
                if not self.video_thumbnail:
                    thumbnail_time = clip.duration / 2
                    thumbnail_path = f'projects/thumbnails/{self.slug}_thumb.jpg'
                    clip.save_frame(thumbnail_path, t=thumbnail_time)
                    self.video_thumbnail = thumbnail_path
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