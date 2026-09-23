# 🎯 GeniusPilot — Interview Preparation Cheat-Sheet

> **Read this once, then practice saying each answer OUT LOUD until you can speak without looking.**

---

## 🔴 Priority 1 — The Project

### 1. What problem does it solve?

> "Job seekers spend **hours googling random interview questions** that have nothing to do with the actual role they applied for. GeniusPilot solves this by taking the candidate's **resume + a specific job description** and using **OpenAI's GPT model** to generate a **fully personalised interview preparation report** — tailored technical questions, behavioral questions, skill-gap analysis, and a **15-day study plan**. It also generates an **AI-optimised resume PDF** targeting that exact job."

### 2. Why did you build it?

> "I was preparing for interviews myself and realized every generic question bank was useless because it didn't know **my** skills or **my** target job. I wanted to build something that bridges that gap using AI. It also let me work with a **production-grade full-stack architecture** — authentication, payments, AI integration, PDF generation, rate-limiting, Docker deployment — all in one project."

---

## 🏗️ 3. Architecture of the Project

> "It's a classic **three-tier architecture** containerised with Docker Compose."

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy / LB)       │
│               Port 80 → routes /api → Backend       │
│                        → else → Frontend SPA        │
└──────────┬──────────────────────┬────────────────────┘
           │                      │
  ┌────────▼────────┐   ┌────────▼────────┐
  │  Frontend (×2)  │   │  Backend (×3)   │
  │  React 19 SPA   │   │  Express 5 API  │
  │  Vite · SCSS    │   │  Node.js (ESM)  │
  └─────────────────┘   └──┬──────┬───────┘
                            │      │
                   ┌────────▼┐  ┌──▼───────┐
                   │ MongoDB │  │  Redis   │
                   │  (Mongo │  │  7-Alpine│
                   │   7)    │  │          │
                   └─────────┘  └──────────┘
```

**Key points to say:**
- Nginx sits in front — load-balances 3 backend replicas and 2 frontend replicas.
- Backend & databases share a private `backend` Docker network; Frontend & Nginx share a `frontend` network. This means the browser can **never** reach MongoDB or Redis directly.
- MongoDB stores users, interview reports, and orders.
- Redis stores rate-limit counters and a JWT blacklist for instant session revocation.

---

## 4. Frontend → Backend → Database Flow (example: generating a report)

> "The user fills out a form with their **resume PDF + job description** on the React frontend. The form is submitted as `multipart/form-data` via **Axios** to `POST /api/interview`. The request carries an **httpOnly cookie** containing the JWT.
>
> On the backend, the **auth middleware** reads the cookie, checks Redis to see if the token is blacklisted, then verifies it with `jsonwebtoken`. If valid, the request hits the **rate limiter** (Redis `INCR` + `EXPIRE`) to prevent abuse.
>
> The controller uses **Multer** to read the uploaded PDF buffer, passes it to **pdf-parse** to extract text, then calls **OpenAI GPT-4o-mini** with a Zod JSON schema to generate a structured report. The validated JSON is saved to MongoDB via Mongoose, and the response is sent back. React updates the UI with the new report."

---

## 5. React Role

> "React 19 handles the entire client-side SPA. I'm using:
> - **React Router v7** with `createBrowserRouter` for declarative routing.
> - **Context API** (`AuthContext`, `InterviewContext`) for global state — I didn't need Redux because the state shape is simple.
> - **Clerk** for OAuth sign-in / sign-up UI, synced to my own backend via a `/clerk-sync` endpoint.
> - **Protected route wrapper** — a `<Protected>` component that checks if the user is authenticated before rendering children.
> - **SCSS** for styling — component-scoped styles, variables, mixins.
> - **Vite** as the bundler — instant HMR in dev, optimised production builds."

---

## 6. Node.js + Express Role

> "Node.js runs the API server using **Express 5** with ES modules (`type: module`). It handles:
> - **3 feature modules**: `auth`, `interview`, `payment` — each with its own routes, controllers, models, and services.
> - **Middleware pipeline**: `express.json()` → `cookie-parser` → `CORS` → feature routers → global error handler.
> - **AI orchestration**: the `ai.service.js` wraps OpenAI's SDK with a **3-attempt retry loop** — if the model returns invalid JSON, I clean it with `extractJson` + `repairJson`, validate with **Zod**, and ask the model to try again.
> - **PDF generation**: Puppeteer launches a headless Chrome instance, renders the AI-generated HTML, and exports an A4 PDF buffer."

---

## 7. MongoDB / Mongoose

> "MongoDB is my primary data store. I chose it because my data (interview reports) is **deeply nested** — arrays of questions, each with sub-fields — which maps perfectly to MongoDB's document model. No joins needed.
>
> I have 3 Mongoose models:
> - **User** — `username`, `email`, `password` (bcrypt hash), `credits` (Number, default 5), `subscriptionPlan` (free/monthly/yearly), `subscriptionExpiry`.
> - **InterviewReport** — stores the full AI output: `technicalQuestions[]`, `behavioralQuestions[]`, `skillGaps[]`, `preparationPlan[]`, plus `technicalProgress[]` and `behavioralProgress[]` (boolean arrays for tracking which questions the user has practiced).
> - **Order** — tracks Razorpay payment lifecycle: `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, `status` (created → paid / failed), `creditsAdded`.
>
> I use **`findOneAndUpdate` with `returnDocument: 'after'`** throughout, which gives me atomic operations and avoids stale reads."

