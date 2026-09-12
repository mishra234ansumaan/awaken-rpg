export type Rank = "E" | "C" | "A" | "S";

export const RANK_CONFIG: Record<
  Rank,
  { label: string; hp: number; xp: number; anima: number; color: string }
> = {
  E: { label: "E-Rank (Minor Threat)", hp: 50, xp: 20, anima: 5, color: "text-muted" },
  C: { label: "C-Rank (Standard Fiend)", hp: 100, xp: 50, anima: 15, color: "text-cyan" },
  A: { label: "A-Rank (High Demon)", hp: 200, xp: 120, anima: 40, color: "text-system-bright" },
  S: { label: "S-Rank (Dungeon Boss)", hp: 400, xp: 300, anima: 100, color: "text-danger-glow" },
};

/** Hardcore curve: Lv2=400, Lv3=900, Lv5=2500, Lv10=10000 */
export function getXpForLevel(level: number): number {
  return 100 * (level * level);
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 21) return 2.0;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.2;
  return 1.0;
}

export function generateObstaclesForTitle(title: string): { name: string; hp: number; icon: string }[] {
  const t = title.toLowerCase();
  const list: { name: string; hp: number; icon: string }[] = [];

  if (t.includes("study") || t.includes("read") || t.includes("exam") || t.includes("homework") || t.includes("learn")) {
    list.push({ name: "Brain Fog Demon", hp: 40, icon: "👾" });
    list.push({ name: "Doomscroll Spectre", hp: 60, icon: "📱" });
  } else if (t.includes("gym") || t.includes("workout") || t.includes("run") || t.includes("exercise") || t.includes("fit")) {
    list.push({ name: "Couch Lock Parasite", hp: 50, icon: "🛋️" });
    list.push({ name: "Lactic Phantom", hp: 70, icon: "⚡" });
  } else if (t.includes("code") || t.includes("build") || t.includes("bug") || t.includes("dev") || t.includes("project")) {
    list.push({ name: "Syntax Fiend", hp: 45, icon: "🐛" });
    list.push({ name: "Stack Overflow Trap", hp: 80, icon: "🌀" });
  } else if (t.includes("clean") || t.includes("room") || t.includes("laundry") || t.includes("dishes")) {
    list.push({ name: "Procrastination Golem", hp: 60, icon: "🗿" });
  } else {
    list.push({ name: "Apathy Spore", hp: 40, icon: "🦠" });
  }

  return list;
}

/** Unlockable hunter skins — DiceBear seeds + min level required */
export type HunterSkin = {
  id: string;
  name: string;
  seed: string;
  minLevel: number;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic" | "god";
};

export const HUNTER_SKINS: HunterSkin[] = [
  { id: "novice", name: "Novice Awakened", seed: "novice-hunter-01", minLevel: 1, rarity: "common" },
  { id: "scout", name: "Shadow Scout", seed: "shadow-scout-02", minLevel: 1, rarity: "common" },
  { id: "recruit", name: "Guild Recruit", seed: "guild-recruit-03", minLevel: 2, rarity: "common" },
  { id: "striker", name: "C-Rank Striker", seed: "c-rank-striker-04", minLevel: 3, rarity: "rare" },
  { id: "blade", name: "Moon Blade", seed: "moon-blade-05", minLevel: 4, rarity: "rare" },
  { id: "veteran", name: "B-Rank Veteran", seed: "b-rank-veteran-06", minLevel: 5, rarity: "rare" },
  { id: "frost", name: "Frost Operative", seed: "frost-op-07", minLevel: 6, rarity: "epic" },
  { id: "flame", name: "Flame Weaver", seed: "flame-weaver-08", minLevel: 7, rarity: "epic" },
  { id: "storm", name: "Storm Caller", seed: "storm-caller-09", minLevel: 8, rarity: "epic" },
  { id: "elite", name: "A-Rank Elite", seed: "a-rank-elite-10", minLevel: 9, rarity: "legendary" },
  { id: "void", name: "Void Walker", seed: "void-walker-11", minLevel: 10, rarity: "legendary" },
  { id: "national", name: "S-Rank National", seed: "s-rank-national-12", minLevel: 12, rarity: "legendary" },
  { id: "demon", name: "Demon Hunter", seed: "demon-hunter-13", minLevel: 15, rarity: "mythic" },
  { id: "abyss", name: "Abyssal Vanguard", seed: "abyssal-vanguard-14", minLevel: 18, rarity: "mythic" },
  { id: "shadow-knight", name: "Shadow Elite Knight", seed: "shadow-elite-15", minLevel: 20, rarity: "mythic" },
  { id: "commander", name: "Shadow Commander", seed: "shadow-commander-16", minLevel: 25, rarity: "mythic" },
  { id: "monarch-fire", name: "White Flame Monarch", seed: "white-flame-17", minLevel: 30, rarity: "god" },
  { id: "dragon-king", name: "King of Dead Dragons", seed: "dead-dragon-18", minLevel: 35, rarity: "god" },
  { id: "architect", name: "The Architect", seed: "system-architect-19", minLevel: 40, rarity: "god" },
  { id: "shadow-monarch", name: "SHADOW MONARCH", seed: "shadow-monarch-20", minLevel: 50, rarity: "god" },
];

export function dicebearUrl(seed: string) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
}