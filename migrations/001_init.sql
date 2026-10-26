-- ClashOfPens Neon PostgreSQL Schema Migration 001
-- Enables persistent user accounts, cloud saves, match history, and achievements

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub);

-- 2. Player Cloud Saves Table (with Optimistic Concurrency Control)
CREATE TABLE IF NOT EXISTS player_saves (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  save_version INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  coins INTEGER NOT NULL DEFAULT 200 CHECK (coins >= 0),
  unlocked_pens JSONB NOT NULL DEFAULT '["matador_pinpoint", "matador_alltime"]'::jsonb,
  equipped_pen_id VARCHAR(50) NOT NULL DEFAULT 'matador_pinpoint',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  challenge_progress JSONB NOT NULL DEFAULT '[]'::jsonb,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Match History Table
CREATE TABLE IF NOT EXISTS match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_mode VARCHAR(50) NOT NULL,
  result VARCHAR(20) NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  opponent_type VARCHAR(20) NOT NULL DEFAULT 'ai',
  opponent_name VARCHAR(100) NOT NULL,
  shots_taken INTEGER NOT NULL DEFAULT 0 CHECK (shots_taken >= 0),
  knockouts INTEGER NOT NULL DEFAULT 0 CHECK (knockouts >= 0),
  duration_seconds INTEGER DEFAULT 0 CHECK (duration_seconds >= 0),
  played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_history_user_id ON match_history(user_id);
CREATE INDEX IF NOT EXISTS idx_match_history_played_at ON match_history(played_at DESC);

-- 4. Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(80) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
