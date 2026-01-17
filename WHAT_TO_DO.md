# Problem: Ralph.sh Tasks Not Being Marked Complete

## Current Issue

When `ralph.sh` runs on the server, Claude completes tasks but **does NOT mark them as complete in `plans/PRD.md`**. This causes:

1. The same task runs over and over (e.g., "Set up ESLint and Prettier" runs 50+ times)
2. Discord notifications don't fire (we added a check to only notify when remaining count decreases)
3. The PRD stays at "Completed: 2 | Remaining: 93" forever

## Root Cause

The prompt in `build_prompt()` (around line 940 in `plans/ralph.sh`) tells Claude:
```
$step. Update the PRD to mark the task as complete (change '- [ ]' to '- [x]').
```

But Claude on the server is NOT following this instruction. It does the implementation work but skips editing the PRD file.

## Evidence

On the server (`ssh personal-server`):
```bash
cd /root/ted
git status
# Shows: only plans/progress.txt modified, NOT plans/PRD.md

head -10 plans/PRD.md | grep -E '^\- \['
# Shows: "Set up ESLint and Prettier" is still [ ] not [x]
```

## Two Possible Fixes

### Option A: Make the prompt more explicit (Recommended)

Edit `plans/ralph.sh` around line 940-942. Change from:
```bash
prompt="$prompt
$step. Update the PRD to mark the task as complete (change '- [ ]' to '- [x]')."
```

To something like:
```bash
prompt="$prompt
$step. CRITICAL: You MUST edit the file ${PRD_FILE} and change the task checkbox from '- [ ]' to '- [x]'. Use the Edit tool to modify the exact line. The task is NOT complete until you do this."
```

### Option B: Have ralph.sh mark the task complete itself

After Claude finishes (around line 1319 in `run_single_task()`), add:
```bash
# Force mark the task complete since Claude didn't
mark_task_complete "$current_task"
```

This is already done for GitHub issues but not for markdown PRD.

## Files to Modify

- `plans/ralph.sh` - either fix the prompt (Option A) or add auto-marking (Option B)

## How to Test

1. Make the fix locally
2. `git add -A && git commit -m "Fix task completion marking" && git push`
3. SSH to server: `ssh personal-server`
4. On server: `cd /root/ted && git pull && chmod +x ./plans/ralph.sh`
5. Run: `export DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/1462194560565514292/6J4vrIbJlRwCeRmkD9ABJBVf_WsgY-7ECDiAeyJh4dIF0N6HbTspAiMF2NcYRPNeH2kF' && ./plans/ralph.sh --max-iterations 2`
6. Check: After run, verify `git diff plans/PRD.md` shows the task checkbox changed to `[x]`
7. Check Discord channel for notification

## Server Details

- SSH: `ssh personal-server` (configured in ~/.ssh/config as 100.84.194.49)
- Project path: `/root/ted`
- Claude Code CLI is installed: `/usr/local/bin/claude`
