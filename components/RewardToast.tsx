"use client";
import { motion, AnimatePresence } from "framer-motion";

export interface Reward { id: number; xp: number; gold: number; }

export default function RewardToast({ rewards }: { rewards: Reward[] }) {
  return (
    <div className="fixed bottom-8 right-6 z-[90] flex flex-col-reverse gap-2 pointer-events-none">
      <AnimatePresence>
        {rewards.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: 60, scale: 0.7 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="card-rpg px-5 py-3 flex items-center gap-4 border-gold-400/50"
          >
            <span className="text-2xl">✨</span>
            <div className="text-sm">
              <p className="text-gold-300 font-bold">+{r.xp} XP</p>
              <p className="text-gold-400/70 text-xs">+{r.gold} Gold</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}