### 🔥 Drill-down: "Why MongoDB over PostgreSQL?"

> "My interview reports contain **variable-length nested arrays** — 10+ technical questions, 10+ behavioral questions, 15+ day plans — each with sub-objects. In Postgres, I'd need 4-5 separate tables with JOINs. In MongoDB, it's **one document, one read, one write**. For this use case, the document model is simpler and more performant."

---

## 8. REST APIs

> "I follow **resource-oriented REST conventions**:
>
> | Method   | Endpoint                                      | Purpose                          |
> |----------|-----------------------------------------------|----------------------------------|
> | `POST`   | `/api/auth/register`                          | Create account                   |
> | `POST`   | `/api/auth/login`                             | Log in, set JWT cookie           |
> | `POST`   | `/api/auth/logout`                            | Blacklist JWT in Redis           |
> | `GET`    | `/api/auth/me`                                | Get current user profile         |
> | `POST`   | `/api/auth/clerk-sync`                        | Sync Clerk OAuth user to backend |
> | `POST`   | `/api/interview`                              | Generate AI interview report     |
> | `GET`    | `/api/interview`                              | List all user's reports          |
> | `GET`    | `/api/interview/report/:id`                   | Get one report by ID             |
> | `PUT`    | `/api/interview/report/:id/progress`          | Update practice progress         |
> | `DELETE` | `/api/interview/:id`                          | Delete a report                  |
> | `POST`   | `/api/interview/resume/pdf/:id`               | Generate tailored resume PDF     |
> | `POST`   | `/api/payment/create-order`                   | Create Razorpay order            |
> | `POST`   | `/api/payment/verify`                         | Verify payment + add credits     |
> | `GET`    | `/api/payment/status`                         | Get subscription info            |
>
> Every protected route goes through `authUser` middleware. I use proper HTTP status codes — `201` for creation, `400` for validation, `401` for auth, `403` for no credits, `409` for duplicate payment, `429` for rate-limit, `500` for server errors."

---

## 9. Authentication / JWT

> "When a user registers or logs in, the server creates a **JWT** (signed with `HS256`, expires in 24 hours) and sets it in an **httpOnly, sameSite: strict** cookie. This means:
> - JavaScript in the browser **cannot read the token** (XSS protection).
> - The cookie is **not sent on cross-origin requests** (CSRF protection).
>
> On every protected request, the `authUser` middleware:
> 1. Reads the token from `req.cookies.token`.
> 2. Checks Redis for `bl:<token>` — if exists, the token has been **blacklisted** (user logged out) → reject immediately.
> 3. Verifies the signature with `jwt.verify()`.
> 4. Attaches `req.user = { id, username }` for downstream handlers.
>
> On **logout**, I decode the token, calculate its remaining TTL, and store it in Redis with that exact TTL using `SET bl:<token> 1 EX <ttl>`. This gives me **instant session revocation** without needing to change the JWT secret or maintain a database table."

