# University Command Center API

Spring Boot 3 REST API using PostgreSQL for student planning, coursework, study sessions, statistics, calendar events, notifications, and gamification.

## Local backend and database

The backend and PostgreSQL 15 database can be started together with Docker Compose:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Run these commands from the `backend/` directory. The example `.env` values are for local development only; do not use them in a public deployment. Flyway creates the PostgreSQL schema when the API starts. The database data is stored in the `postgres_data` Docker volume.

Adminer is available at `http://localhost:8081` for local database inspection. Select PostgreSQL as the database system and `db` as the server when connecting from Adminer.

To stop the services without deleting the local database volume, run `docker compose down`. Do not remove the volume unless you intend to erase the local database.

## Frontend integration

Run the API on port `8080` and start the Vite app from `frontend/` with `npm run dev`. Vite proxies `/api` to `http://localhost:8080` by default; set `VITE_API_PROXY_TARGET` if the API runs elsewhere. The frontend uses `/api/v1` by default. For a separately hosted API, set `VITE_API_BASE_URL` to its full base URL (for example, `https://api.example.com/api/v1`) when building the frontend, and add the frontend origin to `APP_CORS_ALLOWED_ORIGINS`.

Use **Conectar con el servidor** in the app header to register or sign in. Authenticated data is synchronized with the API; IndexedDB continues to provide the local/offline copy. Pending delivery changes are sent after sign-in or when connectivity returns. Local subjects, class schedules, notes, sessions, and goals are linked to the account on sign-in.

## Hosted deployment

Create a PostgreSQL 15 database and deploy this backend in a compatible hosting service. PostgreSQL 15 matches the Flyway version managed by the current Spring Boot configuration. Prefer the database's private/internal connection address when the database and backend are hosted in the same region. Configure these backend environment variables using the values supplied by the hosting provider:

- `SPRING_DATASOURCE_URL`: JDBC URL, for example `jdbc:postgresql://HOST:PORT/DATABASE`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET_KEY`: a stable, randomly generated secret
- `APP_CORS_ALLOWED_ORIGINS`: the frontend's exact origin, without a path or trailing slash

If the provider requires TLS, add its documented PostgreSQL SSL option to the JDBC URL. Do not use the local Compose credentials in production. Flyway applies the schema migrations during startup.
