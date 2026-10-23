import React, { useState } from 'react';
import { X, Settings, Volume2, Vibrate, Compass, Bot, RotateCcw } from 'lucide-react';
import { GameSettings } from '../types/game';
import { Sound } from '../game/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onResetProgress,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const update = (key: keyof GameSettings, value: any) => {
    Sound.playClick();
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#1a110a] border-2 border-[#543319] rounded-2xl p-5 shadow-2xl text-[#f3f4f6] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3d2313] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#f5c518]" />
            <div>
              <h2 className="font-kalam font-bold text-2xl text-[#f5d061] leading-none">
                Settings <span className="font-bangla text-lg text-[#d8536b] font-normal">(সেটিংস)</span>
              </h2>
              <p className="text-xs text-gray-400">Audio, physics rules, and controls</p>
            </div>
          </div>
          <button
            onClick={() => {
              Sound.playClick();
              onClose();
            }}
            aria-label="Close settings modal"
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings rows */}
        <div className="space-y-4 text-xs">
          {/* Fall Rule */}
          <div className="flex items-center justify-between p-3 bg-[#24150b] rounded-xl border border-[#422614]">
            <div>
              <span className="font-bold text-white block">Fall Elimination Rule</span>
              <span className="text-[11px] text-gray-400">When is a pen knocked out?</span>
            </div>
            <div className="flex gap-1 bg-[#150c06] p-1 rounded-lg border border-[#3b2010]">
              <button
                onClick={() => update('fall', 'strict')}
                className={`px-3 py-1 rounded font-bold transition ${
                  settings.fall === 'strict'
                    ? 'bg-[#d4af37] text-black shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Any Part Over
              </button>
              <button
                onClick={() => update('fall', 'center')}
                className={`px-3 py-1 rounded font-bold transition ${
                  settings.fall === 'center'
                    ? 'bg-[#d4af37] text-black shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Center Over
              </button>
            </div>
          </div>

          {/* Sound & Music */}
          <div className="flex items-center justify-between p-3 bg-[#24150b] rounded-xl border border-[#422614]">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-bold text-white block">Sound Effects</span>
                <span className="text-[11px] text-gray-400">Pen clatters, flicks, and falls</span>
              </div>
            </div>
            <button
              onClick={() => update('sound', !settings.sound)}
              className={`w-12 h-6 rounded-full transition p-0.5 ${
                settings.sound ? 'bg-[#22c55e]' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.sound ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Haptic Vibration */}
          <div className="flex items-center justify-between p-3 bg-[#24150b] rounded-xl border border-[#422614]">
            <div className="flex items-center gap-2">
              <Vibrate className="w-4 h-4 text-purple-400" />
              <div>
                <span className="font-bold text-white block">Haptic Feedback</span>
                <span className="text-[11px] text-gray-400">Device vibration on flick & hit</span>
              </div>
            </div>
            <button
              onClick={() => update('vibrate', !settings.vibrate)}
              className={`w-12 h-6 rounded-full transition p-0.5 ${
                settings.vibrate ? 'bg-[#22c55e]' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.vibrate ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Trajectory Guide */}
          <div className="flex items-center justify-between p-3 bg-[#24150b] rounded-xl border border-[#422614]">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="font-bold text-white block">Trajectory Guide</span>
                <span className="text-[11px] text-gray-400">Show predictive slide path</span>
              </div>
            </div>
            <button
              onClick={() => update('guide', !settings.guide)}
              className={`w-12 h-6 rounded-full transition p-0.5 ${
                settings.guide ? 'bg-[#22c55e]' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.guide ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Bot Skill */}
          <div className="flex items-center justify-between p-3 bg-[#24150b] rounded-xl border border-[#422614]">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-pink-400" />
              <div>
                <span className="font-bold text-white block">Bot Skill Level</span>
                <span className="text-[11px] text-gray-400">AI opponent aim & strategy</span>
              </div>
            </div>
            <div className="flex gap-1 bg-[#150c06] p-1 rounded-lg border border-[#3b2010]">
              {(['easy', 'normal', 'sharp'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => update('skill', s)}
                  className={`px-2.5 py-1 rounded font-bold capitalize transition ${
                    settings.skill === s
                      ? 'bg-[#d4af37] text-black shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Progress Section */}
          <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-red-300 block">Reset Progress</span>
                <span className="text-[10px] text-gray-400">Erase stats, coins, and unlocks</span>
              </div>
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-200 rounded-lg font-bold border border-red-500/40 text-xs transition active:scale-95"
                >
                  Reset
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      Sound.playClick();
                      onResetProgress();
                      setShowResetConfirm(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1.5 text-gray-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
