---
name: write-a-prd
description: Use this skill when writing a PRD for a feature. Creates PRDs with actionable tasks for automated execution.
---

This skill creates PRDs designed for automated task execution (compatible with ralphy.sh and similar tools).

## Process

Go through these steps. Skip steps if unnecessary.

1. **Understand the problem**: Ask the user for a detailed description of the problem they want to solve and any solution ideas they have.

2. **Explore the codebase**: Verify their assertions and understand the current state. Look at relevant files, patterns, and dependencies.

3. **Discuss alternatives**: Present other approaches. Ask if they've considered them. Debate tradeoffs.

4. **Interview for details**: Be thorough. Ask about edge cases, error handling, testing requirements, and acceptance criteria.

5. **Define scope**: Explicitly state what IS and what IS NOT part of this PRD. Get user confirmation.

6. **Write the PRD**: Use the template below. Save to `PRD.md` in the project root (ralph.sh expects this by default).

## Template

```markdown
# [Feature Name]

## Problem Statement

[What problem does this solve? Why does it matter? Write from the user's perspective.]

## Solution

[High-level description of the solution. What will be built?]

## Technical Approach

[Key technical decisions, architecture choices, patterns to follow. NO specific file paths - they become stale.]

## Out of Scope

[Explicitly list what this PRD does NOT cover. Prevents scope creep.]

## Tasks

[Break down into atomic, implementable tasks. Order matters - dependencies first.]

- [ ] Task 1 description
- [ ] Task 2 description
- [ ] Task 3 description
...

## Acceptance Criteria

[How do we know this is done? What should work when complete? Use plain bullets, NOT checkboxes - ralph.sh only tracks Tasks.]

- Criterion 1
- Criterion 2
...
```

## Task Writing Guidelines

Tasks MUST follow this format exactly (for automated parsing):

```
- [ ] Verb + specific action + context
```

**Good tasks:**
- [ ] Create database migration for notifications table
- [ ] Implement WebSocket connection handler in the API
- [ ] Add notification preferences to user settings UI
- [ ] Write integration tests for notification delivery

**Bad tasks:**
- [ ] Notifications (too vague)
- [ ] Maybe add some tests? (uncertain)
- [ ] Do the backend stuff (not specific)
  - [ ] Indented task (won't be parsed - must start at line beginning)

## Rules

1. **Atomic tasks**: Each task should be completable in one focused session
2. **Ordered by dependency**: Tasks that depend on others come later
3. **Testable**: Each task should have a clear "done" state
4. **No nested tasks**: All tasks at root level (no indentation)
5. **Verb-first**: Start each task with an action verb (Create, Implement, Add, Write, Update, Fix, Remove, Refactor)

## Output

Save the PRD to `PRD.md` in the project root. Confirm with the user before saving.

**Note**: ralph.sh looks for `PRD.md` by default. Users can override with `--prd path/to/file.md`.
