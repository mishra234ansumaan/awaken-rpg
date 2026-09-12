"use client";

import { useEffect, useState } from "react";

type Props = {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursor?: boolean;
  onDone?: () => void;
};

export default function TypewriterText({
  text,
  speed = 28,
  delay = 0,
  className = "",
  cursor = true,
  onDone,
}: Props) {
  const [shown, setShown] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown("");
    setDone(false);
    setStarted(false);
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [text, delay]);

  useEffect(() => {
    if (!started) return;
    if (shown.length >= text.length) {
      setDone(true);
      onDone?.();
      return;
    }
    const t = setTimeout(() => {
      setShown(text.slice(0, shown.length + 1));
    }, speed);
    return () => clearTimeout(t);
  }, [started, shown, text, speed, onDone]);

  return (
    <span className={`${className} ${cursor && !done ? "tw-cursor" : ""}`}>
      {shown}
    </span>
  );
}