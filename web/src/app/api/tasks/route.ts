import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDb();
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY section, position').all();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
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
      'SELECT COALESCE(MAX(position), 0) as maxPos FROM tasks WHERE section = ?'
    ).get(section) as any;
    const position = (maxPos?.maxPos ?? 0) + 1;
    const now = new Date().toISOString();

    const result = db.prepare(
      'INSERT INTO tasks (content, section, completed, position, created_at, updated_at) VALUES (?, ?, 0, ?, ?, ?)'
    ).run(content, section, position, now, now);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
