# Canonical simulation content

Hand-authored, reviewed simulations. These are the curated library — distinct
from anything the in-app AI generator produces.

## Layout

```text
content/simulations/<class>/<subject-slug>/<chapter-no>-<topic-slug>.html
```

Example:

```text
content/simulations/class-9/computer_science/03-binary-number-system.html
```

Each file is a complete, self-contained HTML document. It renders inside a
sandboxed iframe with no network access assumed, so everything it needs —
styles, scripts, data — must be inline. No external CDN links.

## Publishing one

Simulations are published with `upsert_canonical_simulation`, added in
`supabase/migrations/20260930100200_upsert_canonical_simulation.sql`. It resolves
the curriculum path by name, creates or updates the topic, and inserts or updates
the payload row. Running it twice with the same class, subject, chapter and topic
updates in place rather than duplicating, so republishing a corrected simulation
is the same command again.

In the Supabase SQL editor:

```sql
select public.upsert_canonical_simulation(
  'Class 9',                      -- class name, exactly as in classes.name
  'computer_science',             -- subjects.slug
  3,                              -- chapters.chapter_no
  'Binary Number System',         -- topic name
  'Convert between binary, decimal and hexadecimal by dragging bits.',
  '## Binary Number System ...',  -- study guide, markdown
  $html$<!doctype html> ... $html$
);
```

Use `$html$ ... $html$` dollar quoting for the payload. The HTML contains single
quotes and backslashes that ordinary quoting would mangle.

The function returns the simulation's id.

## Why the files live here as well as in the database

The database row is what the app serves. The file is what gets reviewed: a real
diff in a pull request, readable history, and a source of truth to republish from
if a row is ever lost or overwritten. Treat the file as the original and the row
as a deployment of it.

## Quality bar

A canonical simulation is not just a working page.

- The physics, maths or logic must be correct. A simulation that looks right and
  teaches something false is worse than none.
- The student must be able to change something and see the consequence.
- It must work at phone width.
- It must carry a study guide. 92 of the 110 existing simulations have none,
  which leaves the AI tutor with nothing to work from.
- It must match the chapter it is filed under in the Punjab Curriculum and
  Textbook Board syllabus.
