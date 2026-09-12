import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function getTaskRewards(difficulty: string) {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return { xp: 10, gold: 5 };
    case "medium":
      return { xp: 25, gold: 10 };
    case "hard":
      return { xp: 50, gold: 25 };
    default:
      return { xp: 10, gold: 5 };
  }
}

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, category, difficulty } = await req.json();
  if (!title || !category || !difficulty) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rewards = getTaskRewards(difficulty);

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert({
      user_id: user.id,
      title,
      description: description || "",
      category,
      difficulty,
      xp_reward: rewards.xp,
      gold_reward: rewards.gold,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing task ID" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}