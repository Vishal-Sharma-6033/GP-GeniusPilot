# GP-GeniusPilot 🚀

An AI-powered interview preparation and strategy platform built on the MERN stack (React, Node.js/Express, MongoDB) with integrations for OpenAI and Puppeteer. GP-GeniusPilot analyzes a user's resume, self-description, and target job descriptions to produce a comprehensive interview plan containing custom technical/behavioral questions, intended answers, match scores, severity-based skill gaps, and custom roadmaps. It also dynamically compiles optimized resume PDFs for targeted job applications.

---

## 📦 Repository Structure

```
GP-GeniusPilot/
├── Backend/                   # Node.js/Express REST API
│   ├── src/
│   │   ├── config/            # Database configurations
│   │   ├── controllers/       # Controller logic (Auth, Interview)
│   │   ├── middlewares/       # Security validation and File upload layers
│   │   ├── models/            # Mongoose Schemas (User, Blacklist, Report)
│   │   ├── routes/            # Express Endpoint maps
│   │   ├── services/          # OpenAI completion and Puppeteer PDF generation
│   │   └── utils/             # Helper utilities (auth cookies)
│   ├── server.js              # Backend entry point
│   ├── .env                   # Configuration parameters
│   └── package.json           # Backend dependency configuration
│
├── Frontend/                  # Vite compilation of React SPA Client
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/          # Authentication services, contexts, guards, and pages
│   │   │   └── interview/     # Dashboard, Report pages, and interview hooks
│   │   ├── style/             # Generic SCSS styles
│   │   ├── App.jsx            # App startup provider container
│   │   ├── app.routes.jsx     # Client router maps (React Router 7)
│   │   └── main.jsx           # React app mount selector
│   ├── package.json           # Client dependency configuration
│   └── vite.config.js         # Vite configuration settings
```

---

## ✨ Features

- 🔐 **Secure Authentication**: Cookie-based JWT authentication with active token revocation/blacklisting on logout.
- 🧠 **AI-Powered Analysis**: Generates detailed candidate alignment, match scores, technical/behavioral questions, intentions, and model answers based on the job specification.
- 🗺️ **Personalized Roadmap**: Automatically drafts day-by-day technical preparation plans tailored to the candidate's skill gaps.
- 📄 **Dynamic Resume PDF**: Programmatically formats and prints clean resume HTML to PDF buffers via headless Puppeteer.
- ⚡ **Modern Design**: Implements sleek dark modes, timeline timelines, custom SCSS layout transitions, and fluid hover effects.

---

## 🛠️ Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** (Local Community Edition or Atlas Cloud Database URI)
- **OpenAI API Key** (or compatible provider endpoints)

---

## ⚙️ Environment Configuration

### **Backend Setup**
Create a `.env` file inside the `/Backend` directory and define the following variables:

```ini
PORT=3000
MONGO_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_signing_token
OPENAI_API_KEY=your_openai_api_credential
OPENAI_MODEL=gpt-4o-mini
```

*Note: The backend implements CORS authorization targeting `http://localhost:5173` (default React client dev port).*

---

## 🚀 Running the Project Locally

### **1. Spin up the API Backend**
```bash
cd Backend
npm install
npm run dev
```
The server will boot with `nodemon` and listen on: [http://localhost:3000](http://localhost:3000)

### **2. Launch the Client Frontend**
```bash
cd ../Frontend
npm install
npm run dev
```
The client compiles using Vite and serves on: [http://localhost:5173](http://localhost:5173)

---

## 📄 Core API Endpoint Documentation

### **Authentication**
| Endpoint | Method | Access | Payload / Headers | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | `{ username, email, password }` | Registers account and returns JWT cookie. |
| `/api/auth/login` | `POST` | Public | `{ email, password }` | Authenticates credentials and returns JWT cookie. |
| `/api/auth/logout` | `GET` | Public | JWT Cookie | Revokes current JWT token in DB blacklist. |
| `/api/auth/get-me` | `GET` | Private | JWT Cookie | Retrieves active session details. |

### **Interview & Analysis**
| Endpoint | Method | Access | Payload / Headers | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/interview/` | `POST` | Private | `multipart/form-data` containing `resume` (PDF file, optional), `jobDescription`, `selfDescription` | Generates a structured interview report via AI. |
| `/api/interview/` | `GET` | Private | JWT Cookie | Fetches recent interview plan summaries (metadata). |
| `/api/interview/report/:interviewId` | `GET` | Private | JWT Cookie | Fetches full report details by its ObjectId. |
| `/api/interview/resume/pdf/:interviewReportId`| `POST` | Private | JWT Cookie | Programmatically builds and streams dynamic resume PDF. |

---

## ⚠️ Important: Known Codebase Issues & Bugs

> [!WARNING]
> The current codebase contains a few critical bugs that will cause runtime crashes during normal operations. They are listed here for active reference before developer edits:

1.  **AI Service Client Crash**: In [ai.service.js](file:///Users/vishal/Desktop/MERN%20DEVLOPER/GP-GeniusPilot/Backend/src/services/ai.service.js#L52), the client attempts to use `openai.responses.create()` which is a non-existent API method on the OpenAI client, causing a `TypeError`. This needs to be refactored to standard `openai.chat.completions.create` or `openai.beta.chat.completions.parse`.
2.  **PDF-Parse Execution Error**: In [interview.controller.js](file:///Users/vishal/Desktop/MERN%20DEVLOPER/GP-GeniusPilot/Backend/src/controllers/interview.controller.js#L13), `new pdfParse.PDFParse(...)` throws a `TypeError: pdfParse.PDFParse is not a constructor`. The `pdf-parse` library should be invoked as a functional promise helper instead.
3.  **Missing Resume Bug**: If the user submits only a `selfDescription` (making the file upload optional), `req.file` remains `undefined`. The backend controller attempts to read `req.file.buffer`, throwing a `TypeError` and crashing the process.
4.  **Frontend Hook Crash on API Failure**: Functions inside [useInterview.js](file:///Users/vishal/Desktop/MERN%20DEVLOPER/GP-GeniusPilot/Frontend/src/features/interview/hooks/useInterview.js#L30) suppress errors but immediately return properties on a `null` variable (e.g. `response.interviewReport`), resulting in React app crashes on network errors.
5.  **Unconditional Redirect Loop**: Submit handlers inside the Login/Register page navigate to `/` unconditionally before API transactions settle. If authentications fail, the user is navigated to `/` and immediately pushed back to `/login` without visual feedback or errors.

---

## 💡 Recommended Improvements

- **Input Validation**: Integrate `zod` or `express-validator` middleware on the authentication and interview creation endpoints.
- **TTL Database Indexes**: Set an automatic `expireAfterSeconds` index on the `blacklistTokens` schema to auto-purge expired sessions.
- **Improved PDF Routing**: Transition the resume PDF creation endpoint from a `POST` request to `GET` for better REST API compliance.
- **State Error Messaging**: Propagate authentication and API network failures to user-visible toast notifications or form-level error prompts.
- **Interactive Checklists**: Enhance the Roadmap panel to allow checking off day-wise preparation tasks interactively.
