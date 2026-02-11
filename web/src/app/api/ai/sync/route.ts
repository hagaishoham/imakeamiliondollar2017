import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST() {
  try {
    const db = getDb();
    const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '');

    const note = db.prepare('SELECT * FROM daily_notes WHERE date = ?').get(today) as any;
    const memory = db.prepare('SELECT * FROM memory_items ORDER BY section, position').all();
    const scratchpad = db.prepare('SELECT * FROM scratchpad_items WHERE processed = 0').all();
    const unprocessedMeetings = db.prepare("SELECT * FROM meetings WHERE status = 'unprocessed'").all();

    const settings = db.prepare("SELECT value FROM settings WHERE key = 'anthropic_api_key'").get() as any;
    if (!settings?.value) {
      return NextResponse.json({
        error: 'API key not configured',
        data: { note, memory, scratchpad, unprocessedMeetings }
      }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: settings.value });

    const memoryBySection: Record<string, any[]> = {};
    (memory as any[]).forEach(m => {
      if (!memoryBySection[m.section]) memoryBySection[m.section] = [];
      memoryBySection[m.section].push(m);
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a personal productivity AI. Analyze the current state and suggest memory updates.

Current Memory:
${Object.entries(memoryBySection).map(([section, items]) =>
  `## ${section}\n${(items as any[]).map(i => `- ${i.content}`).join('\n')}`
).join('\n\n')}

Today's Note:
- Decisions: ${note?.decisions || 'none'}
- Notes: ${note?.notes || 'none'}

Scratchpad Items:
${(scratchpad as any[]).map(s => `- ${s.content}`).join('\n') || 'empty'}

Unprocessed Meetings: ${(unprocessedMeetings as any[]).length}

Suggest a JSON response with:
- "memory_add": [{content, section}] - new items to add to memory
- "memory_remove_ids": [] - IDs of stale memory items to remove (from: ${(memory as any[]).map(m => `${(m as any).id}:"${(m as any).content}"`).join(', ')})
- "scratchpad_actions": [{id, action: "task"|"note"|"memory"|"discard", target_section?}] - what to do with each scratchpad item
- "summary": brief sync summary for the user

Return ONLY valid JSON.`
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const suggestions = JSON.parse(text);

    return NextResponse.json({
      suggestions,
      data: { note, memory, scratchpad, unprocessedMeetings }
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
}
