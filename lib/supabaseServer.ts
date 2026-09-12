import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jmoodsenvdqpiaybbjvh.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptb29kc2VudmRxcGlheWJianZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODU1NTIsImV4cCI6MjEwNDc2MTU1Mn0.a2c7okq47Ecu_DNmXn3gVEFgyzfWSJ46zAZ2FWFsYyM";

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);