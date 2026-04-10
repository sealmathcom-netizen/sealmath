import { NextResponse } from 'next/server'

export async function GET() {
  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://aklaifdmrdloycebatrd.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrbGFpZmRtcmRsb3ljZWJhdHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzgxOTMsImV4cCI6MjA5MTI1NDE5M30.2kAu8T0LujyOgeC0bfanizS4Mj2-tuQ_M24tGOpqZu4',
    // NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    // NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    TEST_BYPASS_TOKEN: !!process.env.TEST_BYPASS_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  }

  return NextResponse.json({
    message: "Environment Diagnostic Tool",
    status: envStatus,
    instruction: "If any are 'false' (except TEST_BYPASS_TOKEN), your production site will fail. Add them to your hosting dashboard (e.g. Vercel) and redeploy."
  })
}
