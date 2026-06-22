/**
 * Node.js Interview Questions Bank
 * ─────────────────────────────────────
 * 20 curated Node.js interview questions covering core concepts,
 * streams, the event loop, Express, security, and performance.
 */

export const NODE_QUESTIONS = [
    {
        id: 'node-1',
        question: 'What is Node.js and what makes it different from traditional server-side environments?',
        difficulty: 'Easy',
        intention: 'Tests foundational understanding of Node\'s architecture — interviewers want to confirm you understand it\'s not multi-threaded.',
        answer: `Node.js is a JavaScript runtime built on Chrome's V8 engine that allows JavaScript to run on the server side.

Key characteristics:

1. Single-threaded event loop — unlike Apache/PHP which spawn a new thread per request, Node uses a single thread. This avoids thread context-switching overhead.

2. Non-blocking I/O — I/O operations (file reads, network calls, DB queries) are delegated to the OS or libuv thread pool. While waiting, Node handles other requests.

3. Event-driven — Node registers callbacks for I/O completion and processes them when they fire.

4. V8 engine — the same high-performance JS engine used in Chrome, with JIT compilation.

5. libuv — the C library that provides the event loop, thread pool (for file system ops), and OS-level async I/O.

Advantages:
  - Excellent for I/O-bound workloads (REST APIs, real-time apps, microservices).
  - Same language (JavaScript) on front and back end.
  - Massive npm ecosystem.

Disadvantages:
  - Single-threaded: CPU-bound tasks (image processing, complex calculations) block the event loop. Use worker_threads or child_process for these.
  - Callback/async complexity (mitigated by async/await).
  - Not ideal for CPU-intensive applications.`,
    },
    {
        id: 'node-2',
        question: 'Explain the Node.js event loop in detail. What are the different phases?',
        difficulty: 'Hard',
        intention: 'Tests deep understanding of Node\'s async execution model — a differentiating question for senior roles.',
        answer: `The Node.js event loop is implemented by libuv. It has multiple phases, each with its own FIFO queue of callbacks.

Phases (in order):
  1. timers — Executes callbacks from setTimeout() and setInterval() whose thresholds have elapsed.

  2. pending callbacks — Handles I/O errors deferred from the previous iteration.

  3. idle, prepare — Internal libuv use only.

  4. poll — Retrieves new I/O events; executes I/O callbacks. Blocks here if the queue is empty (waiting for I/O).

  5. check — Executes setImmediate() callbacks. Always runs after the poll phase.

  6. close callbacks — Handles close events (e.g., socket.on('close', ...)).

Priority queue (runs between EVERY phase transition):
  - process.nextTick() — highest priority. Runs before any I/O, even before the next event loop phase.
  - Promise microtasks (.then, async/await) — runs after nextTick queue is drained.

Execution order example:
  setImmediate(() => console.log('setImmediate'));
  setTimeout(() => console.log('setTimeout'), 0);
  Promise.resolve().then(() => console.log('Promise'));
  process.nextTick(() => console.log('nextTick'));

  Output: nextTick → Promise → setTimeout (or setImmediate — order varies outside I/O) → setImmediate

Key rule: nextTick > Promises > setTimeout ≈ setImmediate (when not in I/O) > I/O callbacks.`,
    },
    {
        id: 'node-3',
        question: 'What are Node.js Streams? Explain the four types and when to use streams.',
        difficulty: 'Hard',
        intention: 'Tests advanced knowledge of memory-efficient I/O — streams are essential for handling large files or real-time data.',
        answer: `Streams are abstract interfaces for working with data sequentially and in chunks, rather than loading everything into memory at once.

The four stream types:

1. Readable — source of data (read from):
   fs.createReadStream('file.txt')
   http.IncomingMessage (request object)

2. Writable — destination of data (write to):
   fs.createWriteStream('out.txt')
   http.ServerResponse (response object)

3. Duplex — both readable and writable:
   net.Socket (TCP socket)
   WebSocket connections

4. Transform — duplex that transforms data as it passes through:
   zlib.createGzip() (compresses data)
   crypto.createCipheriv() (encrypts data)

Using streams with pipe:
  // Read a file, compress it, write it — no entire file in memory:
  fs.createReadStream('large.csv')
    .pipe(zlib.createGzip())
    .pipe(fs.createWriteStream('large.csv.gz'));

Events: Streams emit: 'data', 'end', 'error', 'finish', 'drain'.

Why streams:
  - Memory efficiency: Process 10GB files with ~100MB RAM.
  - Time efficiency: Start processing the first chunk while the rest downloads.
  - Composability: pipe chains are elegant and reusable.

Modern: Node 10+ streams support async iteration:
  for await (const chunk of readableStream) {
    process(chunk);
  }`,
    },
    {
        id: 'node-4',
        question: 'What is the difference between process.nextTick() and setImmediate()?',
        difficulty: 'Medium',
        intention: 'Tests precision knowledge of Node\'s async scheduling — a classic Node interview question.',
        answer: `Both schedule callbacks asynchronously, but they fire at different points in the event loop.

process.nextTick(callback):
  - Fires IMMEDIATELY after the current operation completes, BEFORE any I/O events or timers.
  - It is NOT part of the event loop phases — it drains its entire queue after every C++ → JS boundary crossing.
  - Has the HIGHEST priority among async callbacks.
  - Risk: Recursive nextTick() calls can starve I/O (callbacks never reach the poll phase).

setImmediate(callback):
  - Fires in the CHECK phase of the event loop, AFTER the poll phase (I/O callbacks).
  - Designed to execute "immediately after" I/O — guaranteed to run before any timers in I/O callbacks.

Example:
  const fs = require('fs');
  fs.readFile('file', () => {
    setTimeout(() => console.log('timeout'), 0);
    setImmediate(() => console.log('immediate'));
    process.nextTick(() => console.log('nextTick'));
  });
  // Always: nextTick → immediate → timeout
  // (Inside I/O callback, setImmediate always beats setTimeout)

When to use each:
  - process.nextTick: Emit events or call callbacks after the current function returns but before any I/O — e.g., in constructors that emit events.
  - setImmediate: Break up long CPU work; defer I/O-following code; generally safer than nextTick.

Node.js docs actually recommend preferring setImmediate for most use cases due to the starvation risk of nextTick.`,
    },
    {
        id: 'node-5',
        question: 'What is the cluster module in Node.js and how does it solve the single-thread limitation?',
        difficulty: 'Hard',
        intention: 'Tests knowledge of Node scalability patterns — important for production systems.',
        answer: `Node.js runs on a single thread, so it can only utilize ONE CPU core by default. The cluster module allows you to create child processes (workers) that share the same server port, enabling multi-core utilization.

  const cluster = require('cluster');
  const http = require('http');
  const os = require('os');

  if (cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    console.log(\`Primary \${process.pid} running\`);

    // Fork one worker per CPU core:
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker) => {
      console.log(\`Worker \${worker.process.pid} died — restarting\`);
      cluster.fork(); // auto-restart crashed workers
    });

  } else {
    // Workers share the TCP connection:
    http.createServer((req, res) => {
      res.end(\`Worker \${process.pid}\`);
    }).listen(3000);
    console.log(\`Worker \${process.pid} started\`);
  }

How load balancing works:
  - Linux (default): Round-robin by the primary process.
  - Windows: The OS decides which worker gets a connection.

Alternatives:
  - PM2 cluster mode: pm2 start app.js -i max — wraps cluster automatically.
  - worker_threads: Share memory for CPU-bound tasks (image processing, crypto).

Cluster vs worker_threads:
  - cluster: Multiple processes, no shared memory, for handling concurrent requests.
  - worker_threads: Multiple threads, shared ArrayBuffer, for CPU-bound computation.`,
    },
    {
        id: 'node-6',
        question: 'What is middleware in Express.js? Explain the request-response cycle.',
        difficulty: 'Easy',
        intention: 'Tests Express fundamentals — middleware is the core building block of every Express application.',
        answer: `Middleware functions are functions that have access to the request object (req), the response object (res), and the next() function in the application's request-response cycle.

Middleware signature: (req, res, next) => void

What middleware can do:
  - Execute any code.
  - Modify req and res objects.
  - End the request-response cycle (send a response).
  - Call next() to pass control to the next middleware.

Types of middleware:
  1. Application-level: app.use() or app.METHOD()
  2. Router-level: router.use()
  3. Error-handling: (err, req, res, next) — 4 parameters
  4. Built-in: express.json(), express.static()
  5. Third-party: morgan (logging), cors, helmet, multer

Request lifecycle:
  Request → app.use(cors()) → app.use(express.json()) → app.use(authMiddleware) → Route handler → Response

Example:
  // Logger middleware:
  app.use((req, res, next) => {
    console.log(\`\${req.method} \${req.url} \${Date.now()}\`);
    next(); // MUST call next() or the request hangs
  });

  // Error handler (must have 4 params):
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

Order matters: Middleware executes in the order it's registered. Put authentication before route handlers, error handlers last.`,
    },
    {
        id: 'node-7',
        question: 'How do you handle errors in Express.js? What is the difference between synchronous and asynchronous error handling?',
        difficulty: 'Medium',
        intention: 'Tests production-readiness — unhandled errors crash Node processes and leak information to clients.',
        answer: `Express has distinct patterns for sync vs async errors, and getting this wrong leaves unhandled rejections that crash your server.

Synchronous errors:
  If a sync error is thrown inside a route handler, Express automatically catches it and passes it to the error middleware:
  app.get('/route', (req, res) => {
    throw new Error('Something broke'); // ✅ Express catches this
  });

Asynchronous errors (classic callback/Promise):
  Express does NOT automatically catch async errors. You must pass them to next():
  app.get('/route', async (req, res, next) => {
    try {
      const data = await fetchData();
      res.json(data);
    } catch (err) {
      next(err); // ✅ Pass to error middleware
    }
  });

Express 5 (currently in beta): automatically catches rejected promises from route handlers — no try/catch needed.

Wrapper helper (for Express 4):
  const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  app.get('/route', asyncHandler(async (req, res) => {
    const data = await fetchData();
    res.json(data);
  }));

Error middleware (must be last, 4 params):
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
      error: process.env.NODE_ENV === 'production' ? 'Error' : err.message
    });
  });

Process-level safety:
  process.on('unhandledRejection', (reason) => { /* log and gracefully shutdown */ });
  process.on('uncaughtException', (err) => { /* log, then exit(1) */ });`,
    },
    {
        id: 'node-8',
        question: 'What is the difference between require() and ES Modules (import/export) in Node.js?',
        difficulty: 'Medium',
        intention: 'Tests awareness of Node\'s module system evolution — the CommonJS vs ESM transition is a common source of confusion.',
        answer: `Node.js originally used CommonJS (CJS). ES Modules (ESM) are the official JavaScript standard, added to Node in v12 (stable in v14+).

CommonJS (require):
  const fs = require('fs');                    // import
  module.exports = { myFunc };                 // export
  exports.myFunc = myFunc;                     // named export shorthand

  Characteristics:
  - Synchronous — require() blocks until the module is loaded.
  - Dynamic — can require() inside conditionals or functions.
  - .js files are CJS by default.

ES Modules (import/export):
  import fs from 'fs';                         // import
  export const myFunc = () => {};              // named export
  export default MyClass;                      // default export

  Characteristics:
  - Asynchronous — modules are fetched and parsed concurrently.
  - Static — import statements must be at the top level (enables tree-shaking).
  - Requires .mjs extension OR "type": "module" in package.json.
  - Use import() for dynamic imports.

Interop rules:
  - ESM can import CJS: import pkg from 'cjs-package'
  - CJS cannot require() ESM natively (must use dynamic import())

Key differences:
  Feature          | CJS              | ESM
  ─────────────────|──────────────────|──────────────────
  __dirname        | ✅ available      | ❌ use import.meta.url
  __filename       | ✅ available      | ❌ use import.meta.url
  Top-level await  | ❌               | ✅
  Tree-shaking     | ❌               | ✅
  Circular deps    | partial support  | handled better

Modern recommendation: Use ESM for new projects. Set "type": "module" in package.json.`,
    },
    {
        id: 'node-9',
        question: 'What is JWT (JSON Web Token) authentication? How do you implement it in Node.js?',
        difficulty: 'Medium',
        intention: 'Tests real-world auth implementation knowledge — JWT is used in virtually every modern Node.js API.',
        answer: `JWT is a compact, self-contained token format for securely transmitting information between parties as a JSON object, signed with a secret or RSA key.

Structure: header.payload.signature (three Base64URL-encoded parts)
  - Header: { "alg": "HS256", "typ": "JWT" }
  - Payload: { "userId": "123", "role": "admin", "iat": 1234, "exp": 1234+3600 }
  - Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)

Implementation with jsonwebtoken:

  // Generate token on login:
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  res.json({ token });

  // Verify middleware:
  function authenticate(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.split(' ')[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  // Protected route:
  app.get('/api/profile', authenticate, (req, res) => {
    res.json({ userId: req.user.userId });
  });

Security best practices:
  - Use short expiry (15m) + refresh tokens (7d, stored in httpOnly cookie).
  - Never store tokens in localStorage (XSS vulnerability).
  - Use RS256 (asymmetric) for distributed systems.
  - Add jti (JWT ID) claim for token revocation.
  - Validate all claims: exp, iat, iss, aud.`,
    },
    {
        id: 'node-10',
        question: 'What is event-driven programming in Node.js? How do you use the EventEmitter class?',
        difficulty: 'Medium',
        intention: 'Tests understanding of Node\'s core pattern — EventEmitter is used throughout Node.js (streams, HTTP, child processes).',
        answer: `Event-driven programming means application flow is determined by events (user actions, I/O completions, messages). Node.js is built around this model.

The EventEmitter class is the backbone:
  const { EventEmitter } = require('events');

  class OrderService extends EventEmitter {
    placeOrder(order) {
      // Process order...
      this.emit('order:placed', order);    // fire event with data
      this.emit('notification', { type: 'email', to: order.email });
    }
  }

  const orderService = new OrderService();

  // Register listeners:
  orderService.on('order:placed', (order) => {
    console.log('Order received:', order.id);
  });

  orderService.once('notification', (msg) => {
    // Fires only once, then auto-removes
    sendEmail(msg);
  });

  orderService.placeOrder({ id: '001', email: 'user@example.com' });

Key methods:
  - .on(event, listener): Register persistent listener.
  - .once(event, listener): Register one-time listener.
  - .emit(event, ...args): Fire an event.
  - .off(event, listener): Remove a listener.
  - .removeAllListeners(event): Remove all listeners for an event.

Important: EventEmitter has a default max of 10 listeners per event. Exceed this and Node warns of a possible memory leak. Increase with emitter.setMaxListeners(n).

Error events: Always handle the 'error' event — an unhandled 'error' event throws and crashes the process:
  emitter.on('error', (err) => { console.error('Handled:', err); });`,
    },
    {
        id: 'node-11',
        question: 'What is the Buffer class in Node.js? Why is it needed?',
        difficulty: 'Medium',
        intention: 'Tests understanding of binary data handling — Buffers are essential for file I/O, network protocols, and cryptography.',
        answer: `The Buffer class is a global in Node.js used to work with binary data directly. It represents a fixed-size chunk of memory allocated outside the V8 heap.

Why Buffers exist:
  JavaScript strings are UTF-16 encoded in memory. When reading files, network packets, or cryptographic data, you need raw bytes, not strings. Buffer fills this gap.

Creating Buffers:
  // Allocate a zero-filled buffer (safe):
  const buf = Buffer.alloc(10);

  // From a string:
  const buf2 = Buffer.from('Hello, world!', 'utf8');

  // From array of bytes:
  const buf3 = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);

Converting:
  buf2.toString('utf8');   // 'Hello, world!'
  buf2.toString('hex');    // '48656c6c6f2c...'
  buf2.toString('base64'); // 'SGVsbG8sIHdvcmxkIQ=='

Common use cases:
  1. File I/O: fs.readFile returns a Buffer by default.
  2. Network: TCP and HTTP raw data arrives as Buffers.
  3. Cryptography: crypto module works with Buffers for hashing and encryption.
  4. Image processing: sharp, jimp receive/return Buffers.

Buffer vs Uint8Array:
  Buffer is a subclass of Uint8Array, so it inherits all typed array methods and is interoperable with Web APIs (fetch, FileReader) that use Uint8Array.

Security: Never use Buffer.allocUnsafe() with user data — it may contain sensitive memory from previous allocations. Use Buffer.alloc() for safe, zero-initialized buffers.`,
    },
    {
        id: 'node-12',
        question: 'How do you prevent common security vulnerabilities in a Node.js/Express application?',
        difficulty: 'Hard',
        intention: 'Tests production security awareness — a critical topic for any backend role.',
        answer: `Security in Node.js/Express requires multiple layers. Key vulnerabilities and mitigations:

1. SQL/NoSQL Injection:
  - Parameterize all queries (never concatenate user input).
  - Use Mongoose schema validation to reject unexpected fields.
  - Sanitize input with express-mongo-sanitize.

2. XSS (Cross-Site Scripting):
  - Set Content-Security-Policy headers via helmet.
  - Sanitize HTML output with DOMPurify or xss libraries.
  - Never reflect raw user input into HTML responses.

3. CSRF (Cross-Site Request Forgery):
  - Use csurf middleware for form-based endpoints.
  - Use SameSite=Strict cookies.
  - For REST APIs: rely on Authorization header (not cookies) — immune to CSRF.

4. Rate Limiting:
  - express-rate-limit to prevent brute-force attacks.
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

5. Helmet (HTTP Security Headers):
  app.use(helmet()); // sets X-Frame-Options, HSTS, XSS-Protection, etc.

6. Sensitive data exposure:
  - Never log passwords, tokens, or PII.
  - Use HTTPS everywhere (TLS).
  - Rotate secrets; use environment variables (never hardcode).
  - Hash passwords with bcrypt (cost factor 12+), never store plaintext.

7. Dependency vulnerabilities:
  - Regularly run: npm audit
  - Keep dependencies updated.
  - Use Snyk or Dependabot for automated scanning.

8. Prototype pollution:
  - Avoid using user-controlled keys to set object properties directly.
  - Use Object.create(null) for dictionaries.

9. ReDoS (Regular Expression Denial of Service):
  - Avoid catastrophically backtracking regexes with user input.
  - Use safe-regex to audit patterns.`,
    },
    {
        id: 'node-13',
        question: 'What is CORS and how do you configure it in a Node.js/Express application?',
        difficulty: 'Easy',
        intention: 'Tests practical knowledge of cross-origin requests — every web API developer encounters CORS configuration.',
        answer: `CORS (Cross-Origin Resource Sharing) is a browser security mechanism that restricts web pages from making requests to a different domain than the one that served the page.

The browser sends an Origin header with cross-origin requests. The server must respond with appropriate Access-Control-* headers, or the browser blocks the response.

Preflight requests: For non-simple requests (PUT, DELETE, custom headers, JSON body), the browser first sends an OPTIONS request. The server must respond with permission headers.

Configuring CORS in Express:

Simple setup with the cors package:
  const cors = require('cors');
  app.use(cors()); // Allow ALL origins — fine for public APIs

Production setup with restrictions:
  const allowedOrigins = ['https://myapp.com', 'https://www.myapp.com'];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,         // Allow cookies / Authorization headers
    maxAge: 86400,             // Cache preflight for 24 hours
  }));

  // Preflight for ALL routes:
  app.options('*', cors());

credentials: true requires the client to send: fetch(url, { credentials: 'include' }) and the Access-Control-Allow-Origin must be a specific origin (not *).`,
    },
    {
        id: 'node-14',
        question: 'What is the difference between authentication and authorization in Node.js?',
        difficulty: 'Easy',
        intention: 'Tests that candidates understand the fundamental distinction — confusing the two is a major security design mistake.',
        answer: `Authentication and authorization are related but distinct security concepts.

Authentication — "Who are you?"
  Verifies the identity of a user. Confirms that you are who you claim to be.
  - Login with username + password (then issue JWT or session cookie).
  - OAuth (Sign in with Google).
  - API keys.

Authorization — "What are you allowed to do?"
  Determines what an authenticated user is permitted to access or perform.
  - Role-based: "Admin can delete users; viewers can only read."
  - Resource-based: "User can only edit their OWN posts."

Implementation in Express:

  // Authentication middleware:
  function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthenticated' });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  }

  // Authorization middleware (role-based):
  function authorize(...roles) {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    };
  }

  // Usage:
  app.delete('/api/users/:id', authenticate, authorize('admin'), deleteUser);

HTTP status codes:
  - 401 Unauthorized: Not authenticated (needs to log in).
  - 403 Forbidden: Authenticated but not authorized (lacks permission).

Common libraries: Passport.js (auth strategies), CASL (fine-grained authorization).`,
    },
    {
        id: 'node-15',
        question: 'What is connection pooling in Node.js databases and why is it important?',
        difficulty: 'Medium',
        intention: 'Tests database efficiency knowledge — naive database usage creates connection overhead that kills performance.',
        answer: `A database connection is an expensive resource: it involves a TCP handshake, authentication, and memory allocation on the DB server. Creating a new connection for every request is wasteful.

Connection pooling maintains a set of pre-established connections that can be reused across multiple requests.

How it works:
  - On startup: Pool creates a min number of connections.
  - On request: A free connection is leased from the pool.
  - After use: The connection is returned to the pool (not closed).
  - If all connections are busy: Requests queue up until one is available.
  - If the pool grows to max size: New requests wait or receive an error.

MongoDB with Mongoose:
  // Mongoose manages a pool internally — configure with options:
  mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 10,      // default: 5
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
  });
  // Create connection ONCE at startup, reuse throughout.

PostgreSQL with pg (node-postgres):
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,                   // max connections
    idleTimeoutMillis: 30000,  // close idle connections after 30s
    connectionTimeoutMillis: 2000,
  });

  // In route handler:
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows;
  } finally {
    client.release(); // ALWAYS release back to pool
  }

Common mistakes:
  - Creating a new connection per request → exhausts DB connections.
  - Not releasing connections → pool exhaustion.
  - Pool too small → request queuing under load.`,
    },
    {
        id: 'node-16',
        question: 'What are environment variables and how do you manage them securely in Node.js?',
        difficulty: 'Easy',
        intention: 'Tests production readiness basics — hardcoded secrets are one of the most common and dangerous security mistakes.',
        answer: `Environment variables are key-value pairs set in the runtime environment, outside the application code. They are used to configure the application without hardcoding sensitive or environment-specific values.

Accessing env vars:
  process.env.DATABASE_URL
  process.env.JWT_SECRET
  process.env.NODE_ENV // 'development' | 'production' | 'test'

Local development with .env and dotenv:
  // .env file (NEVER commit to git):
  DATABASE_URL=mongodb://localhost:27017/mydb
  JWT_SECRET=supersecretkey123
  PORT=5000

  // Load at app entry point:
  require('dotenv').config(); // or: import 'dotenv/config';
  // Now process.env.DATABASE_URL is available.

Security best practices:
  1. Add .env to .gitignore — NEVER commit secrets to source control.
  2. Create a .env.example with placeholder values — commit this as documentation.
  3. Use different .env files per environment (.env.production, .env.test).
  4. In production, use secrets managers:
     - AWS Secrets Manager / Parameter Store
     - HashiCorp Vault
     - GCP Secret Manager
     - Vercel / Railway environment variable UI

Validation — fail fast if required variables are missing:
  const required = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
  for (const key of required) {
    if (!process.env[key]) throw new Error(\`Missing env var: \${key}\`);
  }

Libraries: envalid — validates and documents environment variables with type checking.`,
    },
    {
        id: 'node-17',
        question: 'What is rate limiting and how do you implement it in Express.js?',
        difficulty: 'Medium',
        intention: 'Tests API hardening knowledge — rate limiting is essential to prevent abuse, brute force attacks, and DoS.',
        answer: `Rate limiting restricts how many requests a client can make to an API within a time window. Without it, a single client can exhaust server resources or brute-force credentials.

Using express-rate-limit:
  const rateLimit = require('express-rate-limit');

  // Global limiter — apply to all routes:
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                  // 100 requests per window
    standardHeaders: true,     // Return RateLimit-* headers
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use(globalLimiter);

  // Strict limiter for auth endpoints:
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Only 10 login attempts per 15 minutes
    skipSuccessfulRequests: true, // Don't count successful logins
  });
  app.post('/api/auth/login', authLimiter, loginHandler);

Strategies:
  - Fixed window: Count requests in fixed time windows (simple, burst-prone).
  - Sliding window: Smoother counting over the last N seconds.
  - Token bucket: Allow bursts up to a bucket size, refill at a rate.

Distributed rate limiting (multiple servers):
  express-rate-limit with rate-limit-redis uses Redis as a shared store:
  const RedisStore = require('rate-limit-redis');
  rateLimit({ store: new RedisStore({ client: redisClient }) });

Response headers sent to clients:
  RateLimit-Limit: 100
  RateLimit-Remaining: 93
  RateLimit-Reset: 1234567890`,
    },
    {
        id: 'node-18',
        question: 'What is caching in Node.js? Explain different caching strategies.',
        difficulty: 'Hard',
        intention: 'Tests performance optimization knowledge — caching is one of the highest-impact optimizations in backend development.',
        answer: `Caching stores the result of expensive operations so subsequent requests can reuse the stored result instead of recomputing.

Levels of caching:

1. In-memory (process-level):
  const cache = new Map();
  app.get('/api/products', async (req, res) => {
    if (cache.has('products')) return res.json(cache.get('products'));
    const products = await db.find();
    cache.set('products', products);
    setTimeout(() => cache.delete('products'), 60_000); // TTL: 1 min
    res.json(products);
  });
  ✅ Fastest. ❌ Lost on restart, not shared across processes.

2. Redis (distributed cache):
  const redis = require('ioredis');
  const client = new redis(process.env.REDIS_URL);

  app.get('/api/product/:id', async (req, res) => {
    const key = \`product:\${req.params.id}\`;
    const cached = await client.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const product = await db.findById(req.params.id);
    await client.set(key, JSON.stringify(product), 'EX', 300); // 5 min TTL
    res.json(product);
  });
  ✅ Shared across servers. ✅ Survives restarts. Slightly slower than in-memory.

Caching strategies:
  - Cache-aside (lazy loading): Check cache first, fetch from DB on miss, populate cache.
  - Write-through: Write to cache AND DB simultaneously (always fresh).
  - Write-behind: Write to cache, DB updated asynchronously (risk of data loss).
  - Read-through: Cache layer sits in front of DB (transparent).

Cache invalidation (hard problem):
  - TTL (Time To Live): Simple, may serve stale data.
  - Event-based: Invalidate on data mutation (CRUD events).
  - Versioned keys: product:v2:123 — change version on update.

HTTP caching: Also set Cache-Control, ETag, and Last-Modified headers for client-side caching.`,
    },
    {
        id: 'node-19',
        question: 'How does Node.js handle file uploads? What are best practices for managing uploaded files?',
        difficulty: 'Medium',
        intention: 'Tests real-world feature implementation knowledge — file uploads are in virtually every production application.',
        answer: `Node.js/Express doesn't parse multipart/form-data (file uploads) out of the box. You need a middleware like multer.

Basic multer setup:
  const multer = require('multer');

  // Store on disk:
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only images allowed'));
    },
  });

  app.post('/api/avatar', upload.single('avatar'), async (req, res) => {
    // req.file = { filename, path, size, mimetype, ... }
    res.json({ url: \`/uploads/\${req.file.filename}\` });
  });

Production best practices:

  1. Upload to cloud storage (S3, GCS, Cloudinary) — never serve files from Node:
     const upload = multer({ storage: multer.memoryStorage() }); // buffer in RAM
     // Then stream to S3 using @aws-sdk/client-s3

  2. Validate file type by MAGIC BYTES, not just MIME type (clients can lie):
     Use file-type package to inspect actual bytes.

  3. Scan for malware with ClamAV integration.

  4. Limit file size and count — prevent DoS via huge uploads.

  5. Serve files via CDN, not directly from the Node server.

  6. Generate random, unguessable filenames — never use the original filename (path traversal).`,
    },
    {
        id: 'node-20',
        question: 'What is the worker_threads module and how does it differ from the cluster module?',
        difficulty: 'Hard',
        intention: 'Tests advanced Node.js concurrency knowledge — essential for CPU-bound workloads.',
        answer: `Node.js is single-threaded by default. Both worker_threads and cluster allow multi-core utilization, but they solve different problems.

worker_threads (since Node 10.5, stable in Node 12):
  - Creates OS threads within the SAME process.
  - Threads share memory via SharedArrayBuffer and Atomics.
  - Designed for CPU-intensive tasks: image processing, cryptography, machine learning inference, JSON parsing of huge payloads.
  - No overhead of separate processes or IPC serialization for shared memory.

  const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

  if (isMainThread) {
    const worker = new Worker(__filename, { workerData: { num: 40 } });
    worker.on('message', result => console.log('Fibonacci:', result));
  } else {
    // This runs in the worker thread:
    function fib(n) { return n <= 1 ? n : fib(n-1) + fib(n-2); }
    parentPort.postMessage(fib(workerData.num));
  }

cluster module:
  - Creates separate OS processes (each with its own V8 instance and event loop).
  - No shared memory — communicate via IPC (message passing with JSON serialization).
  - Designed for scaling I/O-bound HTTP servers across CPU cores.
  - Workers share the server port.

Comparison:
  Feature               | cluster           | worker_threads
  ──────────────────────|───────────────────|──────────────────
  Goal                  | Scale I/O servers | CPU-bound tasks
  Memory sharing        | No (separate)     | Yes (SharedArrayBuffer)
  Communication         | IPC (JSON)        | postMessage + SharedMemory
  Crash isolation       | Yes               | No (crashes parent)
  Overhead              | Higher            | Lower

When to use which:
  - Serving HTTP traffic across CPUs → cluster (or PM2).
  - CPU-intensive computation in background → worker_threads.`,
    },
]
