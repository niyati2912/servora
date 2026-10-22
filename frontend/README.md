# Sevora Frontend

A React + Vite + Tailwind CSS frontend starter for Sevora, a local home-services, household-help, driver-booking and local-work marketplace. The design takes inspiration from the supplied pink/blush, photo-forward home-services references while using Sevora-specific branding and layout.

## Run on Windows (PowerShell)

```powershell
cd path\to\SevoraFrontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open the local URL shown by Vite (normally `http://localhost:5173`).

## Backend connection

The frontend requests `GET /services?limit=100` from the backend base URL defined by `VITE_API_URL` in `.env`.

```env
VITE_API_URL=http://localhost:5000/api
```

If the service catalogue endpoint is unavailable or returns no services, the frontend falls back to its included demo catalogue. The small status label above the service grid identifies the catalogue state.

## Included interactions

- Responsive desktop/mobile navigation and section links
- Search and category filtering for service catalogue data
- Live catalogue fetch with a local fallback catalogue
- City picker and area search for Rajpura, Chandigarh, Panchkula, Ambala, Patiala, Samana, Sirhind, Khanna, Ludhiana, Shahabad Markanda, Kurukshetra and additional nearby locations
- Service preview modal with area, duration and optional notes
- Local service shortlist (frontend state only)
- FAQ accordion and responsive sections

## Backend integration boundary

This is the frontend starter, not a fully authenticated booking client. The current project backend requires an authenticated user and a provider ID to create bookings; this UI does not invent provider endpoints or submit a fake booking. Selecting a service lets a visitor preview details and add it to a local shortlist. Connect sign-in, provider discovery and booking confirmation once those backend endpoints and token-handling rules are final.

## Notes

- Service photo URLs are served from Unsplash and require internet access; the card layout remains styled if an image cannot load.
- Catalogue demo prices are illustrative UI values, not market quotes.
- Locations are shown for the project concept and do not promise real-time service availability in every area.
