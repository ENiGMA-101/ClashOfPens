import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Lock, Sparkles, Coins } from 'lucide-react';
import { PenSkin, PlayerProgress } from '../types/game';
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
  const [selectedId, setSelectedId] = useState<string>(progress.equippedSkin || 'blue');
  const [activeTab, setActiveTab] = useState<'classic' | 'hero' | 'legendary'>('classic');
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedSkin = getSkin(selectedId);
  const isUnlocked = progress.unlockedSkins.includes(selectedId) || selectedSkin.price === 0;
  const isEquipped = progress.equippedSkin === selectedId;
  const canAfford = progress.coins >= selectedSkin.price;

  // Render rotating / 360 animated preview of selected pen
  useEffect(() => {
    let animId: number;
    let angle = 0;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      angle += 0.012;
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
      const scale = Math.min((w - 20) / 180, (h - 20) / 50);
      ctx.scale(scale, scale);

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
  }, [selectedSkin]);

  const filteredSkins = SKINS_DATA.filter((s) => s.group === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-[#1a110a] border-2 border-[#543319] rounded-2xl p-5 shadow-2xl text-[#f3f4f6] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3d2313] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#f5c518]" />
            <div>
              <h2 className="font-kalam font-bold text-2xl text-[#f5d061] leading-none">
                Pen Locker <span className="font-bangla text-lg text-[#d8536b] font-normal">(কলম লকার)</span>
              </h2>
              <p className="text-xs text-gray-400">Unlock & equip custom classroom fighters</p>
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

        {/* 360 Pen Showcase Canvas */}
        <div className="my-3 bg-[#130b05] border border-[#3b2010] rounded-xl p-3 flex flex-col items-center relative overflow-hidden">
          <div className="w-full h-24 sm:h-28 flex items-center justify-center">
            <canvas ref={previewCanvasRef} className="w-full h-full" />
          </div>

          <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-white/5 px-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-kalam font-bold text-xl text-white">
                  {selectedSkin.name}
                </h3>
                {selectedSkin.banglaName && (
                  <span className="font-bangla text-xs text-[#d8536b]">
                    {selectedSkin.banglaName}
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
                        : '#6b7280',
                    color: selectedSkin.rarity === 'legendary' ? '#000' : '#fff',
                  }}
                >
                  {selectedSkin.rarity}
                </span>
              </div>
              <p className="text-xs text-gray-400 max-w-sm mt-0.5">{selectedSkin.lore}</p>
            </div>

            {/* Action: Equip or Unlock */}
            <div>
              {isEquipped ? (
                <div className="flex items-center gap-1 px-4 py-2 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold shadow">
                  <Check className="w-4 h-4" />
                  <span>Equipped</span>
                </div>
              ) : isUnlocked ? (
                <button
                  onClick={() => {
                    Sound.playClick();
                    onEquipSkin(selectedSkin.id);
                  }}
                  className="px-5 py-2 bg-[#d4af37] text-black font-kalam font-extrabold text-base rounded-xl hover:brightness-110 active:scale-95 transition shadow-lg"
                >
                  Equip
                </button>
              ) : (
                <button
                  disabled={!canAfford}
                  onClick={() => {
                    Sound.playClick();
                    onUnlockSkin(selectedSkin.id, selectedSkin.price);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
                    canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-black active:scale-95'
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

        {/* Group Tabs */}
        <div className="flex gap-2 mb-3 bg-[#130b05] p-1 rounded-xl border border-[#3b2010]">
          {(['classic', 'hero', 'legendary'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                Sound.playClick();
                setActiveTab(tab);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition ${
                activeTab === tab
                  ? 'bg-[#d4af37] text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'classic'
                ? 'Classics (সাধারণ)'
                : tab === 'hero'
                ? 'Hero Squad (বীর)'
                : 'Legendary (কিংবদন্তি)'}
            </button>
          ))}
        </div>

        {/* Skin Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto pr-1 flex-1">
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
                    ? 'border-[#f5c518] bg-[#2d1b0f] shadow-md'
                    : 'border-[#3d2414] bg-[#1a0e06] hover:border-[#6b3f21]'
                }`}
              >
                <div className="w-full flex items-center justify-between">
                  <span
                    className="w-3 h-3 rounded-full shadow"
                    style={{ backgroundColor: skin.ui }}
                  />
                  {isSkinEquipped ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                      Equipped
                    </span>
                  ) : !isSkinUnlocked ? (
                    <Lock className="w-3.5 h-3.5 text-gray-500" />
                  ) : null}
                </div>
                <span className="font-kalam font-bold text-sm text-white truncate w-full">
                  {skin.name}
                </span>
                <span className="text-[10px] text-gray-400">
                  {isSkinUnlocked ? 'Unlocked' : `${skin.price} Coins`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
