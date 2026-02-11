import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDb();
    const notes = db.prepare('SELECT id, date, summary FROM daily_notes ORDER BY date DESC').all();
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching daily notes:', error);
    return NextResponse.json({ error: 'Failed to fetch daily notes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date } = await request.json();
    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const db = getDb();

    const existing = db.prepare('SELECT * FROM daily_notes WHERE date = ?').get(date);
    if (existing) {
      return NextResponse.json(existing);
    }

    const now = new Date().toISOString();
    const result = db.prepare(
      'INSERT INTO daily_notes (date, decisions, meetings_conversations, notes, summary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(date, '', '', '', '', now, now);

    const note = db.prepare('SELECT * FROM daily_notes WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating daily note:', error);
    return NextResponse.json({ error: 'Failed to create daily note' }, { status: 500 });
  }
}