### 🔥 Drill-down: "Why not just use sessions?"

> "Sessions require **server-side storage on every request**. JWTs are stateless — the server just verifies a signature. I only hit Redis on logout (to blacklist) and on each request (one `EXISTS` call). That's O(1) and much cheaper than loading a full session object."

---

## 10. Redis — Why did you use it?

> "Redis is an **in-memory key-value data store** that I use for two things:
>
> **1. JWT Blacklist (instant logout):**
> When a user logs out, I store their token as `bl:<token>` in Redis with an `EX` (expiry) equal to the token's remaining TTL. On every authenticated request, the middleware does `redis.exists('bl:<token>')` — an O(1) lookup that takes < 1ms. When the JWT would have naturally expired, Redis auto-deletes the key, so I never accumulate stale data.
>
> **2. Rate Limiting:**
> I built a custom rate limiter using `INCR` + `EXPIRE`. For each user/IP, I increment a counter like `rl:gen:<userId>`. On the first hit, I set a 60-second TTL. If the counter exceeds `max` (5 requests/minute), I return `429 Too Many Requests` with a `Retry-After` header. This protects the OpenAI and Puppeteer endpoints from abuse.
>
> I chose Redis over in-memory Maps because:
> - It survives server restarts.
> - It works across **multiple backend replicas** (I run 3 in Docker) — all instances share the same Redis, so rate limits are global."

### 🔥 Drill-down: "What Redis client do you use?"

> "I use **ioredis** — it supports `lazyConnect`, automatic reconnection with exponential backoff (`retryStrategy`), and `reconnectOnError` for handling `READONLY` failovers in Redis Cluster. The client is **lazily initialised as a singleton** — only created on the first call to `getRedisClient()`."

---

## 11. OpenAI API — How did you integrate it?

> "I use the official **OpenAI Node.js SDK** (`openai` npm package) to call the **GPT-4o-mini** model. Here's the flow:
>
> 1. **Schema definition**: I define the expected output structure using **Zod** — arrays of questions, skill gaps, preparation plan — with `.min()` constraints.
> 2. **Schema conversion**: I convert the Zod schema to a **JSON Schema** using `zod-to-json-schema` and embed it in the system prompt.
> 3. **API call**: I call `chat.completions.create()` with `response_format: { type: 'json_object' }` to force JSON output.
> 4. **Robust parsing pipeline**:
>    - First, I try `JSON.parse()` on the raw output.
>    - If that fails, I run `repairJson()` — strips trailing commas, removes comments, converts single quotes to double quotes, escapes inner quotes.
>    - Then I validate with `schema.parse()` (Zod).
>    - If Zod validation fails (e.g., model returned only 5 questions instead of 10), I **append the error message to the conversation** and ask the model to correct itself.
> 5. **Retry loop**: This whole process runs up to **3 attempts**. Temperature starts at `0.0` (deterministic) and increases to `0.2` on retries.
>
> The OpenAI client is a **lazily-initialised singleton** with configurable `baseURL` so I can swap providers (e.g., Groq, Azure) without changing application code."

### 🔥 Drill-down: "Why Zod for validation?"

> "Zod gives me **runtime type safety** — I can define exact shapes with constraints like `.min(10)` for arrays, `.enum()` for severity levels, and get detailed error messages (`path + message`) that I feed back to the model. It's like TypeScript types but at runtime."

---

## 12. Razorpay — Payment Flow

