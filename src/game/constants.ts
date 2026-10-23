import { AttackSide, GameSettings } from '../types/game';

export const PEN_LENGTH = 170;
export const PEN_WIDTH = 16;
export const BASE_DENSITY = 0.002;
export const BASE_RESTITUTION = 0.22;
export const SUB_DT = 1000 / 120;
export const DESK_MARGIN = 34;
export const MAX_SPEED = 42;

export const DESK_FRICTION_MAP: Record<string, number> = {
  polished: 0.035,
  normal: 0.05,
  rough: 0.068,
};

export const ATTACK_SIDES: AttackSide[] = [
  {
    id: 0,
    name: 'Top Strike (Side 1)',
    banglaName: 'শীর্ষ আঘাত (সাইড ১)',
    offset: 0.40,
    mult: 1.08,
    strike: 0.60,
    dens: 1.0,
    title: 'Spinning Nib Attack',
    desc: 'Strikes the top (nib) end. Pen spins dynamically as it slides, sweeping a wide arc to clip curved targets.',
  },
  {
    id: 1,
    name: 'Middle Push (Side 2)',
    banglaName: 'সরাসরি ধাক্কা (সাইড ২)',
    offset: 0.00,
    mult: 0.92,
    strike: 0.98,
    dens: 1.05,
    title: 'Direct Momentum Transfer',
    desc: 'Straight trajectory, zero spin, shorter slide reach. On a clean direct hit, stops dead and launches the enemy pen over the edge.',
  },
  {
    id: 2,
    name: 'Bottom Slam (Side 3)',
    banglaName: 'ভারী আঘাত (সাইড ৩)',
    offset: -0.40,
    mult: 1.22,
    strike: 0.28,
    dens: 1.85,
    title: 'Heavyweight Bulldoze',
    desc: 'Strikes the bottom (cap) end. Pen gains heavy momentum with high mass. Long reach bulldozing through, but beware rolling off!',
  },
];

export const DEFAULT_SETTINGS: GameSettings = {
  fall: 'strict',
  sound: true,
  music: true,
  vibrate: true,
  guide: true,
  desk: 'classic',
  skill: 'normal',
  reducedMotion: false,
  dragFlickGesture: true,
};

export const BOT_NAMES = ['Rabiul Master', 'Bot Tutul', 'Bot Shimul', 'Bot Mitu', 'Exam Proctor Bot'];
