from django import forms
from django.core.validators import EmailValidator
import bleach

class ContactForm(forms.Form):
    name = forms.CharField(max_length=100)
    email = forms.EmailField(validators=[EmailValidator()])
    service = forms.ChoiceField(choices=[
        ('art', 'Animation Services'),
        ('modeling', 'Modeling Services'),
        ('other', 'Other Services'),
        
    ])
    message = forms.CharField(max_length=2000, widget=forms.Textarea)

    def clean_name(self):
        name = self.cleaned_data.get('name')
        name = bleach.clean(name.strip())
        
        if len(name) < 2:
            raise forms.ValidationError('Name must be at least 2 characters long')
        
        if not all(char.isalpha() or char.isspace() for char in name):
            raise forms.ValidationError('Name can only contain letters and spaces')
        
        return name
    
    def clean_message(self):
        message = self.cleaned_data.get('message')
        message = bleach.clean(message.strip())
        
        if len(message) < 10:
            raise forms.ValidationError('Message must be at least 10 characters long')
        
        if len(message) > 2000:
            raise forms.ValidationError('Message cannot exceed 2000 characters')
            
        return message
    
    def clean_email(self):
        email = self.cleaned_data.get('email').lower().strip()
        if not email:
            raise forms.ValidationError('Email is required')
        return email