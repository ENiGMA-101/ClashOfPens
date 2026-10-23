import { TournamentMatch } from '../types/game';

export const CHAMPIONSHIP_ROUNDS: TournamentMatch[] = [
  {
    round: 1,
    roundName: 'Quarter-Final (কোয়ার্টার ফাইনাল)',
    opponent: {
      name: 'Tutul (Back-Bencher)',
      skinId: 'blue',
      skill: 'easy',
      avatar: '🎓',
      title: 'Class 9 Section B Fighter',
    },
    won: false,
    completed: false,
    rewardCoins: 150,
  },
  {
    round: 2,
    roundName: 'Semi-Final (সেমিফাইনাল)',
    opponent: {
      name: 'Rabiul Master',
      skinId: 'tiger',
      skill: 'normal',
      avatar: '🐯',
      title: 'Reigning School Champion',
    },
    won: false,
    completed: false,
    rewardCoins: 300,
  },
  {
    round: 3,
    roundName: 'Grand Final (গ্র্যান্ড ফাইনাল)',
    opponent: {
      name: 'The Golden Pen of Dhaka',
      skinId: 'gold',
      skill: 'sharp',
      avatar: '👑',
      title: 'Undefeated Desk Legend',
    },
    won: false,
    completed: false,
    rewardCoins: 750,
  },
];
