import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDb();
    const meetings = db.prepare('SELECT * FROM meetings ORDER BY date DESC').all();
    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, date, attendees, type, raw_transcript } = await request.json();
    if (!title || !date) {
      return NextResponse.json({ error: 'title and date are required' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    const result = db.prepare(
      `INSERT INTO meetings (title, date, attendees, type, status, summary, action_items, key_points, raw_transcript, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(title, date, attendees || '', type || '', 'raw', '', '', '', raw_transcript || '', now, now);

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
}
