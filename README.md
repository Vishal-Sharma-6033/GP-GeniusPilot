# GP-GeniusPilot 🚀

An AI-powered interview preparation and strategy platform built on the MERN stack (React, Node.js/Express, MongoDB) with integrations for OpenAI, Puppeteer, Redis, and Razorpay. GP-GeniusPilot analyzes a user's resume, self-description, and target job description to produce a comprehensive interview plan containing custom technical/behavioral questions, intended answers, match scores, severity-based skill gaps, and a day-by-day preparation roadmap. It also dynamically compiles optimized resume PDFs, tracks study progress, and monetizes usage through a credit-based subscription model.

---

## 📦 Repository Structure

```
GP-GeniusPilot/
├── Backend/                   # Node.js/Express REST API
│   ├── src/
│   │   ├── config/            # Database (Mongo) and Redis connection setup
│   │   ├── controllers/       # Request handlers (Auth, Interview, Payment)
│   │   ├── middlewares/       # Auth guard, file upload, rate limiting
│   │   ├── models/            # Mongoose schemas (User, InterviewReport, Order, Blacklist)
│   │   ├── routes/            # Express endpoint maps (auth, interview, payment)
│   │   ├── services/          # OpenAI generation, Puppeteer PDF, Razorpay
│   │   └── utils/             # Helper utilities (auth cookie options)
│   ├── server.js              # Backend entry point
│   ├── .env.example           # Sample environment configuration
│   └── package.json           # Backend dependency configuration
│
├── Frontend/                  # Vite-bundled React 19 SPA client
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/          # Auth services, context, route guard, Login/Register/Profile
│   │   │   ├── interview/     # Dashboard, report pages, interview hooks/context
│   │   │   └── payment/       # Subscription modal and payment API services
│   │   ├── style/             # Shared SCSS styles
│   │   ├── App.jsx            # Root provider container
│   │   ├── app.routes.jsx     # Client router map (React Router 7)
│   │   └── main.jsx           # React app mount entry
│   ├── package.json           # Client dependency configuration
│   └── vite.config.js         # Vite configuration
│
└── package.json               # Root scripts to run both apps together
```

---

## ✨ Features

- 🔐 **Secure Authentication** — Cookie-based JWT auth (httpOnly) with active token revocation via a Redis blacklist on logout.
- 🧠 **AI-Powered Analysis** — Generates a match score, 10+ technical questions, 10+ behavioral questions (each with interviewer intent and a model answer), and severity-rated skill gaps tailored to the job description.
- 🗺️ **Personalized Roadmap** — Drafts a 15+ day, day-by-day preparation plan with focus areas and concrete tasks.
- ✅ **Study Progress Tracking** — Interactive checklists let users mark technical and behavioral questions as completed; progress persists per report.
- 📄 **Dynamic Resume PDF** — Programmatically builds clean resume HTML and renders it to a downloadable PDF via headless Puppeteer.
- 💳 **Credits & Subscriptions** — Credit-gated generation with Razorpay-powered Monthly and Yearly plans; signature verification on the backend.
- ⚡ **Rate Limiting** — Redis-backed sliding window protects the expensive AI generation endpoint.
- 🎨 **Modern UI** — Dark-themed, responsive SCSS interface with timeline roadmaps and an upgrade modal.

---

## 🛠️ Prerequisites

Make sure you have the following installed/available:
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** (Local Community Edition or Atlas connection URI)
- **Redis** (Local instance or hosted URI — used for JWT blacklisting and rate limiting)
- **OpenAI API Key** (or a compatible provider via `OPENAI_BASE_URL`)
- **Razorpay Account** (Key ID + Secret — test mode is fine for development)

---

## ⚙️ Environment Configuration

Create a `.env` file inside the `/Backend` directory (see `Backend/.env.example`) and define:

```ini
MONGO_URI=your_mongodb_connection_uri
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your_jwt_signing_secret
OPENAI_API_KEY=your_openai_api_credential
OPENAI_MODEL=gpt-4o-mini
# OPENAI_BASE_URL=                 # optional — for OpenAI-compatible providers
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
# NODE_ENV=production              # enables secure, cross-site cookies
```

> [!NOTE]
> New accounts start with **5 free credits**. Each report generation consumes 1 credit. The **Monthly** plan (₹399) adds 100 credits; the **Yearly** plan (₹2,999) adds 1,200 credits and sets the corresponding subscription expiry.

*The backend enables CORS for `http://localhost:5173` (the default Vite client dev port) with credentials.*

---

## 🚀 Running the Project Locally

### Option A — Run both apps from the root
```bash
npm run dev          # starts Backend (nodemon) and Frontend (Vite) together
```

