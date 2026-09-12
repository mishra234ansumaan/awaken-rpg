"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Sword, Scroll, ShoppingBag, User, LogOut } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Sword },
  { href: "/quests", label: "Quests", icon: Scroll },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 bg-dungeon-900/90 backdrop-blur-md border-b border-gold-400/20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-fantasy text-xl text-gold-400 font-bold">
          ⚔️ Life RPG
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gold-400/20 text-gold-400"
                    : "text-parchment/60 hover:text-parchment hover:bg-dungeon-700"
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="ml-2 p-2 text-parchment/40 hover:text-red-400 transition-colors"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}