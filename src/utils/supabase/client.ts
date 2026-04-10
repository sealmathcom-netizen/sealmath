import {createBrowserClient} from '@supabase/ssr'


export function createSupabaseClient() {

    return createBrowserClient(
        'https://aklaifdmrdloycebatrd.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrbGFpZmRtcmRsb3ljZWJhdHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzgxOTMsImV4cCI6MjA5MTI1NDE5M30.2kAu8T0LujyOgeC0bfanizS4Mj2-tuQ_M24tGOpqZu4',
        {
            auth: {
                flowType: 'pkce',
                detectSessionInUrl: true,
                persistSession: true
            }
        }
    )
}
