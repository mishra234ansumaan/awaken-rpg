import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user;
}

export async function GET(req: NextRequest) {
  const { data, error } = await supabaseAdmin.from("shop_items").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: "Missing itemId" }, { status: 400 });

  // Get item
  const { data: item } = await supabaseAdmin
    .from("shop_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // Get profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("gold")
    .eq("id", user.id)
    .single();

  if (!profile || profile.gold < item.cost) {
    return NextResponse.json({ error: "Not enough gold!" }, { status: 400 });
  }

  // Deduct gold
  await supabaseAdmin
    .from("profiles")
    .update({ gold: profile.gold - item.cost })
    .eq("id", user.id);

  // Add to inventory
  await supabaseAdmin.from("inventory").insert({
    user_id: user.id,
    item_name: item.name,
    item_icon: item.icon,
    item_rarity: item.rarity,
  });

  return NextResponse.json({ success: true, newGold: profile.gold - item.cost });
}