# Linkly — URL Shortener Microservice

A production-grade, RESTful URL shortener microservice built with **Node.js (ESM)**, **Express 5**, and **PostgreSQL 16+**. Engineered for high-concurrency redirection, atomic click telemetry, cursor-based pagination, and memory-efficient CSV analytics streaming.

---

## Live Deployment & API Docs

* **Production Base URL:** `https://ur-shortener-microservice.onrender.com`
* **Interactive Swagger UI:** `https://ur-shortener-microservice.onrender.com/api-docs`
* **Health Check:** `https://ur-shortener-microservice.onrender.com/health`

---

## Key Features

* **Short URL & Vanity Code Generation (`POST /links`):** Generates 8-character hexadecimal short codes or accepts custom vanity codes, enforcing uniqueness atomically via PostgreSQL `23505` unique constraints (`409 Conflict`).
* **Expiration Enforcement (`410 Gone`):** Supports optional ISO-8601 `expires_at` timestamps and automatically blocks expired links during redirection.
* **Atomic Redirection & Telemetry (`GET /:short_code`):** Executes `302` redirects while atomically incrementing `click_count` and logging `referrer` and `user_agent` inside a PostgreSQL transaction (`BEGIN` / `COMMIT`).
* **Keyset (Cursor) Pagination (`GET /links/:short_code/clicks`):** High-performance `O(1)` cursor pagination (`limit` & `after`) backed by composite PostgreSQL indexes (`idx_click_log_link_id_clicked`).
* **Streamed CSV Exports (`GET /links/:short_code/clicks.csv`):** Streams click logs in 5,000-row batches via Node.js `Transform` streams with spreadsheet formula injection sanitization (`=`, `+`, `-`, `@`).
* **Automated Startup Migrations (`init-db.js`):** Idempotent schema initialization and legacy column migration (`expired_at` -> `expires_at`) executed automatically on startup.
* **OpenAPI 3.0 & Structured Logging:** Interactive documentation via `swagger-ui-express`, boundary validation via `Zod`, and structured JSON logs via `Winston`.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime** | Node.js (v18+ ES Modules) |
| **Framework** | Express 5 |
| **Database** | PostgreSQL 16+ (`pg` connection pool) |
| **Validation & Docs** | Zod, OpenAPI 3.0 (`swagger-ui-express`, `yamljs`) |
| **Logging** | Winston |
| **Testing & Quality** | `node:test`, Supertest, ESLint, Prettier |

---

## Project Structure

```text
url_shortener_microservice/
├── src/
│   ├── config/
│   │   ├── db.js              # PostgreSQL connection pool configuration
│   │   └── logger.js          # Winston structured logger
│   ├── controllers/
│   │   └── urlcontroller.js   # Route handlers, transactions, CSV streaming
│   ├── middlewares/           # Zod validation & centralized error handling
│   ├── routes/                # Express route definitions
│   ├── tests/                 # Integration, concurrency, expiry & security tests
│   ├── app.js                 # Express app setup & Swagger UI mount
│   └── server.js              # HTTP server entry point
├── init-db.js                 # Automated schema creation & safe migrations
├── schema.sql                 # Reference PostgreSQL DDL & indexes
├── swagger.yaml               # OpenAPI 3.0 specification
└── package.json               # Scripts & dependencies