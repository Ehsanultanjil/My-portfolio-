// TODO: replace these with your own Supabase project values.
// Find them in your Supabase dashboard under Project Settings -> API.
// The anon/public key is safe to expose here by design (it's protected by
// the Row Level Security policies set up in supabase/setup.sql) -- it is
// NOT the service_role secret key, never use that one in client-side code.
const SUPABASE_URL = 'https://wyxtzqmucnzcpvxautcs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JTaERPc_WhrusMwaaDoNZQ_3LfuvYsR';

window.supabaseClient = (!window.supabase || SUPABASE_URL.startsWith('YOUR_'))
    ? null
    : window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
