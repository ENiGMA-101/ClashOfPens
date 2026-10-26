import React from 'react';
import { AlertTriangle, ArrowLeft, Play } from 'lucide-react';
import { Sound } from '../game/audio';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onStay,
  onLeave,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      data-testid="exit-confirm-modal"
    >
      <div className="w-full max-w-md bg-[#1c120a] border-2 border-amber-600/70 rounded-3xl p-6 sm:p-7 shadow-2xl text-center relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center text-amber-400 mb-4 shadow-inner">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="font-kalam font-bold text-2xl sm:text-3xl text-amber-100 tracking-tight mb-2">
          Do you want to leave the match?
        </h3>

        <p className="text-stone-300 text-sm leading-relaxed mb-6 font-sans">
          Your current match will be abandoned. Completed results and completed series scores will remain unchanged.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              Sound.playClick();
              onStay();
            }}
            data-testid="stay-match-btn"
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-stone-950 font-black text-sm shadow-lg shadow-emerald-700/30 active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <Play className="w-4 h-4 fill-stone-950" />
            Stay in Match
          </button>

          <button
            type="button"
            onClick={() => {
              Sound.playClick();
              onLeave();
            }}
            data-testid="leave-match-btn"
            className="py-3 px-4 rounded-2xl bg-stone-800 hover:bg-rose-950/80 border border-stone-700 hover:border-rose-700/60 text-stone-300 hover:text-rose-200 font-bold text-sm active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Leave Match
          </button>
        </div>
      </div>
    </div>
  );
};
