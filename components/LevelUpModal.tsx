"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function LevelUpModal({ level, onClose }: { level: number; onClose: () => void }) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 300 - 150,
      y: Math.random() * -200 - 50,
    }));
    setParticles(newParticles);
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="particle"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ left: "50%", top: "50%" }}
            />
          ))}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-8xl mb-4"
          >
            🎉
          </motion.div>
          <h2 className="font-fantasy text-5xl text-gold-400 mb-2" style={{ textShadow: "0 0 30px rgba(251,191,36,0.8)" }}>
            LEVEL UP!
          </h2>
          <p className="text-2xl text-parchment">You reached Level {level}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}