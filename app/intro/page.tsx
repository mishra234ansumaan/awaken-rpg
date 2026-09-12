"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import TypewriterText from "@/components/TypewriterText";
import HeroPortrait from "@/components/HeroPortrait";
import { playSound } from "@/lib/fx";

const LINES = [
  { text: "> SYSTEM INITIALIZING...", speed: 32, pause: 700 },
  { text: "> HOST CONFIRMED.", speed: 30, pause: 600 },
  {
    text: "> The world is infected by \"The Apathy\" — invisible parasites that feed on human potential.",
    speed: 22,
    pause: 900,
  },
  { text: "> You have been Awakened.", speed: 28, pause: 700 },
  {
    text: "> Your daily tasks are no longer chores — they are Battles.",
    speed: 24,
    pause: 800,
  },
  {
    text: "> Defeat your demons. Reclaim your potential. Level Up.",
    speed: 24,
    pause: 500,
  },
];

export default function IntroPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [seed, setSeed] = useState("awakened");
  const [lineIdx, setLineIdx] = useState(0);
  const [lineDone, setLineDone] = useState(false);
  const [showAccept, setShowAccept] = useState(false);
  const [portaling, setPortaling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const current = LINES[lineIdx];
  const isLast = lineIdx >= LINES.length - 1;

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace("/auth");
        return;
      }
      if (!alive) return;
      setUserId(session.user.id);
      setSeed(session.user.email || session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("intro_completed, avatar_seed")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.intro_completed) {
        router.replace("/");
        return;
      }
      if (profile?.avatar_seed) setSeed(profile.avatar_seed);

      setLoading(false);
      playSound("boot");
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  // advance lines
  useEffect(() => {
    if (!lineDone) return;
    if (isLast) {
      const t = setTimeout(() => setShowAccept(true), 400);
      return () => clearTimeout(t);
    }
    const pause = current?.pause ?? 600;
    const t = setTimeout(() => {
      setLineDone(false);
      setLineIdx((i) => i + 1);
    }, pause);
    return () => clearTimeout(t);
  }, [lineDone, isLast, current?.pause]);

  const visibleLines = useMemo(() => LINES.slice(0, lineIdx + 1), [lineIdx]);

  async function acceptSystem() {
    if (!userId || portaling) return;
    setError("");
    setPortaling(true);
    playSound("accept");
    setTimeout(() => playSound("portal"), 350);

    const { error: updErr } = await supabase
      .from("profiles")
      .update({
        intro_completed: true,
        avatar_seed: seed,
        title: "Novice Awakened",
      })
      .eq("id", userId);

    if (updErr) {
      setPortaling(false);
      setError(updErr.message);
      playSound("error");
      return;
    }

    setTimeout(() => router.replace("/"), 1600);
  }

  if (loading) {
    return (
      <div className="grid-bg flex min-h-screen items-center justify-center">
        <p className="font-[family-name:var(--font-display)] tracking-[0.3em] text-system-bright uppercase">
          Linking neural interface...
        </p>
      </div>
    );
  }

  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* ambient orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-system/20 blur-[100px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-cyan/10 blur-[100px]" />

      <AnimatePresence>
        {portaling && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative flex h-48 w-48 items-center justify-center">
              <div className="portal-ring absolute inset-0 rounded-full border-2 border-system shadow-[0_0_40px_rgba(124,58,237,0.6)]" />
              <div className="portal-ring absolute inset-4 rounded-full border border-cyan/70" />
              <div className="portal-ring absolute inset-8 rounded-full border border-system-bright/50" />
              <p className="font-[family-name:var(--font-display)] text-sm tracking-[0.25em] text-cyan uppercase text-glow-cyan">
                Entering
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="sys-panel sys-panel-glow scanlines relative w-full max-w-2xl overflow-hidden p-6 sm:p-10"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-[11px] font-bold tracking-[0.35em] text-cyan uppercase">
              Player System // v.1
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-extrabold text-white text-glow-system sm:text-3xl">
              Awakening Protocol
            </h1>
          </div>
          <HeroPortrait seed={seed} size={72} showFrame level={1} title="???" />
        </div>

        <div className="mb-8 min-h-[220px] space-y-3 rounded-xl border border-border bg-void/60 p-4 font-mono text-sm leading-relaxed sm:p-5 sm:text-[15px]">
          {visibleLines.map((line, i) => {
            const active = i === lineIdx;
            return (
              <div key={i} className={i === 0 ? "text-cyan" : "text-text"}>
                {active ? (
                  <TypewriterText
                    text={line.text}
                    speed={line.speed}
                    cursor
                    onDone={() => {
                      playSound("type");
                      setLineDone(true);
                    }}
                  />
                ) : (
                  <span>{line.text}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-dim">
            {showAccept
              ? "Authorization required to bind System."
              : "Transmitting classified briefing..."}
          </p>

          <AnimatePresence>
            {showAccept && (
              <motion.button
                type="button"
                className="btn-system"
                onClick={acceptSystem}
                disabled={portaling}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
              >
                Accept the System
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <p className="mt-4 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </motion.div>
    </div>
  );
}