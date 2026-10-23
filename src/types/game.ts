export type AttackSideIndex = 0 | 1 | 2;

export interface AttackSide {
  id: AttackSideIndex;
  name: string;
  banglaName: string;
  offset: number; // along pen axis (-0.40 to 0.40)
  mult: number;   // velocity multiplier
  strike: number; // restitution/transfer factor
  dens: number;   // density multiplier
  title: string;
  desc: string;
}

export type PenPattern = 'none' | 'stripes' | 'rain' | 'bolt' | 'petals' | 'chevron' | 'weave' | 'stars' | 'gold' | 'neon' | 'dots';
export type PenRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface PenSkin {
  id: string;
  name: string;
  banglaName?: string;
  group: 'classic' | 'hero' | 'legendary';
  rarity: PenRarity;
  price: number;
  translucent?: boolean;
  body: string;
  cap: string;
  grip: string;
  clip: string;
  ui: string;
  accent?: string;
  pattern?: PenPattern;
  emblem?: boolean;
  glow?: string;
  lore: string;
}

export type SurfacePreset = 'polished' | 'normal' | 'rough';

export interface ArenaDesk {
  id: string;
  name: string;
  banglaName: string;
  desc: string;
  surface: SurfacePreset;
  frictionAir: number;
  theme: {
    baseHue: number;
    baseSat: number;
    baseLight: number;
    rimColor: string;
    scratchColor: string;
    chalkDoodles?: boolean;
    inkStains?: boolean;
    specular?: string;
  };
}

export type FallRule = 'strict' | 'center';
export type BotSkill = 'easy' | 'normal' | 'sharp';

export interface GameSettings {
  fall: FallRule;
  sound: boolean;
  music: boolean;
  vibrate: boolean;
  guide: boolean;
  desk: string; // arena ID
  skill: BotSkill;
  reducedMotion: boolean;
  dragFlickGesture: boolean;
}

export interface PlayerConfig {
  id: string;
  name: string;
  skinId: string;
  isBot: boolean;
  color?: string;
}

export interface InGamePlayer {
  id: string;
  name: string;
  skin: PenSkin;
  isBot: boolean;
  idx: number;
  body: any; // Matter.Body
  alive: boolean;
  lastPower: number;
  lastSide: AttackSideIndex;
  flickCount: number;
  knockouts: number;
}

export type GamePhase = 'aim' | 'launch' | 'moving' | 'settling' | 'over';
export type GameMode = 'quick' | 'practice' | 'pass_and_play' | 'ai_battle' | 'challenge' | 'championship';

export interface ChallengeItem {
  id: string;
  title: string;
  banglaTitle: string;
  desc: string;
  rewardCoins: number;
  rewardXp: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completed: boolean;
  targetCount: number;
  maxTurns: number;
  sideRequired?: AttackSideIndex;
  playerPos: { x: number; y: number; a: number };
  targets: Array<{ x: number; y: number; a: number; skinId: string; name: string }>;
}

export interface TournamentMatch {
  round: number; // 1: Quarter-Final, 2: Semi-Final, 3: Grand Final
  roundName: string;
  opponent: {
    name: string;
    skinId: string;
    skill: BotSkill;
    avatar: string;
    title: string;
  };
  won: boolean;
  completed: boolean;
  rewardCoins: number;
}

export interface PlayerProgress {
  version: number;
  level: number;
  xp: number;
  coins: number;
  matchesPlayed: number;
  matchesWon: number;
  knockoutsCount: number;
  trickShotsCount: number;
  unlockedSkins: string[];
  equippedSkin: string;
  equippedArena: string;
  completedChallenges: string[];
  championshipTrophies: number;
  lastDailyDate: string;
  dailyStreak: number;
}
