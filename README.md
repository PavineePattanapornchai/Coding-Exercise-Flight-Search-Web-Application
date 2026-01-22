# Flight Search Web Application

Full-stack exercise using ADSBDB for flight details. The frontend is React and the backend is Node.js + Express with SQLite.

## Requirements
- Node.js 18+
- npm

## Setup

### 1) Backend
```bash
cd backend
npm install
cp env.example .env
```

Edit `backend/.env` and set a strong `JWT_SECRET` if needed.

Seed a test user:
```bash
npm run seed
```

Start backend:
```bash
npm run dev
```

Backend runs at `http://localhost:4000`.
The SQLite `backend/data` folder is created automatically on first run.

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Test Login
- Email: `test@example.com`
- Password: `password123`

## API Endpoints

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`

### Flights (protected)
- `GET /api/flights/stats`
- `GET /api/flights/search?query=...&type=...`

Notes:
- `type` can be `callsign`, `aircraft`, or `airline`.
- If omitted, the backend infers a type based on the query format.

## ADSBDB Integration
The backend calls:
- `https://api.adsbdb.com/v0/stats`
- `https://api.adsbdb.com/v0/callsign/{CALLSIGN}`
- `https://api.adsbdb.com/v0/aircraft/{MODE_S_OR_REG}`
- `https://api.adsbdb.com/v0/airline/{ICAO_OR_IATA}`

The frontend never calls ADSBDB directly.

## Assumptions
- Callsign lookups may return `unknown` from ADSBDB; the UI shows "No data found".
- Only `daily` stats are shown in the popular list.
- SQLite is used for simplicity.
- `/api/flights/stats` responses are cached on the server for 5 minutes.
