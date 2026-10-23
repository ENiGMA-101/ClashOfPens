import { GameSettings, PlayerProgress } from '../types/game';
import { DEFAULT_SETTINGS } from './constants';

const SAVE_KEY = 'penfight.v2.save';
const SETTINGS_KEY = 'penfight.v2.settings';

export const INITIAL_PROGRESS: PlayerProgress = {
  version: 2,
  level: 1,
  xp: 0,
  coins: 200, // Starter coins
  matchesPlayed: 0,
  matchesWon: 0,
  knockoutsCount: 0,
  trickShotsCount: 0,
  unlockedSkins: ['blue', 'black'],
  equippedSkin: 'blue',
  equippedArena: 'classic',
  completedChallenges: [],
  championshipTrophies: 0,
  lastDailyDate: '',
  dailyStreak: 0,
};

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      // Check legacy v1 save
      const legacy = localStorage.getItem('penfight.setup');
      if (legacy) {
        return { ...INITIAL_PROGRESS, coins: 300 };
      }
      return { ...INITIAL_PROGRESS };
    }
    const parsed = JSON.parse(raw);
    return { ...INITIAL_PROGRESS, ...parsed };
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
