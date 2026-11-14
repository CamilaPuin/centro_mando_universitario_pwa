# University Command Center API

Spring Boot 3 REST API using PostgreSQL for student planning, coursework, study sessions, statistics, calendar events, notifications, and gamification.

## Local backend and database

The backend and PostgreSQL 15 database can be started together with Docker Compose:

```powershell
docker compose up --build
```

Run this command from the `backend/` directory. Compose uses local development defaults; set overrides in a local `.env` file if needed, and do not use local credentials in a public deployment. Flyway creates the PostgreSQL schema when the API starts. The database data is stored in the `postgres_data` Docker volume.

To run the API against the Neon branch configured in `backend/.env.local`, use `docker compose --env-file .env.local up --build` from `backend/`. The API uses the pooled `DATABASE_URL`; Flyway uses `DATABASE_URL_UNPOOLED` for migrations. The local PostgreSQL service remains available for the default development setup.

Adminer is available at `http://localhost:8081` for local database inspection. Select PostgreSQL as the database system and `db` as the server when connecting from Adminer.

To stop the services without deleting the local database volume, run `docker compose down`. Do not remove the volume unless you intend to erase the local database.

## Frontend integration

Run the API on port `8080` and start the Vite app from `frontend/` with `npm run dev`. Vite proxies `/api` to `http://localhost:8080` by default; set `VITE_API_PROXY_TARGET` if the API runs elsewhere. The frontend uses `/api/v1` by default. For a separately hosted API, set `VITE_API_BASE_URL` to its full base URL (for example, `https://api.example.com/api/v1`) when building the frontend, and add the frontend origin to `APP_CORS_ALLOWED_ORIGINS`.

Use **Conectar con el servidor** in the app header to register or sign in. Authenticated data is synchronized with the API; IndexedDB continues to provide the local/offline copy. Pending delivery changes are sent after sign-in or when connectivity returns. Local subjects, class schedules, notes, sessions, and goals are linked to the account on sign-in.

## Hosted deployment

The Blueprint is in `backend/render.yaml`. In Render, create a Blueprint from this repository and set its Blueprint Path to `backend/render.yaml`. Set the prompted secrets on the `centro-mando-api` service:

- `DATABASE_URL`: Neon pooled connection string for application queries.
- `DATABASE_URL_UNPOOLED`: Neon direct connection string for Flyway migrations.
- `JWT_SECRET_KEY`: a stable, randomly generated secret.

The connection strings are stored in the ignored `backend/.env.local`; copy them directly from there into Render's environment settings, not into source control. `APP_CORS_ALLOWED_ORIGINS` is already set to the GitHub Pages frontend origin; update it if the frontend URL changes. Deploy the service and verify its `/actuator/health` endpoint. The first startup runs Flyway migrations against the configured Neon branch, so confirm the Render variables point to the intended project and branch before deploying.
