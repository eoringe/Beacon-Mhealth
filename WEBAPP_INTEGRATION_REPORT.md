# Web App Integration Report: Teleconsultation Booking with M-Pesa Payment

## Overview

The Beacon Children's Centre backend API now supports **teleconsultation booking with M-Pesa payment** for the web application. When a patient books a teleconsultation, they must pay via M-Pesa STK push before the appointment is created.

**In-person bookings remain unchanged** — no payment is required.

---

## 🔗 API Base URL

**Use the live Railway deployment:**

```
https://beacon-mhealth-production.up.railway.app
```

> ⚠️ **Do NOT use localhost.** M-Pesa callbacks require a publicly accessible URL, which only works on the Railway deployment.

---

## 📋 Available Endpoints

### 1. Get Specializations
```
GET /api/public/specializations
```

Returns all available specializations with teleconsult availability flags.

**Response:**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": 1,
      "name": "Developmental Paediatrician",
      "roleId": 2,
      "doctorCount": 1,
      "hasTeleconsult": true
    }
  ]
}
```

---

### 2. Get Consultation Prices
```
GET /api/public/consultation-prices
```

Returns the price list for teleconsultation services.

**Response:**
```json
{
  "success": true,
  "prices": {
    "Medical Officer": 1000,
    "Paediatrician": 2000,
    "Developmental Paediatrician": 1,
    "Occupational Therapist": 1500,
    "Speech Therapist": 2000,
    "Physiotherapist": 1500,
    "Psychologist": 2500,
    "Nutritionist": 1500,
    "Default": 1000
  },
  "currency": "KES",
  "note": "Prices are for teleconsultation services. In-person bookings do not require prepayment."
}
```

> 📌 **Note:** Developmental Paediatrician is currently set to **KES 1** for testing purposes.

---

### 3. Check Availability
```
GET /api/public/availability?specialization_id={id}&date={YYYY-MM-DD}&appointment_type=TELECONSULT
```

**Response:**
```json
{
  "success": true,
  "date": "2026-05-02",
  "available_slots": ["09:00", "10:00", "11:00", "14:00"]
}
```

---

### 4. Verify Return Patient
```
POST /api/public/verify-patient
Content-Type: application/json

