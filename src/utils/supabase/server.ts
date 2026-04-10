import {createServerClient} from '@supabase/ssr'
import {cookies} from 'next/headers'

export async function createSupabaseServerClient() {
    const cookieStore = await cookies()

    return createServerClient(
        'https://aklaifdmrdloycebatrd.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrbGFpZmRtcmRsb3ljZWJhdHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzgxOTMsImV4cCI6MjA5MTI1NDE5M30.2kAu8T0LujyOgeC0bfanizS4Mj2-tuQ_M24tGOpqZu4',
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({name, value, options}) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
            auth: {
                flowType: 'pkce',
                detectSessionInUrl: true,
                persistSession: true
            }
        }
    )
}
