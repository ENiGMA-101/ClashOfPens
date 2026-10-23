import React from 'react';
import { X, Check, Flame } from 'lucide-react';
import { ARENAS_DATA } from '../game/arenas';
import { Sound } from '../game/audio';

interface ArenaSelectorModalProps {
  currentArenaId: string;
  onSelectArena: (id: string) => void;
  onClose: () => void;
}

export const ArenaSelectorModal: React.FC<ArenaSelectorModalProps> = ({
  currentArenaId,
  onSelectArena,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-[#19110a] border-2 border-[#543319] rounded-2xl p-5 shadow-2xl text-[#f3f4f6] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3d2313] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-[#f5c518]" />
            <div>
              <h2 className="font-kalam font-bold text-2xl text-[#f5d061] leading-none">
                Desk Arenas <span className="font-bangla text-lg text-[#d8536b] font-normal">(ডেস্ক অ্যারেনা)</span>
              </h2>
              <p className="text-xs text-gray-400">Select wooden desk surfaces and friction levels</p>
            </div>
          </div>
          <button
            onClick={() => {
              Sound.playClick();
              onClose();
            }}
            aria-label="Close arena selector"
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Arenas Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
          {ARENAS_DATA.map((arena) => {
            const isEquipped = currentArenaId === arena.id;
            return (
              <div
                key={arena.id}
                onClick={() => {
                  Sound.playClick();
                  onSelectArena(arena.id);
                }}
                className={`cursor-pointer p-3.5 rounded-xl border flex flex-col justify-between transition relative ${
                  isEquipped
                    ? 'border-[#f5c518] bg-[#2d1b0f] shadow-lg shadow-[#d4af37]/10'
                    : 'border-[#3d2414] bg-[#1a0e06] hover:border-[#6b3f21]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-kalam font-bold text-lg text-white">
                      {arena.name}
                    </span>
                    {isEquipped && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <span className="font-bangla text-xs text-[#d8536b] block mt-0.5">
                    {arena.banglaName}
                  </span>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{arena.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Surface Friction:</span>
                  <span
                    className={`font-bold capitalize px-2 py-0.5 rounded ${
                      arena.surface === 'polished'
                        ? 'bg-blue-950 text-blue-300'
                        : arena.surface === 'rough'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-emerald-950 text-emerald-300'
                    }`}
                  >
                    {arena.surface}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
