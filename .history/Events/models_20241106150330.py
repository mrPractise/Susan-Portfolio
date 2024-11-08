from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
from django.utils import timezone

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
    max_capacity = models.PositiveIntegerField(
        help_text="Maximum total capacity for the event",
        default=0
    )

    class Meta:
        ordering = ['date', 'start_time']

    def clean(self):
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError('End time must be after start time')
        
        if self.date and self.date < timezone.now().date():
            raise ValidationError('Event date cannot be in the past')
        
        if self.id:
            total_capacity = sum(tt.capacity or 0 for tt in self.ticket_types.all())
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
        return all(tt.is_sold_out for tt in self.ticket_types.all())

    def __str__(self):
        return f"{self.title} - {self.date}"

class TicketType(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='ticket_types')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.PositiveIntegerField(
        default=0,
        help_text="Total number of tickets available"
    )
    available_tickets = models.PositiveIntegerField(
        default=0,
        help_text="Number of tickets currently available"
    )
    minimum_purchase = models.PositiveIntegerField(
        default=1,
        help_text="Minimum tickets per purchase"
    )
    maximum_purchase = models.PositiveIntegerField(
        default=10,
        help_text="Maximum tickets per purchase"
    )
    display_order = models.IntegerField(
        default=0, 
        help_text="Order in which ticket type appears"
    )
    
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
        
        if self.capacity > self.event.max_capacity:
            raise ValidationError('Ticket type capacity cannot exceed event maximum capacity')
        
        if self.event_id:
            total_capacity = self.capacity
            for tt in self.event.ticket_types.exclude(id=self.id):
                total_capacity += tt.capacity
            
            if total_capacity > self.event.max_capacity:
                raise ValidationError(
                    f'Total ticket capacity ({total_capacity}) would exceed event '
                    f'maximum capacity ({self.event.max_capacity})'
                )

    def save(self, *args, **kwargs):
        if self.available_tickets == 0 and self.capacity > 0:
            self.available_tickets = self.capacity
        super().save(*args, **kwargs)

    @property
    def is_sold_out(self):
        return self.available_tickets == 0

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
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    booking_date = models.DateTimeField(auto_now_add=True)
    mpesa_transaction_id = models.CharField(
        max_length=50, 
        blank=True, 
        null=True
    )
    total_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Total amount including all tickets"
    )

    class Meta:
        ordering = ['-booking_date']
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'

    def clean(self):
        if self.id:
            calculated_total = sum(
                ticket.quantity * ticket.unit_price 
                for ticket in self.tickets.all()
            )
            if calculated_total != self.total_amount:
                raise ValidationError('Total amount does not match ticket selections')

    @property
    def subtotal_amount(self):
        return sum(
            ticket.quantity * ticket.unit_price 
            for ticket in self.tickets.all()
        )

    def __str__(self):
        return f"{self.name} - {self.event.title} ({self.status})"

class BookingTicket(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='tickets')
    ticket_type = models.ForeignKey(
        TicketType, 
        on_delete=models.PROTECT,
        related_name='bookings'
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Price per ticket at time of booking"
    )

    class Meta:
        verbose_name = 'Booking Ticket'
        verbose_name_plural = 'Booking Tickets'

    def clean(self):
        if not self.id:
            if self.quantity > self.ticket_type.available_tickets:
                raise ValidationError(
                    f'Not enough tickets available. Only {self.ticket_type.available_tickets} remaining.'
                )
            
            if self.quantity < self.ticket_type.minimum_purchase:
                raise ValidationError(
                    f'Minimum purchase for this ticket type is {self.ticket_type.minimum_purchase}'
                )
            
            if self.quantity > self.ticket_type.maximum_purchase:
                raise ValidationError(
                    f'Maximum purchase for this ticket type is {self.ticket_type.maximum_purchase}'
                )

    def save(self, *args, **kwargs):
        if not self.id:
            self.unit_price = self.ticket_type.price
            self.ticket_type.available_tickets -= self.quantity
            self.ticket_type.save()
        super().save(*args, **kwargs)

    @property
    def subtotal(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.quantity}x {self.ticket_type.name} for {self.booking.name}"