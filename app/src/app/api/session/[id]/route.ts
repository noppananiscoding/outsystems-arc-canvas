import { NextRequest, NextResponse } from 'next/server';
import { getSession, putSession, upsertSession, createSession, SessionState } from '@/lib/session-store';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (id === 'new') {
    const sessionId = createSession();
    return NextResponse.json({ sessionId });
  }
  const state = getSession(id);
  if (!state) {
    return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
  }
  return NextResponse.json(state);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as SessionState;
  if (!body || typeof body.projectName !== 'string') {
    return NextResponse.json({ error: 'Invalid state payload' }, { status: 400 });
  }
  const ok = putSession(id, { ...body, lastUpdatedBy: 'browser', lastUpdatedAt: new Date().toISOString() });
  if (!ok) {
    // Session may not exist yet; create it on first PUT from browser
    upsertSession(id, { ...body, lastUpdatedBy: 'browser', lastUpdatedAt: new Date().toISOString() });
  }
  return NextResponse.json({ ok: true });
}
