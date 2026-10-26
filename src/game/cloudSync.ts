/**
 * Cloud Save & Authentication Client for Neon PostgreSQL + Google Sign-In.
 */

import { PlayerProgress } from '../types/game';

export type SyncStatus = 'saved' | 'syncing' | 'offline' | 'error';

export interface UserSession {
  authenticated: boolean;
  user?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    googleSub?: string;
  };
  isDbConnected: boolean;
}

/**
 * Checks current authentication session.
 */
export async function checkSession(): Promise<UserSession> {
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) {
      return { authenticated: false, isDbConnected: false };
    }
    return await res.json();
  } catch {
    return { authenticated: false, isDbConnected: false };
  }
}

/**
 * Sends Google credential / profile to backend.
 */
export async function authenticateWithGoogle(
  credential?: string,
  profile?: { sub: string; name: string; picture?: string }
): Promise<{ success: boolean; user?: any; save?: any; error?: string }> {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential, profile }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Authentication failed' };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Logs out of session.
 */
export async function logoutSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Synchronizes local progress with Neon cloud save.
 */
export async function syncProgressToCloud(
  local: PlayerProgress,
  revision = 1
): Promise<{ success: boolean; cloudSave?: any; conflict?: boolean; error?: string }> {
  try {
    const payload = {
      xp: local.xp,
      level: local.level,
      coins: local.coins,
      unlockedPens: local.unlockedSkins,
      equippedSkin: local.equippedSkin,
      settings: {
        equippedArena: local.equippedArena,
        championshipTrophies: local.championshipTrophies,
      },
      completedChallenges: local.completedChallenges,
      revision,
    };

    const res = await fetch('/api/save', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.status === 409) {
      return { success: false, conflict: true, cloudSave: data.save };
    }

    if (!res.ok) {
      return { success: false, error: data.error || 'Sync failed' };
    }

    return { success: true, cloudSave: data.save };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Records a completed match in cloud history.
 */
export async function recordCloudMatch(matchData: {
  matchMode: string;
  result: 'win' | 'loss' | 'draw';
  opponentType: string;
  opponentName: string;
  shotsTaken: number;
  knockouts: number;
  durationSeconds?: number;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(matchData),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Deletes user account and cloud progress.
 */
export async function deleteCloudAccount(): Promise<boolean> {
  try {
    const res = await fetch('/api/account', {
      method: 'DELETE',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}
