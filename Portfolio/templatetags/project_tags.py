from django import template
from django.utils.safestring import mark_safe

register = template.Library()  # This line is crucial

@register.simple_tag
def video_player(project, autoplay=False):
    """Render video player with proper attributes"""
    if not project.video:
        return ''
        
    video_attrs = {
        'preload': 'metadata',
        'playsinline': '',
        'id': f'video-{project.id}',
        'data-video-id': project.id,
    }
    
    if project.video_thumbnail:
        video_attrs['poster'] = project.video_thumbnail.url
        
    if autoplay:
        video_attrs['autoplay'] = ''
        video_attrs['muted'] = ''
        
    attrs_str = ' '.join([f'{k}="{v}"' for k, v in video_attrs.items() if v])
    
    html = f'''
    <div class="custom-video-player" data-video-id="{project.id}">
        <div class="video-container">
            <video {attrs_str}>
                <source src="{project.video.url}" type="video/mp4">
                <source src="{project.video.url[:-4]}.webm" type="video/webm">
                Your browser doesn't support video playback.
            </video>
            <div class="video-controls">
                <button class="play-pause" aria-label="Play/Pause">
                    <i class="fas fa-play"></i>
                </button>
                <div class="progress-bar">
                    <div class="progress-bar-filled"></div>
                </div>
                <div class="time">
                    <span class="current-time">0:00</span>
                    <span>/</span>
                    <span class="duration">0:00</span>
                </div>
                <div class="volume-control">
                    <button class="mute-unmute" aria-label="Mute/Unmute">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="1">
                </div>
                <button class="fullscreen" aria-label="Fullscreen">
                    <i class="fas fa-expand"></i>
                </button>
            </div>
        </div>
    </div>
    '''
    return mark_safe(html)