"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Window, Button, Field, Message } from "@/components/retro";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) return setError("Email and password are required.");
    if (mode === "signup" && !form.name.trim()) return setError("Please enter your name.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");

    setBusy(true);
    const { error: err } =
      mode === "signin"
        ? await authClient.signIn.email({ email: form.email, password: form.password })
        : await authClient.signUp.email({ name: form.name, email: form.email, password: form.password });
    setBusy(false);

    if (err) return setError(err.message || "Could not sign in. Check your details.");
    router.push("/dashboard");
  }

  return (
    <main className="center-screen">
      <div className="login-box">
        <Window title="Welcome to Mini ERP 95" icon="🖥️">
          <div className="tabs">
            <Button className={mode === "signin" ? "on" : ""} onClick={() => setMode("signin")}>
              Sign in
            </Button>
            <Button className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>
              Sign up
            </Button>
          </div>

          {error && <Message kind="error">{error}</Message>}

          <form onSubmit={submit} className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
            {mode === "signup" && (
              <Field label="Name">
                <input value={form.name} onChange={set("name")} autoComplete="name" />
              </Field>
            )}
            <Field label="Email">
              <input type="email" value={form.email} onChange={set("email")} autoComplete="email" />
            </Field>
            <Field label="Password">
              <input type="password" value={form.password} onChange={set("password")} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
            </Field>
            <div className="row">
              <Button variant="primary" type="submit" disabled={busy}>
                {busy ? "Please wait..." : mode === "signin" ? "OK" : "Create account"}
              </Button>
              <Button onClick={() => setForm({ name: "", email: "admin@minierp.dev", password: "admin12345" })}>Use demo login</Button>
            </div>
          </form>
        </Window>
      </div>
    </main>
  );
}
