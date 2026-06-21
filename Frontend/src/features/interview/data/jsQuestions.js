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
    {
        id: 'js-4',
        question: 'What is the difference between Promise.all(), Promise.allSettled(), Promise.race(), and Promise.any()?',
        difficulty: 'Hard',
        intention: 'Tests knowledge of concurrent async patterns — critical for building robust APIs and handling parallel data fetching.',
        answer: `All four combinators accept an iterable of Promises but differ in how they resolve/reject:

Promise.all(promises)
  - Resolves when ALL promises resolve → returns array of results in order.
  - Short-circuits and rejects immediately if ANY promise rejects.
  - Use when all results are required (parallel API calls where any failure is fatal).

Promise.allSettled(promises)
  - Always resolves (never rejects) after ALL promises settle.
  - Returns array of {status: 'fulfilled'|'rejected', value|reason} objects.
  - Use when you want all results regardless of individual failures (fire-and-forget batch ops).

Promise.race(promises)
  - Settles as soon as the FIRST promise settles (resolves or rejects).
  - Use for timeouts: race a real request against a setTimeout-rejection.

Promise.any(promises)
  - Resolves when the FIRST promise RESOLVES; ignores rejections.
  - Rejects only if ALL promises reject → throws AggregateError.
  - Use for fallback patterns (try multiple CDNs, first success wins).

Memory tip: all=all-or-nothing, allSettled=wait for everyone, race=fastest wins, any=first success.`,
    },
    {
        id: 'js-5',
        question: 'Explain the "this" keyword in JavaScript. How does its value differ in regular functions vs arrow functions?',
        difficulty: 'Medium',
        intention: 'Evaluates understanding of execution context — a frequent source of bugs in callbacks and class methods.',
        answer: `"this" refers to the execution context — the object that is currently executing the function. Its value is determined at call-time, not at definition-time (except for arrow functions).

Rules for regular functions (dynamic "this"):
1. Global call: this === window (browser) or {} (Node strict mode) or global (Node sloppy)
2. Method call: obj.method() → this === obj
3. Constructor call: new Fn() → this === newly created object
4. Explicit binding: call/apply/bind → this === first argument

Arrow functions (lexical "this"):
  Arrow functions do NOT have their own "this". They inherit "this" from the enclosing lexical scope at definition-time. You cannot rebind them with call/apply/bind.

Practical consequence:
  class Timer {
    constructor() { this.count = 0; }
    start() {
      // Regular function — "this" is undefined in strict mode callbacks:
      setInterval(function() { this.count++; }, 1000); // ❌ breaks
      // Arrow function — "this" is captured from start():
      setInterval(() => { this.count++; }, 1000);      // ✅ works
    }
  }

Common pitfall: destructuring a method from an object loses "this" context. Fix: bind in constructor or use arrow class fields.`,
    },
    {
        id: 'js-6',
        question: 'What are the most useful JavaScript array methods? Explain map(), filter(), reduce(), and find() with examples.',
        difficulty: 'Easy',
        intention: 'Tests practical fluency with functional programming patterns that are used daily in React and modern JS codebases.',
        answer: `These are the core higher-order array methods every JS developer must know:

map(callback) — Transforms every element; returns a new array of the same length.
  [1, 2, 3].map(n => n * 2)  // [2, 4, 6]
  Use: converting API data shapes, rendering lists in React.

filter(callback) — Keeps only elements where callback returns true; returns a shorter (or same length) array.
  [1, 2, 3, 4].filter(n => n % 2 === 0)  // [2, 4]
  Use: search results, removing deleted items from state.

reduce(callback, initialValue) — Accumulates elements into a single value (can be a number, object, or array).
  [1, 2, 3].reduce((acc, n) => acc + n, 0)  // 6
  Use: summing totals, grouping by key, flattening arrays.

find(callback) — Returns the FIRST element where callback is true; returns undefined if none found.
  [{id:1}, {id:2}].find(x => x.id === 2)  // {id:2}
  Use: looking up an item by id in a local array.

Bonus — findIndex(), some(), every():
  findIndex → like find but returns the index.
  some → true if at least one element passes.
  every → true if all elements pass.

Key rule: map/filter/reduce/find do NOT mutate the original array — they always return a new one.`,
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
