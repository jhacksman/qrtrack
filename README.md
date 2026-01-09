# QRTrack - QR Code Generator & Analytics SaaS

A complete SaaS application for creating QR codes with powerful analytics tracking. Built with FastAPI (backend) and React + Vite (frontend).

## Features

- User authentication (JWT-based)
- Create customizable QR codes with custom colors
- Track every scan with analytics (device type, location, time)
- Free tier (5 QR codes, basic analytics)
- Pro tier ($9.99/month - unlimited QR codes, full analytics)
- Stripe integration for subscription payments

## Project Structure

```
qrtrack/
├── qrtrack-backend/     # FastAPI backend
│   ├── app/
│   │   ├── main.py      # Main FastAPI app
│   │   ├── auth.py      # JWT authentication
│   │   ├── database.py  # SQLite database setup
│   │   ├── schemas.py   # Pydantic models
│   │   └── routers/     # API routes
│   └── pyproject.toml   # Python dependencies
│
└── qrtrack-frontend/    # React + Vite frontend
    ├── src/
    │   └── App.tsx      # Main React app
    └── package.json     # Node dependencies
```

## Setup

### Backend

```bash
cd qrtrack-backend
poetry install
poetry run fastapi dev app/main.py
```

The backend will run at http://localhost:8000

### Frontend

```bash
cd qrtrack-frontend
npm install
npm run dev
```

The frontend will run at http://localhost:5173

## Environment Variables

### Backend (.env)
```
JWT_SECRET_KEY=your-secret-key
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:8000
DATABASE_PATH=/data/app.db  # For production with persistent volume
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Create a product with a $9.99/month recurring price
3. Copy your API keys and price ID to the backend .env file
4. Set up a webhook endpoint pointing to `/stripe/webhook`

## Deployment

The app is designed to be deployed with:
- Backend: Fly.io with persistent SQLite volume
- Frontend: Any static hosting (Vercel, Netlify, etc.)

## License

MIT
