# GeniusPilot Interview Preparation Guide (`INTERVIEW.md`)

This guide serves as a comprehensive preparation manual for technical and HR interviews, focusing on the design, architecture, implementation decisions, and codebase of **GeniusPilot**. Use this document to master the full-stack flow, study the project roadmap, and practice targeted interview questions.

---

## Task 1: Project Explanation

### 1.1 Project Overview
**GeniusPilot** is an AI-powered, full-stack Interview Preparation Platform built on the MERN (MongoDB, Express, React, Node.js) stack. It helps job seekers, students, and developers bridge the gap between their current profile and target job descriptions. By parsing uploaded resumes (PDFs) and cross-referencing them with job descriptions, GeniusPilot generates tailored technical and behavioral interview questions, provides intention analysis, offers model answers, detects skill gaps, and designs a customized day-by-day 15-day preparation plan. 

Additionally, users can:
- Generate a beautifully structured professional resume in PDF format (dynamically constructed via OpenAI, rendered using HTML, and compiled using Puppeteer).
- Purchase premium subscription plans (Monthly/Yearly) integrated with Razorpay to gain credits for generating detailed AI reports.
- Track their learning progress directly on the platform by marking generated interview questions as completed.

### 1.2 What Problem the Project Solves
Traditional interview preparation is generic (e.g., solving random LeetCode questions or reading generic "Top 50 Interview Questions" lists). Candidates often fail interviews because they:
1. Don't understand how their specific background maps to a particular job description.
2. Cannot identify which skills they lack relative to what the employer is seeking.
3. Don't know the "intention" behind behavioral questions or how to structure answers using industry-standard frameworks (like STAR).
4. Lack a structured, time-bound study roadmap leading up to the interview.

GeniusPilot solves these issues by automating hyper-personalized preparation, turning static resume and job description text into interactive, actionable study materials.

### 1.3 Why This Project Is Needed
In a highly competitive job market, candidates need immediate, specific feedback before they speak to human recruiters. Static resume scanners (ATS checkers) only tell candidates what keywords are missing; they don't prepare them for the actual conversation. GeniusPilot acts as a virtual interviewer and career coach, offering:
- Real-time simulation of technical and behavioral questions tailored *only* to the gaps between a specific user and a specific job.
- Affordable access to mock assessments, resume polishing, and structural roadmap planning.
- An interactive UI that tracks prep progress, helping users stay accountable.

### 1.4 Target Users and Use Cases
- **Target Users:** Computer Science students, freshers/junior developers, career switchers, and active job seekers.
- **Use Cases:**
  - *Tailored Prep:* A developer applying for a Node.js position uploads their React-heavy resume and the backend job description. GeniusPilot identifies the backend gaps and generates 10+ target Node.js/System Design questions.
  - *Resume Refinement:* Users download an AI-polished resume as a PDF, optimized according to the job description requirements.
  - *Subscription and Credits:* Users purchase credits via Razorpay to generate new interview plans when applying to different jobs.
  - *Structured Study:* A 15-day custom-tailored curriculum keeps the candidate organized.

---

### 1.5 System Architecture
GeniusPilot operates on a standard client-server-database architecture with cached state and payment gateway integrations.

```
                  +-----------------------------------+
                  |           Client (Vite React)     |
                  +-----------------+-----------------+
                                    | (HTTPS + Cookies)
                                    v
                  +-----------------+-----------------+
                  |        Express Server (Node.js)   |
                  +-----+-----------+-----------+-----+
                        |           |           |
       (Redis Client)   |           |           | (Mongoose ORM)
                        v           |           v
  +-----------------------+         |         +-----------------------+
  |    Redis Cache DB     |         |         |  MongoDB Atlas (DB)   |
  |  - JWT Blacklist      |         |         |  - users collection   |
  |  - IP/ID Rate Limit   |         |         |  - reports collection |
  +-----------------------+         |         |  - orders collection  |
                                    |         +-----------------------+
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
          v (JSON Schema HTTP)      v (Razorpay API)          v (Puppeteer)
  +-----------------+       +-----------------+       +-----------------+
  |   OpenAI API    |       |   Razorpay API  |       | PDF Generator   |
  | - gpt-4o-mini   |       | - Orders & Keys |       | - HTML -> PDF   |
  +-----------------+       +-----------------+       +-----------------+
```

---

### 1.6 Frontend Workflow
1. **User Authentication:** The client loads, checking credentials via a `/api/auth/me` request using the `AuthContext` provider. Secure cookie-based JWTs keep the user logged in.
2. **Dashboard Actions:** The user views a dashboard (`Home.jsx`) containing their past interview reports and remaining credits.
3. **Report Generation Form:**
   - The user inputs a Job Description, Self-Description, and uploads a Resume PDF.
   - A `FormData` object is posted to `/api/interview/`.
   - The UI shows a loading overlay while the server parses the PDF, calls OpenAI, and persists the report.
4. **Interactive Report View:** The dashboard routes the user to `/interview/:interviewId`. Here, the user can toggle between:
   - **Match Score & Skill Gaps:** Visual representation of strengths and deficiencies.
   - **Technical & Behavioral Questions:** Interactive lists where clicking a question reveals its *Intention* and *Model Answer*. Users check checkboxes to mark questions completed, firing a debounce/instant request to `/api/interview/report/:id/progress` to synchronize progress.
   - **Preparation Plan:** An accordion-style day-by-day study schedule.
   - **Resume Download:** Clicking "Download Resume" initiates a request to the backend `/api/interview/resume/pdf/:id`, downloading a compiled professional PDF.
5. **Subscription & Payment:** The user clicks "Buy Credits" in `/profile`, selects a plan, opens the Razorpay checkout overlay, pays, and the frontend posts signature verification payloads to `/api/payment/verify` to refresh credit counts.

---

### 1.7 Backend Workflow
1. **Request Intake & Security Verification:**
   - Request hits the Express app, going through CORS, `cookie-parser`, and JSON parsers.
   - Protected routes execute `authUser` middleware, verifying the JWT from cookies and querying Redis to ensure the token isn't blacklisted.
   - High-compute endpoints (report and PDF generation) execute the `createRateLimiter` middleware, using Redis to block requests exceeding 5 per 60 seconds per user/IP.
2. **Report Generation Route (`POST /api/interview/`):**
   - Receives the multipart form data (via `multer` in-memory buffer storage).
   - Passes the resume PDF buffer to `pdf-parse`, extracting clean text.
   - **Atomic Credit Reservation:** The server runs `findOneAndUpdate` on the user model requiring `credits: { $gt: 0 }` and decrementing it by 1. If no user is updated, it returns a `403 Forbidden` (stops double-spend/concurrency issues).
   - Calls the `generateInterviewReport` AI service, which sends the prompt and JSON Schema definition to OpenAI's Chat Completion.
   - If OpenAI fails or output validation fails after retries, the server refunds the credit (`updateOne` with `$inc: { credits: 1 }`) and returns a `500` error.
   - If successful, it creates an `InterviewReport` record in MongoDB, prefilled with boolean completion arrays matching the question count.
