import { TournamentMatch } from '../types/game';

export const CHAMPIONSHIP_ROUNDS: TournamentMatch[] = [
  {
    round: 1,
    roundName: 'Quarter-Final (কোয়ার্টার ফাইনাল)',
    opponent: {
      name: 'Backbench Boss',
      skinId: 'matador_alltime',
      skill: 'easy',
      avatar: '👑',
      title: 'Last-Row Heavyweight',
    },
    won: false,
    completed: false,
    rewardCoins: 150,
  },
  {
    round: 2,
    roundName: 'Semi-Final (সেমিফাইনাল)',
    opponent: {
      name: 'Class Captain',
      skinId: 'matador_envoy_premium',
      skill: 'normal',
      avatar: '🎖️',
      title: 'Discipline Enforcer',
    },
    won: false,
    completed: false,
    rewardCoins: 300,
  },
  {
    round: 3,
    roundName: 'Grand Final (গ্র্যান্ড ফাইনাল)',
    opponent: {
      name: 'Matador Master',
      skinId: 'gold_champion',
      skill: 'sharp',
      avatar: '🏆',
      title: 'The Golden Champion',
    },
    won: false,
    completed: false,
    rewardCoins: 750,
  },
];
