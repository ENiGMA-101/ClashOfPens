import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Check,
  Lock,
  Sparkles,
  Coins,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ShieldCheck,
  Palette,
  Info,
} from 'lucide-react';
import { PenGroup, PenSkin, PlayerProgress } from '../types/game';
import { SKINS_DATA, getSkin } from '../game/skins';
import { drawDetailedPen } from '../game/renderer';
import { Sound } from '../game/audio';

interface PenLockerModalProps {
  progress: PlayerProgress;
  onClose: () => void;
  onEquipSkin: (skinId: string) => void;
  onUnlockSkin: (skinId: string, price: number) => void;
}

export const PenLockerModal: React.FC<PenLockerModalProps> = ({
  progress,
  onClose,
  onEquipSkin,
  onUnlockSkin,
}) => {
  const [selectedId, setSelectedId] = useState<string>(progress.equippedSkin || 'matador_pinpoint');
  const [activeGroup, setActiveGroup] = useState<PenGroup | 'all'>('basic');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [manualAngle, setManualAngle] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedSkin = getSkin(selectedId);
  const isUnlocked = progress.unlockedSkins.includes(selectedId) || selectedSkin.price === 0;
  const isEquipped = progress.equippedSkin === selectedId;
  const canAfford = progress.coins >= selectedSkin.price;

  // Render rotating 360 preview of selected pen with zoom controls
  useEffect(() => {
    let animId: number;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (isAutoRotating) {
        setManualAngle((prev) => prev + 0.012);
      }

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
      ctx.rotate(manualAngle);
      const baseScale = Math.min((w - 20) / 185, (h - 20) / 52);
      const finalScale = baseScale * zoomLevel;
      ctx.scale(finalScale, finalScale);

      drawDetailedPen(ctx, selectedSkin, {
        shadow: { blur: 16, x: 4, y: 8 },
        activeSide: 1,
        aura: selectedSkin.rarity === 'legendary',
      });
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [selectedSkin, manualAngle, zoomLevel, isAutoRotating]);

  // Filter skins by group and search query
  const filteredSkins = SKINS_DATA.filter((s) => {
    const matchesGroup = activeGroup === 'all' || s.group === activeGroup;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.banglaName && s.banglaName.includes(searchQuery)) ||
      s.lore.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-[#18110a] border-2 border-[#543319] rounded-2xl p-4 sm:p-5 shadow-2xl text-[#f3f4f6] max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3d2313] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#f5c518]" />
            <div>
              <h2 className="font-kalam font-bold text-2xl text-[#f5d061] leading-none">
                Pen Locker <span className="font-bangla text-lg text-[#d8536b] font-normal">(কলম লকার)</span>
              </h2>
              <p className="text-xs text-gray-400">Authentic Bangladeshi Stationery & Special Edition Collectibles</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#2b170c] border border-[#d4af37]/30 rounded-full text-xs font-bold text-[#f5c518]">
              <Coins className="w-3.5 h-3.5" />
              <span>{progress.coins.toLocaleString()}</span>
            </div>
            <button
              onClick={() => {
                Sound.playClick();
                onClose();
              }}
              aria-label="Close pen locker"
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 360 Interactive Inspection Canvas */}
        <div className="my-2.5 bg-[#120a05] border border-[#3b2010] rounded-xl p-3 flex flex-col relative overflow-hidden">
          {/* Top Canvas Controls: Zoom & Rotate Toggles */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-sm p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
              title="Zoom In"
              aria-label="Zoom In"
              className="p-1 text-gray-300 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
              title="Zoom Out"
              aria-label="Zoom Out"
              className="p-1 text-gray-300 hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsAutoRotating((r) => !r)}
              title={isAutoRotating ? 'Pause Rotation' : 'Auto Rotate'}
              aria-label="Toggle Auto Rotation"
              className={`p-1 rounded ${isAutoRotating ? 'text-[#f5c518]' : 'text-gray-400'}`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive 360 Viewport */}
          <div className="w-full h-24 sm:h-28 flex items-center justify-center cursor-grab active:cursor-grabbing">
            <canvas ref={previewCanvasRef} className="w-full h-full" />
          </div>

          {/* Pen Specs & Details Bar */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-kalam font-bold text-xl text-white">
                  {selectedSkin.name}
                </h3>
                {selectedSkin.banglaName && (
                  <span className="font-bangla text-xs text-[#d8536b]">
                    {selectedSkin.banglaName}
                  </span>
                )}
                {/* Authenticity Badge */}
                {selectedSkin.isAuthentic ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Authentic Stationery</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-500/30">
                    Original Game Design
                  </span>
                )}
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      selectedSkin.rarity === 'legendary'
                        ? '#d4af37'
                        : selectedSkin.rarity === 'epic'
                        ? '#a855f7'
                        : selectedSkin.rarity === 'rare'
                        ? '#3b82f6'
                        : '#4b5563',
                    color: selectedSkin.rarity === 'legendary' ? '#000' : '#fff',
                  }}
                >
                  {selectedSkin.rarity}
                </span>
              </div>

              {/* Technical stationery specifications */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#f5c518] mt-1">
                {selectedSkin.tipSize && (
                  <span>
                    <b className="text-gray-400">Tip:</b> {selectedSkin.tipSize}
                  </span>
                )}
                {selectedSkin.inkType && (
                  <span>
                    <b className="text-gray-400">Ink:</b> {selectedSkin.inkType}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-300 max-w-lg mt-1 leading-snug">{selectedSkin.lore}</p>
            </div>

            {/* Action: Equip or Unlock */}
            <div className="flex items-center sm:self-center">
              {isEquipped ? (
                <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold shadow">
                  <Check className="w-4 h-4" />
                  <span>Equipped</span>
                </div>
              ) : isUnlocked ? (
                <button
                  onClick={() => {
                    Sound.playClick();
                    onEquipSkin(selectedSkin.id);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#d4af37] text-black font-kalam font-extrabold text-base rounded-xl hover:brightness-110 active:scale-95 transition shadow-lg"
                >
                  Equip Pen
                </button>
              ) : (
                <button
                  disabled={!canAfford}
                  onClick={() => {
                    Sound.playClick();
                    onUnlockSkin(selectedSkin.id, selectedSkin.price);
                  }}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition shadow ${
                    canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-black active:scale-95 shadow-amber-500/20'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/10'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlock ({selectedSkin.price} 🪙)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-2">
          {/* Categories */}
          <div className="flex gap-1 bg-[#120a05] p-1 rounded-xl border border-[#3b2010] overflow-x-auto text-xs">
            <button
              onClick={() => {
                Sound.playClick();
                setActiveGroup('basic');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex-shrink-0 ${
                activeGroup === 'basic' ? 'bg-[#d4af37] text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Basic Pens (ফ্রি)
            </button>
            <button
              onClick={() => {
                Sound.playClick();
                setActiveGroup('matador');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex-shrink-0 ${
                activeGroup === 'matador' ? 'bg-[#d4af37] text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Authentic Matador (ম্যাটাডোর)
            </button>
            <button
              onClick={() => {
                Sound.playClick();
                setActiveGroup('special');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex-shrink-0 ${
                activeGroup === 'special' ? 'bg-[#d4af37] text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Special Editions (স্পেশাল)
            </button>
            <button
              onClick={() => {
                Sound.playClick();
                setActiveGroup('all');
              }}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex-shrink-0 ${
                activeGroup === 'all' ? 'bg-[#d4af37] text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({SKINS_DATA.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-1.5 bg-[#120a05] px-2.5 py-1.5 rounded-xl border border-[#3b2010] text-xs">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search pen name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white placeholder-gray-500 outline-none w-28 sm:w-36"
            />
          </div>
        </div>

        {/* Pens Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 overflow-y-auto pr-1 flex-1">
          {filteredSkins.map((skin) => {
            const isSkinUnlocked =
              progress.unlockedSkins.includes(skin.id) || skin.price === 0;
            const isSkinEquipped = progress.equippedSkin === skin.id;
            const isChosen = selectedId === skin.id;

            return (
              <button
                key={skin.id}
                onClick={() => {
                  Sound.playClick();
                  setSelectedId(skin.id);
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 text-left transition relative ${
                  isChosen
                    ? 'border-[#f5c518] bg-[#2d1b0f] shadow-md scale-[1.02]'
                    : 'border-[#3d2414] bg-[#1a0e06] hover:border-[#6b3f21]'
                }`}
              >
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full shadow"
                      style={{ backgroundColor: skin.ui }}
                    />
                    {skin.isAuthentic && (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1 rounded">
                        BD
                      </span>
                    )}
                  </div>
                  {isSkinEquipped ? (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                      Equipped
                    </span>
                  ) : !isSkinUnlocked ? (
                    <Lock className="w-3 h-3 text-gray-500" />
                  ) : null}
                </div>

                <span className="font-kalam font-bold text-sm text-white truncate w-full mt-0.5">
                  {skin.name}
                </span>

                <div className="w-full flex items-center justify-between text-[10px] text-gray-400">
                  <span className="capitalize">{skin.rarity}</span>
                  <span className="font-semibold text-amber-400">
                    {isSkinUnlocked ? 'Free / Owned' : `${skin.price} 🪙`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
