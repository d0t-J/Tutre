## What changed

<!-- One or two sentences. What does this do that the code did not do before? -->

## Why

<!-- Link the issue, or explain the problem this solves. -->

Closes #

## Scope

- [ ] This branch covers **one** concern
- [ ] No unrelated files are in the diff
- [ ] Existing behaviour is preserved (if not, describe the change below)

<!-- If behaviour changes, say exactly what and who it affects. -->

## Verification

Paste the result, do not just tick the box.

- [ ] `npm run build --prefix admin-panel`
- [ ] `npm run lint  --prefix admin-panel`
- [ ] `npm run build --prefix student-panel`
- [ ] `npm run lint  --prefix student-panel`

**Screens exercised in a browser:**

<!-- e.g. "Admin > Create Simulation > wizard step 3, saved a physics sim and
     reopened it. Student > viewer, simulation rendered, tutor replied." -->

**Not verified:**

<!-- Anything you could not test, and why. An honest gap is fine. -->

## Database

- [ ] No schema change
- [ ] Schema change, and a migration is included in `supabase/migrations/`
- [ ] Destructive change — **approved by:** <!-- name -->

## Security

- [ ] No secrets, keys or `.env` files in the diff
- [ ] Iframe sandbox and HTML sanitisation are unchanged, or the change is
      explained below
- [ ] No RLS policy was disabled or loosened

## Screenshots

<!-- For any visible change. Before and after if you can. -->
