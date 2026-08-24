# AGENTS.md — whiteboard

Guidance for AI coding agents working in this repo.

## Code style

**Write self-explanatory code, not comments.** The JavaScript is the deliverable
— names and structure should carry the meaning. Reach for a comment only when the
code genuinely can't explain itself.

- Prefer a clear name or a small extracted function over a comment.
- When a comment is necessary, keep it to **one short line**. Explain the
  non-obvious **why** (a gotcha, an invariant, a reason for an odd choice), never
  the **what** the code already states.
- No block/banner comments, no restating the line below, no commented-out code.
- Delete a comment the moment the code makes it redundant.

Good:

```js
// Re-fit re-bases the local frame; pin endpoints in scene space across it.
```

Avoid:

```js
// This function sets the value of x to the value of y plus one.
x = y + 1;
```

## Working in this repo

- Default branch: `master`. Branch off it; never commit there directly.
- Tests: `npm run test:unit` (Jest via react-scripts). New/changed logic needs tests.
- Lint + format: `npm run test:all` (ESLint + Prettier) must pass. Run `npm run fix` to auto-fix.
- **Never** use `git commit --no-verify` — fix the failure instead.
- Icons: prefer `lucide-react`.
- Verify UI/canvas changes in the browser, not just via unit tests.
