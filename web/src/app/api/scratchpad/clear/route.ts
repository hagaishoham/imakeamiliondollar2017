import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const db = getDb();
    db.prepare('UPDATE scratchpad_items SET processed = 1 WHERE processed = 0').run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing scratchpad:', error);
    return NextResponse.json({ error: 'Failed to clear scratchpad' }, { status: 500 });
  }
}
