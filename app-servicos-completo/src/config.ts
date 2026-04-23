export const GMAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ?? '';

if (!GMAPS_KEY) {
  console.error("🚨 [CONFIG] VITE_GOOGLE_MAPS_API_KEY is missing in .env file!");
} else {
  console.log("✅ [CONFIG] Google Maps API Key loaded successfully.");
}

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? '';
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? '';
