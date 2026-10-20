# University Command Center API

Spring Boot 3 REST API for student planning, coursework, study sessions, statistics, calendar events, notifications, and gamification.

## Requirements

- Java 17
- Maven 3.9+
- MySQL 8+
- A Base64-encoded JWT signing key containing at least 32 random bytes

Create a signing key in PowerShell:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$env:JWT_SECRET_KEY = [Convert]::ToBase64String($bytes)
```

Configure the database with `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`. Set `APP_CORS_ALLOWED_ORIGINS` to a comma-separated list of trusted browser origins when needed. For local development, the application generates a temporary random JWT key if `JWT_SECRET_KEY` is unset; existing tokens become invalid after restart. Configure the generated Base64 key as `JWT_SECRET_KEY` in every production instance so tokens remain verifiable across restarts. Flyway applies database migrations; Hibernate validates the schema at startup.

## Run locally

```powershell
mvn spring-boot:run
```

The API listens on port `8080`. Swagger UI is available at `/swagger-ui.html`.

## Run with Docker Compose

For production-like local testing, set `JWT_SECRET_KEY` in the current PowerShell session. It is optional for a quick local start:

```powershell
docker compose up --build
```

Docker Compose starts the API and a local MySQL database. The database credentials configured in Compose are intended only for local development. MySQL is published on host port `3307` by default to avoid conflicts with an existing local MySQL server; the API still connects to port `3306` over the Compose network. Set `MYSQL_HOST_PORT` to change the host port if needed.

## Authentication

Register and log in through:

- `POST /api/v1/users/register`
- `POST /api/v1/users/login`

Send the returned token on protected requests with the HTTP `Authorization` header using the `Bearer` scheme.

## API modules

- `GET /api/v1/dashboard/day`: daily classes, prioritized upcoming deliveries, study progress, and streak.
- `/api/v1/subjects`: subject CRUD, evaluations, weighted averages, and quick notes.
- `/api/v1/tasks`: delivery CRUD, status transitions, and the next seven days of exams.
- `/api/v1/study`: completed study sessions, focus-mode information, and streaks.
- `/api/v1/statistics`: weekly metrics, study history, weekly review, and user goals.
- `/api/v1/calendar`: week/month events from class schedules, deliveries, and evaluations. Create or remove recurring class schedules at `/api/v1/calendar/class-schedules`.
- `GET /api/v1/notifications`: generated due-date, study-reminder, and goal-risk alerts.
- `GET /api/v1/gamification/profile`: level, points, streak, and badges.

Calendar views accept `view=week|month` and an optional ISO date, for example `/api/v1/calendar?view=week&date=2026-10-19`.

## Verify

```powershell
mvn test
```
