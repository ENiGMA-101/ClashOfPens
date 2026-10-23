import React, { useState } from 'react';
import { X, Play, User, Bot } from 'lucide-react';
import { PlayerConfig } from '../types/game';
import { SKINS_DATA, getSkin } from '../game/skins';
import { Sound } from '../game/audio';

interface MatchSetupModalProps {
  mode: 'quick' | 'pass_and_play' | 'ai_battle';
  onClose: () => void;
  onStart: (players: PlayerConfig[]) => void;
  defaultSkinId: string;
}

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({
  mode,
  onClose,
  onStart,
  defaultSkinId,
}) => {
  const [playerCount, setPlayerCount] = useState<2 | 3>(2);
  const [players, setPlayers] = useState<PlayerConfig[]>([
    {
      id: 'p1',
      name: 'Player 1',
      skinId: defaultSkinId || 'blue',
      isBot: false,
    },
    {
      id: 'p2',
      name: mode === 'ai_battle' ? 'Bot Tutul' : 'Player 2',
      skinId: 'black',
      isBot: mode === 'ai_battle',
    },
    {
      id: 'p3',
      name: mode === 'ai_battle' ? 'Bot Shimul' : 'Player 3',
      skinId: 'red',
      isBot: mode === 'ai_battle',
    },
  ]);

  const updatePlayer = (idx: number, updates: Partial<PlayerConfig>) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
  };

  const handleStart = () => {
    Sound.playClick();
    onStart(players.slice(0, playerCount));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#1c120a] border-2 border-[#5a361c] rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto text-[#f3f4f6]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3d2313] pb-3 mb-4">
          <div>
            <h2 className="font-kalam font-bold text-2xl text-[#f5d061]">
              {mode === 'pass_and_play' ? (
                <>
                  Pass & Play Setup{' '}
                  <span className="font-bangla text-lg text-[#d8536b] font-normal">
                    (বন্ধুদের সাথে)
                  </span>
                </>
              ) : mode === 'ai_battle' ? (
                <>
                  AI Battle Match{' '}
                  <span className="font-bangla text-lg text-[#d8536b] font-normal">
                    (বটদের সাথে)
                  </span>
                </>
              ) : (
                <>
                  Match Setup{' '}
                  <span className="font-bangla text-lg text-[#d8536b] font-normal">
                    (ম্যাচ প্রস্তুতি)
                  </span>
                </>
              )}
            </h2>
            <p className="text-xs text-[#9ca3af]">Configure pens and fighters at the desk</p>
          </div>
          <button
            onClick={() => {
              Sound.playClick();
              onClose();
            }}
            aria-label="Close setup modal"
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Count Segment */}
        <div className="mb-4 flex items-center justify-between bg-[#2a170d] p-2 rounded-xl border border-[#4d2b17]">
          <span className="text-xs font-bold text-[#e5e7eb] pl-2">Players at Desk</span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                Sound.playClick();
                setPlayerCount(2);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                playerCount === 2
                  ? 'bg-[#d4af37] text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              2 Players
            </button>
            <button
              onClick={() => {
                Sound.playClick();
                setPlayerCount(3);
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                playerCount === 3
                  ? 'bg-[#d4af37] text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              3 Players
            </button>
          </div>
        </div>

        {/* Players Cards */}
        <div className="space-y-3 mb-5">
          {players.slice(0, playerCount).map((p, idx) => {
            const currentSkin = getSkin(p.skinId);
            return (
              <div
                key={p.id}
                className="bg-[#24150b] border border-[#422614] rounded-xl p-3 shadow-inner"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span
                      className="w-3 h-3 rounded-full shadow"
                      style={{ backgroundColor: currentSkin.ui }}
                    />
                    <input
                      type="text"
                      value={p.name}
                      maxLength={14}
                      onChange={(e) => updatePlayer(idx, { name: e.target.value })}
                      className="bg-transparent border-b border-[#5a361c] font-kalam font-bold text-lg text-white px-1 py-0.5 focus:border-[#d4af37] outline-none w-36"
                    />
                  </div>

                  {/* Human / Bot toggle */}
                  <div className="flex gap-1 bg-[#150c06] p-1 rounded-lg border border-[#3d2313]">
                    <button
                      onClick={() => updatePlayer(idx, { isBot: false })}
                      className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded ${
                        !p.isBot ? 'bg-[#3b82f6] text-white' : 'text-gray-500'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      <span>Human</span>
                    </button>
                    <button
                      onClick={() => updatePlayer(idx, { isBot: true })}
                      className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded ${
                        p.isBot ? 'bg-[#ec4899] text-white' : 'text-gray-500'
                      }`}
                    >
                      <Bot className="w-3 h-3" />
                      <span>Bot</span>
                    </button>
                  </div>
                </div>

                {/* Skin Selector Row */}
                <div className="mt-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Select Pen: {currentSkin.name}
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5">
                    {SKINS_DATA.map((skin) => {
                      const isTaken = players
                        .slice(0, playerCount)
                        .some((other, j) => j !== idx && other.skinId === skin.id);
                      const isSelected = p.skinId === skin.id;

                      return (
                        <button
                          key={skin.id}
                          disabled={isTaken}
                          onClick={() => {
                            Sound.playClick();
                            updatePlayer(idx, { skinId: skin.id });
                          }}
                          className={`flex-shrink-0 px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition ${
                            isSelected
                              ? 'border-[#d4af37] bg-[#3d2716] text-[#f5d061]'
                              : isTaken
                              ? 'opacity-30 border-transparent bg-black/20 text-gray-600 cursor-not-allowed'
                              : 'border-[#3d2313] bg-[#1a0e06] text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: skin.ui }}
                          />
                          <span>{skin.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Start Game Action */}
        <button
          onClick={handleStart}
          className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#d4af37] text-black font-kalam font-extrabold text-xl rounded-xl shadow-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>START THE FIGHT (যুদ্ধ শুরু)</span>
        </button>
      </div>
    </div>
  );
};
