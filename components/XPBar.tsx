"use client";
import { motion } from "framer-motion";

export default function XPBar({ currentXp, xpNeeded, level }: { currentXp: number; xpNeeded: number; level: number }) {
  const percentage = Math.min((currentXp / xpNeeded) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="font-fantasy text-gold-400 text-sm">Level {level}</span>
        <span className="text-parchment/60 text-xs">{currentXp} / {xpNeeded} XP</span>
      </div>
      <div className="xp-bar-bg">
        <motion.div
          className="xp-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}