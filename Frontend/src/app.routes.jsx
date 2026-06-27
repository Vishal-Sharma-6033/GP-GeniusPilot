import { createBrowserRouter, Outlet } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import Profile from "./features/auth/pages/Profile";
import InterviewQuestions from "./features/interview/pages/InterviewQuestions";
import SignInPage from "./features/auth/pages/SignInPage";
import SignUpPage from "./features/auth/pages/SignUpPage";
import { ClerkProvider } from "@clerk/react-router";
import { AuthProvider } from "./features/auth/auth.context.jsx";
import { InterviewProvider } from "./features/interview/interview.context.jsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

function RootLayout() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AuthProvider>
        <InterviewProvider>
          <Outlet />
        </InterviewProvider>
      </AuthProvider>
    </ClerkProvider>
  )
}

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            {
                path: "/login",
                element: <Login />
            },
            {
                path: "/register",
                element: <Register />
            },
            {
                path: "/sign-in/*",
                element: <SignInPage />
            },
            {
                path: "/sign-up/*",
                element: <SignUpPage />
            },
            {
                path: "/",
                element: <Protected><Home /></Protected>
            },
            {
                path: "/interview/:interviewId",
                element: <Protected><Interview /></Protected>
            },
            {
                path: "/profile",
                element: <Protected><Profile /></Protected>
            },
            {
                path: "/questions",
                element: <Protected><InterviewQuestions /></Protected>
            }
        ]
    }
])