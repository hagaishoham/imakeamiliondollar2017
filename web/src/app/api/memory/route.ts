import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDb();
    const items = db.prepare('SELECT * FROM memory_items ORDER BY section, position').all();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching memory items:', error);
    return NextResponse.json({ error: 'Failed to fetch memory items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { content, section } = await request.json();
    if (!content || !section) {
      return NextResponse.json({ error: 'content and section are required' }, { status: 400 });
    }

    const db = getDb();
    const maxPos = db.prepare(
      'SELECT COALESCE(MAX(position), 0) as maxPos FROM memory_items WHERE section = ?'
    ).get(section) as any;
    const position = (maxPos?.maxPos ?? 0) + 1;
    const now = new Date().toISOString();

    const result = db.prepare(
      'INSERT INTO memory_items (content, section, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(content, section, position, now, now);

    const item = db.prepare('SELECT * FROM memory_items WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating memory item:', error);
    return NextResponse.json({ error: 'Failed to create memory item' }, { status: 500 });
  }
}
