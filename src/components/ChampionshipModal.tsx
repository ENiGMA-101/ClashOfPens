import React from 'react';
import { X, Trophy, Play, CheckCircle2, Coins, Crown } from 'lucide-react';
import { PlayerProgress, TournamentMatch } from '../types/game';
import { CHAMPIONSHIP_ROUNDS } from '../game/championship';
import { getSkin } from '../game/skins';
import { Sound } from '../game/audio';

interface ChampionshipModalProps {
  progress: PlayerProgress;
  onClose: () => void;
  onStartRound: (round: TournamentMatch) => void;
}

export const ChampionshipModal: React.FC<ChampionshipModalProps> = ({
  progress,
  onClose,
  onStartRound,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-[#19110a] border-2 border-[#543319] rounded-2xl p-5 shadow-2xl text-[#f3f4f6] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3d2313] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#ffd700]" />
            <div>
              <h2 className="font-kalam font-bold text-2xl text-[#f5d061] leading-none">
                Championship <span className="font-bangla text-lg text-[#d8536b] font-normal">(গ্র্যান্ড টুর্নামেন্ট)</span>
              </h2>
              <p className="text-xs text-gray-400">
                Fight your way through 3 rounds to become the Desk Legend
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              Sound.playClick();
              onClose();
            }}
            aria-label="Close championship modal"
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trophies Counter */}
        <div className="mb-4 bg-gradient-to-r from-[#2c190c] to-[#1a0f07] border border-[#d4af37]/30 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-[#3d2511] text-[#ffd700] border border-[#d4af37]/40 shadow">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-kalam font-bold text-base text-white">Your Trophy Cabinet</h3>
              <p className="text-xs text-gray-400">Total Cups Won: {progress.championshipTrophies}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold font-outfit text-[#ffd700]">
              🏆 {progress.championshipTrophies}
            </span>
          </div>
        </div>

        {/* Tournament Tree */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {CHAMPIONSHIP_ROUNDS.map((round, idx) => {
            const oppSkin = getSkin(round.opponent.skinId);
            return (
              <div
                key={round.round}
                className="bg-[#24150b] border border-[#422614] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#361e0f] border border-[#5c371d] flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                    {round.opponent.avatar}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider block">
                      Round {round.round} &middot; {round.roundName}
                    </span>
                    <h4 className="font-kalam font-bold text-lg text-white">
                      vs {round.opponent.name}
                    </h4>
                    <p className="text-xs text-gray-400">{round.opponent.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-400">Weapon:</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: oppSkin.ui }}
                      />
                      <span className="text-xs font-semibold text-gray-300">
                        {oppSkin.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Coins className="w-3.5 h-3.5" />
                    <span>+{round.rewardCoins}</span>
                  </div>

                  <button
                    onClick={() => {
                      Sound.playClick();
                      onStartRound(round);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f5d061] text-black font-kalam font-extrabold text-sm rounded-xl hover:brightness-110 active:scale-95 transition shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Duel</span>
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
