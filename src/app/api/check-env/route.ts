import { NextResponse } from 'next/server'

export async function GET() {
  const envStatus = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      TEST_BYPASS_TOKEN: !!process.env.TEST_BYPASS_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  }

  return NextResponse.json({
    message: "Environment Diagnostic Tool",
    status: envStatus,
    instruction: "If any are 'false' (except TEST_BYPASS_TOKEN), your production site will fail. Add them to your hosting dashboard (e.g. Vercel) and redeploy."
  })
}