3. **PDF Compilation Route (`POST /api/interview/resume/pdf/:id`):**
   - Retrieves the report from MongoDB.
   - Requests OpenAI to compose optimized resume HTML.
   - Launches a Puppeteer instance, loads the HTML string, prints to an A4 PDF buffer, and streams it back to the client as an attachment.

---

### 1.8 Database Design and Relationships
MongoDB Atlas stores application data across three core collections. Mongoose enforces structures, data validation, and references.

#### 1.8.1 User Schema (`users`)
Keeps track of authentication credentials, credit counts, and premium payment access.
```javascript
{
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, // Bcrypt hash
  credits: { type: Number, default: 5 },
  subscriptionPlan: { type: String, enum: ["free", "monthly", "yearly"], default: "free" },
  subscriptionExpiry: { type: Date, default: null }
}
```

#### 1.8.2 InterviewReport Schema (`interviewreports`)
Stores generated reports. Questions are embedded as subdocuments to maintain schema validation.
```javascript
{
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  title: { type: String, required: true }, // Job title
  jobDescription: { type: String, required: true },
  resume: { type: String }, // Extracted text
  selfDescription: { type: String },
  matchScore: { type: Number, min: 0, max: 100 },
  technicalQuestions: [{
    question: { type: String, required: true },
    intention: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  behavioralQuestions: [{
    question: { type: String, required: true },
    intention: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  technicalProgress: [{ type: Boolean, default: false }],
  behavioralProgress: [{ type: Boolean, default: false }],
  skillGaps: [{
    skill: { type: String, required: true },
    severity: { type: String, enum: ["low", "medium", "high"], required: true }
  }],
  preparationPlan: [{
    day: { type: Number, required: true },
    focus: { type: String, required: true },
    tasks: [{ type: String, required: true }]
  }]
}
```

#### 1.8.3 Order Schema (`orders`)
Records financial transactions created and fulfilled via Razorpay.
```javascript
{
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  plan: { type: String, enum: ["monthly", "yearly"], required: true },
  amount: { type: Number, required: true }, // In paise
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
  creditsAdded: { type: Number }
}
```

#### 1.8.4 Redis Cache Store
Stores short-lived transactional configurations:
- **Rate Limit Counter:** Key: `rl:{userId}` or `rl:{IP}` | Value: Integer counter | TTL: 60 seconds.
- **JWT Blacklist:** Key: `bl:{jwtToken}` | Value: `"1"` | TTL: Remaining seconds of token lifetime (calculated on logout).

---

### 1.9 Authentication and Authorization Flow
1. **Sign Up/Login:**
   - Normalizes input fields (email to lowercase, trimmed whitespaces).
   - Hashes password using `bcryptjs` with 10 salt rounds.
   - Signs a JWT containing `{ id: user._id, username: user.username }` expiring in `1d` using `jsonwebtoken`.
   - Sends the token in an **httpOnly** cookie:
     ```javascript
     res.cookie("token", token, {
       httpOnly: true, // Safeguards against XSS reading token
       secure: process.env.NODE_ENV === "production", // Transmit only via HTTPS
       sameSite: "strict", // Safeguards against CSRF attacks
       maxAge: 24 * 60 * 60 * 1000 // 1 day matching JWT TTL
     })
     ```
2. **Protected Routes Middleware (`authUser`):**
   - Extracts `token` from `req.cookies`.
   - Queries Redis: `GET bl:${token}`. If it exists, returns `401 Unauthorized` (handles invalidated active tokens before expiration).
   - Runs `jwt.verify(token, secret)`. If signature is invalid or expired, returns `401`.
   - Sets `req.user = decoded` and calls `next()`.
3. **Logout:**
   - Reads the token from client cookie.
   - Decodes token structure to read the `exp` timestamp.
   - Calculates the remaining lifetime: `ttl = exp - Math.floor(Date.now() / 1000)`.
   - If `ttl > 0`, saves the token to Redis: `SETEX bl:${token} ${ttl} "1"`.
   - Clears the cookie on the response: `res.clearCookie("token")`.

---

### 1.10 API Flow and Communication
All endpoints exchange strict JSON bodies. Major communication routes are documented below:

| HTTP Method | Route Path | Description | Protected | Key Payload / Response |
|---|---|---|---|---|
| **POST** | `/api/auth/register` | Register a new user account | No | `{ username, email, password }` -> Returns user profile and sets Cookie |
| **POST** | `/api/auth/login` | Login user account | No | `{ email, password }` -> Returns profile and sets Cookie |
| **POST** | `/api/auth/logout` | Log out and blacklist token | Yes | Clears Cookie, adds token to Redis blacklist |
| **GET** | `/api/auth/me` | Fetch active user credentials | Yes | Returns `{ id, username, email, credits, subscriptionPlan, ... }` |
| **POST** | `/api/interview/` | Generate a new AI interview plan | Yes (Rate Ltd) | Multipart: `file` (resume PDF), `selfDescription`, `jobDescription` -> Returns full report |
| **GET** | `/api/interview/` | List user reports (summarized) | Yes | Returns reports array (projected out heavy text variables) |
| **GET** | `/api/interview/report/:id` | Get single report details | Yes | Returns full report detail |
| **PUT** | `/api/interview/report/:id/progress` | Sync completed question checks | Yes | `{ type: "technical" \| "behavioral", progress: [true, false, ...] }` |
| **POST** | `/api/interview/resume/pdf/:id` | Generate professional PDF file | Yes (Rate Ltd) | Streams compiled Puppeteer buffer as `application/pdf` |
| **DELETE** | `/api/interview/:id` | Delete interview report | Yes | Returns success message |
| **POST** | `/api/payment/order` | Initialize order with Razorpay | Yes | `{ plan: "monthly" \| "yearly" }` -> Returns Razorpay order configuration |
| **POST** | `/api/payment/verify` | Verify payment and credit user | Yes | `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }` -> Verifies SHA256, updates credits |

---

### 1.11 Third-Party Services and Integrations
1. **OpenAI API (GPT-4o-mini):**
   - Used for structural report generation and dynamic HTML resume compiling.
   - System prompt instructs model to act as a recruiter and export validated JSON structures.
   - Structured JSON response enforced via `response_format: { type: "json_object" }` parameter.
2. **Razorpay Checkout API:**
   - Initialized backend order utilizing the official `razorpay` library.
   - Client executes checkout using Razorpay's custom window script (`https://checkout.razorpay.com/v1/checkout.js`).
   - Secure verification accomplished by computing a HMAC SHA-256 hash using the local client secret and matching it with the payload signature.
3. **Puppeteer (Headless Browser Engine):**
   - Launched programmatically in the background with sandbox-disabled arguments.
   - Mounts dynamically structured HTML text in a virtual page layout, waits until network connections complete, and prints to an A4 PDF buffer.
4. **Redis Database:**
   - Connected via `ioredis` to manage sub-millisecond atomic transactions (rate limits, blacklisted user credentials).

---

### 1.12 Deployment Architecture
- **Frontend App:** Hosted on static rendering hosting providers (such as Vercel or Netlify) since Vite compiles client source code into static asset bundles (HTML/CSS/JS).
- **Backend Service:** Deployed on cloud platform services (Render, Railway, or AWS Elastic Beanstalk). Requires a platform supporting chromium dependencies to execute Puppeteer.
- **Database Layer:** Hosted using MongoDB Atlas, utilizing connection strings with credentials masked behind environment variables.
- **Cache Layer:** Run on managed Redis instances (Redis Cloud or Upstash).

