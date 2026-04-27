# servitaxi-tortuguero

![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=FFD62E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

A full-stack taxi booking platform built for Tortuguero, Nicaragua, designed to streamline reservations, dispatching, and operations for both customers and drivers.

**Live demo:** https://servitaxitortuguero.com

---

## Features

- 🚕 **Multi-step booking form** for customers, with no account required
- 💰 **Automatic fare calculation** based on origin and destination
- 📍 **Optional customer geolocation** using GPS and a text reference
- 📧 **Instant booking email** to the customer, including a calendar-ready `.ics` file
- 🔒 **Private admin panel** for the business owner
- 👨‍✈️ **Driver system** with registration, login, and personal dashboard
- 📥 **Driver dashboard sections** for pending trips, accepted trips, and trip history
- 🔔 **Sound alert in the driver panel** when a new booking arrives
- 📣 **Automatic email notifications** to all active drivers on new reservations
- ✅ **Confirmation email to the customer** when a driver accepts a trip
- 🧑‍💼 **Driver management panel** to activate or deactivate drivers
- 📰 **Public homepage advertising system** with full CRUD
- 🛡️ **Protected routes** for admin and drivers using Supabase Auth
- 🚀 **Automatic deployment from GitHub** to Vercel
- 🌐 **Custom domain setup** with Porkbun

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| Hosting / Serverless | Vercel |
| Email Delivery | Resend |
| Domain | Porkbun |

---

## Architecture

```
servitaxi-tortuguero/
├── api/
│   ├── enviar-email.js        ← booking email to customer + notifications to drivers
│   └── confirmar-viaje.js     ← confirmation email when driver accepts a trip
├── src/
│   ├── constants/
│   │   └── destinos.js        ← destinations and pricing logic
│   ├── components/
│   │   ├── ProtectedRoute.jsx
│   │   └── ProtectedTaxistaRoute.jsx
│   └── pages/
│       ├── admin/             ← admin dashboard (reservations, drivers, ads)
│       └── taxista/           ← driver portal (login + panel)
└── vercel.json                ← SPA routing for Vercel
```

### Supabase tables

- `reservas` — all bookings with status, origin, destination, customer info and driver assignment
- `taxistas` — registered drivers with vehicle info and active/inactive status
- `publicidad` — ads shown on the public homepage

---

## Setup

### Prerequisites

- Node.js 18+
- npm, pnpm, or yarn
- A Supabase project
- A Resend account
- A Vercel account

### Installation

```bash
git clone https://github.com/deyvingarcias/servitaxi-tortuguero.git
cd servitaxi-tortuguero
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_api_key
```

### Run locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
npm run preview
```

---

## Screenshots

> Screenshots coming soon.

| Public booking flow | Admin dashboard | Driver dashboard |
|---|---|---|
| _coming soon_ | _coming soon_ | _coming soon_ |

---

## Deployment

This project is configured for automatic deployment from GitHub to Vercel.

Make sure to:

- Set all environment variables in Vercel
- Verify the SPA routing rules in `vercel.json`
- Configure the custom domain in Porkbun and Vercel
- Enable the required Supabase RLS policies and Auth settings

---

## Disclaimer

This is a real production project built for a client business in Tortuguero, Nicaragua. Some implementation details, credentials, internal workflows, and business-specific logic are intentionally not shared publicly.

---

## License

Private client project. All rights reserved.