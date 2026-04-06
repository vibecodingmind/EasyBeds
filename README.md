# EasyBeds — Hotel Booking & Channel Management Platform

A comprehensive, production-ready hotel management SaaS built with Next.js 15. Manage bookings, sync OTA channels, automate housekeeping, power AI guest concierge, and grow revenue — all from one dashboard.

## Features

### Core Operations
- **Unified Calendar** — Gantt-chart view of all bookings across channels
- **Booking Management** — Create, modify, cancel bookings with audit trail
- **Room Management** — Room types, amenities, status tracking, availability
- **Guest Management** — Profiles, stay history, communication logs
- **Housekeeping** — Kanban board, auto-generated tasks, staff management
- **Night Audit** — End-of-day reconciliation, room status verification

### Channel Distribution
- **OTA Sync** — Two-way iCal sync with Booking.com, Airbnb, Expedia, and more
- **Online Booking Engine** — Branded booking page with zero commission
- **Rate Parity Checker** — Detect pricing discrepancies across channels

### Revenue & Analytics
- **Dynamic Pricing** — Seasonal, occupancy-based, day-of-week rate rules
- **Coupon System** — Percentage, fixed, free-night promo codes with validation
- **Revenue Analytics** — ADR, RevPAR, GOPPAR, occupancy forecasts, trend charts
- **PDF Reports** — Daily, monthly, and financial reports (print-ready)
- **Occupancy Forecast** — AI-powered occupancy prediction with confidence scores

### Guest Experience
- **AI Concierge** — 24/7 AI-powered guest support (powered by LLM)
- **Guest Portal** — Self-service booking management, messaging, ID upload
- **Self Check-In** — 4-step mobile check-in flow
- **Loyalty Program** — Points system, redemptions, tier management
- **Reviews System** — Collect, respond to, and analyze guest reviews
- **WhatsApp Notifications** — Booking confirmations, reminders, receipts

### Payments & Billing
- **Payment Processing** — Cash, mobile money, card, bank transfer, Stripe online
- **Invoice Generation** — Auto-numbered invoices with print-ready PDFs
- **Email Notifications** — 6 HTML templates (confirmation, reminder, receipt, etc.)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | SQLite via Prisma ORM |
| State | Zustand (client) + TanStack Query (server) |
| Auth | NextAuth.js v4 (JWT) |
| AI | z-ai-web-dev-sdk (LLM chat completions) |
| Charts | Recharts |
| Animations | Framer Motion |

## Getting Started

### Prerequisites
- Node.js 20+ or Bun
- npm or bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/easybeds.git
cd easybeds

# Install dependencies
npm install
# or: bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Push database schema
npx prisma db push

# Seed demo data (optional)
# Visit http://localhost:3000/api/seed

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Demo Credentials
- **Email:** demo@easybeds.com
- **Password:** demo123

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `NEXTAUTH_SECRET` | JWT signing secret | Yes |
| `NEXTAUTH_URL` | App base URL | Yes |
| `RESEND_API_KEY` | Resend email API key | No |
| `STRIPE_SECRET_KEY` | Stripe secret key | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | No |

## Project Structure

```
src/
├── app/
│   ├── api/              # 57 API routes
│   ├── (booking)/        # Public booking engine
│   ├── (portal)/         # Guest portal & check-in
│   ├── layout.tsx        # Root layout (PWA meta)
│   ├── page.tsx          # Landing page / Dashboard
│   └── globals.css
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── views/            # 16 dashboard views
│   ├── layout/           # Sidebar, Header
│   └── booking/          # Booking dialogs
├── lib/
│   ├── db.ts             # Prisma client
│   ├── store.ts          # Zustand store
│   ├── api.ts            # API client
│   ├── auth.ts           # JWT verification
│   ├── payments.ts       # Payment service
│   ├── notifications.ts  # Notification service
│   ├── invoices.ts       # Invoice service
│   ├── whatsapp.ts       # WhatsApp service
│   ├── currency.ts       # Multi-currency support
│   └── ...
prisma/
├── schema.prisma         # 20 database models
public/
├── manifest.json         # PWA manifest
├── logo.svg              # App logo
└── icon-*.png            # PWA icons
```

## API Overview

All API routes are under `/api/` and accept JSON. Protected routes require `Authorization: Bearer <token>` header.

### Authentication
- `POST /api/auth/login` — Login with email/password
- `POST /api/auth/register` — Create hotel account

### Dashboard
- `GET /api/dashboard` — Dashboard statistics

### Core CRUD
- `GET/POST /api/bookings` — List/create bookings
- `GET/PATCH/DELETE /api/bookings/[id]` — Booking details
- `GET/POST /api/rooms` — List/create rooms
- `GET /api/guests` — List guests

### Channels & OTA
- `GET/POST /api/channels` — List/create channels
- `POST /api/channels/sync-all` — Sync all channels
- `GET /api/channels/[id]/ical` — Get iCal URL

### Revenue
- `GET/POST /api/revenue/rules` — Dynamic pricing rules
- `GET /api/revenue/calculate` — Calculate dynamic price
- `GET/POST /api/coupons` — Coupon management

### Analytics
- `GET /api/analytics/kpis` — Key performance indicators
- `GET /api/analytics/trends` — Revenue & occupancy trends
- `GET /api/forecast/occupancy` — Occupancy forecast

### Guest Experience
- `POST /api/ai/chat` — AI concierge chat
- `GET /api/reviews` — Guest reviews
- `GET /api/loyalty/guests` — Loyalty program

### Public APIs
- `GET /api/public/hotel/[slug]` — Public hotel info
- `GET /api/public/hotel/[slug]/availability` — Room availability
- `POST /api/public/hotel/[slug]/book` — Public booking

## Deployment

### Railway

1. Push your code to GitHub
2. Connect the repo in [Railway](https://railway.app)
3. Add environment variables from `.env.example`
4. Railway will auto-detect the `railway.toml` config

Or use the Dockerfile:
```bash
docker build -t easybeds .
docker run -p 3000:3000 --env-file .env easybeds
```

### Vercel

1. Import project in [Vercel](https://vercel.com)
2. Add environment variables
3. Deploy — Vercel auto-detects Next.js

> **Note:** For production, switch from SQLite to PostgreSQL by updating `DATABASE_URL` to a `postgresql://` connection string.

### Docker

```bash
docker build -t easybeds .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  easybeds
```

## Database Models (20)

`Hotel`, `User`, `Room`, `RoomType`, `Booking`, `Guest`, `Channel`, `AvailabilityBlock`, `HousekeepingTask`, `CancellationPolicy`, `AuditLog`, `Notification`, `Invoice`, `Coupon`, `DynamicRateRule`, `RatePlan`, `LoyaltyTransaction`, `GuestMessage`, `Review`, `NightAudit`

## License

Private — All rights reserved.
