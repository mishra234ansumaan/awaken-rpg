"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/lib/fx";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (data.session) {
        await routeAfterAuth(data.session.user.id);
        return;
      }
      setChecking(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureProfile(
    userId: string,
    userEmail: string,
    name?: string
  ) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, intro_completed")
      .eq("id", userId)
      .maybeSingle();

    if (existing) return existing;

    const seed = name?.trim() || userEmail.split("@")[0] || userId;
    const { data, error: insErr } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        username: (name?.trim() || seed).slice(0, 24),
        avatar_seed: seed,
        title: "Novice Awakened",
        level: 1,
        xp: 0,
        anima_cores: 100,
        streak: 0,
        max_streak: 0,
        streak_freezes: 1,
        intro_completed: false,
      })
      .select("id, intro_completed")
      .single();

    if (insErr) throw insErr;
    return data;
  }

  async function routeAfterAuth(userId: string) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("intro_completed")
      .eq("id", userId)
      .maybeSingle();

    if (profile && !profile.intro_completed) {
      router.replace("/intro");
    } else if (!profile) {
      // profile missing — send to intro after soft create attempt by caller
      router.replace("/intro");
    } else {
      router.replace("/");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    playSound("click");

    try {
      if (mode === "signup") {
        if (!username.trim()) {
          throw new Error("Hunter name required.");
        }
        const { data, error: signErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signErr) throw signErr;
        if (!data.user) throw new Error("Signup failed — no user returned.");

        await ensureProfile(data.user.id, data.user.email || email, username);
        playSound("boot");
        setInfo("System bound. Entering Awakening Protocol...");
        setTimeout(() => router.replace("/intro"), 500);
      } else {
        const { data, error: loginErr } = await supabase.auth.signInWithPassword(
          {
            email: email.trim(),
            password,
          }
        );
        if (loginErr) throw loginErr;
        if (!data.user) throw new Error("Login failed.");

        await ensureProfile(
          data.user.id,
          data.user.email || email,
          data.user.email?.split("@")[0]
        );
        playSound("accept");
        await routeAfterAuth(data.user.id);
      }
    } catch (err) {
      playSound("error");
      setError(err instanceof Error ? err.message : "Auth failed.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="grid-bg flex min-h-screen items-center justify-center">
        <p className="font-[family-name:var(--font-display)] tracking-[0.3em] text-system-bright uppercase">
          Scanning session...
        </p>
      </div>
    );
  }

  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute top-0 left-1/2 h-72 w-[480px] -translate-x-1/2 rounded-full bg-system/25 blur-[120px]" />

      <motion.div
        className="sys-panel sys-panel-glow w-full max-w-md p-6 sm:p-8"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="mb-8 text-center">
          <p className="font-[family-name:var(--font-display)] text-[11px] font-bold tracking-[0.4em] text-cyan uppercase">
            AWAKEN// System
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-white text-glow-system">
            {mode === "signup" ? "Awaken" : "Re-Link"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "signup"
              ? "Create your Hunter profile and face The Apathy."
              : "Welcome back, Hunter. Resume your battles."}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-border bg-void/50 p-1">
          <button
            type="button"
            className={`rounded-lg py-2.5 font-[family-name:var(--font-display)] text-sm font-bold tracking-wide uppercase transition ${
              mode === "signup"
                ? "bg-system text-white shadow-[0_0_20px_rgba(124,58,237,0.35)]"
                : "text-muted hover:text-white"
            }`}
            onClick={() => {
              setMode("signup");
              setError("");
              playSound("click");
            }}
          >
            Sign Up
          </button>
          <button
            type="button"
            className={`rounded-lg py-2.5 font-[family-name:var(--font-display)] text-sm font-bold tracking-wide uppercase transition ${
              mode === "login"
                ? "bg-system text-white shadow-[0_0_20px_rgba(124,58,237,0.35)]"
                : "text-muted hover:text-white"
            }`}
            onClick={() => {
              setMode("login");
              setError("");
              playSound("click");
            }}
          >
            Log In
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-dim uppercase">
                Hunter Name
              </label>
              <input
                className="sys-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. ShadowMonarch"
                autoComplete="username"
                required
                maxLength={24}
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-dim uppercase">
              Email
            </label>
            <input
              className="sys-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hunter@system.io"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-dim uppercase">
              Password
            </label>
            <input
              className="sys-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger-glow" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 text-sm text-cyan">
              {info}
            </p>
          )}

          <button type="submit" className="btn-system w-full" disabled={loading}>
            {loading
              ? "Processing..."
              : mode === "signup"
                ? "Initialize System"
                : "Enter Command Center"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-dim">
        </p>
      </motion.div>
    </div>
  );
}