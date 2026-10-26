import React, { useState, useMemo } from 'react';
import { X, Play, User, Bot, AlertCircle, Shield, Swords } from 'lucide-react';
import { PlayerConfig } from '../types/game';
import { SKINS_DATA, getSkin, DEFAULT_PEN_ID } from '../game/skins';
import { BOT_ROSTER } from '../game/bots';
import { Sound } from '../game/audio';
import { MatchFormat } from '../game/seriesState';
import { validatePlayerName } from '../game/validation';

interface MatchSetupModalProps {
  mode: 'quick' | 'pass_and_play' | 'ai_battle';
  onClose: () => void;
  onStart: (players: PlayerConfig[], format?: MatchFormat) => void;
  defaultSkinId: string;
}

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({
  mode,
  onClose,
  onStart,
  defaultSkinId,
}) => {
  const [playerCount, setPlayerCount] = useState<2 | 3>(2);
  const [format, setFormat] = useState<MatchFormat>('single');
  const [players, setPlayers] = useState<PlayerConfig[]>([
    {
      id: 'p1',
      name: 'Player 1',
      skinId: defaultSkinId || DEFAULT_PEN_ID,
      isBot: false,
    },
    {
      id: 'p2',
      name: mode === 'ai_battle' ? BOT_ROSTER[0].name : 'Player 2',
      skinId: mode === 'ai_battle' ? BOT_ROSTER[0].defaultSkinId : 'matador_alltime',
      isBot: mode === 'ai_battle',
      botPersonalityId: mode === 'ai_battle' ? BOT_ROSTER[0].id : undefined,
    },
    {
      id: 'p3',
      name: mode === 'ai_battle' ? BOT_ROSTER[2].name : 'Player 3',
      skinId: mode === 'ai_battle' ? BOT_ROSTER[2].defaultSkinId : 'matador_iteen',
      isBot: mode === 'ai_battle',
      botPersonalityId: mode === 'ai_battle' ? BOT_ROSTER[2].id : undefined,
    },
  ]);

  const updatePlayer = (idx: number, updates: Partial<PlayerConfig>) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
  };

  const handleSelectBotRoster = (playerIdx: number, botId: string) => {
    const personality = BOT_ROSTER.find((b) => b.id === botId);
    if (!personality) return;
    Sound.playClick();
    updatePlayer(playerIdx, {
      name: personality.name,
      skinId: personality.defaultSkinId,
      isBot: true,
      botPersonalityId: personality.id,
    });
  };

  // Validate active player names
  const activePlayers = players.slice(0, playerCount);
  const nameValidations = useMemo(() => {
    return activePlayers.map((p, idx) => {
      if (p.isBot) {
        return { valid: true, cleanName: p.name };
      }
      const otherNames = activePlayers
        .filter((_, j) => j !== idx)
        .map((other) => other.name);
      return validatePlayerName(p.name, otherNames, idx);
    });
  }, [activePlayers]);

  const hasValidationError = nameValidations.some((v) => !v.valid);

  const handleStart = () => {
    if (hasValidationError) return;
    Sound.playClick();

    // Clean trimmed names while keeping stable IDs
    const finalPlayers: PlayerConfig[] = activePlayers.map((p, idx) => ({
      ...p,
      name: p.isBot ? p.name : nameValidations[idx].cleanName || `Player ${idx + 1}`,
      id: `player_${idx + 1}`,
    }));

    onStart(finalPlayers, format);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn"
      data-testid="match-setup-modal"
    >
      <div className="w-full max-w-xl bg-[#1c120a] border-2 border-amber-600/70 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto text-[#f3f4f6]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3d2313] pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
                <Swords className="w-5 h-5" />
              </span>
              <h2 className="font-kalam font-bold text-2xl text-amber-300">
                {mode === 'pass_and_play' ? (
                  <>Friendly Pass & Play</>
                ) : mode === 'ai_battle' ? (
                  <>AI Battle Match</>
                ) : (
                  <>Match Setup</>
                )}
              </h2>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {mode === 'pass_and_play'
                ? 'Enter player names, choose your stationery pens, and prepare for placement'
                : 'Configure participants, format, and stationery loadouts'}
            </p>
          </div>
          <button
            onClick={() => {
              Sound.playClick();
              onClose();
            }}
            aria-label="Close setup modal"
            className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Count & Match Format Segments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          {/* Player Count */}
          <div className="flex items-center justify-between bg-[#2a170d] p-2.5 rounded-2xl border border-[#4d2b17]">
            <span className="text-xs font-bold text-stone-300 pl-1">Players</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  Sound.playClick();
                  setPlayerCount(2);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                  playerCount === 2
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                2 Players
              </button>
              <button
                type="button"
                onClick={() => {
                  Sound.playClick();
                  setPlayerCount(3);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                  playerCount === 3
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                3 Players
              </button>
            </div>
          </div>

          {/* Match Format Toggle */}
          <div className="flex items-center justify-between bg-[#2a170d] p-2.5 rounded-2xl border border-[#4d2b17]">
            <span className="text-xs font-bold text-stone-300 pl-1">Format</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  Sound.playClick();
                  setFormat('single');
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl transition ${
                  format === 'single'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Single Match
              </button>
              <button
                type="button"
                onClick={() => {
                  Sound.playClick();
                  setFormat('bo5');
                }}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-xl transition ${
                  format === 'bo5'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Best of 5
              </button>
            </div>
          </div>
        </div>

        {/* Players Cards */}
        <div className="space-y-3 mb-5">
          {activePlayers.map((p, idx) => {
            const currentSkin = getSkin(p.skinId);
            const validation = nameValidations[idx];

            return (
              <div
                key={p.id}
                className="bg-[#24150b] border border-[#422614] rounded-2xl p-3.5 shadow-inner"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow"
                      style={{ backgroundColor: currentSkin.ui }}
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={p.name}
                        disabled={p.isBot}
                        maxLength={18}
                        onChange={(e) => updatePlayer(idx, { name: e.target.value })}
                        placeholder={`Enter Player ${idx + 1} Name`}
                        className={`bg-transparent border-b font-kalam font-bold text-lg text-white px-1 py-0.5 outline-none w-full max-w-[240px] transition ${
                          !validation.valid
                            ? 'border-rose-500 text-rose-200 focus:border-rose-400'
                            : 'border-[#5a361c] focus:border-amber-400'
                        } ${p.isBot ? 'opacity-80 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Human / Bot selector (for multi-bot setups) */}
                  {mode !== 'pass_and_play' && (
                    <div className="flex gap-1 bg-[#150c06] p-1 rounded-xl border border-[#3d2313] self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => updatePlayer(idx, { isBot: false })}
                        className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                          !p.isBot
                            ? 'bg-[#3b82f6] text-white shadow'
                            : 'text-stone-500 hover:text-stone-300'
                        }`}
                      >
                        <User className="w-3 h-3" />
                        <span>Human</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const bot = BOT_ROSTER[idx % BOT_ROSTER.length];
                          updatePlayer(idx, {
                            isBot: true,
                            name: bot.name,
                            skinId: bot.defaultSkinId,
                            botPersonalityId: bot.id,
                          });
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                          p.isBot
                            ? 'bg-[#ec4899] text-white shadow'
                            : 'text-stone-500 hover:text-stone-300'
                        }`}
                      >
                        <Bot className="w-3 h-3" />
                        <span>Bot</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Validation Error */}
                {!validation.valid && validation.error && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 mb-2 pl-6">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validation.error}</span>
                  </div>
                )}

                {/* If bot, show quick personality selector */}
                {p.isBot && (
                  <div className="mb-2 p-2.5 bg-[#180e07] rounded-xl border border-amber-950/40">
                    <span className="text-[10px] font-bold text-stone-400 block mb-1.5">
                      Choose Opponent Personality:
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                      {BOT_ROSTER.map((bot) => {
                        const isChosen = p.botPersonalityId === bot.id;
                        return (
                          <button
                            type="button"
                            key={bot.id}
                            onClick={() => handleSelectBotRoster(idx, bot.id)}
                            className={`flex-shrink-0 px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition ${
                              isChosen
                                ? 'border-amber-400 bg-amber-950/50 text-amber-300 shadow'
                                : 'border-[#38200f] bg-[#120a05] text-stone-400 hover:text-white'
                            }`}
                          >
                            <span>{bot.avatar}</span>
                            <span className="font-semibold">{bot.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pen Selector Row */}
                <div className="mt-2">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                    Weapon: {currentSkin.name} {currentSkin.isAuthentic && '(Matador BD)'}
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5">
                    {SKINS_DATA.map((skin) => {
                      const isTaken = activePlayers.some(
                        (other, j) => j !== idx && other.skinId === skin.id
                      );
                      const isSelected = p.skinId === skin.id;

                      return (
                        <button
                          type="button"
                          key={skin.id}
                          disabled={isTaken}
                          onClick={() => {
                            Sound.playClick();
                            updatePlayer(idx, { skinId: skin.id });
                          }}
                          className={`flex-shrink-0 px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition ${
                            isSelected
                              ? 'border-amber-400 bg-amber-950/60 text-amber-300 shadow'
                              : isTaken
                              ? 'opacity-30 border-transparent bg-black/20 text-stone-600 cursor-not-allowed'
                              : 'border-[#3d2313] bg-[#1a0e06] text-stone-300 hover:border-stone-500'
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

        {/* Match Summary Card */}
        <div className="p-3 bg-[#130b05] border border-[#3d2313] rounded-2xl mb-4 text-xs text-stone-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {mode === 'pass_and_play' ? 'Friendly Pass & Play' : 'Battle Arena'} ·{' '}
              {format === 'bo5' ? 'Best of 5 Series' : 'Single Sudden Death'}
            </span>
          </div>
          <span className="text-amber-400 font-semibold">{playerCount} Combatants</span>
        </div>

        {/* Start Game Action */}
        <button
          type="button"
          onClick={handleStart}
          disabled={hasValidationError}
          className={`w-full py-4 font-kalam font-extrabold text-xl rounded-2xl shadow-lg flex items-center justify-center gap-2 transition ${
            !hasValidationError
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-stone-950 hover:brightness-110 active:scale-98 cursor-pointer'
              : 'bg-stone-800 text-stone-500 border border-stone-700/60 cursor-not-allowed'
          }`}
        >
          <Play className="w-5 h-5 fill-current" />
          <span>START PEN PLACEMENT (কলম স্থাপন শুরু)</span>
        </button>
      </div>
    </div>
  );
};
