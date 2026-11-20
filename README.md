# URL Shortener Microservice

A RESTful URL Shortener Microservice built with **Node.js, Express.js, and PostgreSQL**. It allows users to create short links, redirect visitors to their original destinations, track link activity, view click analytics, and export click records as CSV files.

## Features

- Create short URLs with automatically generated or custom short codes.
- Redirect users from short URLs to their original destinations.
- Retrieve information about shortened URLs.
- Track clicks, referrers, user agents, and timestamps.
- Paginate click history using cursor-based pagination.
- Export click analytics as CSV.
- Support link expiration and inactive links.
- Delete shortened links.
- Validate incoming requests and handle errors.
- Interactive API documentation using Swagger.

## Technologies

- Node.js
- Express.js
- PostgreSQL
- JavaScript (ES Modules)
- Swagger / OpenAPI
- Node.js test runner
- Supertest
- ESLint
- Prettier
- GitHub Actions

## Live Deployment

**Base URL:**  
https://url-shortener-microservice-ccia.onrender.com

**API documentation:**  
https://url-shortener-microservice-ccia.onrender.com/docs

The live deployment should be checked to confirm it is running the latest version of this repository.

## Getting Started

### Prerequisites

Install the following:

- Node.js (use the version specified in `.nvmrc`, if available).
- PostgreSQL.
- Git.
- npm.

### 1. Clone the repository

```bash
git clone https://github.com/RusselFonta/url-shortener-microservice.git
cd url_shortener_microservice
```

### 2. Install dependencies

```bash
npm install
```

For a clean installation using the lockfile:

```bash
npm ci
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/url_shortener
```

Replace the database username, password, and database name with your PostgreSQL configuration.

Do not commit `.env` files or expose database credentials.

### 4. Create the PostgreSQL database

Create a PostgreSQL database for the application, for example:

```sql
CREATE DATABASE url_shortener;
```

Make sure the database user has permission to create and modify tables.

### 5. Initialize the database

Run:

```bash
npm run db:init
```

This executes `init-db.js`, which creates the required database tables, constraints, indexes, and applies the supported schema migrations.

### 6. Start the application

For production-style startup:

```bash
npm start
```

For development:

```bash
npm run dev
```

The server runs on the configured port, defaulting to port `3000`.

Health check:

```text
GET http://localhost:3000/health
```

Interactive API documentation:

```text
http://localhost:3000/docs
```

An alternative documentation route is:

```text
http://localhost:3000/api-docs
```

## API Endpoints

All endpoints are relative to the application base URL.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/links` | Create a shortened URL |
| GET | `/:short_code` | Redirect to the original URL |
| GET | `/links/:short_code` | Retrieve shortened URL details |
| GET | `/links/:short_code/clicks` | Retrieve paginated click history |
| GET | `/links/:short_code/clicks.csv` | Export click history as CSV |
| DELETE | `/links/:short_code` | Delete a shortened URL |
| GET | `/health` | Check application and database health |

### Create a shortened URL

**Request:**

```http
POST /links
Content-Type: application/json
```

Example request body:

```json
{
  "target_url": "https://github.com",
  "code": "github"
}
```

The `code` field is optional if the application generates a short code automatically.

A successful request returns HTTP `201 Created`.

Possible validation and conflict responses include:

- `400 Bad Request` – Invalid input.
- `409 Conflict` – The requested short code already exists.

### Redirect to the original URL

```http
GET /github
```

A successful redirect returns HTTP `302 Found` and sends the visitor to the original destination.

Expired links return HTTP `410 Gone`.

### Retrieve link details

```http
GET /links/github
```

Returns information about the shortened URL, including its destination and available link metadata.

### Retrieve click history

```http
GET /links/github/clicks?limit=10
```

Supports cursor-based pagination using the `after` query parameter.

Example:

```http
GET /links/github/clicks?limit=10&after=<next_cursor>
```

### Export click history

```http
GET /links/github/clicks.csv
```

Returns click analytics in CSV format.

### Delete a shortened URL

```http
DELETE /links/github
```

A successful deletion returns HTTP `204 No Content`.

## Database Schema

The application uses PostgreSQL.

The main tables are:

- **links** – Stores destination URLs, short codes, click counts, expiration dates, and link status.
- **click_log** – Stores individual click records, including timestamps, referrers, and user agents.

Database initialization and migration logic is maintained in:

```text
init-db.js
```

Run `npm run db:init` to initialize or migrate the database.

## Testing

The project uses Node.js's built-in test runner and Supertest.

Tests use a separate PostgreSQL database to avoid affecting application data.

Create a `.env.test` file in the project root:

```env
NODE_ENV=test
DATABASE_URL_TEST=postgresql://username:password@localhost:5432/url_shortener_test
```

Create the test database in PostgreSQL before running the tests.

Run the test suite:

```bash
npm test
```

The test script initializes the test database and then runs the automated tests.

## Code Quality

Check JavaScript formatting:

```bash
npm run format:check
```

Format the source files:

```bash
npm run format
```

Run ESLint:

```bash
npm run lint
```

## Continuous Integration

GitHub Actions runs the project's automated checks using PostgreSQL 16.

The workflow checks formatting, runs ESLint, initializes the test database, and executes the test suite.

## Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Port on which the Express server listens |
| `DATABASE_URL` | PostgreSQL connection string for the application |
| `NODE_ENV` | Application environment, including `test` |
| `DATABASE_URL_TEST` | Separate PostgreSQL connection string for automated tests |

Keep credentials private and use environment variables for deployment configuration.

## Database Seeding

The current database setup uses `init-db.js` for table creation and schema migrations.

A separate seed script has not been documented because a dedicated seed-file implementation has not yet been confirmed. Automated tests create their own test records.

## Known Limitations and Future Improvements

- Production deployment must be verified against the latest repository commit.
- A dedicated database seed script may be added if required.
- Additional regression tests and API validation improvements are ongoing.

## Contributing

1. Create a feature branch.
2. Make your changes.
3. Run the test suite.
4. Run formatting and lint checks.
5. Commit and push your changes.
6. Open a pull request for review.

## Author

**Russel Fonta Fadil**

- **Email:** [fontawestbrook99@gmail.com](mailto:fontawestbrook99@gmail.com)
- **GitHub:** [RusselFonta](https://github.com/RusselFonta)
