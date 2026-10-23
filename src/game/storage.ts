import { GameSettings, PlayerProgress } from '../types/game';
import { DEFAULT_SETTINGS } from './constants';
import { DEFAULT_PEN_ID } from './skins';

const SAVE_KEY = 'penfight.v3.save';
const LEGACY_V2_KEY = 'penfight.v2.save';
const SETTINGS_KEY = 'penfight.v3.settings';

export const INITIAL_PROGRESS: PlayerProgress = {
  version: 3,
  level: 1,
  xp: 0,
  coins: 250, // Starter coins
  matchesPlayed: 0,
  matchesWon: 0,
  knockoutsCount: 0,
  trickShotsCount: 0,
  unlockedSkins: ['matador_pinpoint', 'matador_alltime'],
  equippedSkin: DEFAULT_PEN_ID, // Strictly Matador Pin-Point
  equippedArena: 'classic',
  completedChallenges: [],
  championshipTrophies: 0,
  lastDailyDate: '',
  dailyStreak: 0,
};

export function loadProgress(): PlayerProgress {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_V2_KEY);
    }
    if (!raw) {
      return { ...INITIAL_PROGRESS };
    }
    const parsed = JSON.parse(raw);
    const progress: PlayerProgress = { ...INITIAL_PROGRESS, ...parsed };

    // Migration logic to ensure Matador Pin-Point and Matador All-Time are present
    if (!progress.unlockedSkins.includes('matador_pinpoint')) {
      progress.unlockedSkins.push('matador_pinpoint');
    }
    if (!progress.unlockedSkins.includes('matador_alltime')) {
      progress.unlockedSkins.push('matador_alltime');
    }

    // If equipped skin was the old generic 'blue' or invalid, set to Matador Pin-Point
    if (progress.equippedSkin === 'blue' || !progress.equippedSkin) {
      progress.equippedSkin = 'matador_pinpoint';
    }

    return progress;
  } catch {
    return { ...INITIAL_PROGRESS };
  }
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
  } catch {}
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}

export function xpForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100;
}
