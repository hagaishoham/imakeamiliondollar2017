import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const db = getDb();
    const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '');

    // Get or create today's note
    let note = db.prepare('SELECT * FROM daily_notes WHERE date = ?').get(today);
    if (!note) {
      db.prepare('INSERT INTO daily_notes (date) VALUES (?)').run(today);
      note = db.prepare('SELECT * FROM daily_notes WHERE date = ?').get(today);
    }

    const memory = db.prepare('SELECT * FROM memory_items ORDER BY section, position').all();
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY section, position').all();

    return NextResponse.json({
      date: today,
      note,
      memory,
      tasks,
      message: 'Good morning! Ready to work.'
    });
  } catch (error) {
    console.error('Start error:', error);
    return NextResponse.json({ error: 'Failed to start' }, { status: 500 });
  }
}
