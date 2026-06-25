-- KI-002 — diagnose & unblock a hanging tenant delete (Postgres).
-- Run inside the DB container WHILE the admin delete is hanging:
--   docker exec -it od-sasiada-pg psql -U postgres -d od_sasiada
-- See _bmad-output/KNOWN_ISSUES.md → KI-002.

-- 1) WHO IS WAITING, WHO IS BLOCKING ─────────────────────────────────────────
-- Look for the row whose query is `delete from "tenants" ...`.
--  • blocked_by non-empty + blocker `idle in transaction` → leaked transaction (Branch A).
--  • blocked_by empty + query genuinely running            → unindexed FK scans (Branch B).
SELECT pid,
       state,
       wait_event_type,
       wait_event,
       age(clock_timestamp(), xact_start) AS xact_age,
       pg_blocking_pids(pid)              AS blocked_by,
       left(query, 120)                   AS query
FROM pg_stat_activity
WHERE datname = current_database()
  AND state IS DISTINCT FROM 'idle'
ORDER BY xact_start NULLS LAST;

-- 2) ALL BACKENDS STUCK IN A TRANSACTION (the usual culprit) ──────────────────
SELECT pid,
       state,
       wait_event_type,
       wait_event,
       age(clock_timestamp(), xact_start) AS xact_age,
       left(query, 200)                   AS last_query
FROM pg_stat_activity
WHERE datname = current_database()
  AND state = 'idle in transaction'
ORDER BY xact_start;

-- 3) EXPLICIT LOCK GRAPH (which relation, which mode) ─────────────────────────
SELECT w.pid            AS waiting_pid,
       left(w.query,80) AS waiting_query,
       l.locktype,
       l.mode,
       c.relname        AS on_relation,
       b.pid            AS blocking_pid,
       b.state          AS blocking_state,
       left(b.query,80) AS blocking_last_query
FROM pg_stat_activity w
JOIN LATERAL unnest(pg_blocking_pids(w.pid)) AS bp(pid) ON true
JOIN pg_stat_activity b ON b.pid = bp.pid
LEFT JOIN pg_locks l ON l.pid = b.pid AND l.granted
LEFT JOIN pg_class c ON c.oid = l.relation
WHERE w.wait_event_type = 'Lock';

-- 4) BRANCH B CHECK — FK columns referencing `tenants` that LACK an index ──────
-- Any row returned = a sequential scan + row locks on every tenant delete.
-- Fix: CREATE INDEX CONCURRENTLY <name> ON <child_table>(<fk_column>);
SELECT c.conrelid::regclass AS child_table,
       a.attname            AS fk_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
WHERE c.contype = 'f'
  AND c.confrelid = 'tenants'::regclass
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid
      AND a.attnum = ANY (i.indkey::smallint[])
  );

-- 5) UNBLOCK NOW ─────────────────────────────────────────────────────────────
-- Surgical: cancel/kill the specific blocking pid from query (1).
--   SELECT pg_cancel_backend(<pid>);      -- gentle
--   SELECT pg_terminate_backend(<pid>);   -- hard kill
-- Nuke every transaction leaked for >30s:
--   SELECT pg_terminate_backend(pid)
--   FROM pg_stat_activity
--   WHERE datname = current_database()
--     AND state = 'idle in transaction'
--     AND age(clock_timestamp(), xact_start) > interval '30 seconds';
-- Sledgehammer (also rebuilds the app's poisoned pool): `docker restart od-sasiada-pg`
-- then restart `next dev`.
