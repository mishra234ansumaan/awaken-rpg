"use client";

import { dicebearUrl } from "@/lib/rpg";

type Props = {
  seed?: string | null;
  level?: number;
  title?: string;
  size?: number;
  className?: string;
  showFrame?: boolean;
  onClick?: () => void;
};

export default function HeroPortrait({
  seed = "awakened",
  level = 1,
  title = "Novice Awakened",
  size = 96,
  className = "",
  showFrame = true,
  onClick,
}: Props) {
  const safeSeed = seed || "awakened";

  let ringClass = "border-border shadow-md";
  let bgGradient = "bg-abyss";

  if (level >= 10) {
    ringClass = "border-system shadow-[0_0_30px_rgba(124,58,237,0.8)] pulse-glow";
    bgGradient = "bg-gradient-to-br from-panel to-system/20";
  } else if (level >= 5) {
    ringClass = "border-cyan shadow-[0_0_20px_rgba(34,211,238,0.5)]";
    bgGradient = "bg-gradient-to-br from-panel to-cyan/20";
  }

  const src = dicebearUrl(safeSeed);

  const inner = (
    <div
      className={`relative overflow-hidden rounded-2xl ${bgGradient} ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{ width: size, height: size }}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Hero portrait"
        width={size}
        height={size}
        className="relative z-10 h-full w-full object-cover drop-shadow-2xl"
        draggable={false}
      />
      {level >= 10 && (
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.4)_0%,transparent_70%)] animate-pulse" />
      )}
      {onClick && (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-void/70 py-0.5 text-center text-[9px] font-bold tracking-wider text-cyan uppercase">
          Change
        </div>
      )}
    </div>
  );

  if (!showFrame) return inner;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`rounded-2xl border-2 p-[2px] transition-all duration-700 ${ringClass}`}>
        <div className="rounded-xl bg-void p-1">{inner}</div>
      </div>
      <div className="text-center">
        <div
          className={`font-[family-name:var(--font-display)] text-xs font-bold tracking-widest uppercase ${
            level >= 10
              ? "text-system-bright text-glow-system"
              : level >= 5
                ? "text-cyan text-glow-cyan"
                : "text-muted"
          }`}
        >
          Lv. {level}
        </div>
        <div className="mt-0.5 max-w-[140px] truncate text-[11px] font-semibold text-muted">
          {title}
        </div>
      </div>
    </div>
  );
}