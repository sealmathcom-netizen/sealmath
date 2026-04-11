import {createBrowserClient} from '@supabase/ssr'


export function createSupabaseClient() {
    try {
        return createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
                auth: {
                    flowType: 'pkce',
                    detectSessionInUrl: true,
                    persistSession: true
                }
            }
        )
    } catch (error) {
        console.error('Supabase initialization failed (likely missing env vars or blocked by filter):', error);
        
        // Return a dummy mock client instead of throwing and crashing the entire React app
        return {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
                getSession: async () => ({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
                signOut: async () => ({ error: null }),
            }
        } as unknown as ReturnType<typeof createBrowserClient>;
    }
}
