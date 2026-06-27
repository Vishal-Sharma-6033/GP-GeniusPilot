import React from "react";
import { SignIn } from "@clerk/react-router";

export default function SignInPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#0b0e14" }}>
      <SignIn />
    </div>
  );
}
