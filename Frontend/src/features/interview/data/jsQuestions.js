/**
 * JavaScript Interview Questions Bank
 * ─────────────────────────────────────
 * To add more questions, simply append to the JS_QUESTIONS array below.
 * Fields:
 *   id          - unique string id
 *   question    - the question text shown on the card
 *   difficulty  - 'Easy' | 'Medium' | 'Hard'
 *   intention   - why interviewers ask this question
 *   answer      - detailed model answer
 */

export const JS_QUESTIONS = [
    {
        id: 'js-1',
        question: 'What is the difference between var, let, and const in JavaScript? In what scenarios would you use each?',
        difficulty: 'Easy',
        intention: 'Tests understanding of variable scoping, hoisting, and immutability in modern JavaScript.',
        answer: `var is function-scoped (or globally scoped if declared outside a function), hoisted to the top of its scope, and can be re-declared and re-assigned. It is largely considered legacy and should be avoided in modern code.

let is block-scoped, not re-declarable in the same scope, but re-assignable. It is the default choice for variables that need to change (loop counters, state flags, etc.).

const is also block-scoped but cannot be re-assigned after declaration. It does NOT mean the value is deeply immutable — an object or array declared with const can still have its properties mutated. Use const for everything that should not be re-assigned: references, fixed configs, imported modules, etc.

Rule of thumb: default to const, use let when you know the binding will change, and never use var.`,
    },
    {
        id: 'js-2',
        question: 'Explain how the JavaScript event loop works. Can you provide an example to illustrate your explanation?',
        difficulty: 'Medium',
        intention: 'Evaluates understanding of JavaScript\'s concurrency model, call stack, and asynchronous behavior — essential for debugging async bugs.',
        answer: `JavaScript is single-threaded. The event loop is what allows it to perform non-blocking I/O by offloading operations to the browser/Node APIs and then queuing callbacks.

Key components:
1. Call Stack — where synchronous code executes (LIFO).
2. Web APIs / Node APIs — handle async tasks (setTimeout, fetch, fs.readFile, etc.).
3. Callback Queue (Macrotask Queue) — completed async callbacks wait here.
4. Microtask Queue — higher-priority queue for Promises (.then) and queueMicrotask(). Microtasks are fully drained before the next macrotask runs.

Event loop order: Execute current call stack → drain microtask queue → pick one macrotask → repeat.

Example:
  console.log('1');
  setTimeout(() => console.log('2'), 0);
  Promise.resolve().then(() => console.log('3'));
  console.log('4');

Output: 1 → 4 → 3 → 2
'1' and '4' are synchronous. The Promise microtask ('3') runs before the setTimeout macrotask ('2'), even though both have no delay.`,
    },
    {
        id: 'js-3',
        question: 'What are closures in JavaScript? Can you give a practical example of how closures can be used?',
        difficulty: 'Medium',
        intention: 'Tests deep understanding of lexical scoping and memory — a foundational concept used in React hooks, currying, memoization, and module patterns.',
        answer: `A closure is a function that retains access to its outer (lexical) scope even after that outer function has returned. In other words, the inner function "closes over" the variables from its surrounding environment.

How it works: When a function is defined, it captures a reference to its enclosing scope. That scope is kept alive in memory as long as the closure exists.

Practical example — counter factory:
  function createCounter() {
    let count = 0;           // private variable
    return {
      increment: () => ++count,
      decrement: () => --count,
      value:     () => count,
    };
  }
  const counter = createCounter();
  counter.increment(); // 1
  counter.increment(); // 2
  counter.value();     // 2

Here, count is private — it cannot be accessed directly from outside createCounter, yet the returned methods can still read and modify it. This is the module pattern.

Other real-world uses: React's useState hook uses closures to capture state snapshots, memoization (caching) functions close over a cache Map, and event handlers in loops capture loop variables via closures.`,
    },
]

/**
 * All available topic categories for the sidebar navigation.
 * Add new categories here when you have questions for them.
 */
export const QUESTION_CATEGORIES = [
    {
        id: 'javascript',
        label: 'JavaScript',
        questions: JS_QUESTIONS,
        icon: 'JS',
        color: '#f7df1e',
    },
    // Future categories — uncomment and populate when ready:
    // { id: 'react', label: 'React', questions: [], icon: '⚛', color: '#61dafb' },
    // { id: 'nodejs', label: 'Node.js', questions: [], icon: 'N', color: '#3fb950' },
    // { id: 'dsa', label: 'DSA', questions: [], icon: '∑', color: '#a78bfa' },
]
