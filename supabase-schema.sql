-- ============================================================
-- Chess Royal · IPDC MCQ — Supabase Database Schema
-- Run this entire file in Supabase SQL Editor to set up DB
-- ============================================================

-- ── Users Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  username    text        UNIQUE NOT NULL,
  batch       text,
  xp          integer     NOT NULL DEFAULT 0,
  level       text        NOT NULL DEFAULT 'Pawn',
  badges      jsonb       NOT NULL DEFAULT '[]',
  streak      integer     NOT NULL DEFAULT 0,
  last_played date,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Scores Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scores (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES public.users(id) ON DELETE CASCADE,
  username    text        NOT NULL,
  score       integer     NOT NULL,
  total       integer     NOT NULL DEFAULT 100,
  percentage  numeric(5,2),
  rating      text,
  time_taken  integer,    -- seconds, NULL for non-timed attempts
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Achievements Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.achievements (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id    text        NOT NULL,
  earned_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- ── Battles Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.battles (
  id                  uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_code         text    UNIQUE NOT NULL,
  question_indices    text    NOT NULL,   -- JSON array of 10 question indices
  creator_id          uuid    REFERENCES public.users(id),
  creator_username    text    NOT NULL,
  creator_score       integer,
  challenger_id       uuid    REFERENCES public.users(id),
  challenger_username text,
  challenger_score    integer,
  status              text    NOT NULL DEFAULT 'waiting',  -- waiting | active | complete
  created_at          timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz
);

-- ── Leaderboard View ─────────────────────────────────────────
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  u.username,
  u.batch,
  MAX(s.score)                        AS best_score,
  ROUND(MAX(s.percentage)::numeric, 0) AS percentage,
  (
    SELECT s2.rating
    FROM public.scores s2
    WHERE s2.user_id = u.id
    ORDER BY s2.score DESC, s2.created_at DESC
    LIMIT 1
  )                                    AS rating_icon,
  COUNT(s.id)::integer                 AS attempts
FROM public.users u
JOIN public.scores s ON s.user_id = u.id
GROUP BY u.id, u.username, u.batch
ORDER BY best_score DESC;

-- ── Daily Champions View ──────────────────────────────────────
CREATE OR REPLACE VIEW public.daily_champions AS
SELECT
  u.username,
  u.batch,
  s.score,
  s.percentage,
  s.rating,
  s.created_at
FROM public.scores s
JOIN public.users u ON u.id = s.user_id
WHERE s.created_at::date = CURRENT_DATE
ORDER BY s.score DESC, s.time_taken ASC NULLS LAST
LIMIT 10;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles      ENABLE ROW LEVEL SECURITY;

-- Users: anyone can read; insert/update using anon key
CREATE POLICY "users_select_all"   ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_anon"  ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_anon"  ON public.users FOR UPDATE USING (true) WITH CHECK (true);

-- Scores: public read, anyone can insert their own
CREATE POLICY "scores_select_all"  ON public.scores FOR SELECT USING (true);
CREATE POLICY "scores_insert_anon" ON public.scores FOR INSERT WITH CHECK (true);

-- Achievements: public read, insert only
CREATE POLICY "ach_select_all"     ON public.achievements FOR SELECT USING (true);
CREATE POLICY "ach_insert_anon"    ON public.achievements FOR INSERT WITH CHECK (true);

-- Battles: full access (no auth required for this app)
CREATE POLICY "battles_all"        ON public.battles FOR ALL USING (true) WITH CHECK (true);

-- Grant SELECT on views to anon role
GRANT SELECT ON public.leaderboard       TO anon, authenticated;
GRANT SELECT ON public.daily_champions   TO anon, authenticated;

-- ── Indexes for performance ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_scores_user_id    ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON public.scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_score      ON public.scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_battles_code      ON public.battles(battle_code);
CREATE INDEX IF NOT EXISTS idx_users_username    ON public.users(username);
