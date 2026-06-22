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
    {
        id: 'js-7',
        question: 'What is prototypal inheritance in JavaScript and how does it differ from classical inheritance?',
        difficulty: 'Hard',
        intention: 'Tests understanding of JavaScript\'s core object model — important for senior roles and understanding how ES6 classes really work under the hood.',
        answer: `Classical inheritance (Java, C++) uses blueprints (classes) to create objects. A class defines the structure, and instances are copies of that blueprint.

Prototypal inheritance uses existing objects as prototypes. Every JavaScript object has a hidden [[Prototype]] link (accessible via Object.getPrototypeOf() or __proto__). When you access a property, JS walks the prototype chain until it finds the property or reaches null.

Example:
  const animal = { breathe() { return 'breathing'; } };
  const dog = Object.create(animal); // dog's prototype is animal
  dog.bark = () => 'woof';
  dog.breathe(); // found on prototype chain → 'breathing'

ES6 class syntax is syntactic sugar over prototypal inheritance:
  class Animal { breathe() { return 'breathing'; } }
  class Dog extends Animal { bark() { return 'woof'; } }
  // Dog.prototype.__proto__ === Animal.prototype

Key differences:
  - Classical: copy-based, tight coupling between class and instance.
  - Prototypal: delegation-based, objects link to other objects.
  - JS classes don't copy methods — instances delegate to the prototype, saving memory.

Interview tip: "class" in JS doesn't create a traditional class — it's prototype delegation with nicer syntax.`,
    },
    {
        id: 'js-8',
        question: 'What is the difference between == and === in JavaScript? When would you ever use ==?',
        difficulty: 'Easy',
        intention: 'Tests awareness of type coercion — a common source of bugs for developers coming from typed languages.',
        answer: `=== (strict equality) — Compares value AND type. No type coercion occurs.
  1 === '1'   // false (number vs string)
  null === undefined  // false

== (abstract/loose equality) — Compares value after type coercion following the Abstract Equality Comparison algorithm.
  1 == '1'    // true ('1' is coerced to 1)
  null == undefined  // true (special rule)
  0 == false  // true (false coerced to 0)
  '' == false // true

The coercion rules are complex and unintuitive, which is why == is almost always avoided in modern code (ESLint's eqeqeq rule enforces ===).

The ONE common legitimate use of ==:
  if (value == null) { ... }
  // This catches BOTH null AND undefined in a single check.
  // Equivalent to: value === null || value === undefined

Summary: Always use ===. The only accepted exception is the null/undefined check pattern with ==.`,
    },
    {
        id: 'js-9',
        question: 'What are async/await and how do they relate to Promises? What is the difference between sequential and parallel async execution?',
        difficulty: 'Medium',
        intention: 'Evaluates ability to write clean async code and understand performance implications of sequential vs parallel execution.',
        answer: `async/await is syntactic sugar over Promises, introduced in ES2017. An async function always returns a Promise. await pauses execution inside the async function until the Promise resolves.

  async function fetchUser(id) {
    const res = await fetch(\`/api/users/\${id}\`);
    return res.json(); // returns a Promise automatically
  }

Sequential execution (waterfall):
  const a = await fetchA(); // waits for A to finish
  const b = await fetchB(); // then waits for B
  // Total time = time(A) + time(B)

Parallel execution (concurrent):
  const [a, b] = await Promise.all([fetchA(), fetchB()]);
  // Both start simultaneously
  // Total time = max(time(A), time(B))

Error handling: Use try/catch inside async functions, just like synchronous code.
  try {
    const data = await fetchUser(1);
  } catch (err) {
    console.error('Failed:', err);
  }

Common mistake: Using await inside forEach — it doesn't wait. Use for...of or Promise.all with map instead.`,
    },
    {
        id: 'js-10',
        question: 'What is debouncing and throttling? Provide use cases for each.',
        difficulty: 'Medium',
        intention: 'Tests performance awareness — essential for handling rapid user input events like scroll, resize, and search without hammering APIs or causing jank.',
        answer: `Both techniques limit how often a function executes in response to rapid events, but in different ways:

Debouncing — delays execution until a pause in events.
  The timer resets every time the event fires. The function only runs after the events stop for a specified wait period.

  function debounce(fn, wait) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  Use case: Search autocomplete — wait until the user stops typing before making an API call.
  Use case: Window resize handler — recalculate layout only after resizing stops.

Throttling — limits execution to once per time window.
  No matter how many events fire, the function runs at most once every N milliseconds.

  Use case: Scroll event handler — update UI at most every 100ms while scrolling.
  Use case: Button click guard — prevent double-submitting a form.
  Use case: Real-time game input — cap player movement updates to 60 FPS.

Key difference:
  Debounce = "wait until quiet" (trailing edge).
  Throttle = "execute regularly, no more than once per interval".

Libraries like Lodash provide _.debounce and _.throttle with additional options.`,
    },
    {
        id: 'js-11',
        question: 'What is the difference between deep copy and shallow copy in JavaScript? How do you create each?',
        difficulty: 'Medium',
        intention: 'Tests understanding of reference vs value semantics — a common source of state mutation bugs in React.',
        answer: `Shallow Copy — copies only the top-level properties. Nested objects/arrays are still shared by reference.

  const original = { a: 1, nested: { b: 2 } };

  // Shallow copy methods:
  const copy1 = { ...original };          // spread
  const copy2 = Object.assign({}, original);

  copy1.a = 99;         // ✅ doesn't affect original.a
  copy1.nested.b = 99;  // ❌ mutates original.nested.b too!

Deep Copy — recursively copies all nested objects, creating fully independent copies.

  // Modern: structuredClone (built-in, available in Node 17+ and modern browsers)
  const deepCopy = structuredClone(original);

  // Legacy: JSON round-trip (works for plain data, loses functions/undefined/Date)
  const deepCopy2 = JSON.parse(JSON.stringify(original));

  // Libraries: _.cloneDeep from Lodash (handles edge cases)

When to use which:
  - Shallow: updating flat state, creating modified versions of simple objects.
  - Deep: cloning complex nested state, avoiding mutation bugs.
  - In React: always prefer immutable updates (spread or immer) rather than mutating state directly.`,
    },
    {
        id: 'js-12',
        question: 'What is hoisting in JavaScript? How does it affect var, let, const, and function declarations?',
        difficulty: 'Medium',
        intention: 'Tests understanding of how the JS engine processes code before execution — key for debugging "used before defined" bugs.',
        answer: `Hoisting is JavaScript's behavior of moving declarations to the top of their scope during the compilation phase, before code executes.

Function declarations — fully hoisted (both declaration and body):
  greet(); // ✅ works!
  function greet() { console.log('hello'); }

var — declaration is hoisted and initialized to undefined:
  console.log(x); // undefined (not an error)
  var x = 5;
  console.log(x); // 5

let and const — declaration is hoisted but NOT initialized. They are in the "Temporal Dead Zone" (TDZ) from the start of the block until the declaration line:
  console.log(y); // ❌ ReferenceError: Cannot access 'y' before initialization
  let y = 10;

Function expressions and arrow functions behave like their variable:
  fn(); // ❌ TypeError: fn is not a function (var) or ReferenceError (let/const)
  var fn = () => {};

Practical advice:
  - Declare variables at the top of their scope to avoid TDZ confusion.
  - Prefer const/let over var to get predictable TDZ errors instead of silent undefined bugs.
  - Use named function declarations for utility functions that need to be called anywhere in the file.`,
    },
    {
        id: 'js-13',
        question: 'What are JavaScript generators and iterators? Where would you use them?',
        difficulty: 'Hard',
        intention: 'Tests advanced JS knowledge — generators are used in Redux-Saga, async iteration, and custom lazy sequences.',
        answer: `An iterator is an object with a next() method that returns { value, done } pairs.

A generator function (function*) automatically creates an iterator. It can pause execution with the yield keyword and resume where it left off.

  function* counter(start = 0) {
    while (true) {
      yield start++;
    }
  }
  const gen = counter(1);
  gen.next(); // { value: 1, done: false }
  gen.next(); // { value: 2, done: false }

Generators are lazy — they compute values on demand, not all at once. This makes them perfect for:

1. Infinite sequences (IDs, pagination, streaming data).
2. Custom iterables — make any object work with for...of loops.
3. Async flow control — redux-saga uses generators to write async code that looks synchronous.
4. Pipeline / coroutines — pause and receive values with yield.

Async generators (async function*):
  async function* streamLines(url) {
    const response = await fetch(url);
    for await (const line of response.body) {
      yield line;
    }
  }

Interview tip: Generators are rarely used directly in application code, but they demonstrate deep language knowledge and appear in many popular libraries.`,
    },
    {
        id: 'js-14',
        question: 'What is the Temporal Dead Zone (TDZ) and why does it exist?',
        difficulty: 'Hard',
        intention: 'Tests deep understanding of the let/const specification — separates candidates who have read the spec from those who just use the language.',
        answer: `The Temporal Dead Zone (TDZ) is the period between the start of a block scope and the point where a let or const variable is declared and initialized. Accessing the variable during this window throws a ReferenceError.

  {
    // TDZ starts for 'x'
    console.log(x); // ❌ ReferenceError
    let x = 5;      // TDZ ends — x is initialized
    console.log(x); // ✅ 5
  }

Why does TDZ exist?
  The spec designers deliberately chose this behavior to catch programming errors. With var, accessing a variable before its declaration silently returns undefined — a frequent source of subtle bugs. The TDZ makes the error loud and immediate.

TDZ also applies to:
  - const (same rules as let)
  - Class declarations (classes are not hoisted like function declarations)
  - Default parameter values that reference earlier parameters

  // Default param TDZ:
  function f(a = b, b = 1) {} // ❌ b is in TDZ when a's default is evaluated
  function f(a = 1, b = a) {} // ✅ a is already initialized

Key takeaway: TDZ is a safety mechanism — it prevents you from relying on uninitialized variables, which var silently allowed.`,
    },
    {
        id: 'js-15',
        question: 'What are WeakMap and WeakSet? How do they differ from Map and Set?',
        difficulty: 'Hard',
        intention: 'Tests knowledge of memory management and reference handling — relevant when building caches, private data stores, or avoiding memory leaks.',
        answer: `Map and Set hold strong references to their keys/values, preventing garbage collection even if no other reference exists.

WeakMap and WeakSet hold weak references — they allow their keys (objects only) to be garbage collected if no other strong reference exists.

WeakMap:
  - Keys must be objects (not primitives).
  - Not enumerable — no .size, no .forEach, no iteration.
  - Entries are automatically removed when the key object is GC'd.

WeakSet:
  - Values must be objects.
  - Same non-enumerable, auto-cleanup behavior.

Practical use cases:
  1. Private data per object instance:
     const _private = new WeakMap();
     class Person {
       constructor(name) { _private.set(this, { name }); }
       getName() { return _private.get(this).name; }
     }
     // When the Person instance is GC'd, the private data is too.

  2. Memoization cache keyed on DOM nodes:
     const cache = new WeakMap();
     // When a node is removed from the DOM and GC'd, its cache entry disappears automatically.

  3. Tracking "seen" objects without preventing GC:
     const seen = new WeakSet();

Key rule: Use WeakMap/WeakSet when you want auxiliary data tied to an object's lifetime. Use Map/Set when you need to enumerate or check size.`,
    },
    {
        id: 'js-16',
        question: 'Explain the concept of memoization in JavaScript. How would you implement it?',
        difficulty: 'Medium',
        intention: 'Tests optimization thinking and closure knowledge — important for performance-critical code and understanding React.memo / useMemo.',
        answer: `Memoization is a caching technique where a function stores the result of expensive computations and returns the cached result when the same inputs are provided again.

Basic implementation using a closure + Map:
  function memoize(fn) {
    const cache = new Map();
    return function(...args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key); // cache hit
      }
      const result = fn.apply(this, args);
      cache.set(key, result);
      return result;
    };
  }

  const expensiveSquare = memoize((n) => {
    console.log('computing...');
    return n * n;
  });

  expensiveSquare(5); // computing... → 25
  expensiveSquare(5); // (cached)    → 25

When to use memoization:
  - Pure functions (same input → same output, no side effects).
  - Expensive computations (recursive Fibonacci, complex transforms).
  - React: useMemo() for computed values, useCallback() for functions, React.memo() for components.

Caveats:
  - JSON.stringify is not a perfect key (fails on circular refs, functions, Maps).
  - Unlimited cache size can cause memory leaks — add LRU eviction for production use.
  - Only appropriate for pure functions.`,
    },
    {
        id: 'js-17',
        question: 'What is the difference between call(), apply(), and bind() in JavaScript?',
        difficulty: 'Medium',
        intention: 'Tests mastery of function context manipulation — useful for understanding how libraries and frameworks control "this".',
        answer: `All three explicitly set the "this" context of a function, but differ in how they pass arguments and when the function executes.

call(thisArg, arg1, arg2, ...) — invokes the function immediately with a specific "this" and individual arguments.
  function greet(greeting, punctuation) {
    return \`\${greeting}, \${this.name}\${punctuation}\`;
  }
  greet.call({ name: 'Alice' }, 'Hello', '!'); // "Hello, Alice!"

apply(thisArg, [argsArray]) — same as call but takes arguments as an array.
  greet.apply({ name: 'Bob' }, ['Hi', '.']); // "Hi, Bob."
  // Useful when arguments are already in an array:
  Math.max.apply(null, [1, 5, 3]); // 5 (now use spread: Math.max(...arr))

bind(thisArg, arg1, ...) — returns a NEW function with "this" permanently bound. Does NOT invoke immediately.
  const greetAlice = greet.bind({ name: 'Alice' }, 'Hey');
  greetAlice('?'); // "Hey, Alice?"
  // The first argument is pre-filled (partial application).

Memory trick:
  call  → comma-separated args, immediate
  apply → array args, immediate
  bind  → returns bound function, deferred

Real-world use: React class components use bind in the constructor to fix "this" in event handlers. Arrow class fields replace this pattern in modern code.`,
    },
    {
        id: 'js-18',
        question: 'What is the Proxy object in JavaScript? What are some practical use cases?',
        difficulty: 'Hard',
        intention: 'Tests knowledge of meta-programming — Proxy powers Vue 3\'s reactivity system and many validation/ORM libraries.',
        answer: `A Proxy wraps an object and intercepts fundamental operations (property reads, writes, function calls, etc.) via "traps" defined in a handler object. This enables meta-programming.

  const handler = {
    get(target, key) {
      console.log(\`Reading: \${key}\`);
      return key in target ? target[key] : 'default';
    },
    set(target, key, value) {
      if (typeof value !== 'number') throw new TypeError('Must be a number');
      target[key] = value;
      return true; // must return true on success
    }
  };

  const obj = new Proxy({}, handler);
  obj.x = 42;       // ✅
  obj.y = 'hello';  // ❌ TypeError

Practical use cases:
  1. Reactivity systems — Vue 3's entire reactivity is built on Proxy. Reading a prop triggers dependency tracking; writing triggers re-renders.
  2. Validation / schemas — intercept sets to enforce type rules.
  3. Default values — return fallback for undefined keys (as above).
  4. Logging / debugging — trace every property access in an object.
  5. Immutable objects — trap set/deleteProperty to throw in "frozen" mode.
  6. API mocking — intercept fetch calls in tests.

Reflect API: Use Reflect.get/set/has inside traps to delegate to default behavior cleanly, avoiding infinite loops.`,
    },
]

/**
 * All available topic categories for the sidebar navigation.
 * Add new categories here when you have questions for them.
 */
import { REACT_QUESTIONS } from './reactQuestions'
import { NODE_QUESTIONS } from './nodeQuestions'

export const QUESTION_CATEGORIES = [
    {
        id: 'javascript',
        label: 'JavaScript',
        questions: JS_QUESTIONS,
        icon: 'JS',
        color: '#f7df1e',
    },
    {
        id: 'react',
        label: 'React',
        questions: REACT_QUESTIONS,
        icon: '⚛',
        color: '#61dafb',
    },
    {
        id: 'nodejs',
        label: 'Node.js',
        questions: NODE_QUESTIONS,
        icon: 'N',
        color: '#3fb950',
    },
    // Future categories — uncomment and populate when ready:
    // { id: 'dsa', label: 'DSA', questions: [], icon: '∑', color: '#a78bfa' },
]
