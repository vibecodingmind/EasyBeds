# Fake, Simulated & Mock Functionality Inventory

## Purpose
This document catalogs all areas in the codebase where simulated, mocked, or placeholder functionality is used rather than live external integrations or hardware interfaces.

## 1. Simulated External Gateways
1. **Door Lock Encoders (`/src/components/DigitalKeycardModal.tsx`, `/api/keys/encode`):**
   - *Status:* Software simulation. Generates valid hexadecimal track codes and simulated Apple/Google Wallet payload structures. Does not transmit over TCP/IP to physical RFID encoders (Assa Abloy Visionline / Salto KS).
2. **Channel Manager OTA Webhooks (`/server/channels/`):**
   - *Status:* Mocked API adapters returning simulated latency and success promises. Real RFC 5545 iCal is live.
3. **SMS / WhatsApp Live Dispatch (`/src/components/MessagesView.tsx`):**
   - *Status:* Dispatches simulated queue events and logs to the messaging center. Live delivery requires Twilio credentials.
4. **Payment Gateway Webhook Console (`/src/components/PlatformAdminView.tsx`):**
   - *Status:* In-app webhook simulator for Stripe events. Processes valid JSON payloads through the server webhook handler.

## 2. Real Operational Logic (Non-Mocked)
- ✅ Folio charge reconciliation and balance mathematics
- ✅ Night audit revenue posting and business date rollover
- ✅ Interactive tape chart collision checking and room reassignment
- ✅ F&B POS order dispatching to Kitchen Display Stations
- ✅ Multi-currency conversions using live FX rate tables
- ✅ Configurable multi-tier tax and VAT calculation rules
