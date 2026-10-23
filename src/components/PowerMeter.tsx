import React, { useState, useEffect, useRef } from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { Sound } from '../game/audio';

interface PowerMeterProps {
  power: number;
  disabled?: boolean;
  onSetPower: (val: number) => void;
  onExecuteShot: (power: number) => void;
}

export const PowerMeter: React.FC<PowerMeterProps> = ({
  power,
  disabled = false,
  onSetPower,
  onExecuteShot,
}) => {
  const [isCharging, setIsCharging] = useState(false);
  const chargeRef = useRef<number>(power);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastSoundTickRef = useRef<number>(0);

  // Keep ref in sync
  useEffect(() => {
    chargeRef.current = power;
  }, [power]);

  // Clean up animation on unmount or disable
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const startCharging = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    setIsCharging(true);
    startTimeRef.current = performance.now();
    lastSoundTickRef.current = 0;
    Sound.playClick();

    const CHARGE_DURATION = 1600; // 1.6 seconds from 5% to 100%

    const loop = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / CHARGE_DURATION);

      // Smooth ease-out or linear power ramp
      const newPower = Math.round(5 + progress * 95);
      chargeRef.current = newPower;
      onSetPower(newPower);

      // Subtle audio feedback as charge crosses 25%, 50%, 75%, 100%
      const quarter = Math.floor(newPower / 25);
      if (quarter > lastSoundTickRef.current) {
        lastSoundTickRef.current = quarter;
        Sound.playClick();
      }

      // CRITICAL REQUIREMENT: At 100%, do NOT auto-fire!
      // Keep running loop to maintain 100% pulse until user releases pointer.
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const endCharging = (e: React.PointerEvent) => {
    if (!isCharging) return;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsCharging(false);
    startTimeRef.current = null;

    const finalPower = Math.max(5, Math.min(100, chargeRef.current));
    // Release locks power and fires shot!
    onExecuteShot(finalPower);
  };

  const cancelCharging = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsCharging(false);
    startTimeRef.current = null;
  };

  const isMax = power >= 98;

  // Determine meter color gradient based on power
  const getGradient = () => {
    if (power < 40) return 'from-emerald-500 to-green-400';
    if (power < 75) return 'from-yellow-500 to-amber-400';
    return 'from-orange-500 to-red-500';
  };

  return (
    <div className="flex items-center gap-3 bg-[#150d06] p-2.5 rounded-2xl border border-[#3d2414] shadow-inner select-none">
      {/* 8-Ball Pool Style Vertical Cue Charge Bar */}
      <div
        className={`relative w-9 h-28 sm:h-32 bg-[#0a0604] rounded-xl p-1 border flex flex-col justify-end cursor-pointer touch-none transition-all ${
          isCharging
            ? 'border-[#f5c518] shadow-lg shadow-[#d4af37]/30 scale-[1.03]'
            : 'border-[#452815] hover:border-[#633a1e]'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
        onPointerDown={startCharging}
        onPointerUp={endCharging}
        onPointerCancel={cancelCharging}
        role="slider"
        aria-label="Hold to charge shot power, release to fire"
        aria-valuenow={power}
        aria-valuemin={5}
        aria-valuemax={100}
      >
        {/* Fill Tube */}
        <div className="relative w-full h-full bg-[#1b110a] rounded-lg overflow-hidden flex flex-col justify-end">
          {/* Tick Marks */}
          <div className="absolute inset-0 flex flex-col justify-between py-2 px-1 pointer-events-none z-10 opacity-30">
            <div className="border-b border-white w-full" />
            <div className="border-b border-white w-2/3" />
            <div className="border-b border-white w-full" />
            <div className="border-b border-white w-2/3" />
            <div className="border-b border-white w-full" />
          </div>

          {/* Dynamic Power Fill */}
          <div
            className={`w-full rounded-b-lg bg-gradient-to-t ${getGradient()} transition-all duration-75 relative ${
              isMax ? 'animate-pulse' : ''
            }`}
            style={{ height: `${power}%` }}
          >
            {/* Top Indicator Glow Head */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white shadow-[0_0_8px_#ffffff]" />
          </div>
        </div>

        {/* 100% Max Lock Indicator */}
        {isMax && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-md animate-bounce">
            MAX
          </div>
        )}
      </div>

      {/* Control Details & Main Action Button */}
      <div className="flex-1 flex flex-col justify-between h-28 sm:h-32 py-0.5">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#f5c518]" />
              <span>Shot Power</span>
            </span>
            <span
              className={`font-kalam font-extrabold text-lg sm:text-xl ${
                isMax ? 'text-red-400 animate-pulse' : 'text-[#f5c518]'
              }`}
            >
              {power}%
            </span>
          </div>

          <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
            {isCharging
              ? isMax
                ? '⚡ 100% LOCKED! Release to strike!'
                : '⚡ Charging… release anytime to flick!'
              : 'Hold bar to charge, or click FLICK button below'}
          </p>
        </div>

        {/* Manual Adjuster for Accessibility / Quick Tune */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="5"
            max="100"
            value={power}
            disabled={disabled}
            onChange={(e) => onSetPower(+e.target.value)}
            className="w-full accent-[#d4af37] h-1.5 bg-[#2a170c] rounded cursor-pointer disabled:opacity-40"
          />
        </div>

        {/* Hold or Click Flick Button */}
        <button
          disabled={disabled}
          onPointerDown={startCharging}
          onPointerUp={endCharging}
          onPointerCancel={cancelCharging}
          className={`w-full py-2 px-3 rounded-xl font-kalam font-black text-lg flex items-center justify-center gap-1.5 shadow-lg transition-all select-none touch-none ${
            disabled
              ? 'bg-[#24150d] text-gray-500 border border-[#3d2414] cursor-not-allowed'
              : isCharging
              ? 'bg-gradient-to-r from-[#e11d48] to-[#f59e0b] text-white scale-[1.02] shadow-[#f59e0b]/40 ring-2 ring-[#f5c518]'
              : 'bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#d4af37] text-black hover:brightness-110 active:scale-95 shadow-[#d4af37]/30'
          }`}
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>{isCharging ? 'RELEASE TO FLICK!' : 'HOLD TO CHARGE & FLICK'}</span>
        </button>
      </div>
    </div>
  );
};
