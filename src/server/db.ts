import pg from 'pg';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

export const isDbConnected = Boolean(databaseUrl && !databaseUrl.includes('user:password@ep-sample'));

let pool: pg.Pool | null = null;

if (isDbConnected) {
  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.warn('Neon database pool background error:', err.message);
    });
  } catch (err) {
    console.warn('Failed to initialize Neon connection pool:', err);
    pool = null;
  }
}

// In-memory fallback store for offline / unconfigured database environments
const memoryUsers = new Map<string, any>();
const memorySaves = new Map<string, any>();
const memoryMatches = new Map<string, any[]>();

/**
 * Initializes database tables if Neon PostgreSQL is configured.
 */
export async function initDb() {
  if (!pool) {
    console.info('Running in offline/local storage mode (DATABASE_URL not configured for Neon).');
    return;
  }

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          google_sub VARCHAR(255) UNIQUE NOT NULL,
          display_name VARCHAR(100) NOT NULL,
          avatar_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

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
      `);
      console.info('Connected to Neon PostgreSQL database and verified tables.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('Neon database auto-migration notice:', err.message);
  }
}

/**
 * Finds or creates a user by Google sub identifier.
 */
export async function upsertGoogleUser(googleSub: string, displayName: string, avatarUrl?: string) {
  if (pool) {
    const result = await pool.query(
      `INSERT INTO users (google_sub, display_name, avatar_url, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (google_sub) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
           updated_at = NOW()
       RETURNING id, google_sub, display_name, avatar_url, created_at, updated_at`,
      [googleSub, displayName, avatarUrl || null]
    );
    return result.rows[0];
  }

  // Memory fallback
  let user = memoryUsers.get(googleSub);
  if (!user) {
    user = {
      id: 'local_' + Math.random().toString(36).substring(2, 10),
      google_sub: googleSub,
      display_name: displayName,
      avatar_url: avatarUrl || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryUsers.set(googleSub, user);
  } else {
    user.display_name = displayName;
    if (avatarUrl) user.avatar_url = avatarUrl;
    user.updated_at = new Date().toISOString();
  }
  return user;
}

/**
 * Gets user details by ID.
 */
export async function getUserById(userId: string) {
  if (pool) {
    const res = await pool.query(
      `SELECT id, google_sub, display_name, avatar_url, created_at, updated_at FROM users WHERE id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  for (const user of memoryUsers.values()) {
    if (user.id === userId) return user;
  }
  return null;
}

/**
 * Retrieves player save state with revision control.
 */
export async function getPlayerSave(userId: string) {
  if (pool) {
    const res = await pool.query(
      `SELECT user_id, save_version, xp, level, coins, unlocked_pens, equipped_pen_id, settings, challenge_progress, revision, updated_at
       FROM player_saves WHERE user_id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  return memorySaves.get(userId) || null;
}

/**
 * Saves player progress using Optimistic Concurrency Control (revision comparison).
 */
export async function savePlayerSave(
  userId: string,
  saveData: {
    xp: number;
    level: number;
    coins: number;
    unlockedPens: string[];
    equippedSkin: string;
    settings?: any;
    completedChallenges?: string[];
    revision: number;
  }
) {
  // Validate non-negative balances
  const safeXp = Math.max(0, Math.floor(saveData.xp || 0));
  const safeLevel = Math.max(1, Math.floor(saveData.level || 1));
  const safeCoins = Math.max(0, Math.floor(saveData.coins || 0));
  const safePens = Array.isArray(saveData.unlockedPens) ? saveData.unlockedPens : ['matador_pinpoint'];
  const safeSkin = saveData.equippedSkin || 'matador_pinpoint';
  const safeSettings = saveData.settings || {};
  const safeChallenges = Array.isArray(saveData.completedChallenges) ? saveData.completedChallenges : [];
  const clientRevision = Math.max(1, Math.floor(saveData.revision || 1));

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existingRes = await client.query(
        `SELECT revision FROM player_saves WHERE user_id = $1 FOR UPDATE`,
        [userId]
      );

      if (existingRes.rows.length > 0) {
        const currentRev = existingRes.rows[0].revision;
        // Optimistic check: if client revision is strictly older than current revision
        if (clientRevision < currentRev) {
          await client.query('ROLLBACK');
          return {
            success: false,
            conflict: true,
            currentRevision: currentRev,
            message: 'Cloud save has a newer revision. Please resolve conflicts.',
          };
        }

        const nextRev = currentRev + 1;
        const updateRes = await client.query(
          `UPDATE player_saves
           SET xp = $2, level = $3, coins = $4, unlocked_pens = $5, equipped_pen_id = $6,
               settings = $7, challenge_progress = $8, revision = $9, updated_at = NOW()
           WHERE user_id = $1
           RETURNING *`,
          [
            userId,
            safeXp,
            safeLevel,
            safeCoins,
            JSON.stringify(safePens),
            safeSkin,
            JSON.stringify(safeSettings),
            JSON.stringify(safeChallenges),
            nextRev,
          ]
        );
        await client.query('COMMIT');
        return { success: true, save: updateRes.rows[0] };
      } else {
        // Initial insert
        const insertRes = await client.query(
          `INSERT INTO player_saves (user_id, xp, level, coins, unlocked_pens, equipped_pen_id, settings, challenge_progress, revision)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
           RETURNING *`,
          [
            userId,
            safeXp,
            safeLevel,
            safeCoins,
            JSON.stringify(safePens),
            safeSkin,
            JSON.stringify(safeSettings),
            JSON.stringify(safeChallenges),
          ]
        );
        await client.query('COMMIT');
        return { success: true, save: insertRes.rows[0] };
      }
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Memory fallback
  const existing = memorySaves.get(userId);
  if (existing && clientRevision < existing.revision) {
    return {
      success: false,
      conflict: true,
      currentRevision: existing.revision,
      message: 'Cloud save has a newer revision.',
    };
  }

  const nextRev = existing ? existing.revision + 1 : 1;
  const newSave = {
    user_id: userId,
    save_version: 1,
    xp: safeXp,
    level: safeLevel,
    coins: safeCoins,
    unlocked_pens: safePens,
    equipped_pen_id: safeSkin,
    settings: safeSettings,
    challenge_progress: safeChallenges,
    revision: nextRev,
    updated_at: new Date().toISOString(),
  };
  memorySaves.set(userId, newSave);
  return { success: true, save: newSave };
}

/**
 * Records a completed match into match_history.
 */
export async function recordMatchHistory(
  userId: string,
  matchData: {
    matchMode: string;
    result: 'win' | 'loss' | 'draw';
    opponentType: string;
    opponentName: string;
    shotsTaken: number;
    knockouts: number;
    durationSeconds?: number;
  }
) {
  if (pool) {
    const res = await pool.query(
      `INSERT INTO match_history (user_id, match_mode, result, opponent_type, opponent_name, shots_taken, knockouts, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        matchData.matchMode,
        matchData.result,
        matchData.opponentType || 'ai',
        matchData.opponentName || 'Unknown Opponent',
        matchData.shotsTaken || 0,
        matchData.knockouts || 0,
        matchData.durationSeconds || 0,
      ]
    );
    return res.rows[0];
  }

  const list = memoryMatches.get(userId) || [];
  const item = {
    id: 'match_' + Math.random().toString(36).substring(2, 9),
    user_id: userId,
    match_mode: matchData.matchMode,
    result: matchData.result,
    opponent_type: matchData.opponentType,
    opponent_name: matchData.opponentName,
    shots_taken: matchData.shotsTaken,
    knockouts: matchData.knockouts,
    duration_seconds: matchData.durationSeconds || 0,
    played_at: new Date().toISOString(),
  };
  list.unshift(item);
  memoryMatches.set(userId, list.slice(0, 50));
  return item;
}

/**
 * Retrieves match history for a user.
 */
export async function getRecentMatches(userId: string, limit = 20) {
  if (pool) {
    const res = await pool.query(
      `SELECT id, match_mode, result, opponent_type, opponent_name, shots_taken, knockouts, duration_seconds, played_at
       FROM match_history
       WHERE user_id = $1
       ORDER BY played_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  }

  return (memoryMatches.get(userId) || []).slice(0, limit);
}

/**
 * Deletes user account and associated cloud data.
 */
export async function deleteUserAccountData(userId: string) {
  if (pool) {
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    return true;
  }

  for (const [sub, user] of memoryUsers.entries()) {
    if (user.id === userId) {
      memoryUsers.delete(sub);
      break;
    }
  }
  memorySaves.delete(userId);
  memoryMatches.delete(userId);
  return true;
}