> "The payment flow has **3 steps** designed to be idempotent and secure:
>
> **Step 1 — Create Order (server-side):**
> The frontend sends `{ plan: 'monthly' }` to `POST /api/payment/create-order`. The backend creates a Razorpay order with `razorpay.orders.create()` (₹399 for monthly, ₹2999 for yearly), saves it in MongoDB with `status: 'created'`, and returns the `orderId` + `keyId` to the frontend.
>
> **Step 2 — Checkout (client-side):**
> The frontend opens the **Razorpay Checkout modal** with the orderId. The user completes payment. Razorpay returns `razorpayPaymentId` and `razorpaySignature`.
>
> **Step 3 — Verify Payment (server-side):**
> The frontend sends all three IDs to `POST /api/payment/verify`. The backend:
> 1. Computes `HMAC-SHA256(orderId|paymentId, keySecret)` and compares it to the signature — this proves the payment is **genuine and untampered**.
> 2. Atomically updates the order from `status: 'created'` → `status: 'paid'` using `findOneAndUpdate({ status: 'created' })`. This is **idempotent** — replaying the request finds no pending order.
> 3. The **plan is read from the stored order**, not from the client request. This prevents a user from paying for monthly but claiming yearly credits.
> 4. Credits are added with `$inc: { credits: creditsToAdd }` — atomic, no race conditions.
>
> **Security considerations I'd mention:**
> - The Razorpay `key_secret` never leaves the server.
> - Signature verification uses `crypto.createHmac` (constant-time comparison ideally).
> - The plan is determined server-side from the order, not from client input."

---

## 13. Puppeteer — Why?

> "I use Puppeteer to generate **downloadable resume PDFs**. The flow is:
> 1. The AI generates an HTML string of the resume (styled with inline CSS).
> 2. Puppeteer launches a **headless Chrome** instance.
> 3. I call `page.setContent(html, { waitUntil: 'networkidle0' })` to render it.
> 4. I call `page.pdf({ format: 'A4', margin: {...} })` to produce a pixel-perfect PDF buffer.
> 5. The buffer is sent as `Content-Type: application/pdf` with a `Content-Disposition: attachment` header.
> 6. The browser instance is always closed in a `finally` block to prevent memory leaks.
>
> **Why not a library like `pdfkit` or `html-pdf`?** Because Puppeteer uses real Chrome rendering — it supports modern CSS, flexbox, grid, fonts, everything. The resume looks **exactly** as it would in a browser."

### 🔥 Drill-down: "Isn't Puppeteer heavy?"

> "Yes, it's the heaviest dependency. That's exactly why I added a dedicated **rate limiter** on the resume PDF endpoint (5 requests/minute). In production I'd consider a **Puppeteer pool** or an external service like `Browserless.io` to avoid spinning up Chrome on every request."

---

## 14. Error Handling

> "I have **multiple layers** of error handling:
>
> **Layer 1 — Input Validation:**
> Every controller validates required fields and returns `400` with a descriptive message. Example: 'Please upload a resume or provide a self-description.'
>
> **Layer 2 — Atomic Credit Reservation with Rollback:**
> Before calling OpenAI (which costs money and time), I **atomically deduct 1 credit** using `findOneAndUpdate({ credits: { $gt: 0 } }, { $inc: { credits: -1 } })`. If the AI call fails, I **refund the credit** with `$inc: { credits: 1 }` in a catch block. This prevents race conditions where two concurrent requests could both pass a `credits > 0` check.
>
> **Layer 3 — AI Retry Pipeline:**
> If OpenAI returns invalid JSON, I don't crash — I repair it, validate with Zod, and retry up to 3 times, feeding error messages back to the model.
>
> **Layer 4 — Global Error Handler:**
> Express has a catch-all `(err, req, res, next)` middleware that logs unhandled errors and returns a clean `500` response to the client.
>
> **Layer 5 — Infrastructure Resilience:**
> Redis client has `retryStrategy` with exponential backoff. MongoDB has `maxPoolSize: 100`, `serverSelectionTimeoutMS: 5000`. Rate limiter **fails closed** — if Redis is down, it returns `503` instead of letting requests through."

---

## 15. How you deployed it