{
  "reg_number": "BCC-1234",
  "dob": "2020-01-15"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Patient verified successfully",
  "data": {
    "id": 123,
    "fullname": {"first_name": "John", "last_name": "Doe"},
    "registration_number": "BCC-1234"
  }
}
```

---

### 5. Book Teleconsultation (with M-Pesa Payment) ⭐ NEW
```
POST /api/public/book-teleconsult
Content-Type: application/json
```

**Request Body (New/Guest Patient):**
```json
{
  "is_return_patient": false,
  "parent_first_name": "Jane",
  "parent_last_name": "Doe",
  "parent_phone": "0712345678",
  "parent_email": "jane@example.com",
  "child_first_name": "John",
  "child_last_name": "Doe",
  "child_dob": "2020-01-15",
  "child_gender": "Male",
  "specialization_id": 1,
  "appointment_date": "2026-05-02",
  "appointment_time": "09:00",
  "reason": "Follow up consultation",
  "phone": "0712345678"
}
```

**Request Body (Return Patient):**
```json
{
  "is_return_patient": true,
  "reg_number": "BCC-1234",
  "dob": "2020-01-15",
  "parent_email": "jane@example.com",
  "specialization_id": 1,
  "appointment_date": "2026-05-02",
  "appointment_time": "09:00",
  "reason": "Follow up",
  "phone": "0712345678"
}
```

**Key Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `phone` | ✅ Yes | M-Pesa phone number (format: 0712345678 or 254712345678) |
| `specialization_id` | ✅ Yes | ID from the specializations endpoint |
| `appointment_date` | ✅ Yes | Format: YYYY-MM-DD |
| `appointment_time` | ✅ Yes | Format: HH:MM (24-hour) |
| `is_return_patient` | ✅ Yes | `true` for existing patients, `false` for new |
| `reg_number` | If return | Patient registration number |
| `dob` | If return | Patient date of birth |
| `parent_phone` | If new | Parent phone number |
| `child_first_name` | If new | Child's first name |
| `child_dob` | If new | Child's date of birth |
| `parent_email` | Optional | Email for Google Meet invitation |
| `reason` | Optional | Reason for consultation |

**Response (Success):**
```json
{
  "success": true,
  "message": "STK Push sent to your phone. Please enter your M-Pesa PIN to complete payment.",
  "checkout_request_id": "ws_CO_01052026102345678",
  "merchant_request_id": "12345-67890-1",
  "amount": 1,
  "specialization": "Developmental Paediatrician"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Failed to initiate payment",
  "error": "..."
}
```

---

### 6. Poll Payment Status ⭐ NEW
```
GET /api/public/mpesa-status/{checkout_request_id}
```

After initiating the STK push, **poll this endpoint every 5 seconds** to check if the payment has been completed.

**Response (Pending):**
```json
{
  "checkout_request_id": "ws_CO_01052026102345678",
  "amount": "1.00",
  "status": "pending"
}
```

**Response (Completed):**
```json
{
  "checkout_request_id": "ws_CO_01052026102345678",
  "amount": "1.00",
  "status": "completed",
  "mpesa_receipt_number": "SHJ7Y5KT9R",
  "appointment_id": 456,
  "google_meet_link": "https://meet.google.com/abc-defg-hij",
  "appointment_type": "TELECONSULT"
}
```

**Response (Failed):**
```json
{
  "checkout_request_id": "ws_CO_01052026102345678",
  "amount": "1.00",
  "status": "failed"
}
```

---

### 7. Book In-Person Appointment (No Payment)
```
POST /api/public/book
Content-Type: application/json
```

This endpoint remains **unchanged**. Use it for in-person bookings which do not require prepayment.

---

## 🔄 Complete Booking Flow

```
┌─────────────────────────────────────────┐
│           WEB APP FRONTEND              │
├─────────────────────────────────────────┤
│                                         │
│  1. GET /api/public/specializations     │
│     → Show specializations to user      │
│                                         │
│  2. GET /api/public/consultation-prices │
│     → Display prices for teleconsult    │
│                                         │
│  3. GET /api/public/availability        │
│     → Show available time slots         │
│                                         │
│  4. User selects slot & enters details  │
│                                         │
│  5. POST /api/public/book-teleconsult   │
│     → Sends booking data + phone        │
│     ← Returns checkout_request_id       │
│                                         │
│  6. Show "Waiting for payment..." UI    │
│     User sees STK push on their phone   │
│     User enters M-Pesa PIN              │
│                                         │
│  7. POLL: GET /api/public/mpesa-status/ │
│     → Poll every 5 seconds              │
│     → Stop when status != "pending"     │
│                                         │
│  8. If status == "completed":           │
│     → Show success + Meet link          │
│     If status == "failed":              │
│     → Show failure message              │
│                                         │
└─────────────────────────────────────────┘
```

### Polling Implementation Example (JavaScript):

```javascript
async function pollPaymentStatus(checkoutRequestId) {
  const API_BASE = 'https://beacon-mhealth-production.up.railway.app';
  const MAX_ATTEMPTS = 24; // 2 minutes max (24 × 5s)
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(
          `${API_BASE}/api/public/mpesa-status/${checkoutRequestId}`
        );
        const data = await response.json();

        if (data.status === 'completed') {
          clearInterval(interval);
          resolve(data); // Contains appointment_id, google_meet_link, mpesa_receipt_number
        } else if (data.status === 'failed') {
          clearInterval(interval);
          reject(new Error('Payment was cancelled or failed'));
        } else if (attempts >= MAX_ATTEMPTS) {
          clearInterval(interval);
          reject(new Error('Payment timeout - please check your M-Pesa messages'));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 5000); // Poll every 5 seconds
  });
}
```

---

## ⚠️ Important Notes

1. **Phone Number Format**: The API accepts phone numbers in any of these formats:
   - `0712345678` (auto-converted to `254712345678`)
   - `254712345678`
   - `+254712345678`

2. **Testing**: Developmental Paediatrician is set to **KES 1** for testing. This will be changed to KES 3000 for production.

3. **M-Pesa STK Push**: The user will receive a push notification on their phone asking them to enter their M-Pesa PIN. They have about 60 seconds to respond.

4. **Appointment Creation**: The appointment is automatically created by the backend when M-Pesa confirms payment. The web app does NOT need to call a separate endpoint to create the appointment.

5. **Google Meet Link**: For teleconsultations, a Google Meet link is automatically generated and returned in the payment status response.

6. **Email Notification**: If `parent_email` is provided, a confirmation email with the Google Meet link is automatically sent.

7. **CORS**: The Railway backend allows all origins. If you encounter CORS issues, please report them.

---

## 🧪 Testing Checklist

- [ ] Call `GET /api/public/specializations` to find the Developmental Paediatrician `specialization_id`
- [ ] Call `GET /api/public/consultation-prices` to verify the price is KES 1
- [ ] Call `GET /api/public/availability` with a valid date to get available time slots
- [ ] Call `POST /api/public/book-teleconsult` with a valid Safaricom phone number
- [ ] Check your phone for the M-Pesa STK push prompt
- [ ] Enter your M-Pesa PIN
- [ ] Poll `GET /api/public/mpesa-status/{checkout_request_id}` until status is `completed`
- [ ] Verify the response includes `appointment_id` and `google_meet_link`

---

*Report generated: May 1, 2026*
*Backend version: Beacon Mhealth API (Railway Production)*
