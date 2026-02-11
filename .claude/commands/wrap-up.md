---
description: End of day - sync memory, clear done list, prep for tomorrow
argument-hint: ""
allowed-tools:
  - Read
  - Edit
  - Glob
  - Grep
  - Bash(date:*)
  - Bash(mv:*)
---

End of day wrap-up. Syncs memory, clears completed tasks, and preps for tomorrow.

## Source Files

- **Memory**: `/home/user/imakeamiliondollar2017/.claude/memory.md`
- **Daily Work Note**: `/home/user/imakeamiliondollar2017/Daily Notes/MMDDYY.md`
- **Task Board**: `/home/user/imakeamiliondollar2017/Task Board.md`
- **Scratchpad**: `/home/user/imakeamiliondollar2017/Scratchpad.md`
- **Meetings Folder**: `/home/user/imakeamiliondollar2017/Meetings/`

---

## Steps

### Step 1: Get today's date

Determine today's date in MMDDYY format.

### Step 2: Read current state

Read:
1. Today's Daily Work Note
2. Current Memory file
3. Task Board
4. Scratchpad

### Step 3: Process unprocessed meetings

Scan the Meetings folder for any files with `status: unprocessed` in frontmatter.

For each unprocessed meeting:
1. Read the Raw Transcript section
2. Generate and fill in:
   - **Summary**: 2-4 sentence overview
   - **Action Items**: Bulleted list with owners
   - **Key Points**: Important decisions, insights, information
3. Update frontmatter: `status: processed`
4. **Rename the file** to: `YYYY-MM-DD [Meeting Title].md`
   - Use date from frontmatter
   - Extract title from heading or create from summary
   - Use `mv` command to rename
5. Add to Daily Work Note under `## Meetings & Conversations`:
   - Format: `- [[Meeting Note Name]]: [one-line summary]`
6. **ASK**: "Any action items from [meeting] you want moved to the Task Board?"
   - Do NOT auto-add action items

### Step 4: Sync memory

Review Daily Work Note for items to promote to memory:
- Important decisions → Recent Decisions
- Open questions/blockers → Open Threads
- Ideas to revisit → Parked
- People context → People & Context
- Priority shifts → Now

Review Memory for items to prune:
- Resolved items → Remove
- Stale items → Remove
- Old decisions (2+ weeks) → Remove

Update Memory file, keeping under ~100 lines.

### Step 5: Process and clear Scratchpad

Read the Scratchpad. For each item:
1. **Tasks/todos** → Ask if they should go to Task Board Inbox
2. **Ideas/thoughts** → Add to Daily Note under Notes, or promote to Memory
3. **Context/decisions** → Promote to Memory
4. **Links/references** → Add to Daily Note under Notes
5. **Ephemeral/done** → Discard

After processing, **clear the scratchpad** by resetting it to:
```
# Scratchpad

Quick capture zone. Jot anything here throughout the day.
Processed during `/sync` and `/wrap-up`, then cleared.

---

```

### Step 6: Move completed tasks and manage Done list

Edit the Task Board:
1. Find all checked items in Today section (`- [x]`)
2. Move them to Done section (remove checkbox, use regular bullets)
3. Remove the checked items from Today section

**If Friday:**
- Clear all items from Done section
- Leave just the `-` placeholder
- Tell user: "Cleared the Done list for the week"

**If not Friday:**
- Leave Done items in place (visible through the week)

### Step 7: Update Daily Work Note summary

If the "End of Day Summary" section is empty:
- Add a brief 1-2 sentence summary of what was accomplished
- Note any important carry-overs for tomorrow

### Step 8: Preview tomorrow

Check if anything needs attention tomorrow:
- Deadlines approaching?
- Waiting items that need follow-up?
- High priority items in Soon?

If yes, mention: "Tomorrow: keep an eye on [X]"

### Step 9: Sign off

Tell the user:
- Meetings processed (if any)
- Scratchpad processed and cleared
- Completed tasks moved to Done
- Done list status (cleared if Friday)
- Memory synced (what changed)
- Tomorrow preview (if applicable)
- "Good night."

---

## Memory Maintenance Rules

- Each bullet point should be ONE concise line
- Use format: `- Topic: status/context` for Open Threads
- Use format: `- [MMDDYY] Decision: rationale` for Recent Decisions
- If a section is empty, leave just `-` as placeholder
- Aggressively prune - memory is for ACTIVE context, not history
- **Keep total under ~100 lines**