> "I containerised the entire stack with **Docker Compose**:
>
> | Service     | Image/Build        | Replicas | Network       |
> |-------------|--------------------|----------|---------------|
> | MongoDB     | `mongo:7`          | 1        | backend       |
> | Redis       | `redis:7-alpine`   | 1        | backend       |
> | Backend API | Custom Dockerfile  | **3**    | backend       |
> | Frontend    | Custom (Nginx SPA) | **2**    | frontend      |
> | Nginx LB    | `nginx:alpine`     | 1        | both          |
>
> - **Network isolation**: MongoDB and Redis are only on the `backend` network — the browser cannot reach them.
> - **Health checks**: MongoDB uses `mongosh --eval 'db.runCommand({ping:1})'`; Redis uses `redis-cli ping`. Backend replicas only start after their dependencies are healthy.
> - **Resource limits**: Each service has `mem_limit` and `cpus` constraints to prevent one service from starving others.
> - **Nginx** acts as a reverse proxy and load balancer, distributing requests across backend and frontend replicas with a single entry point on port 80.
>
> For a production deploy I'd add **HTTPS with Let's Encrypt**, a **CI/CD pipeline** (GitHub Actions), and **MongoDB replica set** for high availability."

---

## 16. Biggest problem you faced

> "The biggest challenge was **making the AI output reliable**. OpenAI models don't always return valid JSON — sometimes there are trailing commas, comments, or the model wraps the JSON in markdown code blocks. Worse, even when the JSON is valid, it might not match my schema — for example, returning only 3 technical questions instead of the required 10.
>
> This was critical because the entire frontend relies on the report having a specific structure. If a field is missing, the UI crashes."

---

## 17. How you solved it

> "I built a **multi-layer defense pipeline**:
>
> 1. **`extractJson()`** — strips markdown code fences and extracts content between the first `{` and last `}`.
> 2. **`repairJson()`** — removes trailing commas, strips JS-style comments, converts single-quoted strings to double-quoted, escapes internal quotes.
> 3. **Zod validation** — even if JSON parses, I validate every field, every array length, every enum value.
> 4. **Conversational retry** — if validation fails, I append the AI's wrong output AND the Zod error messages to the chat, and ask it to fix itself. This works because GPT models can self-correct when shown their mistakes.
> 5. **Temperature escalation** — attempt 1 uses `temperature: 0.0` (deterministic), retries use `0.2` (slightly more creative) to avoid getting stuck in the same failure mode.
>
> After implementing this, the success rate went from ~70% to **99%+ on the first or second attempt**."

---

## 18. What would you improve if given more time?

> "Three things:
>
> 1. **WebSocket-based generation**: Right now the AI report generation takes 15-30 seconds on a single HTTP request. I'd use **Server-Sent Events (SSE)** or **WebSockets** to stream progress in real-time so the user sees 'Generating technical questions...' → 'Analyzing skill gaps...' instead of staring at a spinner.
>
> 2. **Puppeteer pool / external service**: Currently every resume PDF request launches a new Chrome instance. I'd implement a **browser pool** (like `puppeteer-cluster`) or use an external headless browser service to reduce memory usage and latency.
>
> 3. **Caching layer**: If a user generates a report for the same resume + job description, I'd hash the inputs and check Redis for a cached report before calling OpenAI again. This saves both cost and time.
>
> 4. **Testing**: I have the Vitest setup but would add more integration tests — especially for the payment verification flow and the AI retry logic.
>
> 5. **Monitoring**: Add **Prometheus + Grafana** for metrics (API latency, error rates, Redis hit rates) and **structured logging** (pino or winston) instead of `console.error`."

---

## 🔥 Rapid-Fire Drill-Down Questions

### "You mentioned Express 5. What's different from Express 4?"

> "Express 5 has native **async error handling** — if an async route handler throws, Express catches it automatically without needing `express-async-errors`. It also removes deprecated methods and has better path-matching performance."

### "Why Vite instead of Create React App?"

> "CRA is deprecated and uses Webpack, which is slow. Vite uses **esbuild** for dev (instant HMR) and **Rollup** for production builds. It's 10-100x faster for development."

### "Why bcryptjs instead of bcrypt?"

