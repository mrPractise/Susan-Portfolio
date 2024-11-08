def format_phone_number(phone):
    """Convert phone number to required format (254XXXXXXXXX)"""
    phone = phone.strip().replace(" ", "")
    if phone.startswith("+"):
        phone = phone[1:]
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    if not phone.startswith("254"):
        phone = "254" + phone
    return phone

# mpesa_utils.py

from decimal import Decimal
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import redirect
from django.contrib import messages
from django.urls import reverse
import requests

class MpesaPaymentHandler:
    def __init__(self, request, mpesa_credential):
        self.request = request
        self.mpesa = mpesa_credential
        self.access_token = self.mpesa.get_access_token()

    def prepare_stk_push(self, booking, phone):
        """Prepare and make STK push request"""
        if not self.access_token:
            raise Exception("Could not get M-Pesa access token")

        password, timestamp = self.mpesa.generate_password()
        callback_url = f"{settings.BASE_URL}/mpesa/callback/"

        stk_payload = {
            'BusinessShortCode': self.mpesa.business_shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerBuyGoodsOnline',
            'Amount': int(booking.total_amount),
            'PartyA': phone,
            'PartyB': self.mpesa.business_shortcode,
            'PhoneNumber': phone,
            'CallBackURL': callback_url,
            'AccountReference': f'EVENT{booking.id}',
            'TransactionDesc': f'Payment for {booking.event.title}'
        }

        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
        }

        response = requests.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            json=stk_payload,
            headers=headers
        )

        return response

    def handle_response(self, response, booking, slug=None):
        """Handle the STK push response and return appropriate response"""
        is_ajax = self.request.headers.get('X-Requested-With') == 'XMLHttpRequest'

        if response.status_code == 200:
            response_data = response.json()
            
            # Store checkout details
            self.request.session['mpesa_checkout'] = {
                'booking_id': booking.id,
                'checkout_request_id': response_data.get('CheckoutRequestID')
            }
            
            success_message = "Please check your phone for the M-PESA prompt"
            redirect_url = reverse('events:booking-confirmation', args=[booking.id])

            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': success_message,
                    'redirect_url': redirect_url
                })
            
            messages.success(self.request, success_message)
            return redirect('events:booking-confirmation', booking_id=booking.id)
        
        else:
            error_message = "Failed to initiate M-Pesa payment. Please try again."
            
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'message': error_message
                })
            
            messages.error(self.request, error_message)
            return redirect('payment', slug=slug) if slug else None

def handle_mpesa_callback(booking, result):
    """Handle M-PESA callback result"""
    if result['ResultCode'] == 0:
        booking.status = 'confirmed'
    else:
        booking.status = 'cancelled'
    
    booking.save()
    return {'status': 'success'}