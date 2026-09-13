# AWAKEN. ⚔️ (Solo Leveling / AWAKEN RPG)

> *"Your daily tasks are no longer chores — they are Battles. Defeat your demons. Reclaim your potential. Level Up."*

**AWAKEN.** is a gamified productivity web app inspired by RPGs and *Solo Leveling*. Instead of checking boxes on a boring to-do list, your tasks become **Boss Battles** with HP bars. Slay your tasks, clear obstacle demons, and earn Anima Cores to unlock epic character skins and titles.

##Key Features
* **Threat Scanner (Task Engine):** Create tasks with varying difficulties (E-Rank to S-Rank Bosses).
* **Keyword-based Obstacle Demons:** AI-free local NLP scans your task name (e.g., "study") and automatically spawns mini-bosses (e.g., "👾 Brain Fog Demon") that you must defeat.
* **Interactive Battle System:** Click **STRIKE** to deal 45 Damage. Watch the T-Rex (🦖) physically chomp your progress bar as the Boss's HP decreases!
* **Hardcore Economy & Leveling:** Exponential XP curves (Level 10 requires 10,000 XP) ensuring genuine long-term progression.
* **Anima Armory:** A massive shop with 35+ items, including streak-freezing Chronos Potions, Mythic Blades, and God-tier titles (like *Shadow Monarch*).
* **Skin Wardrobe:** 20 evolving Avatar skins (powered by DiceBear) that physically unlock as you hit Level milestones.
* **Calendar Streak Multipliers:** Smart daily streaks that grant 1.2x, 1.5x, and 2.0x XP multipliers for consecutive days.

## Tech Stack
* **Frontend:** Next.js 16 (App Router), React, Tailwind CSS v4, Framer Motion.
* **Backend & Auth:** Supabase (PostgreSQL, Row Level Security, Auth triggers).
* **Audio:** Web Audio API (Zero external dependencies for 8-bit sound effects).

---

## Setup Instructions (Local Development)

Follow these steps to run **AWAKEN.** on your local machine.

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

Install Dependencies: npm install

## Environment Variables
Create a file named .env.local in the root directory. Copy the template from .env.example and fill in your Supabase keys:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

## Database Setup (Supabase)
Create a new Supabase project.
Go to Authentication -> Providers -> Email and turn OFF "Confirm email" (for instant hackathon logins).
Go to the SQL Editor and run the schema setup.
(Note for Judges: The full SQL schema including tables for profiles, tasks, obstacles, shop_items, inventory, RLS policies, and Auth Triggers is required to run this app. Contact the team if the SQL dump is needed for local testing, though the Vercel deployment is fully functional)

## Run the Dev Server
npm run dev
Open the localhost link to see the webapp in your browser

## How to Play
Sign Up: Instantly linked via Supabase Auth.
Read the Lore: Watch the typewriter Awakening Protocol.
Scan Threats: Go to the Battles page to spawn a Boss.
Strike: Do the task in real life, then click STRIKE to damage the boss.
Upgrade: Use your Anima Cores 💎 in the Armory to buy titles and potions. Click your profile picture to equip unlocked skins!