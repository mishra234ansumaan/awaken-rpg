"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import HeroPortrait from "@/components/HeroPortrait";
import {
  getXpForLevel,
  getStreakMultiplier,
  HUNTER_SKINS,
  dicebearUrl,
  type HunterSkin,
} from "@/lib/rpg";
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
  streak_freezes: number;
  has_mythic_blade: boolean;
  avatar_seed: string | null;
};

const RARITY_COLOR: Record<string, string> = {
  common: "border-border text-muted",
  rare: "border-cyan/50 text-cyan",
  epic: "border-system/50 text-system-bright",
  legendary: "border-anima/50 text-anima",
  mythic: "border-danger/50 text-danger-glow",
  god: "border-anima text-anima text-glow-anima",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace("/auth");
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sessionData.session.user.id)
      .single();

    if (data) setProfile(data as Profile);
    setLoading(false);
  }

  async function selectSkin(skin: HunterSkin) {
    if (!profile) return;
    if (profile.level < skin.minLevel) {
      playSound("error");
      setMsg(`Locked — reach Level ${skin.minLevel} to unlock ${skin.name}.`);
      return;
    }

    setSaving(true);
    playSound("accept");
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_seed: skin.seed })
      .eq("id", profile.id);

    if (error) {
      playSound("error");
      setMsg(error.message);
      setSaving(false);
      return;
    }

    setProfile({ ...profile, avatar_seed: skin.seed });
    setMsg(`Equipped: ${skin.name}`);
    setSaving(false);
    setTimeout(() => {
      setShowGallery(false);
      setMsg("");
    }, 600);
  }

  if (loading || !profile) {
    return (
      <div className="grid-bg flex min-h-screen items-center justify-center">
        <p className="font-[family-name:var(--font-display)] tracking-[0.3em] text-system-bright uppercase">
          Loading Hunter Dossier...
        </p>
      </div>
    );
  }

  const needXp = getXpForLevel(profile.level);
  const xpPct = Math.min(100, Math.round((profile.xp / Math.max(needXp, 1)) * 100));
  const mult = getStreakMultiplier(profile.streak);
  const currentSeed = profile.avatar_seed || profile.username;

  return (
    <div className="grid-bg min-h-screen pb-16">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8"></main>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="sys-panel p-6 sm:p-10">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:gap-8">
            {/* Click portrait → open gallery */}
            <HeroPortrait
              seed={currentSeed}
              level={profile.level}
              title={profile.title}
              size={120}
              onClick={() => {
                playSound("click");
                setShowGallery(true);
                setMsg("");
              }}
            />
            <div className="mt-4 sm:mt-0">
              <span className="text-xs font-bold tracking-[0.3em] text-cyan uppercase">
                Awakened Hunter
              </span>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-white">
                {profile.username}
              </h1>
              <p className="mt-1 font-semibold text-system-bright">{profile.title}</p>
              <p className="mt-2 text-xs text-dim">
                Click your portrait to open the{" "}
                <span className="text-cyan">Hunter Skin Gallery</span>
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-void/60 p-4 text-center">
              <div className="text-[10px] text-dim uppercase">Streak Boost</div>
              <div className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-cyan">
                {mult}x XP
              </div>
            </div>
            <div className="rounded-xl border border-border bg-void/60 p-4 text-center">
              <div className="text-[10px] text-dim uppercase">Chronos Potions</div>
              <div className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-text">
                🧪 {profile.streak_freezes || 0}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-void/60 p-4 text-center">
              <div className="text-[10px] text-dim uppercase">Mythic Weapon</div>
              <div className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-anima">
                {profile.has_mythic_blade ? "🗡️ Equipped" : "None"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-void/60 p-4 text-center">
              <div className="text-[10px] text-dim uppercase">Anima Vault</div>
              <div className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-anima">
                💎 {profile.anima_cores}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-2 font-[family-name:var(--font-display)] text-sm font-bold text-white uppercase">
              Current Rank Progress
            </h3>
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>Level {profile.level}</span>
              <span>
                {profile.xp} / {needXp} XP
              </span>
            </div>
            <div className="xp-track h-3">
              <div className="xp-fill" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>
      </main>

      {/* SKIN GALLERY MODAL */}
      <AnimatePresence>
        {showGallery && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGallery(false)}
          >
            <motion.div
              className="sys-panel sys-panel-glow max-h-[85vh] w-full max-w-3xl overflow-y-auto p-6 sm:p-8"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.3em] text-cyan uppercase">
                    System Wardrobe
                  </p>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-white">
                    Hunter Skin Gallery
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    Unlock new faces by leveling up. You are{" "}
                    <span className="font-bold text-system-bright">Lv. {profile.level}</span>.
                  </p>
                </div>
                <button type="button" className="btn-ghost text-xs" onClick={() => setShowGallery(false)}>
                  ✕ Close
                </button>
              </div>

              {msg && (
                <p className="mb-4 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 text-sm text-cyan">
                  {msg}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {HUNTER_SKINS.map((skin) => {
                  const unlocked = profile.level >= skin.minLevel;
                  const equipped = currentSeed === skin.seed;
                  const colors = RARITY_COLOR[skin.rarity] || RARITY_COLOR.common;

                  return (
                    <button
                      key={skin.id}
                      type="button"
                      disabled={saving}
                      onClick={() => selectSkin(skin)}
                      className={`relative rounded-2xl border p-3 text-left transition ${colors} ${
                        unlocked
                          ? "bg-void/70 hover:scale-[1.02] hover:bg-panel-2"
                          : "cursor-not-allowed bg-void/40 opacity-55"
                      } ${equipped ? "ring-2 ring-cyan shadow-[0_0_20px_rgba(34,211,238,0.35)]" : ""}`}
                    >
                      <div className="relative mx-auto mb-2 h-20 w-20 overflow-hidden rounded-xl bg-abyss">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={dicebearUrl(skin.seed)}
                          alt={skin.name}
                          className={`h-full w-full object-cover ${!unlocked ? "grayscale blur-[1px]" : ""}`}
                          draggable={false}
                        />
                        {!unlocked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-void/55 text-2xl">
                            🔒
                          </div>
                        )}
                      </div>
                      <div className="font-[family-name:var(--font-display)] text-xs font-bold text-white">
                        {skin.name}
                      </div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wide opacity-80">
                        {unlocked ? skin.rarity : `Unlock Lv.${skin.minLevel}`}
                      </div>
                      {equipped && (
                        <div className="mt-1 text-[10px] font-bold text-cyan uppercase">Equipped</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}