/**
 * React Interview Questions Bank
 * ─────────────────────────────────────
 * 20 curated React interview questions covering hooks, lifecycle,
 * performance, and advanced patterns.
 */

export const REACT_QUESTIONS = [
    {
        id: 'react-1',
        question: 'What is the Virtual DOM and how does React use it to improve performance?',
        difficulty: 'Easy',
        intention: 'Tests foundational understanding of React\'s core rendering mechanism — usually the first React question in any interview.',
        answer: `The Virtual DOM (VDOM) is a lightweight in-memory representation of the real DOM. Instead of updating the real DOM directly (which is slow), React:

1. Maintains a VDOM tree that mirrors the real DOM.
2. On state/prop change, renders a NEW VDOM tree.
3. Diffs the new tree against the previous one (reconciliation/diffing algorithm).
4. Computes the minimal set of real DOM mutations required.
5. Applies those mutations in a batch (committing to the real DOM).

Why is this faster?
  - DOM operations are expensive (layout reflows, repaints).
  - JavaScript object manipulation (the VDOM diff) is orders of magnitude faster.
  - Batching minimizes the number of expensive real DOM touches.

React 18 introduces Concurrent Rendering — React can now pause, interrupt, and resume rendering work, prioritizing urgent updates (user input) over background updates (data fetching).

React Fiber (introduced in React 16) is the reconciliation engine that makes this possible by breaking render work into small units that can be scheduled.`,
    },
    {
        id: 'react-2',
        question: 'Explain the difference between useState and useReducer. When should you use one over the other?',
        difficulty: 'Medium',
        intention: 'Evaluates ability to choose the right state management primitive — a common design decision in real codebases.',
        answer: `Both useState and useReducer manage local component state, but they suit different complexity levels.

useState:
  const [count, setCount] = useState(0);
  setCount(prev => prev + 1);
  - Best for simple, independent state values.
  - Ideal for toggles, form inputs, counters, loading flags.

useReducer:
  const [state, dispatch] = useReducer(reducer, initialState);
  dispatch({ type: 'INCREMENT', payload: 1 });
  - Best when state logic is complex or state transitions depend on each other.
  - The reducer is a pure function: (state, action) => newState.

When to use useReducer over useState:
  1. Multiple sub-values that are updated together (form with many fields).
  2. Next state depends on the previous in non-trivial ways.
  3. You want to co-locate state transition logic (easier to test the reducer in isolation).
  4. You need to pass dispatch (not the state itself) deeply — dispatch is stable across renders, unlike a setter callback.

Rule of thumb:
  - 1-2 related values → useState
  - 3+ related values with complex transitions → useReducer
  - Global complex state → useReducer + Context or Zustand/Redux`,
    },
    {
        id: 'react-3',
        question: 'What is the useEffect hook? Explain the dependency array and the cleanup function.',
        difficulty: 'Medium',
        intention: 'Tests understanding of side-effect management — one of the most misused hooks and a top source of bugs and memory leaks.',
        answer: `useEffect lets you synchronize a component with an external system (API, DOM, subscription, timer).

Syntax:
  useEffect(() => {
    // 1. Side effect runs here
    const subscription = subscribe(id);

    // 2. Cleanup (optional) — runs before next effect and on unmount
    return () => subscription.unsubscribe();
  }, [id]); // 3. Dependency array

Dependency array rules:
  - [] (empty): Effect runs ONCE after mount. Cleanup runs on unmount.
  - [a, b]: Effect runs after mount AND whenever a or b change.
  - (omitted): Effect runs after EVERY render — almost always a mistake.

Common mistakes:
  1. Missing dependencies → stale closure bug (reads old values).
  2. Object/array dependencies → infinite loop (new reference every render). Fix: useMemo or move the value inside the effect.
  3. No cleanup for subscriptions/timers → memory leaks.

React 18 Strict Mode: Effects run twice in development to help find missing cleanups. This is intentional.

Mental model: useEffect is NOT a lifecycle hook. It is a synchronization tool. Ask: "What external thing needs to stay in sync with this state?"`,
    },
    {
        id: 'react-4',
        question: 'What is the difference between useMemo and useCallback? When should you use them?',
        difficulty: 'Medium',
        intention: 'Tests performance optimization knowledge — memoization hooks are often misapplied, and interviewers want to see nuanced judgment.',
        answer: `Both are memoization hooks that prevent unnecessary recalculations, but they memoize different things.

useMemo — memoizes a computed VALUE:
  const sortedList = useMemo(
    () => [...list].sort((a, b) => a.name.localeCompare(b.name)),
    [list]
  );
  // sortedList is only recomputed when 'list' changes.

useCallback — memoizes a FUNCTION reference:
  const handleClick = useCallback(() => {
    doSomething(id);
  }, [id]);
  // handleClick is the same reference between renders (unless id changes).

When to use them:
  - useMemo: Expensive calculations (sorting, filtering large arrays, complex transforms).
  - useCallback: Passing callbacks to memoized child components (React.memo) or as useEffect dependencies.

IMPORTANT — Don't overuse:
  Memoization has a cost (memory + comparison). Don't wrap every value/function.
  Only memoize when:
    1. The computation is measurably expensive (profile first!).
    2. The referential equality matters (prevents re-renders of React.memo children).

Common mistake: Using useCallback/useMemo everywhere "just in case" — this is premature optimization and actually adds overhead for cheap operations.`,
    },
    {
        id: 'react-5',
        question: 'What is React Context API? What are its limitations and when should you use Redux instead?',
        difficulty: 'Medium',
        intention: 'Tests understanding of state sharing patterns — candidates should know when Context is appropriate and when a dedicated state manager is better.',
        answer: `The Context API lets you share values (state, functions) across the component tree without prop-drilling.

  const ThemeContext = React.createContext('light');

  // Provider wraps the tree:
  <ThemeContext.Provider value={theme}>
    <App />
  </ThemeContext.Provider>

  // Consumers anywhere in the tree:
  const theme = useContext(ThemeContext);

Best use cases for Context:
  - Global UI state: theme, locale, current user, feature flags.
  - Values that change infrequently.
  - Avoiding prop-drilling 3+ levels deep.

Limitations of Context:
  1. Performance: Every consumer re-renders when the context VALUE changes, even if the consumer only uses a slice of it. There is no built-in selector optimization.
  2. No dev tools: No time-travel debugging, no action history.
  3. No async middleware: No built-in way to handle async actions.
  4. Not suitable for high-frequency updates (e.g., mouse position, real-time data).

When to use Redux (or Zustand/Jotai):
  - Large, complex shared state with many consumers.
  - Frequent state updates needing performance (selector-based subscriptions).
  - Need for middleware (logging, async thunks).
  - DevTools and time-travel debugging are important.

Rule: Context for low-frequency global state, dedicated store for high-frequency or complex state.`,
    },
    {
        id: 'react-6',
        question: 'What are React keys? Why are they important and what are the rules for using them correctly?',
        difficulty: 'Easy',
        intention: 'Tests understanding of the reconciliation algorithm — incorrect key usage is a very common source of subtle bugs.',
        answer: `Keys help React identify which items in a list have changed, been added, or removed during reconciliation. They must be unique among siblings.

  {items.map(item => (
    <ItemCard key={item.id} item={item} />
  ))}

Why keys matter:
  Without keys (or with index as key), React uses position to track elements. If you insert an item at the beginning of the list, React re-renders ALL items and reassigns state/DOM to wrong elements.

  With stable keys (like database IDs), React can:
  - Move DOM nodes instead of re-creating them (fast).
  - Preserve component state for surviving elements.
  - Correctly unmount removed elements.

Rules:
  ✅ Use stable, unique IDs (database id, uuid).
  ✅ Keys only need to be unique among siblings, not globally.
  ❌ Never use Math.random() — generates new keys on every render, destroying and recreating every DOM node.
  ❌ Avoid array index as key when the list can be reordered, filtered, or items added/removed from anywhere but the end.

When index IS acceptable:
  - List is static (never reordered or filtered).
  - Items have no component state.
  - Items are not added to the front or middle.

Key as reset trick: Changing a key forces React to unmount and remount a component — useful for resetting form state.`,
    },
    {
        id: 'react-7',
        question: 'What are controlled vs uncontrolled components in React?',
        difficulty: 'Easy',
        intention: 'Tests form handling knowledge — every React developer deals with forms, and understanding this distinction prevents bugs.',
        answer: `The distinction refers to who owns the form element's current value.

Controlled Component — React state is the "single source of truth":
  const [value, setValue] = useState('');
  <input value={value} onChange={e => setValue(e.target.value)} />

  - React controls the displayed value at all times.
  - Every keystroke triggers onChange → setState → re-render.
  - Gives full control: validation, formatting, conditional logic on every change.

Uncontrolled Component — the DOM owns the value; React reads it on demand:
  const inputRef = useRef();
  <input ref={inputRef} defaultValue="initial" />
  // Read value: inputRef.current.value (e.g., on form submit)

  - Less React overhead per keystroke.
  - Easier integration with non-React code.
  - Less control for real-time validation.

Controlled is the default recommendation for React forms because:
  - It makes validation straightforward.
  - You can programmatically set/clear values.
  - State is always in sync with the UI.

Libraries like React Hook Form use uncontrolled components internally for maximum performance, then validate on blur/submit rather than per-keystroke.`,
    },
    {
        id: 'react-8',
        question: 'What is React.memo and when should you use it?',
        difficulty: 'Medium',
        intention: 'Tests performance optimization awareness — understanding when to memoize components prevents unnecessary re-renders.',
        answer: `React.memo is a Higher-Order Component (HOC) that wraps a component and memoizes its rendered output. It only re-renders if its props change (by shallow comparison).

  const ExpensiveList = React.memo(function ExpensiveList({ items }) {
    return items.map(i => <Item key={i.id} {...i} />);
  });

  // Parent re-renders → ExpensiveList only re-renders if 'items' reference changed.

When to use React.memo:
  ✅ The component renders often (parent re-renders frequently).
  ✅ The component's output is expensive to compute.
  ✅ Props are mostly primitive values or stable references.

When NOT to use it:
  ❌ Components that almost always receive new props (memoization check adds overhead).
  ❌ Very cheap, simple components.
  ❌ When you haven't measured a performance problem (premature optimization).

Custom comparison:
  React.memo(Component, (prevProps, nextProps) => {
    // Return true to SKIP re-render (props are "equal")
    return prevProps.id === nextProps.id;
  });

React.memo only does a SHALLOW comparison. For array/object props, the reference must be the same. This is why useCallback is paired with React.memo — to give memoized components stable callback references.`,
    },
    {
        id: 'react-9',
        question: 'What are React custom hooks? Create a useFetch hook as an example.',
        difficulty: 'Medium',
        intention: 'Tests ability to extract reusable logic — custom hooks are a core React pattern for DRY, testable component logic.',
        answer: `Custom hooks are JavaScript functions whose name starts with "use" and that call built-in React hooks. They let you extract and share stateful logic between components without changing the component hierarchy.

Rules: Custom hooks must follow the Rules of Hooks — call hooks only at the top level, only inside functions starting with "use".

Example — useFetch:
  function useFetch(url) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);

      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
          return res.json();
        })
        .then(json => { if (!cancelled) { setData(json); setLoading(false); } })
        .catch(err => { if (!cancelled) { setError(err); setLoading(false); } });

      return () => { cancelled = true; }; // cleanup — prevents state update on unmount
    }, [url]);

    return { data, loading, error };
  }

  // Usage:
  const { data: users, loading, error } = useFetch('/api/users');

Benefits of custom hooks:
  - Separation of concerns (logic out of UI).
  - Reusable across components.
  - Independently testable.
  - Named hooks appear in React DevTools.`,
    },
    {
        id: 'react-10',
        question: 'What is the useRef hook? Describe all the ways it can be used.',
        difficulty: 'Medium',
        intention: 'Tests understanding of refs beyond just DOM access — useRef\'s mutable container is a powerful pattern many developers miss.',
        answer: `useRef returns a mutable object { current: initialValue } that persists across renders without causing re-renders when mutated.

Use 1 — DOM Access:
  const inputRef = useRef(null);
  <input ref={inputRef} />
  // Access: inputRef.current.focus()
  // Use: managing focus, triggering animations, integrating 3rd-party libs.

Use 2 — Storing mutable values that should NOT trigger re-renders:
  const renderCount = useRef(0);
  useEffect(() => { renderCount.current++; }); // track renders without re-render loop

Use 3 — Preserving previous values:
  function usePrevious(value) {
    const ref = useRef();
    useEffect(() => { ref.current = value; });
    return ref.current; // returns last render's value
  }

Use 4 — Storing stable references (avoid stale closures):
  const callbackRef = useRef(onSuccess);
  useEffect(() => { callbackRef.current = onSuccess; });
  // Then use callbackRef.current() inside a setInterval — always calls the latest version.

Use 5 — Cancellation flags:
  const cancelled = useRef(false);
  useEffect(() => { return () => { cancelled.current = true; }; }, []);

Key distinction from useState:
  - setState triggers a re-render; ref.current mutation does NOT.
  - Use state for UI-visible data; use ref for "instance variable" data.`,
    },
    {
        id: 'react-11',
        question: 'What is React\'s Strict Mode and what does it do in development?',
        difficulty: 'Easy',
        intention: 'Tests awareness of development-time safety checks — many developers don\'t understand why their effects run twice.',
        answer: `React.StrictMode is a development-only wrapper component that enables additional checks and warnings to help identify potential problems.

  <React.StrictMode>
    <App />
  </React.StrictMode>

What Strict Mode does (development only — no effect in production):

1. Double-invokes render functions, component bodies, and state initializers — to detect side effects in render logic.

2. Double-invokes effects (mount → cleanup → mount again) — to help you find effects that don't properly clean up. This is why you see console.logs twice in dev!

3. Detects deprecated APIs — warns about findDOMNode, legacy context, string refs, etc.

4. Warns about missing keys in lists.

Why double-invoking is helpful:
  If your effect doesn't properly clean up after itself, running it twice exposes the bug. This ensures your app works correctly when React's concurrent features unmount and remount components.

Common confusion: Developers seeing double console.logs or double API calls in development think there's a bug. It's Strict Mode — this is intentional and does NOT happen in production.

React 18 Strict Mode also simulates unmounting and remounting components in development to future-proof your code for features like offscreen rendering.`,
    },
    {
        id: 'react-12',
        question: 'What is prop drilling and how do you solve it?',
        difficulty: 'Easy',
        intention: 'Tests understanding of component communication patterns — interviewers want to hear multiple solutions with trade-offs.',
        answer: `Prop drilling is passing props through intermediate components that don't need the data themselves, just to get it to a deeply nested child.

  <App user={user}>
    <Layout user={user}>        {/* Layout doesn't use user */}
      <Sidebar user={user}>    {/* Sidebar doesn't use user */}
        <Avatar user={user} /> {/* Only Avatar needs user */}

Solutions:

1. Context API — Best for global, low-frequency data (theme, auth user, locale):
   const UserContext = createContext();
   // Wrap tree with Provider, consume with useContext anywhere.

2. Component Composition — Pass the already-rendered component as a prop:
   <Layout sidebar={<Avatar user={user} />} />
   // Layout renders props.sidebar — never touches user.

3. State Management Libraries — Zustand, Redux, Jotai:
   Any component subscribes directly to the store. No intermediate passing.

4. Custom hooks — Encapsulate the context consumption:
   const { user } = useAuth(); // called directly in Avatar, no drilling.

When is drilling OK?
  - 1-2 levels deep — prop drilling is fine and explicit.
  - Over 3 levels deep → consider alternatives.

Best practice: prefer composition and custom hooks first; reach for Context or a store only when needed.`,
    },
    {
        id: 'react-13',
        question: 'What are Error Boundaries in React? How do you implement one?',
        difficulty: 'Hard',
        intention: 'Tests knowledge of production-grade error handling — critical for building resilient applications.',
        answer: `Error Boundaries are React components that catch JavaScript errors anywhere in their child component tree, log the error, and display a fallback UI instead of crashing the whole app.

They catch errors during: rendering, lifecycle methods, and constructors of child components.
They do NOT catch: errors in event handlers, async code, SSR, or errors in the boundary itself.

Implementation (must be a class component — no hook equivalent yet):
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      // Update state to show fallback UI on next render
      return { hasError: true, error };
    }

    componentDidCatch(error, info) {
      // Log to error tracking service (Sentry, Datadog)
      logErrorToService(error, info.componentStack);
    }

    render() {
      if (this.state.hasError) {
        return this.props.fallback || <h2>Something went wrong.</h2>;
      }
      return this.props.children;
    }
  }

Usage:
  <ErrorBoundary fallback={<ErrorPage />}>
    <Dashboard />
  </ErrorBoundary>

Libraries: react-error-boundary (npm) provides a functional wrapper with useErrorBoundary hook and reset functionality.

Best practice: Place error boundaries at route level AND around individual high-risk widgets.`,
    },
    {
        id: 'react-14',
        question: 'What is code splitting and lazy loading in React? How do you implement them?',
        difficulty: 'Medium',
        intention: 'Tests performance optimization for large applications — interviewers expect knowledge of bundle size reduction techniques.',
        answer: `Code splitting divides your JavaScript bundle into smaller chunks that are loaded on demand, reducing the initial bundle size and improving Time-to-Interactive.

React.lazy + Suspense (built-in):
  // Instead of static import:
  // import Dashboard from './Dashboard';

  // Dynamic import — Dashboard is in its own chunk:
  const Dashboard = React.lazy(() => import('./Dashboard'));

  function App() {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Dashboard />
      </Suspense>
    );
  }

How it works:
  - React.lazy creates a lazy component that loads its module on first render.
  - Suspense shows the fallback while the chunk is being fetched.
  - Vite/webpack automatically creates a separate chunk for the lazy import.

Route-based code splitting (recommended):
  const Home    = lazy(() => import('./pages/Home'));
  const Profile = lazy(() => import('./pages/Profile'));

  <Routes>
    <Route path="/" element={<Suspense fallback={<Spinner />}><Home /></Suspense>} />
    <Route path="/profile" element={<Suspense fallback={<Spinner />}><Profile /></Suspense>} />
  </Routes>

Other techniques:
  - Named exports: lazy(() => import('./utils').then(m => ({ default: m.MyComponent })))
  - Preloading: Trigger import() on hover before the user clicks.
  - Next.js dynamic(): next/dynamic wraps lazy + SSR options.`,
    },
    {
        id: 'react-15',
        question: 'Explain React\'s reconciliation algorithm. What are its heuristics and assumptions?',
        difficulty: 'Hard',
        intention: 'Tests deep React internals knowledge — expected for senior/lead roles where you need to reason about performance.',
        answer: `Reconciliation is the algorithm React uses to diff the previous VDOM tree against the new one and compute minimal DOM mutations.

The problem: A general tree diff algorithm is O(n³). React uses heuristics to achieve O(n).

Two core assumptions:

1. Elements of different types produce different trees.
   If a <div> changes to a <span>, React tears down the entire subtree and rebuilds it from scratch. Don't swap root element types unnecessarily.

2. The developer provides stable keys for list items.
   Without keys, React diffs by position. With keys, React can match elements by identity across renders.

Diffing rules:
  - Same type, same position: React updates only the changed props.
  - Different type or key changes: Full unmount + remount of that subtree.
  - Lists: Uses keys to match nodes; elements without keys are matched positionally.

React Fiber (since React 16):
  - Breaks render work into units (fibers) that can be paused/resumed.
  - Allows priority-based scheduling (urgent vs deferred updates).
  - Powers concurrent features (useTransition, useDeferredValue, Suspense).

Practical implications:
  - Stable keys = fast list updates.
  - Avoid conditional rendering that changes root element type.
  - Use React.memo to skip reconciliation for unchanged subtrees.
  - useTransition marks state updates as non-urgent, keeping UI responsive.`,
    },
    {
        id: 'react-16',
        question: 'What are React portals and when would you use them?',
        difficulty: 'Hard',
        intention: 'Tests knowledge of advanced rendering patterns — portals solve real-world problems with modals, tooltips, and z-index.',
        answer: `Portals render a component's output into a different DOM node than its parent — outside the component's DOM hierarchy, but still inside React's component tree.

  import { createPortal } from 'react-dom';

  function Modal({ children, isOpen }) {
    if (!isOpen) return null;
    return createPortal(
      <div className="modal-overlay">
        <div className="modal-content">{children}</div>
      </div>,
      document.getElementById('modal-root') // different DOM node
    );
  }

Why portals exist — The z-index / overflow problem:
  If a modal is rendered inside a parent with overflow: hidden or a lower z-index stacking context, it will be clipped or hidden regardless of its own z-index. Portals escape this constraint by rendering directly into <body> or a top-level DOM node.

Key behavior:
  - The portal is in the REAL DOM elsewhere, but still inside the React component tree.
  - Events bubble up through the React tree (not the DOM tree) — so onClick in the portal fires in the React parent.
  - Context is still accessible across portal boundaries.

Common use cases:
  1. Modals / dialogs
  2. Tooltips and popovers that need to overflow their container
  3. Floating menus
  4. Notifications/toasts

HTML setup: Add <div id="modal-root"></div> to index.html alongside <div id="root"></div>.`,
    },
    {
        id: 'react-17',
        question: 'What is the useLayoutEffect hook and how does it differ from useEffect?',
        difficulty: 'Hard',
        intention: 'Tests precise knowledge of the rendering pipeline — knowing this prevents visual flicker bugs.',
        answer: `useLayoutEffect has the same signature as useEffect but fires synchronously AFTER DOM mutations and BEFORE the browser paints.

Timeline comparison:
  useEffect:       Render → Commit (DOM update) → Paint → Effect fires
  useLayoutEffect: Render → Commit (DOM update) → Effect fires → Paint

Because useLayoutEffect runs before paint, you can read layout measurements and synchronously update the DOM without causing a visual flicker.

When to use useLayoutEffect:
  ✅ Reading DOM measurements (getBoundingClientRect, offsetHeight) immediately after render.
  ✅ Synchronously updating DOM based on measurements (positioning a tooltip, adjusting scroll).
  ✅ Preventing flash of incorrect styles.

  useLayoutEffect(() => {
    const rect = ref.current.getBoundingClientRect();
    if (rect.bottom > window.innerHeight) {
      ref.current.style.top = '-100px'; // fix position before paint
    }
  }, [isOpen]);

When NOT to use useLayoutEffect:
  ❌ For most effects — use useEffect (runs async, doesn't block paint).
  ❌ In SSR — useLayoutEffect generates a warning during server rendering (use useEffect there).

Rule: Start with useEffect. Only switch to useLayoutEffect if you see a visual flicker caused by the DOM being in the wrong state for a frame.`,
    },
    {
        id: 'react-18',
        question: 'What are Higher-Order Components (HOCs)? How do they compare to custom hooks?',
        difficulty: 'Medium',
        intention: 'Tests knowledge of cross-cutting concerns and reuse patterns — HOCs are still present in many codebases (react-redux connect, withRouter).',
        answer: `A Higher-Order Component is a function that takes a component and returns a new enhanced component. It's a pattern (not a React API) for reusing component logic.

  function withAuth(WrappedComponent) {
    return function AuthGuard(props) {
      const { user } = useAuth();
      if (!user) return <Redirect to="/login" />;
      return <WrappedComponent {...props} user={user} />;
    };
  }

  const ProtectedDashboard = withAuth(Dashboard);

HOC use cases:
  - Authentication guards
  - Logging / analytics wrapping
  - Adding loading states
  - Injecting props (react-redux's connect)

Drawbacks of HOCs:
  1. Wrapper hell — multiple HOCs create deeply nested component trees.
  2. Name collisions — injected props can clash with component's own props.
  3. Hard to trace in DevTools — HOC wrapper names obscure the real component.
  4. Ref forwarding needed — HOCs don't pass refs automatically (use forwardRef).

Custom hooks vs HOCs:
  - Hooks extract stateful logic without adding component tree layers.
  - Hooks are composable and easier to type in TypeScript.
  - Hooks are the modern React way — HOCs are largely replaced by hooks.

When HOCs are still appropriate:
  - When you need to conditionally render the component itself (auth guard).
  - When working with class components (no hooks available).
  - When using libraries that provide HOC APIs (react-redux, styled-components).`,
    },
    {
        id: 'react-19',
        question: 'What is useTransition and useDeferredValue in React 18? When should you use them?',
        difficulty: 'Hard',
        intention: 'Tests knowledge of React 18 concurrent features — shows you understand modern React performance patterns.',
        answer: `Both hooks allow you to mark certain state updates as non-urgent, keeping the UI responsive during expensive renders.

useTransition — wraps a state update as non-urgent:
  const [isPending, startTransition] = useTransition();

  function handleSearch(query) {
    setInputValue(query);         // urgent (update input immediately)
    startTransition(() => {
      setFilteredResults(filter(query)); // non-urgent (can be interrupted)
    });
  }

  // Show a spinner while the non-urgent update processes:
  {isPending && <Spinner />}

useDeferredValue — defers a value derived from props:
  const deferredQuery = useDeferredValue(query);
  // deferredQuery lags behind query — uses old value while new one renders.
  const results = useMemo(() => expensiveFilter(deferredQuery), [deferredQuery]);

Differences:
  - useTransition: You control which state UPDATE is deferred.
  - useDeferredValue: You defer a VALUE (useful when you don't own the state update, e.g., a prop).

How they work:
  React 18's concurrent renderer can interrupt non-urgent renders when an urgent update comes in. The urgent update (e.g., typing) renders first; the deferred work resumes after.

When to use:
  ✅ Filtering/sorting large lists based on user input.
  ✅ Rendering expensive visualizations while keeping form inputs snappy.
  ✅ Navigating to heavy routes while old content stays visible.

❌ Don't use for I/O operations (fetching data) — use Suspense + data fetching libraries for that.`,
    },
    {
        id: 'react-20',
        question: 'How does React handle forms? Compare native form handling with React Hook Form.',
        difficulty: 'Medium',
        intention: 'Tests practical experience with forms at scale — large forms with validation are a real-world pain point.',
        answer: `React Forms — Two Approaches:

1. Controlled components (native React):
  const [form, setForm] = useState({ name: '', email: '' });
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  // Every keystroke re-renders the component.

  Pros: Simple, full control, always in sync.
  Cons: Performance degrades with many fields; validation logic scattered.

2. React Hook Form (RHF) — library using uncontrolled inputs + refs:
  const { register, handleSubmit, formState: { errors } } = useForm();

  <input {...register('email', { required: true, pattern: /^\S+@\S+$/i })} />
  {errors.email && <span>Email is required</span>}

  <form onSubmit={handleSubmit(onSubmit)} />

  Pros:
  - Near-zero re-renders (inputs are uncontrolled, state only updates on validation).
  - Built-in validation (required, min, max, pattern, custom validate).
  - Schema validation via Zod/Yup with zodResolver.
  - Tiny bundle (~9KB gzipped).

  Cons: Less "React-native" feel; debugging can be harder.

Schema validation example with Zod:
  import { zodResolver } from '@hookform/resolvers/zod';
  import { z } from 'zod';

  const schema = z.object({ email: z.string().email() });
  const { register } = useForm({ resolver: zodResolver(schema) });

Recommendation:
  - Simple 2-3 field forms → controlled components.
  - Complex forms with many fields and validation → React Hook Form + Zod.`,
    },
]
