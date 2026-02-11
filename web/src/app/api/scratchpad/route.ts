import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDb();
    const items = db.prepare('SELECT * FROM scratchpad_items WHERE processed = 0 ORDER BY created_at').all();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching scratchpad items:', error);
    return NextResponse.json({ error: 'Failed to fetch scratchpad items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    const result = db.prepare(
      'INSERT INTO scratchpad_items (content, processed, created_at) VALUES (?, 0, ?)'
    ).run(content, now);

    const item = db.prepare('SELECT * FROM scratchpad_items WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating scratchpad item:', error);
    return NextResponse.json({ error: 'Failed to create scratchpad item' }, { status: 500 });
  }
}
