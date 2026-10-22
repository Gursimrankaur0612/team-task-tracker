
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type AuthResponse = {
  token?: string;
  message?: string;
  user: { id: string; name: string; email: string; role: string };
};

export default function Home() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        const result = await apiRequest<AuthResponse>("/auth/register/", {
          method: "POST",
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        });

        setSuccess(result.message || "Registration successful! You can now sign in.");
        setIsRegister(false);
        setPassword("");
      } else {
        const result = await apiRequest<AuthResponse>("/auth/login/", {
          method: "POST",
          body: JSON.stringify({ email: email.trim(), password }),
        });

        if (!result.token) {
          throw new Error("Login succeeded but no authentication token was returned.");
        }

        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsRegister((current) => !current);
    setError("");
    setSuccess("");
    setPassword("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Team Task Tracker</h1>
          <p className="mt-2 text-slate-400">
            {isRegister
              ? "Create an account to get started"
              : "Sign in to manage your team's work"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? "At least 8 characters" : "Enter your password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-950 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="rounded-lg bg-green-950 p-3 text-sm text-green-300">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading
              ? isRegister ? "Creating account..." : "Signing in..."
              : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isRegister ? "Already have an account?" : "New to Team Task Tracker?"}{" "}
          <button
            type="button"
            onClick={switchMode}
            className="font-semibold text-indigo-400 hover:text-indigo-300"
          >
            {isRegister ? "Sign in" : "Register"}
          </button>
        </p>
      </div>
    </main>
  );
}
