
# 🔗 URL Shortener Microservice

A RESTful API that creates short URLs, redirects visitors, tracks clicks, and provides link analytics.

---

## 📌 Problem Statement

Long URLs can be difficult to share and manage. Users also need a way to track how their links are accessed.

This project provides a service for shortening URLs, managing links, and monitoring click activity.

---

## 🎯 Project Goals

- Create short URLs using custom or generated codes.
- Redirect visitors to original URLs.
- Track clicks and visitor information.
- Provide click history and analytics.
- Export click records as CSV.
- Support link expiration and deletion.

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js, JavaScript
- **Database:** PostgreSQL
- **Testing:** Node.js Test Runner, Supertest
- **Validation:** Zod
- **Documentation:** Swagger / OpenAPI
- **Code Quality:** ESLint, Prettier
- **Other Tools:** Git, GitHub Actions, Render

---

## 🖥 Features

- Short URL generation.
- URL redirection.
- Click tracking and analytics.
- Cursor-based pagination.
- CSV export.
- Link expiration and deletion.
- Input validation and error handling.
- Interactive API documentation.
- Automated testing.

---

## 📡 API Endpoints

**Base URL:**

`https://url-shortener-microservice-ccia.onrender.com`

| Method | Endpoint | Description | Success Status |
|---|---|---|---|
| POST | `/links` | Create a short URL | 201 |
| GET | `/:short_code` | Redirect to the original URL | 302 |
| GET | `/links/:short_code` | Retrieve link metadata | 200 |
| GET | `/links/:short_code/clicks` | Retrieve paginated click history | 200 |
| GET | `/links/:short_code/clicks.csv` | Export click records as CSV | 200 |
| DELETE | `/links/:short_code` | Delete a short URL | 204 |
| GET | `/health` | Check API/database health | 200 |

### Common Error Status Codes

- **400 Bad Request:** Invalid input, malformed JSON, or invalid pagination parameters.
- **404 Not Found:** The requested short code does not exist.
- **409 Conflict:** The requested custom short code already exists.
- **410 Gone:** The requested short URL has expired.
- **500 Internal Server Error:** An unexpected server error occurred.

For complete request and response definitions, see the Swagger documentation.

---

## 📷 Screenshots

![Swagger Documentation](assets/image/swagger.PNG)

---

## 🔗 Live Demo

- **Backend API:** [https://url-shortener-microservice-ccia.onrender.com](https://url-shortener-microservice-ccia.onrender.com)
- **API Documentation:** [https://url-shortener-microservice-ccia.onrender.com/docs](https://url-shortener-microservice-ccia.onrender.com/docs)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/RusselFonta/url-shortener-microservice.git
cd url-shortener-microservice
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure the Development Environment

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/url_shortener
```

Replace the username and password with your PostgreSQL credentials.

### 4. Create the PostgreSQL Database

```sql
CREATE DATABASE url_shortener;
```

### 5. Initialize the Database

```bash
npm run db:init
```

### 6. Seed the Database

To insert sample data, run:

```bash
npm run db:seed
```

### 7. Start the Application

For development:

```bash
npm run dev
```

The API runs at:

`http://localhost:3000`

### 8. Configure the Test Database

Automated tests use a separate PostgreSQL database to avoid modifying development data.

Create a `.env.test` file in the project root:

```env
TEST_DATABASE_NAME=url_shortener_test
TEST_DATABASE_USER=your_test_database_user
TEST_DATABASE_PASSWORD=your_test_database_password
DATABASE_URL_TEST=postgresql://your_test_database_user:your_test_database_password@localhost:5432/url_shortener_test
NODE_ENV=test
```

Replace the example credentials with your test database credentials.

Create the test database in PostgreSQL:

```sql
CREATE DATABASE url_shortener_test;
```

**Important:** The `DATABASE_URL_TEST` variable is required by the test configuration. The test command uses `.env.test` to initialize the test database and run the automated tests.

### 9. Run Automated Tests

```bash
npm test
```

### 10. Run Code Quality Checks

Run ESLint:

```bash
npm run lint
```

Check formatting:

```bash
npm run format:check
```

---

## 🧪 Testing

The project uses the Node.js built-in test runner and Supertest.

The automated tests cover:

- URL creation and validation.
- Duplicate custom short codes.
- URL redirection.
- Click tracking and concurrent requests.
- Click history and cursor-based pagination.
- Invalid pagination parameters.
- URL expiration.
- URL deletion.
- CSV export.
- Metadata retrieval.
- Malformed JSON handling.
- Security regression testing for injection-shaped Referer values.

The latest local test run completed with **42 tests passing and 0 failures**.

---

## 🧠 Challenges Faced

- Implementing cursor-based pagination.
- Tracking clicks and visitor metadata.
- Managing URL expiration.
- Exporting click records as CSV.
- Configuring automated database tests.
- Setting up continuous integration.

---

## 📚 What I Learned

- Building RESTful APIs with Node.js and Express.
- PostgreSQL database management.
- API validation and error handling.
- URL redirection and click tracking.
- Automated testing.
- API documentation.
- Continuous integration and deployment.

---

## 🚀 Future Improvements

- Expand analytics capabilities.
- Add more regression tests.
- Improve monitoring and error reporting.

---

## 👨🏽‍💻 Author

**Russel Fonta Fadil**

- **Email:** fontawestbrook99@gmail.com
- **GitHub:** [RusselFonta](https://github.com/RusselFonta)
