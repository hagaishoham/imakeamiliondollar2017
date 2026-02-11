import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  try {
    const { meetingId } = await request.json();
    const db = getDb();

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId) as any;
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });

    const settings = db.prepare("SELECT value FROM settings WHERE key = 'anthropic_api_key'").get() as any;
    if (!settings?.value) return NextResponse.json({ error: 'API key not configured' }, { status: 400 });

    const client = new Anthropic({ apiKey: settings.value });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Process this meeting transcript. Return a JSON object with these fields:
- "summary": 2-4 sentence overview
- "action_items": bulleted list as a string (use \\n for newlines, - for bullets)
- "key_points": important decisions and insights as a string (use \\n for newlines, - for bullets)
- "title": a short descriptive title for the meeting

Meeting info:
Title: ${meeting.title || 'Untitled'}
Date: ${meeting.date || 'Unknown'}
Attendees: ${meeting.attendees || 'Unknown'}

Transcript:
${meeting.raw_transcript}

Return ONLY valid JSON, no markdown formatting.`
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const result = JSON.parse(text);

    db.prepare(`
      UPDATE meetings SET
        title = COALESCE(?, title),
        summary = ?, action_items = ?, key_points = ?,
        status = 'processed', updated_at = datetime('now')
      WHERE id = ?
    `).run(result.title || meeting.title, result.summary, result.action_items, result.key_points, meetingId);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Process meeting error:', error);
    return NextResponse.json({ error: 'Failed to process meeting' }, { status: 500 });
  }
}
