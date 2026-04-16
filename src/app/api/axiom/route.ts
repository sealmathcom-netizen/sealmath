import { NextRequest, NextResponse } from 'next/server';
import { logToAxiom } from '@/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await logToAxiom(body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/Axiom] Request failed:', err);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}
