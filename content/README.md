# Canonical simulation content

Hand-authored, reviewed simulations. These are the curated library — distinct
from anything the in-app AI generator produces.

## Layout

One folder per simulation, holding three files:

```text
content/simulations/<class>/<subject-slug>/<chapter-no>-<topic-slug>/
├── simulation.html     the interactive page — becomes code_payload
├── description.html    "Simulation Details" panel and AI tutor context — becomes topics.description
└── study-guide.html    exported study guide — becomes topics.study_guide
```

Example:

```text
content/simulations/class-9/computer_science/02-number-system-conversion-workshop/
```

The chapter number prefix is `chapters.chapter_no`, not a running count, so several
simulations in the same chapter share a prefix.

Each subject folder has a `CATALOG.md` listing every planned simulation, its
chapter and its status.

## What each file is for

This matters because the three files reach students by different routes.

**`simulation.html`** is loaded raw into an iframe's `srcdoc`. It is not sanitised.

**`description.html`** is the most important text in the package. The student
panel shows it in the "Simulation Details" panel (`GuidePanel.jsx`), **and it is the
only context the AI tutor receives** (`Chatbot.jsx` passes `simulation.description`
to `chat-tutor` as `details`). A thin description means a tutor that knows nothing
about the simulation. It is HTML, sanitised with DOMPurify before display. Use
`<sub>` and `<sup>` for notation rather than LaTeX.

**`study-guide.html`** is HTML, used by the PDF and Word export features. It is not
shown in the viewer.

## The frame every simulation runs in

Two platform facts shape how a simulation must be built. Both come from
`student-panel/src/components/common/ResponsiveSimulationFrame.jsx`.

**It is a fixed 1024 × 768 canvas, scaled down to fit.** Tutre renders the iframe at
exactly 1024 × 768 and shrinks it with a CSS transform. The simulation never sees
the real screen width, so CSS media queries do not make it responsive. Design for
1024 × 768 exactly, with nothing overflowing it, and use generous type — on a
375 px phone the whole frame is drawn at about 35% size.

**It is sandboxed with `allow-scripts` only.** The page runs in an opaque origin:

- No `localStorage`, `sessionStorage`, IndexedDB or cookies — they throw.
- No `alert`, `confirm` or `prompt` — they are silently blocked.
- No network requests, and no external scripts, fonts or images. Everything inline.
- The parent page cannot read the iframe's DOM, so the study-guide export's
  simulation snapshot is always skipped.

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
  'Class 9',                        -- classes.name
  'computer_science',               -- subjects.slug
  2,                                -- chapters.chapter_no
  'Number-System Conversion Workshop',
  $tutre$ ...description.html... $tutre$,
  $tutre$ ...study-guide.html... $tutre$,
  $tutre$ ...simulation.html... $tutre$
) as sim_id;
```

Use `$tutre$ ... $tutre$` dollar quoting. The HTML contains quotes, backslashes and
`$` signs that ordinary quoting would mangle; check that none of the three files
contains the literal `$tutre$` before publishing.

## Verifying before publishing

A simulation is not done because it renders. Before publishing:

1. **Correctness, exhaustively.** If the simulation computes something, drive it
   across its whole input range and compare against an independent result. The
   number-conversion workshop was checked across 522 conversions, comparing both
   the final answer and the answer derived step by step.
2. **Inside the real sandbox.** Load it in an iframe with `sandbox="allow-scripts"`
   and `srcdoc`, and confirm there are no console errors.
3. **At exactly 1024 × 768.** Confirm no element extends past the frame — with the
   longest messages and largest inputs showing, not just the defaults.
4. **Every arithmetic claim in the description and study guide**, checked by
   script, not by eye.
5. **A human reviewer against the textbook.** Terminology and examples must match
   the Punjab Curriculum and Textbook Board book, which the author may not have.

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
- It must never hand over an unexplained answer; the working must be visible.
- It must include a prediction, a check for understanding, and a reset that
  returns to the same state every time.
- It must be keyboard operable, must not rely on colour alone, and must respect
  reduced motion.
- It must fit 1024 × 768 without clipping.
- It must carry a description and a study guide. 92 of the 110 legacy simulations
  have no study guide.
- It must match the chapter it is filed under in the Punjab Curriculum and
  Textbook Board syllabus.