---

### 1.13 Challenges Faced during Development
1. **Malformed LLM JSON Responses:**
   - *Problem:* AI engines occasionally return trailing commas, raw quotes wrapped inside strings, markdown wrapping lines (e.g. ` ```json `), or fail to output valid JSON.
   - *Solution:* Developed a robust cleaning pipeline (`extractJson` and `repairJson`) which uses regex to strip markdown blocks, replace single quotes with double quotes around keys/values, and remove trailing commas. Added a 3-attempt retry loop that feeds parsing and Zod validation errors back to the model as prompt updates to enforce correct schemas.
2. **Credit Double-Spend Race Conditions:**
   - *Problem:* Fast consecutive clicks or concurrent requests to generate reports could allow users with 1 credit to launch multiple OpenAI calls simultaneously before the DB writes finished.
   - *Solution:* Implemented atomic MongoDB operations. Instead of reading user credits, validating in JS, and updating the database, the server runs:
     ```javascript
     userModel.findOneAndUpdate(
       { _id: userId, credits: { $gt: 0 } },
       { $inc: { credits: -1 } }
     )
     ```
     This query fails to update and returns null if the credits count is already 0, preventing race conditions.
3. **Puppeteer Build Containerization:**
   - *Problem:* Puppeteer bundle execution fails in cloud host environments (e.g. Render or Alpine Linux Docker containers) due to missing Linux web libraries (Chromium dependencies).
   - *Solution:* Configured launch options with arguments `--no-sandbox` and `--disable-setuid-sandbox`.

---

### 1.14 Optimizations Implemented
1. **Redis Token Invalidations (Blacklist):**
   - Avoids query overhead on MongoDB for session checks. By caching logged-out JWT tokens in Redis with an expiration (`EX` ttl) equal to the token's remaining validity, the server keeps invalidations fast and doesn't pollute memory indefinitely.
2. **Selective Projection (`select` fields):**
   - When loading dashboard summaries (`getAllInterviewReportsController`), fetching large job descriptions and resumes for dozens of records causes high database network latency.
   - Implemented negative projections: `.select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")` to drastically reduce DB query payloads.
3. **Zod Validation with Schema Retries:**
   - OpenAI output structure is validated programmatically via Zod. If the schema parsing throws an exception (e.g. array is missing minimum elements), the error details are sent back to the model in a retry loop. This ensures that the application never crashes due to unexpected AI response formats.

---

### 1.15 Future Improvements and Scalability
1. **WebSockets or Server-Sent Events (SSE) for AI Streaming:**
   - AI generation currently takes 10–20 seconds, causing HTTP requests to hang. Transitioning to WebSockets or SSE will stream sections of the report (e.g., matching score first, then questions) to the client in real-time.
2. **PDF Storage on AWS S3:**
   - Currently, resume PDFs are generated on the fly. Moving forward, PDFs can be uploaded to an S3 bucket with signed URLs to reduce server CPU load during downloads.
3. **OAuth2 Integration:**
   - Implementing Google/GitHub Social Sign-In using Firebase Auth or passport.js to simplify signup.
4. **Vector Search for Similar Job Profiles:**
   - Storing reports with embeddings using MongoDB Atlas Search to allow users to search historical preparation plans for similar job descriptions instantly without spending credits on duplicate generations.

---
---

## Task 2: Complete Code Analysis Roadmap

Follow this step-by-step roadmap to read and understand the GeniusPilot repository from the ground up.

```
[ROOT LEVEL SETUP] (package.json, .env configs)
        │
        ├─► [BACKEND ANALYSIS PATH]
        │     1. server.js (Server entry point)
        │     2. config/ (database.js, redis.js)
        │     3. app.js (Express pipeline configuration)
        │     4. middlewares/ (auth, rateLimit)
        │     5. routes/ (auth, interview, payment)
        │     6. controllers/ (auth, interview, payment)
        │     7. services/ (ai.service.js, razorpay.service.js)
        │     8. models/ (user.model.js, interviewReport.model.js, order.model.js)
        │
        └─► [FRONTEND ANALYSIS PATH]
              1. main.jsx (React mounting & providers)
              2. app.routes.jsx (V7 client-side routing)
              3. auth.context.jsx (Global auth context)
              4. components/ (Protected wrapper, Navbar)
              5. pages/ (Login, Register, Profile, Home, Interview, InterviewQuestions)
```

---

### 2.1 Root Level Analysis

* **`package.json` (Root):** Configures workspace workspaces or simple script orchestrations to run client and server directories concurrently or independently.
* **`Backend/package.json`:** Lists Node.js dependencies (Mongoose 9.x, Express 5.x, ioredis, openai, puppeteer, razorpay, zod). Note the use of `nodemon` for hot-reloading development.
* **`Frontend/package.json`:** Lists Vite React dependencies (React 19, React Router 7, Sass, Axios).
* **`.env` files:**
  - `Backend/.env`: Contains configurations for `PORT` (3000), `MONGO_URI`, `REDIS_HOST`/`PORT`/`PASSWORD` (for local or Cloud Redis), `JWT_SECRET`, `OPENAI_API_KEY`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`.
  - `Frontend/`: Configures API endpoints (e.g., base URL targeting the Express backend).

---

### 2.2 Backend Analysis Path

Read the backend directories in the following order to understand how incoming requests are processed, authenticated, validated, and resolved:

#### 1. Server Entry Point (`Backend/server.js`)
* **What it does:** The starting point of the backend execution. It imports the express application from `src/app.js` and mounts the HTTP server listener.
* **Why it exists:** Isolates the server port-binding listener from the express app routing logic (essential for running automated supertest integration suites without locking ports).
* **How it connects:** Imports `app.js` and executes `app.listen(PORT)`.

#### 2. Configuration Files (`Backend/src/config/`)
* **Files:** [database.js](file:///Users/vishal/Desktop/MERN%20DEVLOPER/GP-GeniusPilot/Backend/src/config/database.js) and [redis.js](file:///Users/vishal/Desktop/MERN%20DEVLOPER/GP-GeniusPilot/Backend/src/config/redis.js).
* **What it does:** Initializes connections to MongoDB Atlas (via Mongoose) and the Redis instance (via `ioredis`).
* **Why it exists:** Keeps credentials and driver connection configurations out of business controllers.
* **How it connects:** Database connections are fired once when starting `server.js`.

#### 3. App Setup (`Backend/src/app.js`)
* **What it does:** Configures Express framework options: sets up JSON parses, mounts CORS rules, registers `cookie-parser`, and hooks API route endpoints.
* **Why it exists:** Acts as the central router pipeline assembler.
* **How it connects:** Integrates configurations, applies app-wide middlewares, and points endpoints to their respective route files.

#### 4. Middlewares (`Backend/src/middlewares/`)
* **Files:** [auth.middleware.js](file:///Users/vishal/Desktop/MERN%20DEVLOPER/GP-GeniusPilot/Backend/src/middlewares/auth.middleware.js) and [rateLimit.middleware.js](file:///Users/vishal/Desktop/MERN%20DEVLOPER/GP-GeniusPilot/Backend/src/middlewares/rateLimit.middleware.js).
* **What it does:** Intercepts incoming requests:
  - `auth.middleware.js` checks JWT cookies and queries Redis to verify the token isn't blacklisted.
  - `rateLimit.middleware.js` uses Redis counters to rate-limit clients.
* **Why it exists:** Keeps cross-cutting concerns (authentication, rate limiting) decoupled from core controller logic.
* **How it connects:** Wrapped around specific protected routes in the routing files.

#### 5. Routes (`Backend/src/routes/`)
* **Files:** `auth.routes.js`, `interview.routes.js`, `payment.routes.js`.
* **What it does:** Maps incoming HTTP request paths and methods to specific middleware chains and controllers.
* **Why it exists:** Provides a clean routing directory.
* **How it connects:** Configured in `app.js` to route endpoints (e.g. `/api/auth` or `/api/interview`) to matching controller methods.

#### 6. Controllers (`Backend/src/controllers/`)
* **Files:** [auth.controller.js](file:///Users/vishal/Desktop/MERN%20DEVLOPER/GP-GeniusPilot/Backend/src/controllers/auth.controller.js), [interview.controller.js](file:///Users/vishal/Desktop/MERN%20DEVLOPER/GP-GeniusPilot/Backend/src/controllers/interview.controller.js), [payment.controller.js](file:///Users/vishal/Desktop/MERN%20DEVLOPER/GP-GeniusPilot/Backend/src/controllers/payment.controller.js).
* **What it does:** The "brain" of the endpoints. Parses query inputs, handles client data, invokes background business services, and returns appropriate HTTP responses.
* **Why it exists:** Implements MVC controller logic, separating HTTP protocols from database schemas and external client drivers.
* **How it connects:** Receives data from route bindings, validates parameters, reads/writes using DB Models, calls service classes, and sends JSON payloads.

#### 7. Services (`Backend/src/services/`)
* **Files:** [ai.service.js](file:///Users/vishal/Desktop/MERN%20DEVLOPER/GP-GeniusPilot/Backend/src/services/ai.service.js) and [razorpay.service.js](file:///Users/vishal/Desktop/MERN%20DEVLOPER/GP-GeniusPilot/Backend/src/services/razorpay.service.js).
* **What it does:** Encapsulates business logic for third-party systems:
  - `ai.service.js` handles OpenAI JSON Schema parsing, retries, and Puppeteer PDF generation.
  - `razorpay.service.js` interacts with Razorpay for order processing and signature verification.
* **Why it exists:** Isolates heavy calculations and external SDK integrations.
* **How it connects:** Called by controller handlers when they require external inputs (e.g. calling the AI API or talking to Razorpay).

#### 8. Database Models (`Backend/src/models/`)
* **Files:** `user.model.js`, `interviewReport.model.js`, `order.model.js`.
* **What it does:** Defines Mongoose schemas, indexes, and validation constraints for the database.
* **Why it exists:** Provides structure to MongoDB collection documents and coordinates CRUD queries.
* **How it connects:** Imported and used by controllers to read and persist records.

---

### 2.3 Frontend Analysis Path

Read the frontend directories in the following order to trace how the application renders state and handles routing:

#### 1. React Entry point (`Frontend/src/main.jsx`)
* **What it does:** Boots React, mounts the DOM node, wraps the project with the routing container, and provides the global `AuthProvider` wrapper.
* **Why it exists:** Instantiates the client application.
* **How it connects:** Binds React to `index.html` and imports `app.routes.jsx`.

#### 2. Route Configuration (`Frontend/src/app.routes.jsx`)
* **What it does:** Configures the client router (`createBrowserRouter` via React Router 7) and sets path configurations.
* **Why it exists:** Manages client-side page routing.
* **How it connects:** Defines which path URLs load which page components, wrapping private pages in the `<Protected>` wrapper.

#### 3. Authentication Context (`Frontend/src/features/auth/auth.context.jsx`)
* **What it does:** Manages global state for the active user: user details, loading states, subscription plans, and remaining credits.
* **Why it exists:** Prevents "prop drilling" by sharing user data across all pages (e.g., checking credits in the sidebar or checking subscription status on the checkout page).
* **How it connects:** Wraps the entire application tree in `main.jsx`, exposing hooks used by pages like `Home` and `Profile`.

#### 4. Route Protection Component (`Frontend/src/features/auth/components/Protected.jsx`)
* **What it does:** Acts as a route guard. Checks if user session details exist in the authentication state; if empty, redirects the user to `/login`.
* **Why it exists:** Secures pages, preventing unauthorized users from accessing private data.
* **How it connects:** Wraps private routes in `app.routes.jsx`.

#### 5. Shared Navbar (`Frontend/src/features/auth/components/Navbar.jsx`)
* **What it does:** Renders header actions, displays remaining credit balances, and provides navigation buttons.
* **Why it exists:** Standardizes navigation across pages.
* **How it connects:** Rendered at the top of protected views.

#### 6. Registration & Login Pages (`Frontend/src/features/auth/pages/`)
* **Files:** `Login.jsx` and `Register.jsx`.
* **What it does:** Displays forms, validates inputs, sends requests to `/api/auth/login` or `/api/auth/register`, and saves the returned user profile to `AuthContext`.
* **Why it exists:** User entry point.
* **How it connects:** Accessible via `/login` and `/register` paths. Fills context state, triggering redirects to `/`.

#### 7. Home Dashboard (`Frontend/src/features/interview/pages/Home.jsx`)
* **What it does:** The main interface for authenticated users. Displays remaining credits, list of past reports, and includes the file upload form.
* **Why it exists:** Acts as the primary control center for creating reports and launching generations.
* **How it connects:** Mounts at the root `/` path. Fills report list summaries via database queries.

#### 8. Detailed Report Page (`Frontend/src/features/interview/pages/Interview.jsx`)
* **What it does:** Displays the generated reports. Renders matching score gauges, displays skill gaps, includes accordion layouts for interview questions, and lets users download the PDF resume.
* **Why it exists:** The core output page of the application.
* **How it connects:** Resolves on route path `/interview/:interviewId`, reading URL params to load data.

#### 9. Frontend Questions Bank (`Frontend/src/features/interview/pages/InterviewQuestions.jsx`)
* **What it does:** Displays a static list of 22 key JavaScript conceptual interview questions (e.g. closures, prototypes). Uses `localStorage` to save completion progress.
* **Why it exists:** Provides a quick offline study bank for core JavaScript features.
* **How it connects:** Routes from `/questions`.

---
---

## Task 3: Interview Preparation (Q&A)

Prepare for your interviews with these 30+ highly tailored questions based on the architecture, stack, and code decisions of **GeniusPilot**.

### 3.1 Project-Based & Architecture Questions

#### Q1: Can you walk me through the system architecture of GeniusPilot and explain how data flows when a user uploads a resume?
* **Why the interviewer asks this:** To test your high-level system design capabilities and your ability to explain complex data flows clearly.
* **Professional Answer:** 
  > "GeniusPilot follows a client-server-database architecture. When a user uploads their resume PDF and a job description on the frontend, the client sends a `multipart/form-data` request via Axios to our Express server. The server uses `multer` to store the file buffer in memory and runs `pdf-parse` to extract the raw text. Next, it performs an atomic MongoDB write to deduct 1 credit from the user. It then calls our OpenAI AI Service, sending the resume text and job description along with a strict Zod-defined JSON schema.
  > 
  > The OpenAI API returns structured JSON, which is verified using Zod. Once validated, the server saves this report in MongoDB under the `InterviewReport` collection and returns it to the client. The frontend then updates its state, re-renders the dashboard, and navigates the user to the report details page."
* **Common mistakes to avoid:** Forgetting to mention the file upload handling (multer in-memory buffer) or how the resume parser processes the file.
* **Follow-up questions:** How does the server handle large resume PDFs? (Answer: We limit file uploads using Multer configuration limits).

#### Q2: Why did you decide to build a custom JSON repair and validation parser instead of relying entirely on OpenAI's structured JSON output mode?
* **Why the interviewer asks this:** To see if you understand the limitations of LLM engines and how to build resilient pipelines for production.
* **Professional Answer:**
  > "While OpenAI's `response_format: { type: "json_object" }` guarantees that the output will be syntactically valid JSON, it doesn't guarantee that the returned keys and values will match our application's required business schema (e.g., returning at least 10 questions or including correct day objects in the preparation plan). 
  > 
  > Additionally, LLMs can occasionally return minor syntax issues, like trailing commas or markdown wraps. Our custom validation pipeline uses `repairJson()` to clean the output first. Then, it uses Zod's `schema.parse()` to validate the schema. If Zod validation fails, we capture the exact validation errors (such as missing fields or array length violations) and pass them back to the model in a retry loop. This feedback loop ensures high schema compliance and prevents application crashes."
* **Common mistakes to avoid:** Saying that OpenAI never returns invalid JSON, or claiming you wrote a complete JSON parser from scratch (it's regex-based cleaning and standard `JSON.parse` with retries).
* **Follow-up questions:** What is the performance impact of retries on request timeout limits? (Answer: We limit attempts to 3 and use the fast `gpt-4o-mini` model, keeping generation within acceptable limits).

#### Q3: How did you implement PDF generation for resumes, and what design choices did you make regarding performance and security?
* **Why the interviewer asks this:** PDF generation is notoriously resource-intensive. Interviewers want to check if you understand containerization constraints and resource management.
* **Professional Answer:**
  > "For PDF generation, we send the resume data to OpenAI with a request to format it into semantic, clean HTML. Once we get the HTML template, we pass it to Puppeteer. The server launches a headless Chromium instance, sets the page content to the HTML, prints it to an A4 PDF buffer using `page.pdf()`, and closes the browser context. The buffer is then streamed back to the client with `Content-Type: application/pdf`.
  > 
  > To optimize performance, we launch Chromium with configurations like `--no-sandbox` to run smoothly in containerized hosting environments, and we use a `try...finally` block to guarantee the browser instance is closed even if page rendering fails, preventing server memory leaks."
* **Common mistakes to avoid:** Not mentioning how you prevent memory leaks (closing the browser instance in the `finally` block).
* **Follow-up questions:** If this page received high concurrent traffic, how would you scale the PDF generation? (Answer: I would offload PDF compilation to a serverless function, like AWS Lambda, or use a dedicated PDF rendering microservice to prevent blocking the main Express event loop).

#### Q4: Why did you choose a monolithic full-stack repository structure over a decoupled setup for this project?
* **Why the interviewer asks this:** To test your project organization logic and your understanding of deployment tradeoffs.
* **Professional Answer:**
  > "We chose a single repository with separate `Frontend` and `Backend` folders because it fits our team size and deployment needs. It allows us to manage both codebases under a single version control tree while keeping them functionally isolated. The frontend is built with Vite and React, deploying to static CDNs, while the backend runs Express on a platform with native Node environments. This setup keeps development simple while maintaining clean, separate deployments."
* **Common mistakes to avoid:** Confusing a monorepo workspace with a single shared node_modules container.
* **Follow-up questions:** How do you handle environment variables in this setup during local development? (Answer: We use separate `.env` files in the Backend and Frontend directories, keeping credentials secure and isolated).

#### Q5: How does the progress tracking feature work under the hood? How do you ensure it stays synchronized between the client and server?
* **Why the interviewer asks this:** To test your understanding of state synchronization and database updates.
* **Professional Answer:**
  > "When a report is generated, we calculate the number of technical and behavioral questions returned by the AI and initialize two arrays in the MongoDB `InterviewReport` document: `technicalProgress` and `behavioralProgress`, populated with `false` values matching the questions' indexes. 
  > 
  > When a user checks a question on the frontend, we update the local array state and send a `PUT` request to `/api/interview/report/:id/progress` containing the updated boolean array. The controller validates the input shape using array checks and runs an atomic `findOneAndUpdate` update on MongoDB. This updates the progress instantly and keeps the UI in sync."
* **Common mistakes to avoid:** Suggesting that you query and update individual question subdocuments (which would be highly inefficient compared to a simple boolean index array).
* **Follow-up questions:** What happens if the array size sent by the client doesn't match the database? (Answer: The controller validates the array length against the report's questions count before saving to prevent index errors).

---

### 3.2 Frontend (React & UI) Questions

#### Q6: React 19 was used in this project. What are the key differences or improvements in React 19 that you leverage, or how does it handle rendering differently?
* **Why the interviewer asks this:** To check if your knowledge is up-to-date with modern frontend technologies.
* **Professional Answer:**
  > "React 19 introduces native support for async transitions and Actions, which simplifies handling pending states, errors, and form submissions. It also improves resource loading (like stylesheets and fonts) by preloading them automatically. 
  > 
  > In our application, we take advantage of React 19's optimized rendering and support for modern build systems. This allows us to handle state transitions smoothly, without needing redundant boilerplate code for loading overlays."
* **Common mistakes to avoid:** Giving generic answers about virtual DOM changes without mentioning specific React 19 features like Actions or resource loading.
* **Follow-up questions:** How does React 19 handle ref forwarding? (Answer: In React 19, `ref` is passed as a standard prop, making `forwardRef` obsolete and simplifying component code).

#### Q7: React Router v7 was used for routing. What routing style did you use, and how did you configure private routes?
* **Why the interviewer asks this:** Routing is key to React SPA architectures. The interviewer wants to verify your route configuration and route guarding implementation.
* **Professional Answer:**
  > "We use React Router 7's modern data router configuration via `createBrowserRouter`. Routes are defined as an array of objects.
  > 
  > To secure our private pages, we built a `<Protected>` layout wrapper. In `app.routes.jsx`, we wrap protected components (like Home, Profile, and Interview details) inside this wrapper: `<Protected><Home /></Protected>`. The Protected component checks the `user` and `loading` states from our `AuthContext`. If the user is authenticated, it renders the page; otherwise, it redirects them to `/login` using the `<Navigate>` component."
* **Common mistakes to avoid:** Recommending older legacy configurations (like `<Routes>` and `<Route>` wrappers in `App.jsx`) instead of the modern `createBrowserRouter` approach.
* **Follow-up questions:** How does your Protected wrapper handle page refreshes without losing auth state? (Answer: While loading the user session from cookies, the wrapper returns a loading spinner instead of redirecting, preventing false redirect flags).

#### Q8: You chose React Context API for state management instead of Redux or Zustand. Why?
* **Why the interviewer asks this:** To test your architectural decision-making. You should choose state management tools based on actual project needs, not just popularity.
* **Professional Answer:**
  > "We chose the Context API because our global state requirements are lightweight. We only need to track the current user profile, loading states, subscription plans, and remaining credits. 
  > 
  > Using a heavy state manager like Redux would add unnecessary boilerplate without much benefit. Context API, combined with React's `useState`, handles this well. For localized, interactive state (like checkboxes on the questions page), we use local component state to keep renders fast and isolated."
* **Common mistakes to avoid:** Claiming Redux is bad. Instead, focus on the tradeoff: matching the tool's complexity to the application's actual state requirements.
* **Follow-up questions:** How do you prevent unnecessary re-renders in components consuming your Context? (Answer: We split context data when needed, keep our state objects flat, and use local state for fast UI interactions).

#### Q9: The frontend questions bank uses `localStorage` to save question progress. Why use `localStorage` there instead of the backend database?
* **Why the interviewer asks this:** To see if you can balance server load, latency, and offline requirements.
* **Professional Answer:**
  > "The JavaScript Questions page is a static resource bank that doesn't vary by user profile or job description. Since it doesn't need to be synced across multiple devices or verified for credits, saving progress in `localStorage` is an efficient design choice. 
  > 
  > It eliminates database writes, reduces API traffic, and allows the feature to work offline. For core, customized features like AI reports, we sync progress with MongoDB to ensure data isn't lost."
* **Common mistakes to avoid:** Forgetting to mention that localStorage is device-locked and can be cleared by the user.
* **Follow-up questions:** How do you key the localStorage data to prevent collision? (Answer: We namespace our keys with the user's ID, for example: `gp_questions_progress_${userId}_${category}`).

#### Q10: How did you implement styling in the frontend? What are the benefits of the approach you took?
* **Why the interviewer asks this:** CSS architecture is crucial for maintaining large frontends.
* **Professional Answer:**
  > "We use **Sass (SCSS)** with a BEM-like naming convention. This gives us nesting, variables for variables (like colors, borders, and margins), and mixins for responsive design. 
  > 
  > For example, on our interview questions page, we use a prefix like `qb-` to scope classes. This prevents style bleeding and keeps our components modular and easy to maintain."
* **Common mistakes to avoid:** Confusing standard CSS with preprocessors, or not explaining the benefits of Sass (like nested rules and variables).
* **Follow-up questions:** How do you handle dark mode styling in your SCSS setup? (Answer: We define CSS custom properties on the `:root` and change them dynamically using a global theme attribute).

---

### 3.3 Backend (Node.js & Express) Questions

#### Q11: Express 5 was used in this project. What are the key improvements in Express 5 over Express 4?
* **Why the interviewer asks this:** To test your knowledge of recent backend framework updates.
* **Professional Answer:**
  > "The most important improvement in Express 5 is how it handles asynchronous errors. In Express 4, if an async handler threw an error or a promise rejected, the app could crash unless the error was explicitly caught and passed to `next(error)`. 
  > 
  > Express 5 automatically handles rejected promises in routes and passes them to your global error handling middleware. This simplifies our code by removing the need for custom async wrappers or redundant try-catch blocks in every controller."
* **Common mistakes to avoid:** Saying there are no differences, or forgetting the automatic promise rejection handling.
* **Follow-up questions:** How do you define a global error handler in Express? (Answer: By creating a middleware with four arguments: `(err, req, res, next)`).

#### Q12: Explain the middleware pattern in Express. How does your backend use it?
* **Why the interviewer asks this:** To test your understanding of Express's core request-response lifecycle.
* **Professional Answer:**
  > "Express middleware functions have access to the request (`req`), response (`res`), and the `next` function in the application's cycle. They can execute code, modify request/response objects, and end the request or pass control to the next middleware.
  > 
  > In GeniusPilot, we chain middlewares for security and validation. For instance, on the `/api/interview` generation route, the request first passes through `authUser` to verify the JWT. If valid, it runs through `createRateLimiter` to check request frequency. Finally, it reaches the controller to run the business logic."
* **Common mistakes to avoid:** Forgetting to call `next()`, which hangs the request indefinitely.
* **Follow-up questions:** What is the difference between app-level and router-level middleware? (Answer: App-level is applied globally via `app.use()`, while router-level is bound to specific router instances).

#### Q13: Why did you choose httpOnly cookies to store JWTs instead of localStorage?
* **Why the interviewer asks this:** Security is a major concern in modern web development. You must know how to defend against common vulnerabilities.
* **Professional Answer:**
  > "Storing JWTs in `localStorage` makes them accessible to JavaScript. If the application has a Cross-Site Scripting (XSS) vulnerability, an attacker can steal the token.
  > 
  > By storing the JWT in an `httpOnly` cookie, we prevent client-side JavaScript from accessing it. We also set the `secure` flag to transmit it only over HTTPS, and use `sameSite: "strict"` to mitigate Cross-Site Request Forgery (CSRF) attacks. This makes the session management much more secure."
* **Common mistakes to avoid:** Stating that cookies completely prevent CSRF without mentioning the `sameSite` configuration.
* **Follow-up questions:** How does the server read cookies if JavaScript can't access them? (Answer: The browser automatically includes cookies in the headers of HTTP requests sent to the issuing domain).

#### Q14: How does your backend handle file uploads? Explain your integration with Multer.
* **Why the interviewer asks this:** File handling is a common backend requirement. They want to see how you handle security and storage.
* **Professional Answer:**
  > "We use `multer` to handle PDF resume uploads. We configure Multer to store files in an in-memory buffer (`multer.memoryStorage()`) rather than saving them directly to the server's disk. This is safer and faster because we only need to parse the text once. 
  > 
  > The file buffer is passed to `pdf-parse` to extract the text. Since we don't save files to disk, we don't have to worry about cleaning up temporary files or filling up server storage."
* **Common mistakes to avoid:** Storing files on disk without a cleanup strategy, which can quickly exhaust server storage.
* **Follow-up questions:** How do you validate that the uploaded file is actually a PDF? (Answer: We configure Multer's `fileFilter` to check the file extension and MIME type).

#### Q15: How did you implement global error handling in your Express application?
* **Why the interviewer asks this:** To evaluate your code cleanliness and API error response standards.
* **Professional Answer:**
  > "We use a global error handling middleware registered at the end of our Express pipeline. Since we use Express 5, all uncaught exceptions and async rejections are routed here automatically. 
  > 
  > The middleware logs the error stack in development for debugging. For production, it sanitizes the error, returning a clean JSON response with a consistent format: `{ message: "An unexpected error occurred." }`. This prevents leaking database internals or sensitive stack traces to the client."
* **Common mistakes to avoid:** Placing the global error handler *before* your routes (it must be registered last to catch errors).
* **Follow-up questions:** How do you handle custom operational errors? (Answer: We create a custom error class extending the native `Error` class and include status codes).

---

### 3.4 Database (MongoDB & Mongoose) Questions

#### Q16: What is Mongoose? Why use it over the native MongoDB driver?
* **Why the interviewer asks this:** To test your understanding of object modeling and validation in NoSQL databases.
* **Professional Answer:**
  > "Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. While MongoDB is schema-less, Mongoose allows us to define schemas, structure models, and enforce validations at the application level. 
  > 
  > It also provides middleware hooks (like pre-save hooks for password hashing) and makes it easy to run complex queries. This ensures our database records stay consistent and clean."
* **Common mistakes to avoid:** Believing MongoDB itself enforces Mongoose schemas (Mongoose validates data in application memory before saving to MongoDB).
* **Follow-up questions:** How do you define relationships in Mongoose? (Answer: By using `Schema.Types.ObjectId` and the `ref` option to reference other collections).

#### Q17: In your `InterviewReport` schema, you defined questions as subdocument arrays instead of separate collections. What are the pros and cons of this design?
* **Why the interviewer asks this:** To evaluate your document design choices and understanding of MongoDB performance tradeoffs.
* **Professional Answer:**
  > "We chose to embed questions as subdocuments because a candidate's interview report is read as a single unit. Embedding them matches MongoDB's nested document model and allows us to retrieve the entire report in a single query, avoiding slow database joins.
  > 
  > The main drawback is MongoDB's 16MB document limit. However, since a report contains only about 20 questions and a text-based preparation plan, the document size is very small (typically under 100KB), making this approach highly efficient."
* **Common mistakes to avoid:** Claiming embedding is always better, or forgetting to mention MongoDB's 16MB document size limit.
* **Follow-up questions:** When would you split subdocuments into a separate collection? (Answer: When the nested arrays grow without bound, or when child documents need to be queried and updated independently).

#### Q18: What is MongoDB query projection, and how does your application use it to improve database performance?
* **Why the interviewer asks this:** Performance tuning. Transferring unnecessary fields over the network slows down applications.
* **Professional Answer:**
  > "Query projection allows us to specify which fields MongoDB should return in a query. In our `getAllInterviewReportsController` route, we only need to show a list of past report titles and dates on the dashboard.
  > 
  > We use negative projection: `.select("-resume -selfDescription -jobDescription -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")`. By excluding these heavy text fields, we reduce the network payload and speed up response times."
* **Common mistakes to avoid:** Only knowing positive projections. Negative projections are often cleaner when you want to exclude just a few large fields.
* **Follow-up questions:** Does projection reduce the memory used by MongoDB itself? (Answer: It reduces the memory used to transmit data over the network and parse it on the server, but MongoDB still reads the index or documents from disk).

#### Q19: How do database transactions differ from atomic operations in MongoDB? Why did you use an atomic operation for credit updates?
* **Why the interviewer asks this:** To test your understanding of concurrency, performance, and data integrity.
* **Professional Answer:**
  > "MongoDB transactions are multi-document operations that follow ACID principles, but they add performance overhead. Atomic operations (like `$inc` or `$set` inside a single document write) are performed in-memory on a single document lock, making them fast.
  > 
  > We use an atomic update to manage credits: `findOneAndUpdate({ _id: userId, credits: { $gt: 0 } }, { $inc: { credits: -1 } })`. Because this write is atomic, MongoDB guarantees that the credits decrement safely, even if the user makes multiple requests at the exact same millisecond. This prevents race conditions without the overhead of full database transactions."
* **Common mistakes to avoid:** Claiming you need transactions for single-document updates, or not explaining how the query prevents negative credit balances.
* **Follow-up questions:** If the credit deduction succeeds but the AI generation fails, how does the app handle it? (Answer: We catch the error in a try-catch block and run a refund query: `$inc: { credits: 1 }`).

#### Q20: Explain MongoDB indexing. Which fields in your schemas would benefit from indexes, and why?
* **Why the interviewer asks this:** Database optimization. They want to check if you know how to speed up slow queries.
* **Professional Answer:**
  > "Indexes are special data structures that store a small portion of the collection's data set in an easy-to-traverse form. Without indexes, MongoDB must perform a collection scan, reading every document to find matches.
  > 
  > In our project, fields like `email` and `username` in the `users` schema, and `razorpayOrderId` in the `orders` schema are indexed automatically because they are marked `unique: true`. Additionally, adding an index to the `user` reference field in the `interviewreports` collection speeds up queries when listing reports for a specific user."
* **Common mistakes to avoid:** Recommending indexes for every field (indexes speed up reads but slow down writes and use disk space).
* **Follow-up questions:** How do you view query performance in MongoDB? (Answer: By appending `.explain("executionStats")` to a Mongoose query).

---

### 3.5 System Design & Security Questions

#### Q21: How does your Redis-based JWT token blacklisting mechanism work on logout? Why is it more secure?
* **Why the interviewer asks this:** Stateless JWTs cannot normally be invalidated before they expire. Blacklisting is a common system design pattern to solve this security issue.
* **Professional Answer:**
  > "JWTs are stateless, meaning once issued, they remain valid until they expire. If a user logs out, the token can still be used if intercepted.
  > 
  > To solve this, our logout controller decodes the token, reads its expiration timestamp (`exp`), and calculates the remaining lifetime: `ttl = exp - now`. We save this token to Redis with the calculated TTL: `SETEX bl:${token} ${ttl} "1"`. 
  > 
  > In our auth middleware, we check if the incoming token exists in Redis. If it does, we reject the request. Once the token's original lifetime expires, Redis deletes it automatically, keeping our database size small and fast."
* **Common mistakes to avoid:** Saving blacklisted tokens in MongoDB (which is slow and requires manual cleanup scripts).
* **Follow-up questions:** What happens if the Redis server goes down? (Answer: We wrap the Redis check in a try-catch block. If Redis fails, we fall back to standard JWT signature verification to keep the service running, and log the error for monitoring).

#### Q22: Explain the Redis rate-limiting implementation. Why did you build a custom middleware instead of using npm packages like `express-rate-limit`?
* **Why the interviewer asks this:** To test your understanding of distributed caching, rate-limiting algorithms, and middleware design.
* **Professional Answer:**
  > "We built a custom rate limiter using Redis to ensure it works across multiple server instances (distributed systems). Package-based memory limiters only work on a single server instance.
  > 
  > Our middleware uses a simple increment pattern. We key rate limits by the user ID (or client IP if not logged in): `rl:${identifier}`. When a request comes in, we call `redis.incr(key)`. If the count is 1, we set an expiration: `redis.expire(key, windowSeconds)`. If the count exceeds our limit, we return a `429 Too Many Requests` status and set a `Retry-After` header. This protects our database and external APIs from abuse."
* **Common mistakes to avoid:** Using a simple in-memory object for rate limiting, which fails when the app is scaled across multiple server instances or containers.
* **Follow-up questions:** What is the 'race condition' in this rate limiter, and how can you solve it? (Answer: A race condition can occur between the `INCR` and `EXPIRE` commands if the client sends requests fast enough. We can solve this by running both commands atomically in a single Redis transaction or using a Lua script).

#### Q23: How do you handle payment security and verify that a transaction was successful and not falsified?
* **Why the interviewer asks this:** Financial transactions require strict security. They want to check if you understand payload verification.
* **Professional Answer:**
  > "When a client completes a payment, Razorpay returns transaction signatures: `razorpayOrderId`, `razorpayPaymentId`, and `razorpaySignature`.
  > 
  > We verify this signature on the server to prevent fraud. We compute an HMAC SHA-256 signature using our secret key and the order details: `razorpayOrderId + "|" + razorpayPaymentId`. We then use `crypto.timingSafeEqual` to compare our generated signature with the signature sent by the client. If they match, we confirm the payment is genuine and credit the user."
* **Common mistakes to avoid:** Relying on the client to confirm payment success, or matching signatures using simple string comparison (which is vulnerable to timing attacks).
* **Follow-up questions:** What is a timing attack, and how does `timingSafeEqual` prevent it? (Answer: A timing attack measures how long a string comparison takes to guess characters. `timingSafeEqual` compares strings in constant time, preventing this vulnerability).

#### Q24: How did you implement payment idempotency to prevent users from getting duplicate credits on replayed requests?
* **Why the interviewer asks this:** Idempotency is key to designing reliable payment systems. They want to see how you prevent duplicate actions.
* **Professional Answer:**
  > "We enforce idempotency at the database level when verifying payments. When a payment is verified, we run a query that only updates orders with a status of `"created"`:
  > 
  > `findOneAndUpdate({ razorpayOrderId, user: userId, status: "created" }, { status: "paid" })`
  > 
  > If a user replays the verification request, the order status will already be `"paid"`. The query won't find a matching `"created"` order and returns null. This prevents the server from crediting the account a second time."
* **Common mistakes to avoid:** Checking the order status first in JS and then running the update (which is vulnerable to race conditions).
* **Follow-up questions:** What happens if the server crashes *after* updating the order status to `"paid"` but *before* crediting the user? (Answer: To make this robust, we update the order status and credit the user's account inside a database transaction, or run a reconciliation job to retry pending payments).

#### Q25: How do you protect your backend against common OWASP vulnerabilities like XSS, CSRF, and SQL Injection?
* **Why the interviewer asks this:** Security fundamentals. Every backend developer should know how to secure APIs.
* **Professional Answer:**
  > "We implement multiple security layers:
  > 1. **XSS Protection:** By storing session tokens in `httpOnly` cookies, we prevent malicious scripts from stealing user credentials.
  > 2. **CSRF Protection:** We configure cookies with `sameSite: "strict"` to block cross-site request forgery.
  > 3. **SQL/NoSQL Injection:** Mongoose query structures automatically serialize parameters, preventing query injection.
  > 4. **Input Sanitization:** We normalize input fields, like trimming strings and converting emails to lowercase, to ensure data is clean."
* **Common mistakes to avoid:** Claiming your app is 100% secure. Focus instead on how you mitigate risks.
* **Follow-up questions:** How does sameSite: "strict" protect against CSRF? (Answer: It instructs the browser not to send cookies with cross-site requests, protecting against unauthorized sessions).

---

### 3.6 HR & Behavioral Questions

#### Q26: Why did you choose to build GeniusPilot? What was the inspiration behind this project?
* **Why the interviewer asks this:** To evaluate your product mindset, passion for engineering, and problem-solving drive.
* **Professional Answer:**
  > "During my own interview preparation, I noticed that generic study lists were rarely helpful. Interviewers want to see how your specific background matches the job description.
  > 
  > I wanted to build a tool that automates this analysis, helping candidates find their skill gaps and prepare with tailored questions. Creating GeniusPilot allowed me to solve a real problem while working with modern web technologies, AI integrations, caching, and payment systems."
* **Common mistakes to avoid:** Saying you built it just for your portfolio or because it was a required project.
* **Follow-up questions:** Did you use the tool yourself? (Answer: Yes, I used it to evaluate my own resume against backend job descriptions, which helped me identify gaps in system design and caching).

#### Q27: What was the single biggest technical challenge you faced during this project, and how did you resolve it?
* **Why the interviewer asks this:** To assess your problem-solving process, engineering depth, and perseverance.
* **Professional Answer:**
  > "My biggest challenge was handling malformed JSON responses from OpenAI. Even with structured output mode enabled, the model would occasionally return trailing commas or single quotes, causing `JSON.parse` to fail.
  > 
  > I solved this by building a custom JSON parsing pipeline. It uses regex-based cleaning (`repairJson`) to fix minor syntax errors before parsing. If validation still fails, we capture the errors and feed them back to the model in a retry loop. This solved our parsing issues and made the AI generation highly reliable."
* **Common mistakes to avoid:** Blaming the AI without showing how you solved the problem, or describing a trivial bug.
* **Follow-up questions:** If you could rebuild this pipeline, what would you do differently? (Answer: I would explore using newer LLM features like function calling, which are designed to output structured data).

#### Q28: If you had another month to work on this project, what features would you add or improve?
* **Why the interviewer asks this:** To test your product vision, scalability mindset, and self-awareness of technical debt.
* **Professional Answer:**
  > "I would focus on two main areas:
  > 1. **User Experience:** AI generation currently takes 10-20 seconds. I would implement Server-Sent Events (SSE) to stream sections of the report to the user in real-time, making the app feel much faster.
  > 2. **Scalability:** Offloading Puppeteer PDF generation to serverless functions, like AWS Lambda, would free up server resources. I would also save generated PDFs to AWS S3 instead of compiling them on the fly for every download."
* **Common mistakes to avoid:** Claiming the project is perfect and needs no improvements.
* **Follow-up questions:** Why use Server-Sent Events over WebSockets for streaming? (Answer: SSE is simpler, runs over standard HTTP, and supports automatic reconnection, which fits our read-only streaming needs).

#### Q29: What was your exact contribution to this project? How did you manage your tasks?
* **Why the interviewer asks this:** To verify your hands-on involvement and assess your project management skills.
* **Professional Answer:**
  > "I built GeniusPilot from scratch as a full-stack project. I structured the database schemas, set up the Express server and its middleware pipeline (including authentication and rate limiting), integrated the OpenAI API with custom validation, and set up Razorpay payments. 
  > 
  > On the frontend, I built the React components, set up Vite routing, and managed the global authentication state. I tracked my work by breaking features down into smaller components, keeping my git history clean and organized."
* **Common mistakes to avoid:** Taking credit for work you didn't do, or being too vague about your contributions.
* **Follow-up questions:** How did you test your APIs during development? (Answer: I used Postman collections and wrote manual tests to verify our endpoint routes, status codes, and error responses).

#### Q30: What is the most important non-technical lesson you learned while building this project?
* **Why the interviewer asks this:** To assess your soft skills, teamwork values, and professional growth.
* **Professional Answer:**
  > "I learned the importance of **designing for the user experience**. Early on, I focused entirely on backend logic and database design. But when testing the app, I realized that waiting 15 seconds for a report to generate without any feedback felt frustrating.
  > 
  > This taught me that good engineering isn't just about clean code—it's also about clear communication. I added loading indicators, progress updates, and helpful error messages to make the application feel responsive and user-friendly."
* **Common mistakes to avoid:** Giving a generic answer, or listing a technical lesson instead of a soft skill.
* **Follow-up questions:** How did you gather feedback on your user interface? (Answer: I asked friends and developers to test the platform and watched where they struggled, which helped me improve our form layouts and navigation).
