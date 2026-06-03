window.CLOUD_NANDY_SUPABASE = {
  url: "https://wyjkehxbybkakgxdnoje.supabase.co",
  key: "sb_publishable_FmN54Y2I0thkiRcGsoZWzg_VSfI6Dia",
  bucket: "property-images",
  table: "properties",
};

// Initialize the Supabase client globally for the frontend
window.supabaseClient = window.supabase.createClient(
  window.CLOUD_NANDY_SUPABASE.url,
  window.CLOUD_NANDY_SUPABASE.key
);
