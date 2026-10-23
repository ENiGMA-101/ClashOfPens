import React from 'react';
import { Trophy, Swords, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SeriesState } from '../game/seriesState';

interface SeriesScoreboardProps {
  series: SeriesState;
  compact?: boolean;
}

export const SeriesScoreboard: React.FC<SeriesScoreboardProps> = ({ series, compact = false }) => {
  if (series.format !== 'bo5') return null;

  return (
    <div
      className={`bg-[#1c1109]/95 border border-[#523019] rounded-xl p-2.5 shadow-xl text-white backdrop-blur-md ${
        compact ? 'text-xs' : 'text-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#3b2010] pb-1.5 mb-2">
        <div className="flex items-center gap-1.5 font-bold text-[#f5c518]">
          <Trophy className="w-4 h-4 text-[#d4af37]" />
          <span>Best-of-5 Series (সেরা ৫ সিরিজ)</span>
        </div>
        <span className="text-[11px] font-mono text-gray-400">
          Target: 3 Wins
        </span>
      </div>

      {/* Players Win Count & Dots */}
      <div className="flex items-center justify-between gap-3 mb-2">
        {/* Player 1 */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs truncate max-w-[100px] text-blue-300">
            {series.player1.name}
          </span>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={`w-3 h-3 rounded-full border transition-all ${
                  series.player1.wins > idx
                    ? 'bg-blue-500 border-blue-300 shadow-[0_0_6px_#3b82f6]'
                    : 'bg-black/50 border-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="font-kalam font-black text-base text-[#f5c518]">VS</div>

        {/* Player 2 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={`w-3 h-3 rounded-full border transition-all ${
                  series.player2.wins > idx
                    ? 'bg-red-500 border-red-300 shadow-[0_0_6px_#ef4444]'
                    : 'bg-black/50 border-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="font-bold text-xs truncate max-w-[100px] text-red-300">
            {series.player2.name}
          </span>
        </div>
      </div>

      {/* Match Slot Indicators (Match 1 to 5) */}
      <div className="grid grid-cols-5 gap-1.5 pt-1 border-t border-white/5">
        {series.slots.map((slot) => {
          const isCurrent = slot.slotNumber === series.currentSlot && !series.isComplete;
          const isDrawPending = isCurrent && series.pendingDrawReplay;

          return (
            <div
              key={slot.slotNumber}
              className={`p-1 rounded text-center text-[10px] flex flex-col items-center justify-center border transition ${
                isDrawPending
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-200 animate-pulse'
                  : isCurrent
                  ? 'bg-[#3b2514] border-[#f5c518] text-[#f5c518] font-bold'
                  : slot.completed
                  ? slot.winnerId === series.player1.id
                    ? 'bg-blue-950/60 border-blue-600/40 text-blue-200'
                    : 'bg-red-950/60 border-red-600/40 text-red-200'
                  : 'bg-black/30 border-white/5 text-gray-500'
              }`}
            >
              <span>M{slot.slotNumber}</span>
              {slot.completed ? (
                <span className="font-bold text-[9px] uppercase">
                  {slot.winnerId === series.player1.id ? 'P1' : 'P2'}
                </span>
              ) : isDrawPending ? (
                <span className="text-[8px] font-bold text-amber-300">DRAW</span>
              ) : (
                <span className="text-[9px] text-gray-600">-</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Status banner */}
      {series.pendingDrawReplay && (
        <div className="mt-2 text-[11px] text-amber-400 bg-amber-950/50 border border-amber-500/30 rounded p-1 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Match drawn! No points awarded. Replaying Game {series.currentSlot}.</span>
        </div>
      )}

      {series.isComplete && (
        <div className="mt-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 rounded p-1 text-center">
          🏆 Series Winner: {series.championName}!
        </div>
      )}
    </div>
  );
};
