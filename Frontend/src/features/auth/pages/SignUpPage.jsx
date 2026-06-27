import React from "react";
import { SignUp } from "@clerk/react-router";

export default function SignUpPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#0b0e14" }}>
      <SignUp />
    </div>
  );
}
