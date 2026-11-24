// Cliente público de Supabase para LINUX CORE. La seguridad se aplica con RLS.
const SUPABASE_URL = "https://dunybrplrpprexggkrgj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_mo_3vIz4qpf7TeWKkJ4qXw_WqzoNdSG";

if (!window.supabase || !window.supabase.createClient) {
    console.error("No se pudo cargar la biblioteca de Supabase.");
} else {
    window.supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
    );
}
