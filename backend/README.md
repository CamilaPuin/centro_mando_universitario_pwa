# University Command Center API

Spring Boot 3 REST API for student planning, coursework, study sessions, statistics, calendar events, notifications, and gamification.

## Frontend integration

Run the API on port `8080` and start the Vite app from `frontend/` with `npm run dev`. Vite proxies `/api` to `http://localhost:8080` by default; set `VITE_API_PROXY_TARGET` if the API runs elsewhere. The frontend uses `/api/v1` by default. For a separately hosted API, set `VITE_API_BASE_URL` to its full base URL (for example, `https://api.example.com/api/v1`) when building the frontend, and add the frontend origin to `APP_CORS_ALLOWED_ORIGINS`.

Use **Conectar con el servidor** in the app header to register or sign in. Authenticated data is synchronized with the API; IndexedDB continues to provide the local/offline copy. Pending delivery changes are sent after sign-in or when connectivity returns. Local subjects, class schedules, notes, sessions, and goals are linked to the account on sign-in.
