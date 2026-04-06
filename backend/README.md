# Fontanella — Backend

Modular Monolith built with **Node.js 20 LTS + Express + Supabase (PostgreSQL)**.  
No ORM — direct Supabase client queries.  
Timezone handling delegated to [timeapi.io](https://timeapi.io).

---

## Prerequisites

- Node.js >= 20
- A Supabase project (URL + service-role key)

---

## Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Start development server (auto-reload)
npm run dev

# 4. Start production server
npm start
```

The server will be available at `http://localhost:3000` (or `PORT` from `.env`).

---

## Health check

```
GET /health
```

Response:
```json
{ "status": "ok", "timestamp": "2024-06-15T12:00:00.000Z" }
```

---

## API Endpoints

All routes are prefixed with `/api/v1`.

| Module            | Prefix                       |
|-------------------|------------------------------|
| Appointments      | `/api/v1/appointments`       |
| Lawyers           | `/api/v1/lawyers`            |
| Clients           | `/api/v1/clients`            |
| Contact           | `/api/v1/contact`            |
| Working Schedule  | `/api/v1/working-schedule`   |
| Vacations         | `/api/v1/vacations`          |

### Appointments (reference implementation)

| Method | Path                            | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/appointments`                 | List all (pagination)    |
| GET    | `/appointments/:id`             | Get one                  |
| POST   | `/appointments`                 | Create                   |
| PATCH  | `/appointments/:id`             | Update                   |
| PATCH  | `/appointments/:id/cancel`      | Cancel                   |
| DELETE | `/appointments/:id`             | Delete                   |

**POST /appointments body example:**
```json
{
  "clientId": "uuid",
  "lawyerId": "uuid",
  "startsAt": "2024-06-15 09:00:00",
  "endsAt":   "2024-06-15 10:00:00",
  "timezone": "America/Argentina/Buenos_Aires",
  "notes": "Initial consultation"
}
```

Dates are received in the client's local timezone, normalized to **UTC** via timeapi.io before storage.

---

## Project structure

```
src/
├── app.js                   # Express app (middleware + routes)
├── server.js                # HTTP server entry point
├── modules/
│   ├── appointments/        # Reference module (Controller → Service → Repository)
│   ├── lawyers/
│   ├── clients/
│   ├── contact/
│   ├── working-schedule/
│   └── vacations/
└── shared/
    ├── config/              # Centralised env config
    ├── database/            # Supabase singleton client
    ├── middlewares/         # errorHandler, notFound
    ├── services/
    │   └── timezone/        # timeapi.io integration
    └── utils/               # Pure date helpers
```

---

## Error format

All errors return:

```json
{
  "status": 404,
  "message": "Appointment not found: abc-123"
}
```

Stack trace is included only in `NODE_ENV=development`.

---

## Environment variables

| Variable                  | Required | Description                              |
|---------------------------|----------|------------------------------------------|
| `PORT`                    | No       | HTTP port (default: 3000)                |
| `NODE_ENV`                | No       | `development` / `production`             |
| `SUPABASE_URL`            | Yes      | Your Supabase project URL                |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes   | Service-role key (never expose to client)|
| `TIMEAPI_BASE_URL`        | No       | Defaults to `https://timeapi.io/api`     |
| `APP_TIMEZONE`            | No       | Default IANA timezone for normalization  |
