# Sevora Frontend

The client-side single-page application (SPA) for **Sevora**, built with **React 18**, **Vite**, **Framer Motion**, and **Tailwind CSS / modern CSS variables**. Heavily inspired by **SnabbIt** and **UrbanClap**.

## ✨ Features

- **SnabbIt Aesthetic**: Blush pink theme (`#ef438b`, `#fff0f6`), rounded card designs, pill tags, and clean typography.
- **SnabbIt Dual Moving Marquee Carousel**: Bidirectional infinite review stream showing customer feedback from local cities with pause-on-hover.
- **4 Dedicated Workspaces**:
  - `Customer`: Book services & drivers, track live bookings, telephone contact, cancel appointments, leave star reviews.
  - `Driver`: Manage ride bookings, trip progression, Multer driver licence document viewer and upload.
  - `Service Pro`: Manage trade skills, categories, availability status, and customer bookings.
  - `Employer`: Register business entities, post job vacancies with salary brackets, and review applicants.
- **Role Switching**: Instant role switcher in Header and Profile page with seamless backend synchronization.
- **Strict Role Gating**: Driving licence document section and prompts only display when the active role is `driver`.
- **Dual JWT Cookie Sync**: Auto-syncs JWT tokens to `token` and `sevora_token` browser cookies so they are visible in browser DevTools Application/Storage settings.

## 🚀 Quick Start (Windows / PowerShell)

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## ⚙️ Configuration (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## 🏗️ Production Build

```powershell
npm run build
```
Build output is saved to the `dist/` directory.
