# Generated by Django 5.1.2 on 2024-11-06 12:43

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('slug', models.SlugField(blank=True, unique=True)),
                ('description', models.TextField()),
                ('date', models.DateField()),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('venue', models.CharField(max_length=200)),
                ('venue_address', models.TextField(blank=True, help_text='Full address of the venue')),
                ('image', models.ImageField(upload_to='events/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('max_capacity', models.PositiveIntegerField(default=0, help_text='Maximum total capacity for the event')),
            ],
            options={
                'ordering': ['date', 'start_time'],
            },
        ),
        migrations.CreateModel(
            name='Booking',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('email', models.EmailField(max_length=254)),
                ('phone', models.CharField(max_length=15)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('confirmed', 'Confirmed'), ('cancelled', 'Cancelled')], default='pending', max_length=10)),
                ('booking_date', models.DateTimeField(auto_now_add=True)),
                ('mpesa_transaction_id', models.CharField(blank=True, max_length=50, null=True)),
                ('total_amount', models.DecimalField(decimal_places=2, help_text='Total amount including all tickets', max_digits=10)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookings', to='Events.event')),
            ],
            options={
                'verbose_name': 'Booking',
                'verbose_name_plural': 'Bookings',
                'ordering': ['-booking_date'],
            },
        ),
        migrations.CreateModel(
            name='TicketType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('capacity', models.PositiveIntegerField(default=0, help_text='Total number of tickets available')),
                ('available_tickets', models.PositiveIntegerField(default=0, help_text='Number of tickets currently available')),
                ('minimum_purchase', models.PositiveIntegerField(default=1, help_text='Minimum tickets per purchase')),
                ('maximum_purchase', models.PositiveIntegerField(default=10, help_text='Maximum tickets per purchase')),
                ('display_order', models.IntegerField(default=0, help_text='Order in which ticket type appears')),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ticket_types', to='Events.event')),
            ],
            options={
                'ordering': ['display_order', 'price'],
                'unique_together': {('event', 'name')},
            },
        ),
        migrations.CreateModel(
            name='BookingTicket',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField()),
                ('unit_price', models.DecimalField(decimal_places=2, help_text='Price per ticket at time of booking', max_digits=10)),
                ('booking', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tickets', to='Events.booking')),
                ('ticket_type', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='bookings', to='Events.tickettype')),
            ],
            options={
                'verbose_name': 'Booking Ticket',
                'verbose_name_plural': 'Booking Tickets',
            },
        ),
    ]
