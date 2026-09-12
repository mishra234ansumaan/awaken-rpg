"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { playSound } from "@/lib/fx";
import Navbar from "@/components/Navbar";

type ShopItem = {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  effect_type: string;
  effect_value: string;
};

type Profile = {
  id: string;
  anima_cores: number;
  streak_freezes: number;
  title: string;
  has_mythic_blade: boolean;
};

export default function ShopPage() {
  const router = useRouter();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadShop();
  }, []);

  async function loadShop() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      router.replace("/auth");
      return;
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("id, anima_cores, streak_freezes, title, has_mythic_blade")
      .eq("id", session.user.id)
      .single();

    const { data: shopItems } = await supabase.from("shop_items").select("*").order("cost");

    if (prof) setProfile(prof as Profile);
    if (shopItems) setItems(shopItems as ShopItem[]);
    setLoading(false);
  }

  async function handleBuy(item: ShopItem) {
    if (!profile) return;
    if (profile.anima_cores < item.cost) {
      playSound("error");
      setMessage("Insufficient Anima Cores! Complete more Boss Battles.");
      return;
    }

    setBuyingId(item.id);
    setMessage("");
    playSound("coin");

    const newBalance = profile.anima_cores - item.cost;
    const updates: Partial<Profile> = { anima_cores: newBalance };

    if (item.effect_type === "streak_freeze") {
      updates.streak_freezes = (profile.streak_freezes || 0) + 1;
    } else if (item.effect_type === "mythic_blade") {
      updates.has_mythic_blade = true;
    } else if (item.effect_type === "title") {
      updates.title = item.effect_value;
    }

    await supabase.from("profiles").update(updates).eq("id", profile.id);

    // Record inventory
    await supabase.from("inventory").insert({
      user_id: profile.id,
      item_id: item.id,
      quantity: 1,
    });

    setBuyingId(null);
    setMessage(`Successfully acquired: ${item.name}!`);
    loadShop();
  }

  if (loading || !profile) {
    return (
      <div className="grid-bg flex min-h-screen items-center justify-center">
        <p className="font-[family-name:var(--font-display)] tracking-[0.3em] text-system-bright uppercase">
          Accessing Anima Vault...
        </p>
      </div>
    );
  }

  return (
    <div className="grid-bg min-h-screen pb-16">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8"></main>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xs font-bold tracking-[0.3em] text-anima uppercase">
              System Vault
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-white">
              Anima Armory
            </h1>
          </div>
          <div className="sys-panel inline-flex items-center gap-2 px-5 py-3">
            <span className="text-xs text-dim uppercase">Your Anima Balance:</span>
            <span className="font-[family-name:var(--font-display)] text-xl font-bold text-anima text-glow-anima">
              💎 {profile.anima_cores}
            </span>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-cyan/40 bg-cyan/10 p-4 text-sm font-semibold text-cyan">
            {message}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const canAfford = profile.anima_cores >= item.cost;
            const isOwned =
              item.effect_type === "mythic_blade" && profile.has_mythic_blade;

            return (
              <div key={item.id} className="sys-panel flex flex-col justify-between p-6">
                <div>
                  <div className="mb-3 flex items-start justify-between">
                    <span className="text-4xl">{item.icon}</span>
                    <span className="font-[family-name:var(--font-display)] text-lg font-bold text-anima">
                      💎 {item.cost}
                    </span>
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{item.description}</p>
                </div>

                <div className="mt-6">
                  {isOwned ? (
                    <button disabled className="btn-ghost w-full cursor-not-allowed opacity-50">
                      EQUIPPED
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford || buyingId === item.id}
                      className={canAfford ? "btn-system w-full" : "btn-ghost w-full opacity-50"}
                    >
                      {buyingId === item.id ? "Binding..." : "Acquire"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}