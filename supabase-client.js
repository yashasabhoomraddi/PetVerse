
const SUPABASE_URL = "https://mregdwyqmjurjnforhxa.supabase.co";  
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZWdkd3lxbWp1cmpuZm9yaHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Mzc5MzksImV4cCI6MjA3ODQxMzkzOX0.tBYR1ngQ7riZLz7d_Rlh6zxp5WMN4L0OcSX7vwCdY_4";             // starts with eyJ... (safe for frontend)


import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


window.supabase = supabase;

console.log("✅ Supabase client initialized:", SUPABASE_URL);
