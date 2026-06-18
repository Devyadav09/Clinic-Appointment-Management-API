# Code Review — Clinic Appointment API

This document records issues found in the original starter codebase, why they matter, and how they were addressed in this submission.

---

## Table of Contents

1. [Prisma Schema Issues](#1-prisma-schema-issues)
2. [API & Route Handler Bugs](#2-api--route-handler-bugs)
3. [Missing Business Logic](#3-missing-business-logic)
4. [Architecture & Code Quality Improvements](#4-architecture--code-quality-improvements)
5. [Remaining Observations](#5-remaining-observations)

---

## 1. Prisma Schema Issues

### 1.1 Appointment status stored as plain `String`

**What:** `Appointment.status` was a free-form `String` with a default of `"BOOKED"`.

**Why:** Any value could be written to the database (`"PENDING"`, `"done"`, empty string). Business rules could not be enforced at the DB layer, and queries filtering by status were unreliable.

**How fixed:** Introduced a Prisma `AppointmentStatus` enum with values `BOOKED`, `COMPLETED`, and `CANCELLED`, and typed the `status` field accordingly.

---

### 1.2 No unique constraint on doctor + date + time slot

**What:** Multiple patients could book the same doctor, date, and time slot.

**Why:** Under concurrent requests, two bookings for `09:00` with the same doctor on the same day would both succeed — a critical data integrity bug in production.

**How fixed:** Added `@@unique([doctorId, date, timeSlot])` on the `Appointment` model so the database rejects duplicate slot bookings.

---

### 1.3 No unique constraint on patient/doctor phone numbers

**What:** `Patient.phone` and `Doctor.phone` had no uniqueness constraint.

**Why:** Duplicate phone numbers break patient lookup, SMS reminders, and identity resolution. The starter code had no guard against registering the same phone twice.

**How fixed:** Added `@unique` on `Patient.phone` and `Doctor.phone`. The patient service also checks for existing phones before insert and returns a `409 Conflict`.

---

### 1.4 Duplicate doctor schedules for the same day

**What:** `DoctorSchedule` had no constraint preventing multiple rows for the same `doctorId` + `dayOfWeek`.

**Why:** Ambiguous schedules — the API would pick one arbitrarily via `findFirst`, producing inconsistent slot generation.

**How fixed:** Added `@@unique([doctorId, dayOfWeek])`.

---

### 1.5 Missing indexes for common query patterns

**What:** No indexes on fields used in every list/filter query (`doctorId`, `date`, `phone`).

**Why:** Full table scans as appointment volume grows; noticeable latency on slot checks and appointment listings.

**How fixed:**

- `@@index([doctorId, date])` on `Appointment`
- `@@index([phone])` on `Patient`
- `@@index([doctorId])` on `DoctorSchedule`

---

### 1.6 `tokenNumber` nullable with no generation guarantee

**What:** `tokenNumber` was `Int?` with no DB-level requirement.

**Why:** Appointments could exist without tokens, breaking queue management at the clinic front desk.

**How fixed:** Token generation is enforced in the booking service inside a transaction. The field remains nullable in the schema for backward compatibility, but every new booking assigns a token.

---

## 2. API & Route Handler Bugs

### 2.1 Generic 500 errors swallowing real failures

**What:** Every route handler caught all errors and responded with `{ error: 'Something went wrong' }` and status `500`.

**Why:** Clients cannot distinguish validation failures, not-found cases, or conflicts from genuine server errors. Debugging and API consumption become painful.

**How fixed:** Introduced a custom error hierarchy (`AppError`, `NotFoundError`, `BadRequestError`, `ConflictError`, `ValidationError`) and a centralized `errorHandler` middleware that maps each error type to the correct HTTP status and message.

---

### 2.2 No input validation

**What:** Request bodies and query parameters were used directly without validation (`patientId`, `doctorId`, `date`, `timeSlot`, `status`).

**Why:** Missing fields, wrong types (`doctorId` as string), or invalid dates cause Prisma/runtime errors that surface as opaque 500 responses.

**How fixed:** Added Zod validation schemas for every endpoint and a `validate` middleware that runs before controllers. Invalid input returns `400` with a descriptive message.

---

### 2.3 Wrong HTTP status codes on create endpoints

**What:** `POST /appointments` and `POST /patients` returned `200` with `res.json()`.

**Why:** REST convention uses `201 Created` for successful resource creation. Clients and HTTP caches rely on correct semantics.

**How fixed:** Create endpoints now return `201` with a structured `{ success, data }` response.

---

### 2.4 No 404 when resource not found

**What:** `GET /appointments/:id` and `GET /patients/:id` returned `null` in JSON with status `200` when the record did not exist.

**Why:** Clients must null-check every response instead of relying on HTTP status. Breaks standard REST client patterns.

**How fixed:** Service layer throws `NotFoundError` (404) when `findUnique` returns null.

---

### 2.5 Appointment list date filter uses exact timestamp match

**What:** `where.date = new Date(date)` matches only the exact stored timestamp, not the full calendar day.

**Why:** If `date` is stored as `2025-03-15T00:00:00.000Z` but queried as `2025-03-15T05:30:00.000Z` (timezone offset), the query returns zero results.

**How fixed / would fix:** Use a date-range filter (`gte` start of day, `lte` end of day) similar to the booking transaction. _(Partially addressed in booking logic; list endpoint still uses exact match — see [5.2](#52-date-filtering-uses-exact-match-in-list-and-slot-queries).)_

---

### 2.6 Patient search limited to `startsWith` on name only

**What:** Search only matched names starting with the query string; phone numbers were not searchable.

**Why:** Front-desk staff typically search by partial name or phone digits, not exact prefixes.

**How fixed:** Search now uses case-insensitive `contains` on `name` and `contains` on `phone`, with results ordered by `createdAt` descending.

---

### 2.7 No duplicate phone check on patient registration

**What:** Creating a patient with an existing phone caused a raw Prisma unique-constraint error (500).

**Why:** Should be a predictable `409 Conflict` with a clear message.

**How fixed:** Service checks `findPatientByPhone` before insert and throws `ConflictError`.

---

### 2.8 `parseInt` on route params without validation

**What:** `parseInt(req.params.id)` silently produces `NaN` for non-numeric IDs.

**Why:** `NaN` passed to Prisma causes confusing errors instead of a clean `400 Bad Request`.

**How fixed:** Zod `z.coerce.number()` in route param schemas validates and rejects invalid IDs at the middleware layer.

---

### 2.9 Async errors not propagated to error handler

**What:** Async route handlers had try/catch blocks but no `next(error)` pattern for unhandled cases outside try blocks.

**Why:** Unhandled promise rejections can crash the process or leave requests hanging.

**How fixed:** Added `asyncHandler` wrapper that catches promise rejections and forwards them to Express error middleware.

---

## 3. Missing Business Logic

### 3.1 Slot availability ignored existing bookings

**What:** `/doctors/:id/slots` returned every slot from the schedule without checking booked appointments.

**Why:** Patients could see slots that were already taken, leading to failed bookings and poor UX.

**How fixed:** The doctor service generates all slots from the schedule, fetches appointments with `status: BOOKED` for that doctor and date, and filters out occupied slots before returning the list.

---

### 3.2 No appointment status state machine

**What:** `PATCH /appointments/:id/status` accepted any status string with no transition rules.

**Why:** A `COMPLETED` appointment could be set back to `BOOKED`, or a `CANCELLED` one to `COMPLETED` — violating clinic workflow and audit integrity.

**How fixed:** Implemented transition rules in `changeStatus`:

- `BOOKED → COMPLETED` ✅
- `BOOKED → CANCELLED` ✅
- `COMPLETED → anything` ❌ (`400 Bad Request`)
- `CANCELLED → anything` ❌ (`400 Bad Request`)
- `BOOKED → BOOKED` ❌ (`400 Bad Request`)

---

### 3.3 Unsafe daily token generation

**What:** Token numbers were computed as `count(all appointments today) + 1` globally, with no transaction or locking.

**Why:**

1. **Wrong scope** — counted all doctors' appointments, not per-doctor queue.
2. **Race condition** — two concurrent bookings read the same count and assign duplicate tokens.
3. **No daily reset logic** — relied on count which breaks if appointments are deleted.

**How fixed:** Booking runs inside a `prisma.$transaction` with `isolationLevel: "Serializable"`. Inside the transaction:

1. Check for an existing `BOOKED` appointment on the same slot (application-level guard).
2. Find the highest `tokenNumber` for that `doctorId` on that calendar day.
3. Assign `(lastToken ?? 0) + 1`.
4. Create the appointment.

Tokens reset to `1` each day because the query is scoped to the day's date range. Tokens are unique per doctor per day.

---

### 3.4 No doctor existence check on slot endpoint

**What:** The slots endpoint did not verify the doctor exists before querying schedules.

**Why:** Invalid doctor IDs returned empty slots with a misleading "not available" message instead of `404`.

**How fixed:** Service checks `findDoctorById` first and throws `NotFoundError` if missing.

---

### 3.5 No slot conflict check at booking time

**What:** Booking did not verify the slot was free before creating the appointment.

**Why:** Even with DB unique constraint, users get a raw Prisma error instead of a friendly `409 Conflict`.

**How fixed:** Transaction checks for existing `BOOKED` appointment on the same doctor/date/slot before insert, throwing `AppError(409, "Slot already booked")`.

---

## 4. Architecture & Code Quality Improvements

Beyond bug fixes, the codebase was restructured for maintainability:

| Area                      | Change                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Modular structure**     | Split into `patients`, `doctors`, `appointments` modules with controller / service / repository layers |
| **Shared Prisma client**  | Single `PrismaClient` instance in `common/database/prisma.ts`                                          |
| **Validation middleware** | Reusable Zod-based `validate()` middleware                                                             |
| **Error middleware**      | Centralized `errorHandler` for consistent JSON errors                                                  |
| **Utilities**             | `generateTimeSlots` moved to `utils/timeSlot.ts` with input validation                                 |
| **API versioning**        | Routes mounted under `/api/v1`                                                                         |
| **Response envelope**     | Consistent `{ success, data }` / `{ success, message }` shape                                          |

---
