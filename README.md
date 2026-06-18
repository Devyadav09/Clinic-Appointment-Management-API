# Clinic Appointment Management API

A REST API for managing clinic appointments — patient registration, doctor schedules, slot availability, and appointment booking with daily token numbers.

Built with **Node.js**, **Express 5**, **TypeScript**, **Prisma**, and **PostgreSQL**.

---

## Features

- **Patient management** — register patients, search by name or phone, fetch by ID
- **Doctor slots** — list available time slots for a doctor on a given date (excludes already booked slots)
- **Appointment booking** — book slots with conflict detection and safe daily token generation
- **Status workflow** — `BOOKED → COMPLETED` or `BOOKED → CANCELLED` (terminal states cannot be changed)
- **Input validation** — Zod schemas on all endpoints
- **Structured errors** — consistent JSON error responses with correct HTTP status codes

---

## Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **PostgreSQL** 14+
- **npm** 9+

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-fork-url>
cd clinic-assignment
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root (or copy from the example below):

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/your_db"
PORT=3000
```

Replace the connection string with your local PostgreSQL credentials.

### 4. Set up the database

Create the database (if it does not exist):

```bash
createdb clinic_db
```

Push the Prisma schema and generate the client:

```bash
npm run db:push
npm run db:generate
```

### 5. Seed sample data (optional)

```bash
npm run seed
```

### 6. Start the server

**Development** (with hot reload):

```bash
npm run dev
```

**Production**:

```bash
npm run build
npm start
```

The server runs at `http://localhost:3000` by default.

### 7. Verify the server

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "success": true,
  "message": "Server is healthy"
}
```

---

## API Overview

Base URL: `/api/v1`

All successful responses follow this shape:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Patients

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/patients` | Register a new patient |
| `GET` | `/patients` | List patients (`?search=` optional) |
| `GET` | `/patients/:id` | Get patient by ID |

**Register patient** — `POST /api/v1/patients`

```json
{
  "name": "Jane Doe",
  "phone": "9876543210",
  "gender": "Female",
  "dateOfBirth": "1990-05-15"
}
```

### Doctors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/doctors/:id/slots?date=YYYY-MM-DD` | Get available slots for a doctor |

**Example:**

```bash
curl "http://localhost:3000/api/v1/doctors/1/slots?date=2025-03-15"
```

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/appointments` | Book an appointment |
| `GET` | `/appointments` | List appointments (`?doctorId=&date=` optional) |
| `GET` | `/appointments/:id` | Get appointment with patient and doctor |
| `PATCH` | `/appointments/:id/status` | Update appointment status |

**Book appointment** — `POST /api/v1/appointments`

```json
{
  "patientId": 1,
  "doctorId": 1,
  "date": "2025-03-15",
  "timeSlot": "09:00"
}
```

**Update status** — `PATCH /api/v1/appointments/:id/status`

```json
{
  "status": "COMPLETED"
}
```

Allowed transitions:

| From | To | Allowed |
|------|----|---------|
| `BOOKED` | `COMPLETED` | Yes |
| `BOOKED` | `CANCELLED` | Yes |
| `COMPLETED` | any | No |
| `CANCELLED` | any | No |

---

## Project Structure

```
src/
├── app.ts                          # Express app setup
├── server.ts                       # Server entry point
├── routes/
│   └── index.ts                    # Route aggregation
├── modules/
│   ├── patients/                   # Patient module
│   ├── doctors/                    # Doctor module
│   └── appointments/               # Appointment module
├── common/
│   ├── database/                   # Prisma client
│   ├── exceptions/                 # Custom error classes
│   ├── middleware/                 # Validation & error handling
│   └── constants/
└── utils/                          # Shared utilities
prisma/
├── schema.prisma                   # Database schema
└── seed.ts                         # Seed script
```

Each module follows a layered structure: **routes → controller → service → repository**.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:generate` | Generate Prisma client |
| `npm run seed` | Seed the database |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express 5 |
| Language | TypeScript |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Validation | Zod 4 |

---

## License

ISC
