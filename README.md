# GP-GeniusPilot

Full-stack MERN application that helps generate interview reports and resumes using Google GenAI, and provides user authentication and interview management APIs.

## Features

- User registration, login, logout (cookie-based JWT)
- Generate interview reports via Google GenAI
- Generate resume PDFs (HTML -> PDF via Puppeteer)
- Basic interview CRUD endpoints

## Prerequisites

- Node.js (>=16 recommended)
- MongoDB (local or Atlas)
- A Google GenAI API key (set as `GOOGLE_GENAI_API_KEY`)

## Repository structure

- `Backend/` — Express API, MongoDB models, AI service
- `Frontend/` — Vite + React client

### Frontend details

- Dev server: `npm run dev` (Vite) — serves at `http://localhost:5173` by default.
- Routing: client routes are defined in `Frontend/src/app.routes.jsx` with these pages:
	- `/login` → `Login` (auth/features)
	- `/register` → `Register` (auth/features)
	- `/` → `Home` (protected)
	- `/interview/:interviewId` → `Interview` (protected)
- Context providers: `AuthProvider` and `InterviewProvider` wrap the app in `Frontend/src/App.jsx`.

## Environment (Backend)

Create a `.env` file inside the `Backend/` folder with the following keys:

```
MONGO_URI=your_mongo_connection_string
JWT_SECRET=some_long_random_secret
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
```

Notes:
- The backend server listens on port `3000` by default (`server.js`).
- The backend CORS is configured to accept requests from `http://localhost:5173` (the Vite dev server).

## Running the project locally

Backend:

```bash
cd Backend
npm install
npm run dev
```

This runs the API with `nodemon` (`server.js`) on port `3000`.

Frontend:

```bash
cd Frontend
npm install
npm run dev
```

This starts the Vite dev server (default `http://localhost:5173`). The frontend expects the API at `http://localhost:3000` and uses cookie-based auth.

## Important API routes

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- Interview: `POST /api/interview/report` (generate report), `POST /api/interview/resume` (generate resume PDF), plus other interview routes in `Backend/src/routes/interview.routes.js`.

## Notes & Security

- Do not commit your `.env` files — keep a `.env.example` with placeholder values if needed.
- After adding real credentials, rotate secrets if they are ever exposed.

## Next steps (optional)

- Add a simple `README` in `Backend/` and `Frontend/` with service-specific docs.
- Add a `.gitignore` at the repo root to exclude `node_modules` and `.env` files.

---

If you want, I can also add a `.env.example`, a root `.gitignore`, or small README files inside `Backend/` and `Frontend/` — tell me which you'd like next.
