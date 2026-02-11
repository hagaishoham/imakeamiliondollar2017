---
description: Start the day - load memory, open task board, ready to work
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(date:*)
  - Bash(ls:*)
  - Bash(mkdir:*)
---

Start the work day. Loads context and gets ready to work.

## Source Files

- **Memory File**: `/home/user/imakeamiliondollar2017/.claude/memory.md`
- **Daily Note Template**: `/home/user/imakeamiliondollar2017/Templates/Daily Note Template.md`
- **Task Board**: `/home/user/imakeamiliondollar2017/Task Board.md`
- **Daily Notes Folder**: `/home/user/imakeamiliondollar2017/Daily Notes/`

---

## Steps

### Step 1: Get today's date

Determine today's date in MMDDYY format.

### Step 2: Load Memory

Read the memory file.

If it has content in the "Now" or "Open Threads" sections, briefly surface the context:
- "Context from memory: [Now summary]"
- "Open threads: [list key items]"

If memory is empty/placeholder only, skip silently.

### Step 3: Create/Open Daily Work Note

Check if today's work note exists at:
`Daily Notes/MMDDYY.md`

If it doesn't exist:
1. Read the template from `Templates/Daily Note Template.md`
2. Replace template variables:
   - `{{DATE}}` → MMDDYY (today's date)
3. Create the new daily work note with the processed template

### Step 4: Open Task Board

Read the Task Board.

### Step 5: Task review

Review:
1. **Inbox**: Any items to process? Move to Later/Soon/Today
2. **Waiting**: Any items to follow up on today?
3. **Today**: What's the plan? Should anything from Soon move up?

### Step 6: Ready to work

Summarize:
- Today list
- Waiting items to watch
- Daily Work Note location

Ask: "What do you want to tackle first?"

---

## Notes

- Be concise
- Focused, action-oriented
- Skip any section silently if its source file is empty
