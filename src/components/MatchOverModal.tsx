import React, { useEffect, useRef } from 'react';
import { RotateCcw, Home, Trophy, Coins, Sparkles, UserCheck } from 'lucide-react';
import { InGamePlayer } from '../types/game';
import { drawDetailedPen } from '../game/renderer';
import { Sound } from '../game/audio';

interface MatchOverModalProps {
  winner: InGamePlayer | null;
  eliminatedOrder: InGamePlayer[];
  coinsAwarded: number;
  xpAwarded: number;
  onRematch: () => void;
  onExit: () => void;
  onChangeOpponent?: () => void;
}

export const MatchOverModal: React.FC<MatchOverModalProps> = ({
  winner,
  eliminatedOrder,
  coinsAwarded,
  xpAwarded,
  onRematch,
  onExit,
  onChangeOpponent,
}) => {
  const winnerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw winner pen in celebration card
  useEffect(() => {
    if (!winner) return;
    const canvas = winnerCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.08);
    const scale = Math.min((w - 20) / 180, (h - 10) / 45);
    ctx.scale(scale, scale);

    drawDetailedPen(ctx, winner.skin, {
      shadow: { blur: 14, x: 3, y: 7 },
      activeSide: 1,
      aura: winner.skin.rarity === 'legendary',
    });
    ctx.restore();
  }, [winner]);

  // Construct ranking order: 1st is winner, then players in reverse order of elimination
  const rankings: Array<{ player: InGamePlayer; rank: number; status: string }> = [];
  if (winner) {
    rankings.push({ player: winner, rank: 1, status: 'Last Pen Standing (বিজয়ী)' });
  }
  const reverseEliminated = [...eliminatedOrder].reverse();
  reverseEliminated.forEach((p) => {
    if (winner && p.id === winner.id) return;
    rankings.push({
      player: p,
      rank: rankings.length + 1,
      status: `Eliminated (${p.knockouts} knockouts)`,
    });
  });

  // Find bot opponent for post-match quip
  const botOpponent =
    winner && winner.isBot
      ? winner
      : eliminatedOrder.find((p) => p.isBot) || (winner?.isBot ? winner : null);

  const botReaction = botOpponent
    ? winner && winner.id === botOpponent.id
      ? botOpponent.botPersonality?.quips.victory || 'Supremacy on the wooden desk!'
      : botOpponent.botPersonality?.quips.defeat || 'Next period-e abr dekha hobe!'
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#1c120a] border-2 border-[#d4af37] rounded-3xl p-5 sm:p-6 shadow-2xl text-[#f3f4f6] text-center relative overflow-hidden">
        {/* Decorative corner stars */}
        <div className="absolute top-3 left-3 text-[#f5c518] text-sm animate-pulse">✨</div>
        <div className="absolute top-3 right-3 text-[#f5c518] text-sm animate-pulse">✨</div>

        {/* Title */}
        <div className="mb-2">
          <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8c6d1f] text-black shadow-lg mb-1.5">
            <Trophy className="w-7 h-7 fill-current" />
          </div>
          <h2 className="font-kalam font-extrabold text-3xl sm:text-4xl text-[#f5d061] leading-tight">
            {winner ? `${winner.name} Wins!` : 'It’s a Draw!'}
          </h2>
          <p className="text-xs text-gray-300 font-bangla mt-0.5">
            {winner ? 'ডেস্কের একমাত্র চ্যাম্পিয়ন কলম' : 'উভয় কলম একই সাথে খসিয়া পড়িল'}
          </p>
        </div>

        {/* Winner Pen Showcase */}
        {winner && (
          <div className="my-2 bg-[#120a05] border border-[#3d2313] rounded-2xl p-2.5 flex flex-col items-center">
            <div className="w-full h-16 sm:h-20">
              <canvas ref={winnerCanvasRef} className="w-full h-full" />
            </div>
            <span className="text-xs font-bold text-[#f5c518] mt-1">
              Weapon: {winner.skin.name} {winner.skin.isAuthentic && '(Matador BD)'}
            </span>
          </div>
        )}

        {/* Bot Opponent Reaction Quip */}
        {botReaction && botOpponent && (
          <div className="my-2 px-3 py-1.5 bg-[#26150b] border border-[#523018] rounded-xl text-left flex items-center gap-2">
            <span className="text-xl flex-shrink-0">
              {botOpponent.botPersonality?.avatar || '🤖'}
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#f5c518] block truncate">
                {botOpponent.name}:
              </span>
              <p className="text-xs text-white italic leading-tight truncate">
                "{botReaction}"
              </p>
            </div>
          </div>
        )}

        {/* Rewards Earned Bar */}
        <div className="my-2.5 bg-[#2b180d] border border-[#5a361c] rounded-xl p-2.5 flex items-center justify-around text-xs font-bold">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Coins className="w-4 h-4" />
            <span>+{coinsAwarded} Coins</span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-1.5 text-purple-400">
            <Sparkles className="w-4 h-4" />
            <span>+{xpAwarded} XP</span>
          </div>
        </div>

        {/* Podium Standings List with Stats */}
        <div className="my-2.5 space-y-1.5 text-left max-h-36 overflow-y-auto pr-1">
          {rankings.map((item) => (
            <div
              key={item.player.id}
              className={`p-2 rounded-xl border flex items-center justify-between text-xs font-bold ${
                item.rank === 1
                  ? 'bg-[#3b2512] border-[#f5c518] text-[#f5c518]'
                  : 'bg-[#150d07] border-[#38200f] text-gray-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-4 font-kalam text-sm text-center">
                  {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                </span>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.player.skin.ui }}
                />
                <span className="text-white truncate max-w-[110px]">{item.player.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block">{item.status}</span>
                <span className="text-[9px] text-[#9ca3af] block">
                  {item.player.flickCount} flicks taken
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons: Rematch, Change Opponent, Main Menu */}
        <div className="flex flex-col gap-2 mt-3 text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => {
                Sound.playClick();
                onRematch();
              }}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#d4af37] text-black font-kalam font-extrabold text-base rounded-xl shadow-lg flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rematch</span>
            </button>
            {onChangeOpponent && (
              <button
                onClick={() => {
                  Sound.playClick();
                  onChangeOpponent();
                }}
                className="flex-1 py-2.5 bg-[#382212] hover:bg-[#4d2f19] text-[#f5c518] font-kalam font-bold text-sm rounded-xl border border-[#6b4122] flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <UserCheck className="w-4 h-4" />
                <span>New Opponent</span>
              </button>
            )}
          </div>
          <button
            onClick={() => {
              Sound.playClick();
              onExit();
            }}
            className="w-full py-2 bg-[#25150a] hover:bg-[#331c0e] text-gray-300 font-kalam font-bold text-sm rounded-xl border border-[#422512] flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
