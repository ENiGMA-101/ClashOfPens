import React from 'react';
import { RotateCcw, Home, Sparkles, MessageCircle, Swords, Compass, Clock } from 'lucide-react';
import { AttackSideIndex, GamePhase, InGamePlayer } from '../types/game';
import { ATTACK_SIDES, TURN_TIME_LIMIT_SEC } from '../game/constants';
import { Sound } from '../game/audio';
import { PowerMeter } from './PowerMeter';
import { SeriesScoreboard } from './SeriesScoreboard';
import { SeriesState } from '../game/seriesState';

interface GameHUDProps {
  players: InGamePlayer[];
  currentTurnIndex: number;
  phase: GamePhase;
  power: number;
  side: AttackSideIndex;
  bannerMessage: { title: string; sub?: string } | null;
  onSetPower: (val: number) => void;
  onSetSide: (side: AttackSideIndex) => void;
  onFlick: (launchPower?: number) => void;
  onRestart: () => void;
  onExit: () => void;
  isPractice?: boolean;
  series?: SeriesState | null;
  turnTimeRemaining?: number;
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
  series,
  turnTimeRemaining,
}) => {
  const currentPlayer = players[currentTurnIndex];
  const isHumanTurn =
    phase === 'aim' && currentPlayer && !currentPlayer.isBot && currentPlayer.alive;
  const isMoving = phase === 'moving' || phase === 'launch';
  const currentSideInfo = ATTACK_SIDES[side];

  // Turn Timer calculations
  const timeRemaining = turnTimeRemaining !== undefined ? Math.max(0, turnTimeRemaining) : TURN_TIME_LIMIT_SEC;
  const isTimeUrgent = phase === 'aim' && timeRemaining <= 4.0;
  const timerPercent = Math.max(0, Math.min(100, (timeRemaining / TURN_TIME_LIMIT_SEC) * 100));

  // Check if any bot or player has an active speech bubble
  const speakingPlayer = players.find(
    (p) => p.speech && p.speechTime && performance.now() - p.speechTime < 3200
  );

  return (
    <>
      {/* Top HUD Bar */}
      <div data-testid="hud-top-panel" className="fixed top-12 left-0 right-0 z-20 px-3 py-2 flex items-start justify-between pointer-events-none">
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

        {/* Center/Top Turn Timer Badge */}
        {phase === 'aim' && (
          <div
            data-testid="turn-timer-badge"
            className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all shadow-md mx-2 ${
              isTimeUrgent
                ? 'bg-red-950/95 border-2 border-red-500 text-red-200 animate-pulse shadow-lg shadow-red-500/40 scale-105'
                : 'bg-[#1e130a]/90 border border-[#e5a93b]/50 text-amber-300'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${isTimeUrgent ? 'text-red-400' : 'text-amber-400'}`} />
            <span className="font-extrabold text-xs sm:text-sm">{Math.ceil(timeRemaining)}s</span>
            {isTimeUrgent && (
              <span className="text-[10px] uppercase tracking-wider text-red-300 font-sans font-bold hidden xs:inline">
                Warning!
              </span>
            )}
          </div>
        )}

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

      {/* Series Bo5 Scoreboard Overlay */}
      {series && (
        <div className="fixed top-24 right-3 z-20 pointer-events-auto max-w-xs animate-fade-in hidden sm:block">
          <SeriesScoreboard series={series} compact />
        </div>
      )}

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

      {/* ============================================================ */}
      {/* DESKTOP LEFT SIDEBAR (Visible on lg >= 1024px screens) */}
      {/* ============================================================ */}
      <aside
        className="hidden lg:flex fixed left-3 top-20 bottom-3 w-72 z-20 flex-col justify-between bg-[#1b120a]/95 backdrop-blur-md border-2 border-[#54341b] rounded-3xl p-3.5 shadow-2xl pointer-events-auto"
        data-testid="desktop-control-sidebar"
      >
        {/* Sidebar Top: Attack Styles */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#3d2414]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Swords className="w-3.5 h-3.5" />
              <span>Attack Style</span>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              {isHumanTurn ? 'Your Turn' : 'Waiting...'}
            </span>
          </div>

          {/* Vertical Stack of Attack Sides */}
          <div className="space-y-1.5">
            {ATTACK_SIDES.map((s, idx) => {
              const isSelected = side === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!isHumanTurn}
                  onClick={() => {
                    Sound.playClick();
                    onSetSide(s.id);
                  }}
                  className={`w-full p-2.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#3b2514] border-[#f5c518] text-[#f5c518] shadow-md scale-[1.02]'
                      : 'bg-[#150d06] border-[#38200f] text-stone-400 hover:text-stone-200 hover:border-stone-600'
                  } ${!isHumanTurn ? 'opacity-60 cursor-not-allowed' : 'active:scale-98 cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-kalam font-bold text-sm">
                      {s.name}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400/90 font-bold">
                      {idx === 0 ? '1.00x Spin' : idx === 1 ? '0.95x Direct' : '1.10x Heavy'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-tight">
                    {s.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Middle: Turn Timer Card */}
        <div
          data-testid="sidebar-turn-timer"
          className={`p-2.5 rounded-2xl border transition-all ${
            isTimeUrgent
              ? 'bg-red-950/40 border-red-500/80 shadow-md shadow-red-950/50'
              : 'bg-[#150d06] border-[#38200f]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${isTimeUrgent ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="text-xs font-bold text-amber-200">Turn Timer</span>
            </div>
            <span
              className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-full ${
                isTimeUrgent
                  ? 'bg-red-900/80 text-red-100 border border-red-500 animate-pulse'
                  : 'bg-[#29170c] text-amber-300 border border-amber-500/30'
              }`}
            >
              {phase === 'aim' ? `${Math.ceil(timeRemaining)}s` : 'Waiting...'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-100 rounded-full ${
                isTimeUrgent
                  ? 'bg-gradient-to-r from-red-600 to-rose-400'
                  : 'bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300'
              }`}
              style={{ width: `${phase === 'aim' ? timerPercent : 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
            <span>{isTimeUrgent ? 'Ticking clock warning!' : '10s max shot time'}</span>
            <span className={isTimeUrgent ? 'text-red-400 font-bold' : 'text-stone-400'}>
              {isTimeUrgent ? 'Shifts on 0s!' : 'Shifts on timeout'}
            </span>
          </div>
        </div>

        {/* Sidebar Middle & Bottom: Vertical PowerMeter Console */}
        <div className="space-y-2">
          <PowerMeter
            power={power}
            disabled={!isHumanTurn}
            layout="vertical"
            onSetPower={onSetPower}
            onExecuteShot={(finalPower) => onFlick(finalPower)}
          />

          <div className="flex items-center justify-between text-[10px] text-stone-400 px-1">
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-400" />
              <span>Drag desk to aim</span>
            </span>
            <span className="text-amber-300/80">{currentSideInfo.name}</span>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MOBILE / TABLET BOTTOM PANEL (Visible on screens < 1024px) */}
      {/* ============================================================ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex justify-center px-2 pb-2 sm:pb-3 pointer-events-none">
        <div
          data-testid="hud-bottom-panel"
          className="pointer-events-auto w-full max-w-xl bg-[#1b120a]/95 backdrop-blur-md border-2 border-[#54341b] rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-col gap-2 sm:gap-2.5"
        >
          {/* Mobile Turn Timer Bar */}
          {phase === 'aim' && (
            <div className="flex items-center justify-between px-2 py-1 bg-black/40 rounded-xl border border-white/10 text-[11px]">
              <div className="flex items-center gap-1.5">
                <Clock className={`w-3.5 h-3.5 ${isTimeUrgent ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
                <span className={`font-mono font-bold ${isTimeUrgent ? 'text-red-300 font-extrabold' : 'text-amber-300'}`}>
                  Turn Time: {Math.ceil(timeRemaining)}s
                </span>
                {isTimeUrgent && (
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-pulse">
                    (Warning!)
                  </span>
                )}
              </div>
              <div className="w-28 sm:w-36 h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div
                  className={`h-full transition-all duration-100 rounded-full ${
                    isTimeUrgent ? 'bg-red-500' : 'bg-amber-400'
                  }`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
            </div>
          )}

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

          {/* Middle Row: 8-Ball Pool Style Charge-and-Release Power Meter */}
          <PowerMeter
            power={power}
            disabled={!isHumanTurn}
            layout="horizontal"
            onSetPower={onSetPower}
            onExecuteShot={(finalPower) => {
              onFlick(finalPower);
            }}
          />

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
