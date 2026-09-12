"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import HeroPortrait from "@/components/HeroPortrait";
import { getXpForLevel } from "@/lib/rpg";
import { playSound } from "@/lib/fx";
import Navbar from "@/components/Navbar";

type Profile = {
  id: string;
  username: string;
  title: string;
  level: number;
  xp: number;
  anima_cores: number;
  streak: number;
  max_streak: number;
  avatar_seed: string | null;
  intro_completed: boolean;
};

export default function CommandCenterPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace("/auth");
        return;
      }

      const { data: prof, error } = await supabase
        .from("profiles")
        .select(
          "id, username, title, level, xp, anima_cores, streak, max_streak, avatar_seed, intro_completed"
        )
        .eq("id", session.user.id)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      if (!prof || !prof.intro_completed) {
        router.replace("/intro");
        return;
      }

      setProfile(prof as Profile);
      setLoading(false);
      playSound("boot");
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  async function signOut() {
    playSound("click");
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (loading || !profile) {
    return (
      <div className="grid-bg flex min-h-screen items-center justify-center">
        <p className="font-[family-name:var(--font-display)] tracking-[0.3em] text-system-bright uppercase">
          Loading Command Center...
        </p>
      </div>
    );
  }

  // SAME formula as Profile page
  const need = getXpForLevel(profile.level);
  const xpPct = Math.min(100, Math.round((profile.xp / Math.max(need, 1)) * 100));

  return (
    <div className="grid-bg min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8"></main>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <motion.div
          className="sys-panel sys-panel-glow p-6 sm:p-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <HeroPortrait
                seed={profile.avatar_seed || profile.username}
                level={profile.level}
                title={profile.title}
                size={96}
              />
              <div>
                <p className="text-xs font-bold tracking-[0.25em] text-cyan uppercase">Hunter ID</p>
                <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-white text-glow-system">
                  {profile.username}
                </h1>
                <p className="mt-1 text-sm text-muted">{profile.title}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-border bg-void/50 px-3 py-3">
                <div className="text-[10px] tracking-widest text-dim uppercase">Streak</div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-cyan">
                  {profile.streak}d
                </div>
              </div>
              <div className="rounded-xl border border-border bg-void/50 px-3 py-3">
                <div className="text-[10px] tracking-widest text-dim uppercase">Anima</div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-anima text-glow-anima">
                  💎 {profile.anima_cores}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-void/50 px-3 py-3">
                <div className="text-[10px] tracking-widest text-dim uppercase">Best</div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-system-bright">
                  {profile.max_streak}d
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-2 flex items-end justify-between">
              <span className="font-[family-name:var(--font-display)] text-sm font-bold tracking-wide text-system-bright uppercase">
                Level {profile.level}
              </span>
              <span className="text-xs text-muted">
                {profile.xp} / {need} XP
              </span>
            </div>
            <div className="xp-track h-3">
              <div className="xp-fill" style={{ width: `${xpPct}%` }} />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/quests"
              className="group rounded-2xl border border-border bg-panel-2/80 p-5 transition hover:border-system-bright/50 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]"
              onClick={() => playSound("click")}
            >
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-white group-hover:text-system-bright">
                ⚔️ Open Battle Log
              </p>
              <p className="mt-1 text-sm text-muted">
                Scan threats. Strike bosses. Clear obstacles.
              </p>
            </Link>
            <Link
              href="/shop"
              className="group rounded-2xl border border-border bg-panel-2/80 p-5 transition hover:border-anima/40 hover:shadow-[0_0_30px_rgba(251,191,36,0.12)]"
              onClick={() => playSound("click")}
            >
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-white group-hover:text-anima">
                💎 Anima Armory
              </p>
              <p className="mt-1 text-sm text-muted">
                Potions, blades, titles — real power upgrades.
              </p>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}