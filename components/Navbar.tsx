"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/lib/fx";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { name: "Command Center", href: "/" },
    { name: "Battles", href: "/quests" },
    { name: "Armory", href: "/shop" },
    { name: "Hunter Profile", href: "/profile" },
  ];

  async function handleLogout() {
    playSound("click");
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/80 bg-void/95 text-white shadow-md backdrop-blur-md transform-gpu">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          
          {/* Logo - Fixed wrapping issue with whitespace-nowrap and tracking */}
          <Link
            href="/"
            onClick={() => playSound("click")}
            className="whitespace-nowrap font-[family-name:var(--font-display)] text-xl font-extrabold tracking-[0.2em] sm:tracking-[0.3em]"
          >
            AWAKEN<span className="text-system-bright">.</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-2 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => playSound("click")}
                className={`btn-ghost text-sm ${
                  pathname === link.href ? "text-cyan border-cyan/30 bg-cyan/10" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}
            <button type="button" onClick={handleLogout} className="btn-ghost text-sm text-danger hover:text-danger-glow">
              Logout
            </button>
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="p-2 text-white md:hidden"
            onClick={() => {
              playSound("click");
              setIsOpen(true);
            }}
          >
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="18" x2="20" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[60] bg-void/80 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-[70] flex w-64 flex-col border-l border-border bg-panel shadow-2xl md:hidden transform-gpu"
            >
              <div className="flex items-center justify-between border-b border-border/50 p-4">
                <span className="font-[family-name:var(--font-display)] text-sm font-bold tracking-widest text-cyan uppercase">
                  System Menu
                </span>
                <button
                  type="button"
                  className="p-2 text-muted hover:text-white"
                  onClick={() => {
                    playSound("click");
                    setIsOpen(false);
                  }}
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <nav className="flex flex-col gap-2 p-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      playSound("click");
                      setIsOpen(false);
                    }}
                    className={`rounded-xl px-4 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide transition-colors ${
                      pathname === link.href
                        ? "bg-system text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                        : "bg-void/50 text-muted hover:text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto p-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-bold text-danger-glow transition hover:bg-danger/20"
                >
                  LOGOUT
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}