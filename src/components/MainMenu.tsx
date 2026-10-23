import React, { useRef, useEffect } from 'react';
import {
  Play,
  Bot,
  Users,
  Trophy,
  Target,
  Wrench,
  Sparkles,
  BookOpen,
  WifiOff,
  Flame,
} from 'lucide-react';
import { PlayerProgress } from '../types/game';
import { getSkin } from '../game/skins';
import { getArena } from '../game/arenas';
import { drawDetailedPen } from '../game/renderer';
import { Sound } from '../game/audio';

interface MainMenuProps {
  progress: PlayerProgress;
  onStartQuickMatch: () => void;
  onOpenSetup: (mode: 'quick' | 'pass_and_play' | 'ai_battle') => void;
  onStartPractice: () => void;
  onOpenLocker: () => void;
  onOpenArenas: () => void;
  onOpenChampionship: () => void;
  onOpenChallenges: () => void;
  onOpenHowTo: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  progress,
  onStartQuickMatch,
  onOpenSetup,
  onStartPractice,
  onOpenLocker,
  onOpenArenas,
  onOpenChampionship,
  onOpenChallenges,
  onOpenHowTo,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const equippedSkin = getSkin(progress.equippedSkin);
  const equippedArena = getArena(progress.equippedArena);

  // Animated rotating pen showcase in main menu
  useEffect(() => {
    let animId: number;
    let angle = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      angle += 0.015;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(angle);
      const scale = Math.min((w - 20) / 180, (h - 20) / 45);
      ctx.scale(scale, scale);

      drawDetailedPen(ctx, equippedSkin, {
        shadow: { blur: 14, x: 4, y: 8 },
        activeSide: 1,
        aura: equippedSkin.rarity === 'legendary',
      });
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [equippedSkin]);

  return (
    <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-between px-4 pt-16 pb-6 overflow-y-auto">
      {/* Offline Badge & Classroom Header */}
      <div className="w-full max-w-md flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-[11px] font-semibold text-emerald-300">
          <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Offline Ready</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300/80 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-600/30">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Arena: {equippedArena.name}</span>
        </div>
      </div>

      {/* Hero Showcase Card */}
      <div className="w-full max-w-md my-3 bg-[#1e140d]/90 border-2 border-[#5c3a21] rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Decorative corner staples */}
        <div className="absolute top-2 left-2 w-3 h-1 bg-[#8c6d1f] rounded-full rotate-45" />
        <div className="absolute top-2 right-2 w-3 h-1 bg-[#8c6d1f] rounded-full -rotate-45" />

        {/* Title branding */}
        <div className="text-center">
          <h1 className="font-kalam font-extrabold text-4xl sm:text-5xl text-[#f5d061] tracking-tight drop-shadow-md leading-none">
            Pen Fight
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="h-[2px] w-8 bg-[#d8536b]" />
            <span className="font-bangla font-bold text-2xl text-[#d8536b]">কলম যুদ্ধ</span>
            <span className="h-[2px] w-8 bg-[#d8536b]" />
          </div>
          <p className="text-xs text-[#b8a28f] mt-1 font-outfit">
            Desk Brawl Arcade &middot; Back-Bench Classroom Edition
          </p>
        </div>

        {/* 360 Animated Pen Showcase */}
        <div className="relative my-3 flex flex-col items-center">
          <div className="w-full h-24 sm:h-28 flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#f5c518] mt-1">
            <span className="px-2 py-0.5 rounded bg-[#382011] border border-[#d4af37]/40">
              {equippedSkin.name}
            </span>
            <span className="capitalize text-[10px] text-[#9ca3af] px-1.5 py-0.5 rounded bg-black/40">
              {equippedSkin.rarity}
            </span>
          </div>
        </div>

        {/* Primary Action: PLAY QUICK MATCH */}
        <button
          onClick={() => {
            Sound.playClick();
            onStartQuickMatch();
          }}
          className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#d4af37] text-[#1a0e05] font-kalam font-extrabold text-2xl rounded-xl shadow-lg shadow-[#d4af37]/20 border border-[#fff3b0] flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>QUICK MATCH</span>
        </button>
      </div>

      {/* Game Modes Grid */}
      <div className="w-full max-w-md grid grid-cols-2 gap-2.5 my-1">
        {/* Pass and Play (Local 2-3P) */}
        <button
          onClick={() => {
            Sound.playClick();
            onOpenSetup('pass_and_play');
          }}
          className="p-3 bg-[#24170f]/90 hover:bg-[#322015] border border-[#52331c] rounded-xl flex items-center gap-3 text-left transition active:scale-95 group shadow-md"
        >
          <div className="p-2 rounded-lg bg-[#3d2414] text-[#38bdf8] border border-[#0284c7]/40 group-hover:scale-105 transition">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-kalam font-bold text-base text-[#f3f4f6] leading-tight">
              Pass & Play
            </h3>
            <p className="text-[10px] text-[#9ca3af] leading-tight mt-0.5">2-3 Players on 1 Phone</p>
          </div>
        </button>

        {/* AI Battle */}
        <button
          onClick={() => {
            Sound.playClick();
            onOpenSetup('ai_battle');
          }}
          className="p-3 bg-[#24170f]/90 hover:bg-[#322015] border border-[#52331c] rounded-xl flex items-center gap-3 text-left transition active:scale-95 group shadow-md"
        >
          <div className="p-2 rounded-lg bg-[#3d2414] text-[#ec4899] border border-[#be185d]/40 group-hover:scale-105 transition">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-kalam font-bold text-base text-[#f3f4f6] leading-tight">
              AI Battle
            </h3>
            <p className="text-[10px] text-[#9ca3af] leading-tight mt-0.5">Easy, Normal, Sharp Bots</p>
          </div>
        </button>

        {/* Championship Tournament */}
        <button
          onClick={() => {
            Sound.playClick();
            onOpenChampionship();
          }}
          className="p-3 bg-[#24170f]/90 hover:bg-[#322015] border border-[#52331c] rounded-xl flex items-center gap-3 text-left transition active:scale-95 group shadow-md"
        >
          <div className="p-2 rounded-lg bg-[#3d2414] text-[#eab308] border border-[#ca8a04]/40 group-hover:scale-105 transition">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-kalam font-bold text-base text-[#f3f4f6] leading-tight">
              Championship
            </h3>
            <p className="text-[10px] text-[#9ca3af] leading-tight mt-0.5">3-Round Cup Tournament</p>
          </div>
        </button>

        {/* Trick Shot Challenges */}
        <button
          onClick={() => {
            Sound.playClick();
            onOpenChallenges();
          }}
          className="p-3 bg-[#24170f]/90 hover:bg-[#322015] border border-[#52331c] rounded-xl flex items-center gap-3 text-left transition active:scale-95 group shadow-md"
        >
          <div className="p-2 rounded-lg bg-[#3d2414] text-[#a855f7] border border-[#7e22ce]/40 group-hover:scale-105 transition">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-kalam font-bold text-base text-[#f3f4f6] leading-tight">
              Challenges
            </h3>
            <p className="text-[10px] text-[#9ca3af] leading-tight mt-0.5">Trick Shots & Missions</p>
          </div>
        </button>
      </div>

      {/* Locker, Arena & Practice Bar */}
      <div className="w-full max-w-md flex items-center justify-between gap-2 mt-2">
        <button
          onClick={() => {
            Sound.playClick();
            onOpenLocker();
          }}
          className="flex-1 py-2.5 px-3 bg-[#2c1a0e] hover:bg-[#3d2414] border border-[#6b4226] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#f5c518] shadow transition active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-[#ffd700]" />
          <span>Pen Locker</span>
        </button>

        <button
          onClick={() => {
            Sound.playClick();
            onOpenArenas();
          }}
          className="flex-1 py-2.5 px-3 bg-[#2c1a0e] hover:bg-[#3d2414] border border-[#6b4226] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#e0a96d] shadow transition active:scale-95"
        >
          <Wrench className="w-4 h-4 text-[#d48c46]" />
          <span>Tables</span>
        </button>

        <button
          onClick={() => {
            Sound.playClick();
            onStartPractice();
          }}
          className="flex-1 py-2.5 px-3 bg-[#2c1a0e] hover:bg-[#3d2414] border border-[#6b4226] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#6ee7b7] shadow transition active:scale-95"
        >
          <BookOpen className="w-4 h-4 text-[#34d399]" />
          <span>Practice</span>
        </button>
      </div>

      {/* Rules link footer */}
      <div className="mt-3 flex items-center gap-4 text-xs text-[#a39485]">
        <button
          onClick={() => {
            Sound.playClick();
            onOpenHowTo();
          }}
          className="underline hover:text-[#f5d061] transition"
        >
          How to Play (নিয়মাবলী)
        </button>
        <span>&bull;</span>
        <span>Version 2.0.0 (Play Ready)</span>
      </div>
    </div>
  );
};
