import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://xdsiftvejggcscmpoyqu.supabase.co';

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_-lRXiQ_N0Bxoyq7Vh5LY2w_gFL9duKY';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

