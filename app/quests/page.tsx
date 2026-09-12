"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import {
  RANK_CONFIG,
  Rank,
  generateObstaclesForTitle,
  getStreakMultiplier,
  getXpForLevel,
} from "@/lib/rpg";
import { playSound } from "@/lib/fx";
import Navbar from "@/components/Navbar";

type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: Rank;
  max_hp: number;
  current_hp: number;
  xp_reward: number;
  anima_reward: number;
  is_completed: boolean;
  created_at: string;
  obstacles?: Obstacle[];
};

type Obstacle = {
  id: string;
  task_id: string;
  name: string;
  icon: string;
  max_hp: number;
  current_hp: number;
  defeated: boolean;
};

type Profile = {
  id: string;
  username: string;
  level: number;
  xp: number;
  anima_cores: number;
  streak: number;
  max_streak: number;
  streak_freezes: number;
  has_mythic_blade: boolean;
  last_streak_update: string | null;
};

function todayISO() {
  // Local calendar day (not UTC) so streak matches the user's real day
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Daily streak rules:
 * - Same day again → streak UNCHANGED
 * - Yesterday was last update → streak +1
 * - First ever (null) → streak = 1
 * - Missed 1+ days → use Chronos freeze OR reset to 1
 */
function computeDailyStreak(profile: Profile): {
  streak: number;
  freezes: number;
  lastUpdate: string;
  changed: boolean;
  keptWithFreeze: boolean;
  reset: boolean;
} {
  const today = todayISO();
  const yesterday = yesterdayISO();
  const last = profile.last_streak_update;

  // Already completed a boss today → do NOT touch streak
  if (last === today) {
    return {
      streak: profile.streak,
      freezes: profile.streak_freezes,
      lastUpdate: last,
      changed: false,
      keptWithFreeze: false,
      reset: false,
    };
  }

  // Consecutive day
  if (last === yesterday) {
    return {
      streak: profile.streak + 1,
      freezes: profile.streak_freezes,
      lastUpdate: today,
      changed: true,
      keptWithFreeze: false,
      reset: false,
    };
  }

  // First activity ever
  if (!last) {
    return {
      streak: Math.max(1, profile.streak || 1),
      // If they somehow already had streak > 0 but no date, lock it in as "today" without +1 spam
      freezes: profile.streak_freezes,
      lastUpdate: today,
      changed: true,
      keptWithFreeze: false,
      reset: false,
    };
  }

  // Gap of 2+ days
  if (profile.streak_freezes > 0) {
    return {
      streak: profile.streak + 1, // freeze covers the gap, still count today
      freezes: profile.streak_freezes - 1,
      lastUpdate: today,
      changed: true,
      keptWithFreeze: true,
      reset: false,
    };
  }

  // Reset
  return {
    streak: 1,
    freezes: profile.streak_freezes,
    lastUpdate: today,
    changed: true,
    keptWithFreeze: false,
    reset: true,
  };
}

export default function QuestsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Mind");
  const [difficulty, setDifficulty] = useState<Rank>("C");
  const [customObstacle, setCustomObstacle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Visual-only HP during chomp (so bar + dino move without card flying)
  const [displayHp, setDisplayHp] = useState<Record<string, number>>({});
  const [chompId, setChompId] = useState<string | null>(null);
  const [flyAwayId, setFlyAwayId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [victoryModal, setVictoryModal] = useState<{
    xp: number;
    anima: number;
    title: string;
    streakMsg: string;
  } | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      router.replace("/auth");
      return;
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select(
        "id, username, level, xp, anima_cores, streak, max_streak, streak_freezes, has_mythic_blade, last_streak_update"
      )
      .eq("id", session.user.id)
      .single();

    if (prof) setProfile(prof as Profile);

    const { data: taskData } = await supabase
      .from("tasks")
      .select("*, obstacles(*)")
      .eq("user_id", session.user.id)
      .eq("is_completed", false)
      .order("created_at", { ascending: false });

    if (taskData) {
      const list = taskData as Task[];
      setTasks(list);
      const map: Record<string, number> = {};
      list.forEach((t) => {
        map[t.id] = t.current_hp;
      });
      setDisplayHp(map);
    }
    setLoading(false);
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !profile) return;
    setCreating(true);
    setError("");
    playSound("click");

    const cfg = RANK_CONFIG[difficulty];
    const { data: newTask, error: insErr } = await supabase
      .from("tasks")
      .insert({
        user_id: profile.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        difficulty,
        max_hp: cfg.hp,
        current_hp: cfg.hp,
        xp_reward: cfg.xp,
        anima_reward: cfg.anima,
        is_completed: false,
      })
      .select()
      .single();

    if (insErr) {
      setError(insErr.message);
      setCreating(false);
      playSound("error");
      return;
    }

    const autoObs = generateObstaclesForTitle(title);
    const obsToInsert = autoObs.map((o) => ({
      task_id: newTask.id,
      name: o.name,
      icon: o.icon,
      max_hp: o.hp,
      current_hp: o.hp,
      defeated: false,
    }));
    if (customObstacle.trim()) {
      obsToInsert.push({
        task_id: newTask.id,
        name: customObstacle.trim(),
        icon: "⚠️",
        max_hp: 80,
        current_hp: 80,
        defeated: false,
      });
    }
    if (obsToInsert.length > 0) await supabase.from("obstacles").insert(obsToInsert);

    playSound("boot");
    setTitle("");
    setDescription("");
    setCustomObstacle("");
    setCreating(false);
    loadData();
  }

  async function handleStrike(task: Task, instantKill = false) {
    if (!profile || busyId) return;
    const current = displayHp[task.id] ?? task.current_hp;
    if (current <= 0) return;

    setBusyId(task.id);
    playSound(instantKill ? "kill" : "strike");

    const damage = instantKill ? current : Math.min(45, current);
    const newHp = Math.max(0, current - damage);

    // 1) Only T-Rex + HP fill move — card stays still
    setChompId(task.id);
    setDisplayHp((prev) => ({ ...prev, [task.id]: newHp }));

    // Let chomp animation play (~0.55s)
    await new Promise((r) => setTimeout(r, 550));
    setChompId(null);

    // Sync obstacles visually defeated on any strike
    if (task.obstacles && task.obstacles.length > 0) {
      await supabase
        .from("obstacles")
        .update({ current_hp: 0, defeated: true })
        .eq("task_id", task.id);
    }

    if (newHp > 0) {
      // Partial damage only — card never flies
      await supabase.from("tasks").update({ current_hp: newHp }).eq("id", task.id);
      setBusyId(null);
      loadData();
      return;
    }

    // 2) HP hit 0 → T-Rex is at far left → NOW card flies away
    setFlyAwayId(task.id);
    playSound("kill");
    await new Promise((r) => setTimeout(r, 480));

    await supabase
      .from("tasks")
      .update({
        current_hp: 0,
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    // STREAK: once per calendar day only
    const s = computeDailyStreak(profile);

    const mult = getStreakMultiplier(s.streak);
    const bladeBonus = profile.has_mythic_blade ? 1.1 : 1.0;
    const earnedXp = Math.round(task.xp_reward * mult * bladeBonus);
    const earnedAnima = Math.round(task.anima_reward * mult);

    let newXp = profile.xp + earnedXp;
    let newLevel = profile.level;
    let needed = getXpForLevel(newLevel);
    while (newXp >= needed) {
      newXp -= needed;
      newLevel += 1;
      needed = getXpForLevel(newLevel);
      setTimeout(() => playSound("levelup"), 350);
    }

    await supabase
      .from("profiles")
      .update({
        level: newLevel,
        xp: newXp,
        anima_cores: profile.anima_cores + earnedAnima,
        streak: s.streak,
        max_streak: Math.max(profile.max_streak, s.streak),
        streak_freezes: s.freezes,
        last_streak_update: s.lastUpdate,
      })
      .eq("id", profile.id);

    let streakMsg = "Streak unchanged (already counted today)";
    if (s.reset) streakMsg = "Streak reset — you missed a day";
    else if (s.keptWithFreeze) streakMsg = "Streak saved by Chronos Potion";
    else if (s.changed && s.streak > 1) streakMsg = `Daily streak → ${s.streak}d`;
    else if (s.changed && s.streak === 1) streakMsg = "Streak started: 1d";

    setFlyAwayId(null);
    setBusyId(null);
    setVictoryModal({
      xp: earnedXp,
      anima: earnedAnima,
      title: task.title,
      streakMsg,
    });
    loadData();
  }

  async function handleDeleteTask(taskId: string) {
    playSound("click");
    await supabase.from("tasks").delete().eq("id", taskId);
    loadData();
  }

  if (loading) {
    return (
      <div className="grid-bg flex min-h-screen items-center justify-center">
        <p className="font-[family-name:var(--font-display)] tracking-[0.3em] text-system-bright uppercase">
          Scanning Radar...
        </p>
      </div>
    );
  }

  return (
    <div className="grid-bg min-h-screen overflow-hidden pb-16">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8"></main>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Scanner */}
          <div className="lg:col-span-5">
            <div className="sys-panel p-6">
              <div className="mb-6">
                <p className="font-[family-name:var(--font-display)] text-[11px] font-bold tracking-[0.3em] text-cyan uppercase">
                  Scanner
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-extrabold text-white">
                  Detect Threat
                </h2>
              </div>
              <form onSubmit={handleCreateTask} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted uppercase">
                    Boss Name / Task *
                  </label>
                  <input
                    type="text"
                    className="sys-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Study Math OR Gym Workout"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted uppercase">
                    Details
                  </label>
                  <textarea
                    className="sys-input min-h-[60px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted uppercase">
                      Category
                    </label>
                    <select
                      className="sys-input"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Mind">🧠 Mind</option>
                      <option value="Body">💪 Body</option>
                      <option value="Career">💼 Career</option>
                      <option value="Soul">✨ Soul</option>
                      <option value="Finance">💰 Finance</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted uppercase">
                      Rank
                    </label>
                    <select
                      className="sys-input"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as Rank)}
                    >
                      <option value="E">E-Rank (50 HP)</option>
                      <option value="C">C-Rank (100 HP)</option>
                      <option value="A">A-Rank (200 HP)</option>
                      <option value="S">S-Rank BOSS (400 HP)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted uppercase">
                    Custom Obstacle (Optional)
                  </label>
                  <input
                    type="text"
                    className="sys-input"
                    value={customObstacle}
                    onChange={(e) => setCustomObstacle(e.target.value)}
                    placeholder="e.g. Loud roommates"
                  />
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                <button type="submit" className="btn-system w-full" disabled={creating}>
                  {creating ? "Scanning..." : "⚔️ Spawn Boss Battle"}
                </button>
              </form>
            </div>
          </div>

          {/* Battles */}
          <div className="space-y-4 lg:col-span-7">
            {tasks.length === 0 ? (
              <div className="sys-panel p-8 text-center">
                <p className="text-muted">No Active Threats. Spawn one!</p>
              </div>
            ) : (
              tasks.map((task) => {
                const cfg = RANK_CONFIG[task.difficulty] || RANK_CONFIG.C;
                const hpNow = displayHp[task.id] ?? task.current_hp;
                const hpPct = Math.max(0, Math.min(100, (hpNow / task.max_hp) * 100));
                const isChomping = chompId === task.id;
                const isFlying = flyAwayId === task.id;
                const isBusy = busyId === task.id;

                return (
                  <motion.div
                    key={task.id}
                    layout={false}
                    className="sys-panel relative p-5"
                    initial={false}
                    animate={
                      isFlying
                        ? { x: 420, y: -40, rotate: 18, opacity: 0, scale: 0.85 }
                        : { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }
                    }
                    transition={
                      isFlying
                        ? { duration: 0.45, ease: "easeIn" }
                        : { duration: 0 }
                    }
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-border bg-void/60 px-2 py-0.5 text-[10px] font-bold text-muted uppercase">
                          {task.category}
                        </span>
                        <span className={`text-xs font-extrabold uppercase ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-xs text-dim hover:text-danger"
                        disabled={isBusy}
                      >
                        ✕ Abort
                      </button>
                    </div>

                    <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="mt-1 text-sm text-muted">{task.description}</p>
                    )}

                    {/* HP bar — only this + dino animate on STRIKE */}
                    <div className="relative z-10 mt-4">
                      <div className="mb-1 flex justify-between text-xs font-bold">
                        <span className="text-danger-glow">BOSS HP</span>
                        <span className="text-muted">
                          {hpNow} / {task.max_hp}
                        </span>
                      </div>

                      <div className="hp-track relative h-3.5 overflow-visible">
                        <motion.div
                          className="hp-fill"
                          initial={false}
                          animate={{ width: `${hpPct}%` }}
                          transition={{ duration: 0.45, ease: "easeOut" }}
                        />

                        {/* T-Rex sits on the RIGHT EDGE of remaining HP and chomps left */}
                        <motion.div
                          className="pointer-events-none absolute top-1/2 -translate-y-1/2 select-none text-[60px] leading-none"
                          style={{ left: `calc(${hpPct}% - 17px)` }}
                          initial={false}
                          animate={
                            isChomping
                              ? {
                                  scale: [1, 1.35, 0.9, 1.25, 1],
                                  rotate: [0, -18, 12, -8, 0],
                                  y: ["-50%", "-62%", "-45%", "-58%", "-50%"],
                                }
                              : { scale: 1, rotate: 0, y: "-50%" }
                          }
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                        >
                          🦖
                        </motion.div>
                      </div>
                      <p className="mt-1 text-[10px] text-dim">
                      </p>
                    </div>

                    {task.obstacles && task.obstacles.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {task.obstacles.map((obs) => (
                          <div
                            key={obs.id}
                            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
                              obs.defeated || hpNow < task.current_hp
                                ? "border-border/40 bg-void/20 text-dim line-through"
                                : "border-danger/40 bg-danger/10 text-text"
                            }`}
                          >
                            <span>
                              {obs.icon} {obs.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
                      <div className="flex items-center gap-3 text-xs font-bold">
                        <span className="text-system-bright">+{task.xp_reward} XP</span>
                        <span className="text-anima">💎 +{task.anima_reward}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStrike(task, false)}
                          className="btn-strike px-3 py-1.5 text-xs"
                          disabled={isBusy}
                        >
                          🦖 STRIKE (−45)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStrike(task, true)}
                          className="btn-system px-3 py-1.5 text-xs"
                          disabled={isBusy}
                        >
                          ⚡ SLAY
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {victoryModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="sys-panel sys-panel-glow max-w-md p-8 text-center"
              initial={{ scale: 0.85, y: 12 }}
              animate={{ scale: 1, y: 0 }}
            >
              <div className="text-5xl">🏆</div>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-extrabold text-white">
                BOSS SLAIN!
              </h3>
              <p className="mt-2 text-sm text-muted">{victoryModal.title}</p>
              <p className="mt-2 text-xs font-semibold text-cyan">{victoryModal.streakMsg}</p>

              <div className="mt-6 flex justify-center gap-4 rounded-xl border border-border bg-void/60 p-4">
                <div>
                  <div className="text-[10px] text-dim uppercase">XP</div>
                  <div className="text-xl font-bold text-system-bright">+{victoryModal.xp}</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <div className="text-[10px] text-dim uppercase">Anima</div>
                  <div className="text-xl font-bold text-anima">💎 +{victoryModal.anima}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVictoryModal(null)}
                className="btn-system mt-6 w-full"
              >
                Claim Rewards
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}