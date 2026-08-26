// ==========================================================================
// HMY Store — Supabase Configuration
// ==========================================================================
// These are PUBLIC values (not secrets). Supabase anon keys are designed
// to be used in frontend code. Security is enforced via Row Level Security
// (RLS) policies on the database, not by hiding these values.
//
// SETUP INSTRUCTIONS:
// 1. Create a free Supabase project at https://supabase.com
// 2. Go to Settings → API in your Supabase dashboard
// 3. Replace the placeholder values below with your actual project URL and anon key
// 4. Run the SQL schema in your Supabase SQL Editor (see implementation_plan.md)
// ==========================================================================

const SUPABASE_CONFIG = {
  url: 'https://jlplcmgeezkmkylbmfyc.supabase.co',
  anonKey: 'sb_publishable_lBKusffTnRsssWy-r3vS7w_lXMjH5eA'
};
