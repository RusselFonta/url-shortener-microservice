
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

## 📷 Screenshots

Screenshots of the API documentation and application responses will be added here.

---

## 🔗 Live Demo

- **Backend API:** https://url-shortener-microservice-ccia.onrender.com
- **API Documentation:** https://url-shortener-microservice-ccia.onrender.com/docs
- **GitHub Repository:** https://github.com/RusselFonta/url-shortener-microservice

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/RusselFonta/url-shortener-microservice.git
cd url_shortener_microservice
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/url_shortener
```

### 4. Create the PostgreSQL database

```sql
CREATE DATABASE url_shortener;
```

### 5. Initialize the database

```bash
npm run db:init
```

### 6. Start the application

```bash
npm start
```

### 7. Run tests

```bash
npm test
```

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