> "bcrypt requires native C++ bindings and a build toolchain. bcryptjs is a **pure JavaScript** implementation — same algorithm, no native dependencies, works everywhere including Docker Alpine images without extra setup."

### "What's your MongoDB connection pooling strategy?"

> "I set `maxPoolSize: 100` which means Mongoose maintains up to 100 concurrent socket connections to MongoDB. With 3 backend replicas, that's 300 total connections. I also set `serverSelectionTimeoutMS: 5000` so the app fails fast if MongoDB is unreachable, and `retryWrites: true` with `w: 'majority'` for write durability."

### "How do you handle CORS?"

> "I use the `cors` middleware with `origin: process.env.CLIENT_URL` (whitelist) and `credentials: true` (to allow cookies). In production, the origin is the exact domain — no wildcards."

### "What happens if two users try to use the last credit at the same time?"

> "That's the **atomic credit reservation** pattern. I use `findOneAndUpdate({ _id: userId, credits: { $gt: 0 } }, { $inc: { credits: -1 } })`. MongoDB guarantees this is atomic at the document level — only ONE of the two concurrent requests will succeed. The other gets back `null` and sees 'no credits remaining'. No race condition possible."

### "How is your project structured?"

> "I use a **feature-based architecture** (not MVC). Each feature (`auth`, `interview`, `payment`) is a self-contained folder with its own `routes.js`, `controller.js`, `model.js`, and `service.js`. Shared utilities like rate-limiting middleware go in `shared/`. Config files (database, Redis) go in `config/`. This makes it easy to find and modify code for any feature without navigating across dozens of folders."

### "What's Zod? Why not Joi or Yup?"

> "Zod is a TypeScript-first **schema declaration and validation library**. I chose it because:
> - It has a `zodToJsonSchema` companion that converts schemas to JSON Schema — which I embed in the AI prompt.
> - It gives **detailed error paths** (e.g., `technicalQuestions.2.answer: Required`) that I feed back to the model for self-correction.
> - It's smaller and faster than Joi."

### "Walk me through what happens when I click 'Logout'."

> "1. Frontend calls `POST /api/auth/logout`.
> 2. The backend reads the JWT from the cookie, **decodes** it (without verifying, since we just need the `exp` claim).
> 3. Calculates `ttl = exp - now` (remaining seconds until natural expiry).
> 4. Stores `bl:<token>` in Redis with `EX ttl` — so it auto-deletes when the token would have expired anyway.
> 5. Clears the cookie from the response.
> 6. From this moment, any request with that token hits the `exists('bl:<token>')` check in middleware and gets rejected immediately.
>
> This gives me **instant revocation** with zero long-term storage overhead."

---

## 📦 Tech Stack Summary (say this confidently)

| Layer        | Technology                              |
|--------------|------------------------------------------|
| Frontend     | React 19, React Router 7, Vite, SCSS    |
| Auth UI      | Clerk (OAuth), custom JWT system         |
| Backend      | Node.js, Express 5 (ESM)                |
| Database     | MongoDB 7 + Mongoose 9                  |
| Cache/Store  | Redis 7 (ioredis)                        |
| AI           | OpenAI GPT-4o-mini + Zod validation     |
| PDF          | Puppeteer (headless Chrome)              |
| Payments     | Razorpay (HMAC-SHA256 verification)      |
| File Upload  | Multer + pdf-parse                       |
| Security     | bcryptjs, JWT (httpOnly cookies), CORS   |
| Deployment   | Docker Compose, Nginx (load balancer)    |
| Testing      | Vitest                                   |

---

## 💡 Final Tips

1. **Don't just list technologies — explain WHY you chose each one.**
2. **Use numbers**: "3 backend replicas", "100 connection pool", "3 retry attempts", "15-day plan with 10+ questions."
3. **Show awareness of trade-offs**: "Puppeteer is heavy, so I rate-limit it." / "JWTs are stateless but I added Redis blacklisting for instant revocation."
4. **Show growth mindset**: When asked "what would you improve?", have 3-5 concrete answers ready (SSE streaming, browser pool, caching, monitoring, testing).

**Good luck with your interview! 🚀**
