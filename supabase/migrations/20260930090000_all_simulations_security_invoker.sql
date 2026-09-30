-- Make all_simulations respect the caller's Row Level Security.
--
-- The view was created without security_invoker, so it executed with its owner's
-- privileges (postgres) and bypassed RLS on every table beneath it. Anonymous
-- requests returned all simulation payloads, while the classes, subjects and
-- topics tables correctly returned nothing to the same caller.
--
-- With security_invoker = on the view is evaluated as the querying role, so the
-- existing policies apply:
--   * anon          -> no rows (no anon SELECT policy on the simulation tables)
--   * authenticated -> all rows ("Enable read access for authenticated users")
--   * admins        -> all rows ("Enable all access for admins")
--
-- Both panels require a login before reading simulations, so no signed-in
-- behaviour changes. Only anonymous access is closed.

alter view "public"."all_simulations" set (security_invoker = on);
