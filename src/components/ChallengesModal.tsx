import React from 'react';
import { X, Target, CheckCircle2, Play, Trophy, Coins } from 'lucide-react';
import { ChallengeItem, PlayerProgress } from '../types/game';
import { CHALLENGES_DATA } from '../game/challenges';
import { Sound } from '../game/audio';

interface ChallengesModalProps {
  progress: PlayerProgress;
  onClose: () => void;
  onStartChallenge: (challenge: ChallengeItem) => void;
}

export const ChallengesModal: React.FC<ChallengesModalProps> = ({
  progress,
  onClose,
  onStartChallenge,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-[#19110a] border-2 border-[#543319] rounded-2xl p-5 shadow-2xl text-[#f3f4f6] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3d2313] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-[#a855f7]" />
            <div>
              <h2 className="font-kalam font-bold text-2xl text-[#f5d061] leading-none">
                Challenge Mode <span className="font-bangla text-lg text-[#d8536b] font-normal">(চ্যালেঞ্জ মিশন)</span>
              </h2>
              <p className="text-xs text-gray-400">Master trick shots, angled spins, and edge defense</p>
            </div>
          </div>
          <button
            onClick={() => {
              Sound.playClick();
              onClose();
            }}
            aria-label="Close challenges modal"
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Missions List */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {CHALLENGES_DATA.map((ch) => {
            const isCompleted = progress.completedChallenges.includes(ch.id);

            return (
              <div
                key={ch.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                  isCompleted
                    ? 'border-emerald-600/40 bg-emerald-950/20'
                    : 'border-[#422614] bg-[#1a0e06] hover:border-[#6b3f21]'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-kalam font-bold text-lg text-white">
                      {ch.title}
                    </span>
                    <span className="font-bangla text-xs text-[#d8536b]">
                      {ch.banglaTitle}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ch.difficulty === 'Easy'
                          ? 'bg-emerald-950 text-emerald-300'
                          : ch.difficulty === 'Medium'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-rose-950 text-rose-300'
                      }`}
                    >
                      {ch.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{ch.desc}</p>

                  <div className="flex items-center gap-3 mt-2 text-xs font-bold text-amber-400">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      <span>+{ch.rewardCoins}</span>
                    </span>
                    <span className="flex items-center gap-1 text-purple-300">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>+{ch.rewardXp} XP</span>
                    </span>
                    <span className="text-[11px] text-gray-500 font-normal">
                      Limit: {ch.maxTurns} {ch.maxTurns === 1 ? 'Turn' : 'Turns'}
                    </span>
                  </div>
                </div>

                {/* Launch Button */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {isCompleted && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Done</span>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      Sound.playClick();
                      onStartChallenge(ch);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#d4af37] text-black font-kalam font-extrabold text-sm rounded-xl hover:brightness-110 active:scale-95 transition shadow"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isCompleted ? 'Replay' : 'Play'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
