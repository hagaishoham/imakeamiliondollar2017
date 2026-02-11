import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST() {
  try {
    const db = getDb();
    const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '');
    const dayOfWeek = new Date().getDay(); // 5 = Friday

    // Move completed tasks to done
    db.prepare("UPDATE tasks SET section = 'done', completed = 0 WHERE section = 'today' AND completed = 1").run();

    // Clear done list on Friday
    if (dayOfWeek === 5) {
      db.prepare("DELETE FROM tasks WHERE section = 'done'").run();
    }

    // Mark all scratchpad items as processed
    db.prepare('UPDATE scratchpad_items SET processed = 1').run();

    // Get current state
    const note = db.prepare('SELECT * FROM daily_notes WHERE date = ?').get(today) as any;
    const memory = db.prepare('SELECT * FROM memory_items ORDER BY section, position').all();
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY section, position').all();

    const settings = db.prepare("SELECT value FROM settings WHERE key = 'anthropic_api_key'").get() as any;

    let summary = 'Day wrapped up. Completed tasks moved to Done. Scratchpad cleared.';

    if (settings?.value) {
      try {
        const client = new Anthropic({ apiKey: settings.value });
        const response = await client.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Generate a brief 1-2 sentence end-of-day summary based on today's work note:
- Decisions: ${note?.decisions || 'none'}
- Meetings: ${note?.meetings_conversations || 'none'}
- Notes: ${note?.notes || 'none'}

Also note if there are items that need attention tomorrow from tasks:
${(tasks as any[]).filter(t => (t as any).section === 'waiting' || (t as any).section === 'soon').map(t => `- [${(t as any).section}] ${(t as any).content}`).join('\n') || 'none'}

Return just the summary text, no JSON.`
          }]
        });
        summary = response.content[0].type === 'text' ? response.content[0].text : summary;
      } catch { /* use default summary */ }
    }

    // Update daily note summary if empty
    if (note && !note.summary) {
      db.prepare("UPDATE daily_notes SET summary = ?, updated_at = datetime('now') WHERE id = ?").run(summary, note.id);
    }

    return NextResponse.json({
      summary,
      fridayClear: dayOfWeek === 5,
      date: today
    });
  } catch (error) {
    console.error('Wrap-up error:', error);
    return NextResponse.json({ error: 'Failed to wrap up' }, { status: 500 });
  }
}
