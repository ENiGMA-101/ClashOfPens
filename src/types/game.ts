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

export type PenPattern =
  | 'none'
  | 'pinpoint_strip'
  | 'alltime_ribs'
  | 'iteen_grooves'
  | 'rio_carnival'
  | 'hischool_band'
  | 'crystal_facets'
  | 'envoy_gold'
  | 'radiant_glow'
  | 'woodmark_grain'
  | 'orbit_rings'
  | 'smoothy_wave'
  | 'stripes'
  | 'rain'
  | 'bolt'
  | 'petals'
  | 'chevron'
  | 'weave'
  | 'stars'
  | 'gold'
  | 'neon'
  | 'thunder'
  | 'flame'
  | 'frost'
  | 'dragon'
  | 'dots';

export type PenRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type PenGroup = 'basic' | 'matador' | 'special';

export type PenModelGeometry =
  | 'pinpoint'
  | 'alltime'
  | 'iteen'
  | 'hischool'
  | 'crystal'
  | 'executive'
  | 'ergonomic'
  | 'classic'
  | 'fantasy';

export interface PenSkin {
  id: string;
  name: string;
  banglaName?: string;
  group: PenGroup;
  rarity: PenRarity;
  price: number;
  isAuthentic: boolean;
  modelGeometry: PenModelGeometry;
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
  tipSize?: string;
  inkType?: string;
  colors?: string[]; // available ink/barrel color variations
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

export interface BotPersonality {
  id: string;
  name: string;
  banglaName: string;
  avatar: string;
  title: string;
  bio: string;
  skill: BotSkill;
  defaultSkinId: string;
  quips: {
    intro: string;
    flick: string;
    nearMiss: string;
    hit: string;
    knockout: string;
    victory: string;
    defeat: string;
  };
}

export interface PlayerConfig {
  id: string;
  name: string;
  skinId: string;
  isBot: boolean;
  botPersonalityId?: string;
  color?: string;
}

export interface InGamePlayer {
  id: string;
  name: string;
  skin: PenSkin;
  isBot: boolean;
  botPersonality?: BotPersonality;
  idx: number;
  body: any; // Matter.Body
  alive: boolean;
  lastPower: number;
  lastSide: AttackSideIndex;
  flickCount: number;
  knockouts: number;
  speech?: string;
  speechTime?: number;
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
  round: number;
  roundName: string;
  opponent: {
    name: string;
    skinId: string;
    skill: BotSkill;
    avatar: string;
    title: string;
    botPersonalityId?: string;
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
