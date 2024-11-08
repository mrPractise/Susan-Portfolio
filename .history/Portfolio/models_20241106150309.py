from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
from datetime import timedelta

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
            
        if self.video and not self.video_duration:
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