import React from 'react';
import { RotateCcw, RotateCw, Check, AlertCircle, Shield, EyeOff, Move, Compass, ArrowRight } from 'lucide-react';
import { InGamePlayer } from '../types/game';
import { PenPlacement, ValidationResult } from '../game/placement';

interface PlacementOverlayProps {
  player: InGamePlayer;
  playerIndex: number;
  totalPlayers: number;
  placement: PenPlacement;
  validation: ValidationResult;
  isHandover: boolean;
  handoverPlayer: InGamePlayer | null;
  allConfirmed: boolean;
  onUpdatePlacement: (update: Partial<PenPlacement>) => void;
  onResetPlacement: () => void;
  onConfirmPlacement: () => void;
  onReadyFromHandover: () => void;
}

export const PlacementOverlay: React.FC<PlacementOverlayProps> = ({
  player,
  playerIndex,
  totalPlayers,
  placement,
  validation,
  isHandover,
  handoverPlayer,
  allConfirmed,
  onUpdatePlacement,
  onResetPlacement,
  onConfirmPlacement,
  onReadyFromHandover,
}) => {
  // If in secret handover state between human players in pass-and-play
  if (isHandover && handoverPlayer) {
    return (
      <div
        className="absolute inset-0 z-50 flex items-center justify-center bg-[#0d1211]/96 backdrop-blur-md px-4 select-none animate-fadeIn"
        data-testid="handover-screen"
      >
        <div className="w-full max-w-md bg-[#18201e] border-2 border-amber-600/60 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Subtle wood grain background glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center text-amber-300 shadow-inner mb-4">
            <EyeOff className="w-10 h-10 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            Secret Pen Setup
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-amber-100 tracking-tight mb-2">
            Pass Device to {handoverPlayer.name}
          </h2>

          <p className="text-stone-300 text-sm leading-relaxed mb-6">
            Previous player’s pen position is kept completely hidden. Hand the device to{' '}
            <strong className="text-amber-300 font-bold">{handoverPlayer.name}</strong> to place their pen in private!
          </p>

          <div className="p-3.5 rounded-2xl bg-[#0f1413] border border-stone-800 text-stone-400 text-xs mb-6 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Device locked until recipient confirms ready
          </div>

          <button
            onClick={onReadyFromHandover}
            data-testid="ready-placement-btn"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-black text-lg shadow-xl shadow-amber-600/30 active:scale-98 transition flex items-center justify-center gap-2"
          >
            I am {handoverPlayer.name} — Ready to Place
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // All confirmed banner transition
  if (allConfirmed) {
    return (
      <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
        <div className="bg-[#18201e]/95 border border-amber-500/60 rounded-3xl px-8 py-6 text-center shadow-2xl animate-scaleUp">
          <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
            Placements Confirmed!
          </div>
          <div className="text-3xl font-black text-white">ALL PENS READY</div>
          <div className="text-stone-300 text-sm mt-1">Starting desk brawl...</div>
        </div>
      </div>
    );
  }

  const deg = Math.round((placement.angle * 180) / Math.PI);
  const normalizedDeg = ((deg % 360) + 360) % 360;

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 pointer-events-none flex flex-col justify-end"
      data-testid="placement-overlay"
    >
      {/* Top Banner Status */}
      <div className="absolute top-16 left-0 right-0 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto bg-[#18201ebd] backdrop-blur-md border border-stone-700/80 rounded-2xl px-5 py-3 shadow-2xl flex flex-col items-center max-w-lg w-full">
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20"
                style={{ backgroundColor: player.skin.ui }}
              />
              <span className="font-bold text-amber-200 text-sm sm:text-base">
                {player.name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                Player {playerIndex + 1}/{totalPlayers}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs font-medium text-stone-400 block truncate max-w-[140px]">
                {player.skin.name}
              </span>
            </div>
          </div>

          {/* Validation Notice Badge */}
          <div className="w-full mt-2.5">
            {validation.valid ? (
              <div
                data-testid="placement-valid-badge"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-600/50 text-emerald-300 text-xs font-medium"
              >
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Valid Position — Ready to confirm placement</span>
              </div>
            ) : (
              <div
                data-testid="placement-invalid-badge"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs font-medium animate-pulse"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{validation.reason || 'Invalid position on table'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Placement Controls Bar */}
      <div className="pointer-events-auto w-full max-w-2xl mx-auto px-4 pb-4">
        <div className="bg-[#18201ee8] backdrop-blur-md border border-stone-700/90 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
          {/* Instructions row */}
          <div className="flex items-center justify-between text-xs text-stone-300 pb-1 border-b border-stone-800">
            <div className="flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-amber-400" />
              <span>Drag pen on desk to position</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-amber-300">
              <Compass className="w-3.5 h-3.5" />
              <span>Angle: {normalizedDeg}°</span>
            </div>
          </div>

          {/* Rotation Quick Buttons & Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onUpdatePlacement({ angle: placement.angle - Math.PI / 12 })}
                className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1 active:scale-95 transition"
                title="Rotate counter-clockwise 15 degrees"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                -15°
              </button>

              <button
                type="button"
                onClick={() => onUpdatePlacement({ angle: placement.angle - Math.PI / 4 })}
                className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1 active:scale-95 transition"
                title="Rotate counter-clockwise 45 degrees"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                -45°
              </button>

              <button
                type="button"
                onClick={() => onUpdatePlacement({ angle: placement.angle + Math.PI })}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold active:scale-95 transition"
                title="Flip 180 degrees"
              >
                Flip 180°
              </button>

              <button
                type="button"
                onClick={() => onUpdatePlacement({ angle: placement.angle + Math.PI / 4 })}
                className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1 active:scale-95 transition"
                title="Rotate clockwise 45 degrees"
              >
                +45°
                <RotateCw className="w-3 h-3 text-amber-400" />
              </button>

              <button
                type="button"
                onClick={() => onUpdatePlacement({ angle: placement.angle + Math.PI / 12 })}
                className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1 active:scale-95 transition"
                title="Rotate clockwise 15 degrees"
              >
                +15°
                <RotateCw className="w-3 h-3 text-amber-400" />
              </button>
            </div>

            {/* Precision Angle Slider */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold shrink-0">
                Rotate
              </span>
              <input
                type="range"
                min="-180"
                max="180"
                step="2"
                value={deg > 180 ? deg - 360 : deg < -180 ? deg + 360 : deg}
                onChange={(e) => {
                  const newDeg = parseFloat(e.target.value);
                  onUpdatePlacement({ angle: (newDeg * Math.PI) / 180 });
                }}
                className="w-full accent-amber-500 h-2 bg-stone-800 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-xs text-amber-300 w-10 text-right">
                {deg}°
              </span>
            </div>
          </div>

          {/* Action Buttons: Reset & Confirm */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onResetPlacement}
              data-testid="reset-placement-btn"
              className="py-3 px-4 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 border border-stone-700 text-stone-300 font-bold text-sm transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={onConfirmPlacement}
              disabled={!validation.valid}
              data-testid="confirm-placement-btn"
              className={`flex-1 py-3 px-5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-lg ${
                validation.valid
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 shadow-emerald-600/30 active:scale-98 cursor-pointer'
                  : 'bg-stone-800 text-stone-500 border border-stone-700/60 cursor-not-allowed opacity-75'
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
