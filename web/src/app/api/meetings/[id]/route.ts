import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const existing = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
    if (body.date !== undefined) { fields.push('date = ?'); values.push(body.date); }
    if (body.attendees !== undefined) { fields.push('attendees = ?'); values.push(body.attendees); }
    if (body.type !== undefined) { fields.push('type = ?'); values.push(body.type); }
    if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
    if (body.summary !== undefined) { fields.push('summary = ?'); values.push(body.summary); }
    if (body.action_items !== undefined) { fields.push('action_items = ?'); values.push(body.action_items); }
    if (body.key_points !== undefined) { fields.push('key_points = ?'); values.push(body.key_points); }
    if (body.raw_transcript !== undefined) { fields.push('raw_transcript = ?'); values.push(body.raw_transcript); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE meetings SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM meetings WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
  }
}
