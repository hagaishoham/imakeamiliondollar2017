import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const note = db.prepare('SELECT * FROM daily_notes WHERE id = ?').get(id);
    if (!note) {
      return NextResponse.json({ error: 'Daily note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching daily note:', error);
    return NextResponse.json({ error: 'Failed to fetch daily note' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const existing = db.prepare('SELECT * FROM daily_notes WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Daily note not found' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.decisions !== undefined) { fields.push('decisions = ?'); values.push(body.decisions); }
    if (body.meetings_conversations !== undefined) { fields.push('meetings_conversations = ?'); values.push(body.meetings_conversations); }
    if (body.notes !== undefined) { fields.push('notes = ?'); values.push(body.notes); }
    if (body.summary !== undefined) { fields.push('summary = ?'); values.push(body.summary); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE daily_notes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const note = db.prepare('SELECT * FROM daily_notes WHERE id = ?').get(id);
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating daily note:', error);
    return NextResponse.json({ error: 'Failed to update daily note' }, { status: 500 });
  }
}
