# Contributing to Tutre

This document is the working agreement for everyone on the project. Read it once
before your first change; skim the checklist before every pull request.

---

## Before you start

1. Read the [README](./README.md) — especially *Getting started*, *Architecture*
   and *Security model*.
2. Get the project running locally and log in to both panels. Do not open a pull
   request against code you have never run.
3. Claim the work. Comment on the issue, or open one, so two people do not build
   the same thing.

---

## Ground rules

These exist because Tutre is an existing, working application with real content
in a shared database. They are not style preferences.

**Preserve existing behaviour.** Breaking a working feature is a regression even
when the new code is better designed. If a change must alter behaviour, say so
explicitly in the pull request.

**Prefer additive changes.** Add alongside rather than rewriting in place.
Architecture rework is a separate, discussed piece of work — not something that
rides along inside a feature branch.

**Do not delete files or dependencies without evidence.** Search the repository
for every reference and state what you found in the pull request. "Looks unused"
is not evidence.

**One concern per branch and per commit.** A branch that renames things *and*
adds a feature *and* tweaks the schema is three reviews pretending to be one.

**Investigate before implementing.** Read how the code actually works first. For
anything touching multiple features, shared state, or the database, agree the
approach in an issue before writing it.

**Match the surrounding code.** JavaScript and JSX — no TypeScript. Feature
folders under `src/features/<feature>/`. `@tanstack/react-query` for server
state, React context for client state. No new frameworks, state managers, build
tooling or abstraction layers without agreement first.

---

## Branches and commits

Branch from `main`:

```bash
git checkout -b feat/simulation-search
```

| Prefix | Use for |
| --- | --- |
| `feat/` | New user-facing capability |
| `fix/` | Bug fix |
| `refactor/` | Internal change, no behaviour change |
| `docs/` | Documentation only |
| `chore/` | Tooling, config, dependencies |

Commit messages use the same prefixes and say what changed and why:

```text
fix: stop wizard discarding study guide on subject change

Changing subject rebuilt the payload from scratch, dropping any
study guide the teacher had already written.
```

**Never discard someone else's work.** No `git reset --hard`, `git clean`, or
force-push over a shared branch.

---

## Before you open a pull request

There is no automated test suite. "Verified" means all four of these:

```bash
npm run build --prefix admin-panel
npm run lint  --prefix admin-panel
npm run build --prefix student-panel
npm run lint  --prefix student-panel
```

...plus opening the affected screen in a running browser and using it. Say in the
pull request which screens you exercised and what you saw. If you could not test
something, say that too — an honest gap is fine, a silent one is not.

Also run:

```bash
git status
```

Check that nothing unrelated is staged, and that no `.env` file has crept in.

---

## The `.gitignore` trap

The root `.gitignore` is **deny-by-default**: it ignores `/*` and then re-allows
specific paths with `!` lines. A new top-level file is invisible to git until you
add a matching `!` line.

```bash
git check-ignore -v <path>      # silence means the path is tracked
```

`.env` files and everything under `.claude/` are ignored on purpose, at every
depth. Do not re-enable them.

---

## Database changes

The Supabase project is shared and holds real content. Treat it accordingly.

- Every schema change — table, column, view, policy, function — needs a migration
  file in `supabase/migrations/`. A change that exists only in the hosted project
  is a change nobody else can reproduce.
- Read [`supabase/README.md`](./supabase/README.md) first. It records what is
  verified about the live schema and what is still unknown.
- **Destructive changes need explicit approval, every time.** `DROP`, destructive
  `ALTER`, deletes, truncates, and any rewrite of an RLS policy. Ask in the issue
  before you run it, not after.
- Row Level Security is the authorization boundary. Never disable it, and never
  reach around it with a privileged key from the browser.

---

## Security expectations

- **AI-generated HTML is untrusted input.** Simulation payloads are model output
  stored in a database row. Treat them exactly as HTML pasted by a stranger.
- **Iframe isolation is load-bearing.** Simulations render inside sandboxed
  iframes. Do not widen the sandbox, remove it, or move a payload into the host
  document. Keep `dompurify` and `utils/sanitizeHTML.js` in the render path.
- **No secrets in the repository.** Only `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY` belong in a panel's `.env`. Anything prefixed
  `VITE_` ships to the browser. Service-role keys, database passwords and AI
  provider keys live server-side on Supabase and nowhere else.

If you think you have committed a secret, say so immediately. Rotating a key is
cheap; a leaked key in git history is not.

---

## Review

Every pull request needs one approving review before merge. Reviewers check:

- Does it do what the description says, and nothing else?
- Was it actually run, or only read?
- Does it preserve existing behaviour?
- Any schema change without a migration?
- Any secret, key or `.env` in the diff?

Be direct in reviews and specific about what to change. Disagreement goes in the
thread, not around it.
