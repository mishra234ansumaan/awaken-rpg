import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function calculateLevel(xp: number): { level: number } {
  return { level: Math.floor(Math.sqrt(xp / 100)) + 1 };
}

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user;
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await req.json();
  if (!taskId) return NextResponse.json({ error: "Missing taskId" }, { status: 400 });

  // Get the task
  const { data: task, error: taskErr } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (taskErr || !task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (task.completed) return NextResponse.json({ error: "Already completed" }, { status: 400 });

  // Mark task complete
  await supabaseAdmin.from("tasks").update({ completed: true }).eq("id", taskId);

  // Get current profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Calculate new XP and level
  const newXp = profile.xp + task.xp_reward;
  const newGold = profile.gold + task.gold_reward;
  const { level: newLevel } = calculateLevel(newXp);
  const leveledUp = newLevel > profile.level;

  // Update streak
  const today = new Date().toISOString().split("T")[0];
  const lastActive = profile.last_active_date;
  let newStreak = profile.streak;

  if (lastActive !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    newStreak = lastActive === yesterday ? newStreak + 1 : 1;
  }

  // Update attribute
  const statField = task.category;
  const currentStat = profile[statField as keyof typeof profile] as number;

  // Update profile
  const { error: updateErr } = await supabaseAdmin
    .from("profiles")
    .update({
      xp: newXp,
      gold: newGold,
      level: newLevel,
      streak: newStreak,
      last_active_date: today,
      [statField]: currentStat + 1,
    })
    .eq("id", user.id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    xpGained: task.xp_reward,
    goldGained: task.gold_reward,
    newLevel,
    leveledUp,
    newStreak,
  });
}