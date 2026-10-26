import React from 'react';
import { Volume2, VolumeX, Settings, Award, Smartphone, Cloud } from 'lucide-react';
import { PlayerProgress, GameSettings } from '../types/game';
import { calculateLevel, xpForNextLevel } from '../game/storage';

interface HeaderNavProps {
  progress: PlayerProgress;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onOpenSettings: () => void;
  onOpenAndroidGuide: () => void;
  onOpenLocker: () => void;
  onOpenAccount?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  progress,
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenAndroidGuide,
  onOpenLocker,
  onOpenAccount,
}) => {
  const level = calculateLevel(progress.xp);
  const nextLvlXp = xpForNextLevel(level);
  const prevLvlXp = xpForNextLevel(level - 1);
  const xpPercent = Math.min(
    100,
    Math.max(0, Math.round(((progress.xp - prevLvlXp) / Math.max(1, nextLvlXp - prevLvlXp)) * 100))
  );

  const toggleSound = () => {
    onUpdateSettings({ ...settings, sound: !settings.sound });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-3 py-2 flex items-center justify-between bg-[#18120d]/85 backdrop-blur-md border-b border-[#3d2719] text-[#e7ebf3] select-none">
      {/* Player Level & XP bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenLocker}
          aria-label="Open Pen Locker"
          className="flex items-center gap-2 px-2.5 py-1 bg-[#2b180d] hover:bg-[#3d2212] border border-[#d4af37]/40 rounded-full transition-all active:scale-95 text-left"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8c6d1f] flex items-center justify-center font-outfit font-extrabold text-xs text-[#1a0e05] shadow-inner">
            {level}
          </div>
          <div className="flex flex-col pr-1">
            <span className="text-[11px] font-bold text-[#f5c518] leading-tight">LVL {level}</span>
            <div className="w-16 h-1.5 bg-[#140b05] rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#e0559a] to-[#ffd700] rounded-full transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </button>

        {/* Coins Badge */}
        <div
          onClick={onOpenLocker}
          className="cursor-pointer flex items-center gap-1.5 px-3 py-1 bg-[#25150a] border border-[#d4af37]/30 rounded-full text-xs font-bold font-outfit text-[#f5d061] shadow-sm hover:border-[#d4af37] transition"
        >
          <span className="text-sm">🪙</span>
          <span>{progress.coins.toLocaleString()}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        {/* Neon Cloud & Account */}
        {onOpenAccount && (
          <button
            onClick={onOpenAccount}
            aria-label="Cloud Save & Account"
            title="Neon Cloud Save & Google Sign-In"
            className="flex items-center gap-1 px-2.5 py-1 bg-[#1e2a38] hover:bg-[#28384b] text-[#60a5fa] text-xs font-bold rounded-lg border border-[#3b82f6]/40 transition active:scale-95"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cloud Save</span>
          </button>
        )}

        {/* Android Play Store Package Guide */}
        <button
          onClick={onOpenAndroidGuide}
          aria-label="Google Play & Android Release Guide"
          title="Google Play Release Guide"
          className="flex items-center gap-1 px-2.5 py-1 bg-[#10422a] hover:bg-[#165a39] text-[#a3e635] text-xs font-bold rounded-lg border border-[#22c55e]/40 transition active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Play Release</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          aria-label={settings.sound ? 'Mute sound' : 'Unmute sound'}
          className="p-1.5 rounded-lg bg-[#2b180d] hover:bg-[#3d2212] text-[#f5d061] border border-[#52321c] transition active:scale-95"
        >
          {settings.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          aria-label="Open settings"
          className="p-1.5 rounded-lg bg-[#2b180d] hover:bg-[#3d2212] text-[#e7ebf3] border border-[#52321c] transition active:scale-95"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
