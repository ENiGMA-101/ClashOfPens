import React, { useState } from 'react';
import { X, Check, Sliders, Maximize2, Square, Layout } from 'lucide-react';
import { TABLE_PRESETS, TableConfig, getTableConfig } from '../game/tableConfig';
import { Sound } from '../game/audio';

interface TableSelectionModalProps {
  currentTableId: string;
  customWidth?: number;
  customHeight?: number;
  onSelectTable: (tableId: string, customDims?: { width: number; height: number }) => void;
  onClose: () => void;
}

export const TableSelectionModal: React.FC<TableSelectionModalProps> = ({
  currentTableId,
  customWidth = 900,
  customHeight = 600,
  onSelectTable,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState(currentTableId);
  const [cWidth, setCWidth] = useState(customWidth);
  const [cHeight, setCHeight] = useState(customHeight);

  const activeTable = getTableConfig(selectedId, { width: cWidth, height: cHeight });

  const handleApply = (id: string) => {
    Sound.playClick();
    setSelectedId(id);
    if (id === 'custom_table') {
      onSelectTable(id, { width: cWidth, height: cHeight });
    } else {
      onSelectTable(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#19110a] border-2 border-[#543319] rounded-2xl p-5 shadow-2xl text-[#f3f4f6] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3d2313] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Layout className="w-6 h-6 text-[#f5c518]" />
            <div>
              <h2 className="font-kalam font-bold text-2xl text-[#f5d061] leading-none">
                Table Arenas <span className="font-bangla text-lg text-[#d8536b] font-normal">(টেবিল নির্বাচন)</span>
              </h2>
              <p className="text-xs text-gray-400">
                Choose table shape, playable dimensions, and wooden friction
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              Sound.playClick();
              onClose();
            }}
            aria-label="Close table selector"
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-1 flex-1">
          {TABLE_PRESETS.map((table) => {
            const isSelected = selectedId === table.id;
            const isEquipped = currentTableId === table.id;
            const dims =
              table.id === 'custom_table'
                ? { w: cWidth, h: cHeight }
                : { w: table.baseWidth, h: table.baseHeight };

            return (
              <div
                key={table.id}
                onClick={() => handleApply(table.id)}
                className={`cursor-pointer p-4 rounded-xl border flex flex-col justify-between transition relative ${
                  isSelected
                    ? 'border-[#f5c518] bg-[#2d1b0f] shadow-lg shadow-[#d4af37]/15'
                    : 'border-[#3d2414] bg-[#1a0e06] hover:border-[#6b3f21]'
                }`}
              >
                <div>
                  {/* Title & Active badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-kalam font-bold text-lg text-white leading-tight">
                        {table.name}
                      </h3>
                      <span className="font-bangla text-xs text-[#d8536b] block">
                        {table.banglaName}
                      </span>
                    </div>
                    {isEquipped && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 flex-shrink-0">
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  {/* Visual Preview Box showing aspect ratio and spawn slots */}
                  <div className="my-3 h-28 bg-[#0d0704] rounded-lg border border-[#381f10] p-2 flex items-center justify-center relative overflow-hidden">
                    {/* Simulated Table Graphic */}
                    <div
                      className="border-2 border-[#d4af37]/80 rounded shadow-md relative flex items-center justify-around"
                      style={{
                        backgroundColor: `hsl(${table.theme.baseHue}, ${table.theme.baseSat}%, ${table.theme.baseLight}%)`,
                        width: table.shape === 'square' ? '88px' : '124px',
                        height: table.shape === 'square' ? '88px' : '64px',
                        boxShadow: `inset 0 0 10px ${table.theme.rimColor}`,
                      }}
                    >
                      {/* Pen spawn indicators */}
                      <div className="w-1.5 h-6 bg-blue-500 rounded-sm shadow opacity-80" />
                      <div className="text-[10px] font-mono text-white/40">VS</div>
                      <div className="w-1.5 h-6 bg-red-500 rounded-sm shadow opacity-80" />
                    </div>

                    <div className="absolute bottom-1 right-2 text-[10px] font-mono text-gray-400">
                      {dims.w} × {dims.h} px
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">{table.desc}</p>
                </div>

                {/* Specs / Properties */}
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Surface Friction:</span>
                  <span
                    className={`font-bold capitalize px-2 py-0.5 rounded ${
                      table.surface === 'polished'
                        ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                        : table.surface === 'rough'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {table.surface}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Table Controls if custom_table selected */}
        {selectedId === 'custom_table' && (
          <div className="mt-3 p-3 bg-[#24150b] rounded-xl border border-[#523019] flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#f5c518]">
              <Sliders className="w-4 h-4" />
              <span>Configure Custom Dimensions (কাস্টম মাপ)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex justify-between text-gray-300 mb-1">
                  <span>Width:</span>
                  <span className="font-mono text-[#f5c518]">{cWidth} px</span>
                </div>
                <input
                  type="range"
                  min="550"
                  max="1200"
                  step="25"
                  value={cWidth}
                  onChange={(e) => {
                    const w = +e.target.value;
                    setCWidth(w);
                    onSelectTable('custom_table', { width: w, height: cHeight });
                  }}
                  className="w-full accent-[#d4af37]"
                />
              </div>
              <div>
                <div className="flex justify-between text-gray-300 mb-1">
                  <span>Height:</span>
                  <span className="font-mono text-[#f5c518]">{cHeight} px</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="1000"
                  step="25"
                  value={cHeight}
                  onChange={(e) => {
                    const h = +e.target.value;
                    setCHeight(h);
                    onSelectTable('custom_table', { width: cWidth, height: h });
                  }}
                  className="w-full accent-[#d4af37]"
                />
              </div>
            </div>
            <div className="text-[11px] text-gray-400">
              Aspect Ratio: <span className="text-white font-mono">{(cWidth / cHeight).toFixed(2)} : 1</span>
            </div>
          </div>
        )}

        {/* Bottom Close / Confirm Action */}
        <div className="mt-4 pt-3 border-t border-[#3d2313] flex justify-end">
          <button
            onClick={() => {
              Sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f5d061] text-black font-kalam font-bold text-lg hover:brightness-110 active:scale-95 shadow"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
