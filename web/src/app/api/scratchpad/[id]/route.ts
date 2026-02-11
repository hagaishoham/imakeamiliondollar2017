import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const existing = db.prepare('SELECT * FROM scratchpad_items WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Scratchpad item not found' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.content !== undefined) { fields.push('content = ?'); values.push(body.content); }
    if (body.processed !== undefined) { fields.push('processed = ?'); values.push(body.processed); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);

    db.prepare(`UPDATE scratchpad_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const item = db.prepare('SELECT * FROM scratchpad_items WHERE id = ?').get(id);
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating scratchpad item:', error);
    return NextResponse.json({ error: 'Failed to update scratchpad item' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM scratchpad_items WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Scratchpad item not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM scratchpad_items WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scratchpad item:', error);
    return NextResponse.json({ error: 'Failed to delete scratchpad item' }, { status: 500 });
  }
}
