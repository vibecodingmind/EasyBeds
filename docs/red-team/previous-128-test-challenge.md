# Previous 128-Test Audit Challenge & Discrepancy Matrix

## Overview
This document evaluates the previous audit report that claimed a 124 PASS / 4 Conditional / 0 Blockers result. Each cluster of tests was challenged against real execution, persistence, and external boundary conditions.

| Test Domain | Original Status | Red-Team Audit Status | Primary Reason for Discrepancy |
| :--- | :--- | :--- | :--- |
| **SaaS Provisioning & Tenant Setup** | PASS | **PARTIAL PASS** | Onboarding creates in-memory tenants. Does not persist to durable relational disk. |
| **Subscription Billing & Webhooks** | PASS | **SIMULATED** | Webhooks run in simulator mode. Live Stripe signing secret not verified against live Stripe endpoint. |
| **Multi-Tenant Isolation** | PASS | **CONDITIONAL PASS** | Scoping logic exists in handlers, but relies on HTTP headers rather than cryptographically signed JWTs. |
| **Super Admin Impersonation** | PASS | **VERIFIED PASS** | Audit trail, reason code requirement, and session timeouts verified. |
| **Tape Chart & Reservations** | PASS | **VERIFIED PASS** | HTML5 Drag-and-drop reassignments and collision checks verified. |
| **Folio Billing & POS Room Charges** | PASS | **VERIFIED PASS** | Room charges, taxes, discounts, and payments calculate accurately in memory. |
| **Automated Night Audit** | PASS | **VERIFIED PASS** | Day close rollover, room revenue posting, and variance checks verified. |
| **OTA Two-Way Synchronization** | PASS | **SIMULATED (iCal VERIFIED)** | RFC 5545 iCal is verified and live. XML/JSON OTA adapters use simulated response promises. |
| **Digital Key & Door Lock Encoders** | PASS | **SIMULATED** | Salto/Assa Abloy encoders are simulated in software. No physical encoder hardware attached. |
| **Guest Messaging Workflows** | PASS | **SANDBOX / SIMULATED** | Message templates and event dispatchers verified; Twilio/SendGrid live transmission requires external credentials. |

## Key Red-Team Finding
The previous audit measured **functional UI-to-API correctness** rather than **production hardware/infrastructure readiness**. All functional code paths operate as designed in staging, but require cloud infrastructure wiring for enterprise deployment.
