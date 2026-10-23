import React from 'react';
import {
  RotateCcw,
  RotateCw,
  RefreshCw,
  Check,
  AlertCircle,
  EyeOff,
  User,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { InGamePlayer, PlayerConfig } from '../types/game';
import { PenPlacement } from '../game/placement';
import { Sound } from '../game/audio';

interface PenPlacementHUDProps {
  playerConfigs: PlayerConfig[];
  currentPlacingIndex: number;
  draftPlacement: PenPlacement;
  isValid: boolean;
  validationError?: string;
  isHandover: boolean;
  isAiMatch: boolean;
  onUpdateDraft: (updates: Partial<PenPlacement>) => void;
  onResetPosition: () => void;
  onConfirmPlacement: () => void;
  onContinueHandover: () => void;
  onExit: () => void;
}

export const PenPlacementHUD: React.FC<PenPlacementHUDProps> = ({
  playerConfigs,
  currentPlacingIndex,
  draftPlacement,
  isValid,
  validationError,
  isHandover,
  isAiMatch,
  onUpdateDraft,
  onResetPosition,
  onConfirmPlacement,
  onContinueHandover,
  onExit,
}) => {
  const currentPlayer = playerConfigs[currentPlacingIndex] || playerConfigs[0];
  const totalPlayers = playerConfigs.length;

  // Degrees for friendly UI display
  const degrees = Math.round(((draftPlacement.angle * 180) / Math.PI) % 360);
  const normalizedDegrees = degrees < 0 ? degrees + 360 : degrees;

  const rotateBy = (deltaDeg: number) => {
    Sound.playClick();
    const rad = draftPlacement.angle + (deltaDeg * Math.PI) / 180;
    onUpdateDraft({ angle: rad });
  };

  // Handover Screen between human players
  if (isHandover) {
    const prevPlayer = playerConfigs[currentPlacingIndex - 1] || playerConfigs[0];
    const nextPlayer = playerConfigs[currentPlacingIndex] || playerConfigs[1];

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#120a05]/95 backdrop-blur-md animate-fade-in select-none"
        data-testid="handover-screen"
      >
        <div className="w-full max-w-md bg-gradient-to-b from-[#241308] to-[#170b04] border-2 border-[#643b1f] rounded-3xl p-6 sm:p-8 shadow-2xl text-center text-[#f3f4f6]">
          {/* Privacy Icon */}
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#3d200e] border-2 border-[#c29b38] flex items-center justify-center shadow-inner">
            <EyeOff className="w-10 h-10 text-[#f5d061] animate-pulse" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#d4af37]/20 text-[#f5d061] border border-[#d4af37]/40 mb-3">
            Private Handover • গোপন হস্তান্তর
          </span>

          <h2 className="text-2xl sm:text-3xl font-kalam font-bold text-[#f5d061] mb-2">
            {prevPlayer.name} has finished placing!
          </h2>

          <p className="text-sm sm:text-base text-[#d1d5db] mb-6 leading-relaxed">
            Please pass the device to <strong className="text-[#facc15] font-bold">{nextPlayer.name}</strong>.
            <br />
            <span className="text-xs text-[#9ca3af]">
              Previous pen positions are kept secret until everyone has confirmed.
            </span>
          </p>

          <div className="bg-[#1a0e07] border border-[#4a2b16] rounded-2xl p-4 mb-6 text-left flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2e190d] flex items-center justify-center text-[#f5d061] font-bold border border-[#5a331a]">
              {currentPlacingIndex + 1}
            </div>
            <div>
              <p className="text-xs text-[#9ca3af]">Up Next:</p>
              <p className="text-base font-bold text-[#f5d061]">{nextPlayer.name}</p>
            </div>
          </div>

          <button
            onClick={() => {
              Sound.playClick();
              onContinueHandover();
            }}
            data-testid="ready-to-place-btn"
            className="w-full py-4 px-6 bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#c29b38] hover:brightness-110 active:scale-[0.98] text-black font-kalam font-bold text-xl rounded-2xl shadow-lg shadow-[#d4af37]/25 flex items-center justify-center gap-2 transition"
          >
            <span>I am {nextPlayer.name} (Ready to Place)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Active Placement Phase Overlay
  return (
    <div
      className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-5 select-none"
      data-testid="placement-hud"
    >
      {/* Top Banner & Instructions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-4xl mx-auto w-full pointer-events-auto">
        {/* Player Status Card */}
        <div className="flex items-center gap-3 bg-[#1c120a]/90 backdrop-blur-md border border-[#5a361c] px-4 py-2.5 rounded-2xl shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#78350f] p-0.5 shadow">
            <div className="w-full h-full bg-[#241309] rounded-[10px] flex items-center justify-center text-[#f5d061]">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                Player {currentPlacingIndex + 1} of {totalPlayers}
              </span>
              <span className="text-[10px] bg-[#3d2313] text-[#e5e7eb] px-1.5 py-0.5 rounded font-mono">
                {normalizedDegrees}°
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-kalam font-bold text-white leading-tight">
              {currentPlayer.name}’s Placement
            </h1>
          </div>
        </div>

        {/* Central Instruction Badge */}
        <div className="bg-[#1c120a]/90 backdrop-blur-md border border-[#5a361c] px-4 py-2 rounded-2xl text-center shadow-xl">
          <p className="text-xs sm:text-sm font-semibold text-[#facc15] font-kalam">
            {isAiMatch
              ? '🎯 Drag your pen to a starting spot. Bot position is revealed upon confirmation!'
              : '🔒 Drag & rotate your pen privately. Opponents place after you!'}
          </p>
          <p className="text-[11px] text-[#9ca3af]">
            Touch/drag the pen on the table, adjust rotation, then confirm.
          </p>
        </div>

        {/* Exit Button */}
        <button
          onClick={() => {
            Sound.playClick();
            onExit();
          }}
          className="text-xs font-bold text-gray-400 hover:text-white bg-[#2a170d]/80 hover:bg-[#3d2313] px-3 py-2 rounded-xl border border-[#4d2b17] transition pointer-events-auto"
        >
          Exit Match
        </button>
      </div>

      {/* Bottom Floating Control Panel */}
      <div className="max-w-2xl mx-auto w-full pointer-events-auto flex flex-col gap-2.5 mb-1 sm:mb-2">
        {/* Validation Feedback Banner */}
        <div className="flex justify-center">
          {!isValid ? (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs sm:text-sm font-bold shadow-lg animate-bounce"
              data-testid="placement-error"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{validationError || 'Invalid position: keep pen inside desk boundaries'}</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-semibold shadow-md"
              data-testid="placement-valid"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Valid Starting Position • প্রস্তুত</span>
            </div>
          )}
        </div>

        {/* Rotation & Action Controls Bar */}
        <div className="bg-[#1c120a]/95 backdrop-blur-md border-2 border-[#5a361c] rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white">
          {/* Quick Rotation Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => rotateBy(-15)}
              data-testid="rotate-ccw-btn"
              title="Rotate Counter-Clockwise (-15°)"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#2d180d] hover:bg-[#432313] active:scale-95 border border-[#522d17] rounded-xl text-xs font-bold text-[#f5d061] transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>-15°</span>
            </button>

            <button
              onClick={() => rotateBy(15)}
              data-testid="rotate-cw-btn"
              title="Rotate Clockwise (+15°)"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#2d180d] hover:bg-[#432313] active:scale-95 border border-[#522d17] rounded-xl text-xs font-bold text-[#f5d061] transition"
            >
              <RotateCw className="w-4 h-4" />
              <span>+15°</span>
            </button>

            <button
              onClick={() => rotateBy(90)}
              title="Rotate 90 Degrees"
              className="px-2.5 py-1.5 bg-[#2d180d] hover:bg-[#432313] active:scale-95 border border-[#522d17] rounded-xl text-xs font-bold text-[#e5e7eb] transition"
            >
              90°
            </button>

            <button
              onClick={() => rotateBy(180)}
              title="Flip 180 Degrees"
              className="px-2.5 py-1.5 bg-[#2d180d] hover:bg-[#432313] active:scale-95 border border-[#522d17] rounded-xl text-xs font-bold text-[#e5e7eb] transition"
            >
              Flip 180°
            </button>
          </div>

          {/* Reset Position & Confirm Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                Sound.playClick();
                onResetPosition();
              }}
              data-testid="reset-placement-btn"
              title="Reset to default zone"
              className="flex items-center gap-1 px-3 py-2 bg-[#2a170d] hover:bg-[#3d2313] active:scale-95 border border-[#4d2b17] rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
              <span>Reset</span>
            </button>

            <button
              onClick={() => {
                if (!isValid) return;
                Sound.playClick();
                onConfirmPlacement();
              }}
              disabled={!isValid}
              data-testid="confirm-placement-btn"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-kalam font-bold text-base transition shadow-lg ${
                isValid
                  ? 'bg-gradient-to-r from-[#22c55e] to-[#15803d] hover:brightness-110 active:scale-95 text-white shadow-emerald-900/40 cursor-pointer'
                  : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Check className="w-5 h-5" />
              <span>Confirm Placement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
