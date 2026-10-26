import { AttackSide, GameSettings } from '../types/game';

export const PEN_LENGTH = 170;
export const PEN_WIDTH = 16;
export const BASE_DENSITY = 0.002;
export const BASE_RESTITUTION = 0.22;
export const SUB_DT = 1000 / 120;
export const DESK_MARGIN = 34;
export const MAX_SPEED = 28;

export const DESK_FRICTION_MAP: Record<string, number> = {
  polished: 0.038,
  normal: 0.048,
  rough: 0.062,
};

export const ATTACK_SIDES: AttackSide[] = [
  {
    id: 0,
    name: 'Top Strike (Side 1)',
    banglaName: 'শীর্ষ আঘাত (সাইড ১)',
    offset: 0.38,
    mult: 1.00,
    strike: 0.65,
    dens: 1.0,
    title: 'Spinning Nib Attack',
    desc: 'Strikes the top (nib) end. Pen curves dynamically with gyroscopic spin, ideal for clipping around blockers.',
  },
  {
    id: 1,
    name: 'Middle Push (Side 2)',
    banglaName: 'সরাসরি ধাক্কা (সাইড ২)',
    offset: 0.00,
    mult: 0.95,
    strike: 0.96,
    dens: 1.05,
    title: 'Direct Momentum Transfer',
    desc: 'Strikes dead center. Zero spin, straight predictable line. Maximizes clean impact transfer on target.',
  },
  {
    id: 2,
    name: 'Bottom Slam (Side 3)',
    banglaName: 'ভারী আঘাত (সাইড ৩)',
    offset: -0.38,
    mult: 1.10,
    strike: 0.40,
    dens: 1.65,
    title: 'Heavyweight Bulldoze',
    desc: 'Strikes the heavy rear cap. Heavy inertia bulldozes through targets, but high momentum risks sliding off!',
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