### Option B — Run each app separately

**1. Spin up the API backend**
```bash
cd Backend
npm install
npm run dev          # nodemon → http://localhost:3000
```

**2. Launch the client frontend**
```bash
cd Frontend
npm install
npm run dev          # Vite → http://localhost:5173
```

---

## 📄 Core API Endpoint Documentation

All private endpoints require the JWT httpOnly cookie issued at login/registration.

### Authentication
| Endpoint | Method | Access | Payload / Notes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | `{ username, email, password }` | Creates an account and sets the JWT cookie. |
| `/api/auth/login` | `POST` | Public | `{ email, password }` | Authenticates and sets the JWT cookie. |
| `/api/auth/logout` | `GET` | Public | JWT Cookie | Clears the cookie and blacklists the token in Redis. |
| `/api/auth/get-me` *(alias `/me`)* | `GET` | Private | JWT Cookie | Returns the active session's user details. |

### Interview & Analysis
| Endpoint | Method | Access | Payload / Notes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/interview/` | `POST` | Private | `multipart/form-data`: `resume` (PDF, optional, ≤3MB), `jobDescription`, `selfDescription` | Generates a structured interview report via AI. Consumes 1 credit; rate-limited 5/min. |
| `/api/interview/` | `GET` | Private | JWT Cookie | Lists the user's interview report summaries (metadata only). |
| `/api/interview/report/:interviewId` | `GET` | Private | JWT Cookie | Fetches a full report by ID (scoped to the owner). |
| `/api/interview/report/:interviewId/progress` | `PUT` | Private | `{ type: "technical"｜"behavioral", progress: boolean[] }` | Updates the study-progress checklist for a report. |
| `/api/interview/resume/pdf/:interviewReportId` | `POST` | Private | JWT Cookie | Builds and streams a generated resume PDF. |
| `/api/interview/:interviewId` | `DELETE` | Private | JWT Cookie | Deletes a report owned by the user. |

### Payments & Subscription
| Endpoint | Method | Access | Payload / Notes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/payment/create-order` | `POST` | Private | `{ plan: "monthly"｜"yearly" }` | Creates a Razorpay order and persists it. Returns `order` + `keyId`. |
| `/api/payment/verify` | `POST` | Private | `{ razorpayOrderId, razorpayPaymentId, razorpaySignature, plan }` | Verifies the payment signature, then credits the account and activates the plan. |
| `/api/payment/subscription` | `GET` | Private | JWT Cookie | Returns the user's current plan, expiry, and credit balance. |

---

## 🧰 Tech Stack

**Backend:** Express 5 · Mongoose 9 · jsonwebtoken · bcryptjs · ioredis · multer · pdf-parse · openai · zod + zod-to-json-schema · puppeteer · razorpay
**Frontend:** React 19 · React Router 7 · Vite 7 · Axios · Sass

---

## ⚠️ Known Issues & Hardening TODOs

> [!WARNING]
> The core flows work, but the following areas need attention before a production deployment:

1. **Payment verification trusts the client `plan`** — `verifyPaymentController` derives credits/expiry from the request body rather than the stored order. Read the plan and amount from the persisted `Order` document instead.
2. **Payment verify is not idempotent** — replaying a valid signature can credit the account more than once. Guard on `order.status !== "paid"` before applying credits.
3. **Resume PDF lacks an ownership check** — `generateResumePdfController` looks up the report by ID without scoping to `req.user.id`, allowing cross-user access (IDOR). It also has no credit cost or rate limit despite launching Chromium per call.
4. **Credit check and decrement are not atomic** — concurrent requests can over-spend. Use a single conditional `findOneAndUpdate({ _id, credits: { $gt: 0 } }, { $inc: { credits: -1 } })`.
5. **Login/Register redirect is unconditional** — the submit handlers navigate to `/` regardless of whether authentication succeeded, and API errors are swallowed in the auth service layer rather than surfaced to the user.

---

## 💡 Recommended Improvements

- **Input Validation** — Add `zod` / `express-validator` middleware to auth and interview endpoints.
- **TTL Index Cleanup** — The Redis blacklist supersedes the unused `blacklistTokens` Mongoose model; remove the dead model or repurpose it with a TTL index.
- **User-Visible Errors** — Propagate API/network failures to toasts or form-level messages instead of `console.log`.
- **Global Error Handler** — Add centralized Express error-handling middleware for consistent responses.
- **Configurable Origins/Ports** — Move the hardcoded `localhost` URLs and port `3000` into environment variables for deployability.
- **Tests** — Introduce unit/integration tests (none currently exist).
