import React from 'react';
import { RotateCcw, Home, Sparkles, MessageCircle } from 'lucide-react';
import { AttackSideIndex, GamePhase, InGamePlayer } from '../types/game';
import { ATTACK_SIDES } from '../game/constants';
import { Sound } from '../game/audio';

interface GameHUDProps {
  players: InGamePlayer[];
  currentTurnIndex: number;
  phase: GamePhase;
  power: number;
  side: AttackSideIndex;
  bannerMessage: { title: string; sub?: string } | null;
  onSetPower: (val: number) => void;
  onSetSide: (side: AttackSideIndex) => void;
  onFlick: () => void;
  onRestart: () => void;
  onExit: () => void;
  isPractice?: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  players,
  currentTurnIndex,
  phase,
  power,
  side,
  bannerMessage,
  onSetPower,
  onSetSide,
  onFlick,
  onRestart,
  onExit,
  isPractice,
}) => {
  const currentPlayer = players[currentTurnIndex];
  const isHumanTurn =
    phase === 'aim' && currentPlayer && !currentPlayer.isBot && currentPlayer.alive;
  const isMoving = phase === 'moving' || phase === 'launch';
  const currentSideInfo = ATTACK_SIDES[side];

  // Check if any bot or player has an active speech bubble
  const speakingPlayer = players.find(
    (p) => p.speech && p.speechTime && performance.now() - p.speechTime < 3200
  );

  return (
    <>
      {/* Top HUD Bar */}
      <div className="fixed top-12 left-0 right-0 z-20 px-3 py-2 flex items-start justify-between pointer-events-none">
        {/* Player Status Chips */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto max-w-[70%]">
          {players.map((p, idx) => {
            const isActive = idx === currentTurnIndex && p.alive && phase !== 'over';
            return (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-md ${
                  !p.alive
                    ? 'bg-black/60 text-gray-500 line-through border border-white/10 opacity-60'
                    : isActive
                    ? 'bg-[#2b180d] text-white border-2 border-[#f5c518] shadow-lg shadow-[#d4af37]/20 scale-105'
                    : 'bg-[#18110b]/80 text-gray-300 border border-[#3d2414]'
                }`}
              >
                {p.botPersonality?.avatar ? (
                  <span className="text-sm">{p.botPersonality.avatar}</span>
                ) : (
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-inner flex-shrink-0"
                    style={{ backgroundColor: p.skin.ui }}
                  />
                )}
                <span className="truncate max-w-[90px]">{p.name}</span>
                <span className="text-[10px] text-amber-300/80 font-normal truncate max-w-[80px]">
                  ({p.skin.name})
                </span>
                {!p.alive && <span className="text-[10px] text-red-400 font-normal">out</span>}
              </div>
            );
          })}
          {isPractice && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
              Practice Range
            </span>
          )}
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => {
              Sound.playClick();
              onRestart();
            }}
            aria-label="Restart match"
            title="Restart Match"
            className="p-2 bg-[#2b180d]/90 hover:bg-[#3d2414] text-[#f5c518] border border-[#5a361c] rounded-xl shadow active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              Sound.playClick();
              onExit();
            }}
            aria-label="Exit to main menu"
            title="Exit to Menu"
            className="p-2 bg-[#2b180d]/90 hover:bg-[#3d2414] text-[#f87171] border border-[#5a361c] rounded-xl shadow active:scale-95 transition"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Dynamic Turn Banner */}
      {bannerMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-25 pointer-events-none animate-bounce-subtle text-center">
          <div className="px-6 py-2.5 bg-[#1a0e06]/90 border-2 border-[#f5c518] rounded-2xl shadow-2xl backdrop-blur-md">
            <h3 className="font-kalam font-extrabold text-2xl sm:text-3xl text-[#f5d061] leading-tight">
              {bannerMessage.title}
            </h3>
            {bannerMessage.sub && (
              <p className="text-xs text-[#e5e7eb] font-bangla font-medium mt-0.5">
                {bannerMessage.sub}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Floating Bot Contextual Speech Bubble */}
      {speakingPlayer && speakingPlayer.speech && (
        <div className="fixed top-36 left-1/2 -translate-x-1/2 z-25 pointer-events-none animate-fade-in text-center max-w-xs sm:max-w-md">
          <div className="px-4 py-2 bg-[#29170c]/95 border-2 border-[#d4af37] rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-left">
            <span className="text-2xl flex-shrink-0">
              {speakingPlayer.botPersonality?.avatar || '💬'}
            </span>
            <div>
              <span className="text-[11px] font-bold text-[#f5c518] block leading-tight">
                {speakingPlayer.name}:
              </span>
              <p className="text-xs text-white italic font-medium leading-tight">
                "{speakingPlayer.speech}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Interactive HUD Control Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center px-2 pb-3 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-xl bg-[#1b120a]/95 backdrop-blur-md border-2 border-[#54341b] rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5">
          {/* Top Row: Attack Sides (Side 1, Side 2, Side 3) */}
          <div className="flex items-center justify-between gap-1.5">
            {ATTACK_SIDES.map((s, idx) => {
              const isSelected = side === s.id;
              return (
                <button
                  key={s.id}
                  disabled={!isHumanTurn}
                  onClick={() => {
                    Sound.playClick();
                    onSetSide(s.id);
                  }}
                  className={`flex-1 py-1.5 px-1 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#3b2514] border-[#f5c518] text-[#f5c518] shadow-md scale-[1.02]'
                      : 'bg-[#150d06] border-[#38200f] text-gray-400 hover:text-gray-200'
                  } ${!isHumanTurn ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
                >
                  {/* Pen SVG showing impact point */}
                  <svg viewBox="0 0 70 14" className="w-14 h-3.5 mb-0.5">
                    <rect
                      x="2"
                      y="3.5"
                      width="54"
                      height="7"
                      rx="3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M56 3.5 L67 7 L56 10.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle
                      cx={idx === 0 ? 59 : idx === 1 ? 32 : 8}
                      cy="7"
                      r="3.2"
                      className={isSelected ? 'fill-[#f5c518]' : 'fill-[#d8536b]'}
                    />
                  </svg>
                  <span className="font-kalam font-bold text-xs leading-none">
                    {idx === 0 ? 'Top Strike' : idx === 1 ? 'Middle Push' : 'Bottom Slam'}
                  </span>
                  <span className="text-[9px] text-gray-400 font-sans">
                    {idx === 0 ? 'Side 1 (Spin)' : idx === 1 ? 'Side 2 (Direct)' : 'Side 3 (Heavy)'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Middle Row: Power Slider & Flick Action Button */}
          <div className="flex items-center gap-3">
            {/* Power Slider */}
            <div className="flex-1 flex flex-col gap-1 bg-[#150d06] p-2 rounded-xl border border-[#38200f]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-300">Power (শক্তি)</span>
                <span className="font-kalam font-extrabold text-base text-[#f5c518]">
                  {power}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={power}
                disabled={!isHumanTurn}
                onChange={(e) => onSetPower(+e.target.value)}
                className="w-full accent-[#d4af37] h-2 bg-[#2d180b] rounded-lg cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* FLICK BUTTON */}
            <button
              disabled={!isHumanTurn}
              onClick={() => {
                onFlick();
              }}
              className={`min-w-[120px] py-3.5 px-4 rounded-xl font-kalam font-black text-xl flex items-center justify-center gap-1.5 shadow-lg transition-all ${
                isHumanTurn
                  ? 'bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#d4af37] text-black hover:brightness-110 active:scale-95 shadow-[#d4af37]/30'
                  : 'bg-[#2a1b12] text-gray-500 border border-[#422919] cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-5 h-5 fill-current" />
              <span>
                {isMoving
                  ? 'Sliding…'
                  : currentPlayer?.isBot
                  ? `${currentPlayer.botPersonality?.avatar || '🤖'} Thinking…`
                  : 'FLICK!'}
              </span>
            </button>
          </div>

          {/* Bottom Hint */}
          <div className="flex items-center justify-between text-[11px] text-[#a89584] leading-tight px-1">
            <span className="truncate">
              <b className="text-[#f5c518]">{currentSideInfo.name}:</b> {currentSideInfo.desc}
            </span>
            <span className="hidden sm:inline-block text-[10px] text-gray-400 pl-2 flex-shrink-0">
              Drag on desk to aim
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
