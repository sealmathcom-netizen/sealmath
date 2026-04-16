import { NextRequest, NextResponse } from 'next/server';
import { logToAxiom } from '@/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // If it's a single object, ensure it has a level
    const data = Array.isArray(body) 
      ? body.map(item => ({ level: 'info', ...item }))
      : { level: 'info', ...body };

    await logToAxiom(data);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/Axiom] Request failed:', err);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}
