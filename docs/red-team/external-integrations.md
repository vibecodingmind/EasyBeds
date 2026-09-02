# External Integrations & Infrastructure Status

| Integration / Provider | Code Implementation | Sandbox Verification | Production Verification | Status | Production Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stripe Payments** | Implemented (`/api/webhooks/stripe`) | Verified | Not Verified (Simulated) | 🟡 **SANDBOX** | Set `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET` |
| **Twilio SMS / WhatsApp** | Implemented (`/api/messages/send`) | Verified | Not Verified (Simulated) | 🟡 **SANDBOX** | Set `TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN` |
| **SendGrid Email** | Implemented (Templates & Triggers) | Verified | Not Verified (Simulated) | 🟡 **SANDBOX** | Set `SENDGRID_API_KEY` |
| **Booking.com OTA** | Provider Adapter (`BookingComProvider.ts`) | Verified | Not Verified (Simulated) | 🟡 **SIMULATED** | Certified OTA Gateway / Channel API Contract |
| **Airbnb OTA** | Provider Adapter (`AirbnbProvider.ts`) | Verified | Not Verified (Simulated) | 🟡 **SIMULATED** | Certified Airbnb Partner API Credentials |
| **Expedia OTA** | Provider Adapter (`ExpediaProvider.ts`) | Verified | Not Verified (Simulated) | 🟡 **SIMULATED** | Expedia Partner Central API Key |
| **iCal Calendar Feed** | Real RFC 5545 `.ics` Engine | Verified Live | Verified Live | 🟢 **VERIFIED LIVE** | Native HTTP Endpoint `/api/ical/...` |
| **Salto / Assa Abloy Locks** | Digital Keycard API (`/api/keys/encode`) | Verified | Simulated (No hardware) | 🟡 **SIMULATED** | Salto KS / Assa Abloy Visionline Gateway |
