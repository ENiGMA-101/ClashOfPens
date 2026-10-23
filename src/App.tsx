/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import confetti from 'canvas-confetti';

import {
  AttackSideIndex,
  ChallengeItem,
  GameMode,
  GamePhase,
  GameSettings,
  InGamePlayer,
  PlayerConfig,
  PlayerProgress,
  TournamentMatch,
} from './types/game';
import {
  BASE_DENSITY,
  BASE_RESTITUTION,
  DESK_MARGIN,
  MAX_SPEED,
  PEN_LENGTH,
  PEN_WIDTH,
  SUB_DT,
} from './game/constants';
import { getSkin } from './game/skins';
import { getArena } from './game/arenas';
import {
  applyLaunch,
  contactPoint,
  isOffDesk,
  launchSpeed,
  resolveCustomStrike,
  simulateTrajectory,
  TrajectoryResult,
} from './game/physics';
import { planBotShot } from './game/bot';
import { getBotPersonality } from './game/bots';
import { Sound } from './game/audio';
import {
  calculateLevel,
  INITIAL_PROGRESS,
  loadProgress,
  loadSettings,
  saveProgress,
  saveSettings,
} from './game/storage';
import {
  drawDetailedPen,
  drawRoundedRect,
  generateDeskCanvas,
} from './game/renderer';
import {
  getTableConfig,
  resolveTableDimensions,
  getTableSpawnPositions,
} from './game/tableConfig';
import {
  SeriesState,
  MatchFormat,
  createNewSeries,
  commitSeriesMatchResult,
  getNextMatchInstanceId,
  loadSavedSeriesState,
} from './game/seriesState';

import { HeaderNav } from './components/HeaderNav';
import { MainMenu } from './components/MainMenu';
import { GameHUD } from './components/GameHUD';
import { MatchSetupModal } from './components/MatchSetupModal';
import { PenLockerModal } from './components/PenLockerModal';
import { ArenaSelectorModal } from './components/ArenaSelectorModal';
import { TableSelectionModal } from './components/TableSelectionModal';
import { ChallengesModal } from './components/ChallengesModal';
import { ChampionshipModal } from './components/ChampionshipModal';
import { SettingsModal } from './components/SettingsModal';
import { HowToModal } from './components/HowToModal';
import { MatchOverModal } from './components/MatchOverModal';
import { AndroidReleaseModal } from './components/AndroidReleaseModal';

const { Engine, Bodies, Body, Composite, Events } = Matter;

type ActiveModal =
  | 'none'
  | 'setup'
  | 'locker'
  | 'arenas'
  | 'challenges'
  | 'championship'
  | 'settings'
  | 'howto'
  | 'match_over'
  | 'android_release';

interface FallenPen {
  player: InGamePlayer;
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  va: number;
  nx: number;
  ny: number;
  t: number;
}

interface ParticleFx {
  type: 'ring' | 'text' | 'confetti';
  x: number;
  y: number;
  t: number;
  dur: number;
  r?: number;
  col?: string;
  text?: string;
}

export default function App() {
  const [progress, setProgress] = useState<PlayerProgress>(loadProgress);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [setupMode, setSetupMode] = useState<'quick' | 'pass_and_play' | 'ai_battle'>('quick');

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('quick');
  const [phase, setPhase] = useState<GamePhase>('aim');
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [power, setPower] = useState<number>(50);
  const [side, setSide] = useState<AttackSideIndex>(1);
  const [banner, setBanner] = useState<{ title: string; sub?: string } | null>(null);

  const [activeChallenge, setActiveChallenge] = useState<ChallengeItem | null>(null);
  const [activeTournamentMatch, setActiveTournamentMatch] = useState<TournamentMatch | null>(null);
  const [turnsUsedInChallenge, setTurnsUsedInChallenge] = useState(0);

  const [matchWinner, setMatchWinner] = useState<InGamePlayer | null>(null);
  const [eliminatedHistory, setEliminatedHistory] = useState<InGamePlayer[]>([]);
  const [awardedRewards, setAwardedRewards] = useState<{ coins: number; xp: number }>({
    coins: 0,
    xp: 0,
  });

  // Table Configuration & Dimensions
  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    try {
      return localStorage.getItem('clashofpens_table_id') || 'large_rectangle';
    } catch {
      return 'large_rectangle';
    }
  });
  const [customDims, setCustomDims] = useState<{ width: number; height: number }>(() => {
    try {
      const saved = localStorage.getItem('clashofpens_custom_table_dims');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { width: 900, height: 600 };
  });

  // Best of 5 Series State & Player Configs
  const [series, setSeries] = useState<SeriesState | null>(loadSavedSeriesState);
  const [lastPlayerConfigs, setLastPlayerConfigs] = useState<PlayerConfig[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable Game Loop State
  const gameRef = useRef<{
    engine: Matter.Engine | null;
    players: InGamePlayer[];
    deskWidth: number;
    deskHeight: number;
    deskCanvas: HTMLCanvasElement | null;
    view: { scale: number; ox: number; oy: number };
    aimAngle: number;
    ghost: TrajectoryResult | null;
    ghostDirty: boolean;
    isDragging: boolean;
    fallen: FallenPen[];
    fx: ParticleFx[];
    stillFrames: number;
    moveSteps: number;
    launchTime: number;
    attacker: InGamePlayer | null;
    struck: boolean;
    shake: number;
    matchId: number;
    botPlanTime: number;
    botActive: boolean;
    botPlan: any;
    lastHitTime: number;
  }>({
    engine: null,
    players: [],
    deskWidth: 1000,
    deskHeight: 640,
    deskCanvas: null,
    view: { scale: 1, ox: 0, oy: 0 },
    aimAngle: 0,
    ghost: null,
    ghostDirty: true,
    isDragging: false,
    fallen: [],
    fx: [],
    stillFrames: 0,
    moveSteps: 0,
    launchTime: 0,
    attacker: null,
    struck: false,
    shake: 0,
    matchId: 0,
    botPlanTime: 0,
    botActive: false,
    botPlan: null,
    lastHitTime: 0,
  });

  // Sound & vibration sync
  useEffect(() => {
    Sound.setSoundEnabled(settings.sound);
    Sound.setMusicEnabled(settings.music);
    Sound.setVibrateEnabled(settings.vibrate);
  }, [settings]);

  // Save changes
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Show banner with auto-hide
  const showBanner = useCallback((title: string, sub?: string, duration = 1800) => {
    setBanner({ title, sub });
    const timer = setTimeout(() => {
      setBanner((b) => (b?.title === title ? null : b));
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  // Compute starting spawn positions for players
  const getSpawnPositions = (count: number, isPortrait: boolean, tw: number, th: number) => {
    const cx = tw / 2;
    const cy = th / 2;
    if (count === 2) {
      return isPortrait
        ? [
            { x: cx, y: th * 0.35, a: 0.12 },
            { x: cx, y: th * 0.65, a: -0.12 },
          ]
        : [
            { x: tw * 0.34, y: cy, a: Math.PI / 2 + 0.12 },
            { x: tw * 0.66, y: cy, a: Math.PI / 2 - 0.12 },
          ];
    }
    const r = Math.min(tw, th) * 0.32;
    const out = [];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count + (isPortrait ? Math.PI / 6 : 0);
      out.push({
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        a: angle + Math.PI / 2,
      });
    }
    return out;
  };

  // Layout calculation
  const updateLayout = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const G = gameRef.current;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPortrait = w / h < 0.95;

    const table = getTableConfig(selectedTableId, customDims);
    const dims = resolveTableDimensions(table, isPortrait);
    G.deskWidth = dims.width;
    G.deskHeight = dims.height;

    const topPad = isPlaying ? 70 : 0;
    const botPad = isPlaying ? 170 : 0;
    const availH = Math.max(120, h - topPad - botPad);

    const scale = Math.min(w / (G.deskWidth + 2 * DESK_MARGIN), availH / (G.deskHeight + 2 * DESK_MARGIN));
    G.view = {
      scale,
      ox: (w - G.deskWidth * scale) / 2,
      oy: topPad + (availH - G.deskHeight * scale) / 2,
    };
  }, [isPlaying, selectedTableId, customDims]);

  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  // Aim towards nearest opponent pen
  const getAngleToNearestOpponent = (playerIdx: number) => {
    const G = gameRef.current;
    const p = G.players[playerIdx];
    if (!p) return 0;
    const targets = G.players.filter((q) => q.alive && q.idx !== playerIdx);
    let bestDist = 1e9;
    let bestTarget = targets[0];
    for (const q of targets) {
      const d = Math.hypot(
        q.body.position.x - p.body.position.x,
        q.body.position.y - p.body.position.y
      );
      if (d < bestDist) {
        bestDist = d;
        bestTarget = q;
      }
    }
    if (!bestTarget) return 0;
    return Math.atan2(
      bestTarget.body.position.y - p.body.position.y,
      bestTarget.body.position.x - p.body.position.x
    );
  };

  // Begin Turn
  const beginTurn = useCallback(
    (turnIdx: number) => {
      const G = gameRef.current;
      const player = G.players[turnIdx];
      if (!player || !player.alive) return;

      G.attacker = null;
      G.struck = false;
      G.stillFrames = 0;
      G.moveSteps = 0;
      G.aimAngle = getAngleToNearestOpponent(turnIdx);
      G.ghostDirty = true;
      G.botActive = false;
      G.botPlan = null;

      setCurrentTurn(turnIdx);
      setPower(player.lastPower);
      setSide(player.lastSide);
      setPhase('aim');

      if (player.isBot) {
        showBanner(`${player.name}’s Turn`, 'Calculating angle and power...');
        if (player.botPersonality && Math.random() < 0.5) {
          player.speech = player.botPersonality.quips.flick;
          player.speechTime = performance.now();
        }
        // Schedule bot planning
        const currentMatchId = G.matchId;
        setTimeout(() => {
          if (G.matchId !== currentMatchId || !player.alive) return;
          const arena = getArena(settings.desk);
          const plan = planBotShot(
            player,
            G.players.filter((p) => p.alive),
            G.deskWidth,
            G.deskHeight,
            arena.frictionAir,
            settings.skill
          );

          G.botActive = true;
          G.botPlan = plan;
          G.botPlanTime = performance.now();
          setSide(plan.side);
          G.ghostDirty = true;
        }, 550);
      } else {
        showBanner(`${player.name}’s Turn`, 'Drag desk to aim, set power, and flick!');
      }
    },
    [settings.desk, settings.skill, showBanner]
  );

  // Execute Flick Action
  const handleFlick = useCallback(
    (overridePower?: number) => {
      const G = gameRef.current;
      if (phase !== 'aim' || G.attacker) return;
      const p = G.players[currentTurn];
      if (!p || !p.alive) return;

      const finalPower = overridePower !== undefined ? overridePower : power;
      p.lastPower = finalPower;
      setPower(finalPower);
      p.lastSide = side;
      p.flickCount++;

      if (p.isBot && p.botPersonality) {
        p.speech = p.botPersonality.quips.flick;
        p.speechTime = performance.now();
      }

      setPhase('launch');
      G.launchTime = performance.now();
      Sound.playFlick(finalPower / 100);

      setBanner(null);
    },
    [currentTurn, phase, power, side]
  );

  // Eliminate Pen
  const eliminatePlayer = useCallback(
    (p: InGamePlayer) => {
      const G = gameRef.current;
      p.alive = false;
      G.players = [...G.players];

      const b = p.body;
      const vel = Body.getVelocity(b);
      Composite.remove(G.engine!.world, b);

      // Add to fallen physics animation
      const x = b.position.x;
      const y = b.position.y;
      const dists = [x, G.deskWidth - x, y, G.deskHeight - y];
      const minIdx = dists.indexOf(Math.min(...dists));
      const normals = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ][minIdx];

      G.fallen.push({
        player: p,
        x,
        y,
        angle: b.angle,
        vx: vel.x,
        vy: vel.y,
        va: Body.getAngularVelocity(b),
        nx: normals[0],
        ny: normals[1],
        t: 0,
      });

      // FX Popup
      G.fx.push({
        type: 'text',
        x: Math.max(70, Math.min(G.deskWidth - 70, x)),
        y: Math.max(50, Math.min(G.deskHeight - 50, y)),
        text: 'OUT!',
        col: p.skin.ui,
        t: 0,
        dur: 1500,
      });

      if (!settings.reducedMotion) {
        G.shake = 10;
      }
      Sound.playFall();

      setEliminatedHistory((prev) => [...prev, p]);

      // Attribute knockout to attacker
      if (G.attacker && G.attacker.id !== p.id) {
        G.attacker.knockouts++;
        if (G.attacker.botPersonality) {
          G.attacker.speech = G.attacker.botPersonality.quips.knockout;
          G.attacker.speechTime = performance.now();
        }
      }
      if (p.botPersonality) {
        p.speech = p.botPersonality.quips.defeat;
        p.speechTime = performance.now();
      }
    },
    [settings.reducedMotion]
  );

  // Check victory / round end conditions
  const finishMatch = useCallback(
    (winner: InGamePlayer | null) => {
      const G = gameRef.current;
      setPhase('over');
      setMatchWinner(winner);

      const baseCoins = winner && !winner.isBot ? 80 : 25;
      const baseXp = winner && !winner.isBot ? 120 : 40;

      // Handle Best-of-5 Series Progression
      if (series && !series.isComplete) {
        const instanceId = getNextMatchInstanceId(series);
        const { updatedSeries } = commitSeriesMatchResult(
          series,
          instanceId,
          winner ? winner.id : null,
          winner ? winner.name : null
        );
        setSeries(updatedSeries);

        if (updatedSeries.isComplete) {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
          });
          Sound.playWin();
        }
      }

      // Check challenge mode objective
      if (activeChallenge && winner && !winner.isBot) {
        const passedTurns = turnsUsedInChallenge <= activeChallenge.maxTurns;
        if (passedTurns) {
          setProgress((prev) => ({
            ...prev,
            coins: prev.coins + activeChallenge.rewardCoins,
            xp: prev.xp + activeChallenge.rewardXp,
            completedChallenges: Array.from(
              new Set([...prev.completedChallenges, activeChallenge.id])
            ),
          }));
        }
      }

      // Check tournament progression
      if (activeTournamentMatch && winner && !winner.isBot) {
        setProgress((prev) => ({
          ...prev,
          coins: prev.coins + activeTournamentMatch.rewardCoins,
          xp: prev.xp + 200,
          championshipTrophies:
            activeTournamentMatch.round === 3
              ? prev.championshipTrophies + 1
              : prev.championshipTrophies,
        }));
      }

      if (winner && !winner.isBot) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        Sound.playWin();
      }

      setAwardedRewards({ coins: baseCoins, xp: baseXp });
      setProgress((prev) => ({
        ...prev,
        coins: prev.coins + baseCoins,
        xp: prev.xp + baseXp,
        matchesPlayed: prev.matchesPlayed + 1,
        matchesWon: winner && !winner.isBot ? prev.matchesWon + 1 : prev.matchesWon,
        knockoutsCount: prev.knockoutsCount + (winner?.knockouts || 0),
      }));

      setTimeout(() => {
        setActiveModal('match_over');
      }, 1400);
    },
    [activeChallenge, activeTournamentMatch, series, turnsUsedInChallenge]
  );

  // Complete turn and advance
  const endTurn = useCallback(() => {
    const G = gameRef.current;
    for (const p of G.players.filter((q) => q.alive)) {
      Body.setVelocity(p.body, { x: 0, y: 0 });
      Body.setAngularVelocity(p.body, 0);
    }

    if (G.attacker && G.attacker.alive) {
      Body.setDensity(G.attacker.body, BASE_DENSITY);
    }
    G.attacker = null;

    setTurnsUsedInChallenge((t) => t + 1);

    const alive = G.players.filter((q) => q.alive);
    if (alive.length === 0) {
      return finishMatch(null); // Draw
    }
    if (alive.length === 1) {
      return finishMatch(alive[0]); // Winner
    }

    // Advance turn to next alive player
    let nextIdx = currentTurn;
    do {
      nextIdx = (nextIdx + 1) % G.players.length;
    } while (!G.players[nextIdx].alive);

    beginTurn(nextIdx);
  }, [beginTurn, currentTurn, finishMatch]);

  // Start new match
  const startMatch = useCallback(
    (
      configs: PlayerConfig[],
      mode: GameMode = 'quick',
      format: MatchFormat = 'single',
      keepSeries = false
    ) => {
      const G = gameRef.current;
      G.matchId++;
      setGameMode(mode);
      setIsPlaying(true);
      setActiveModal('none');
      setEliminatedHistory([]);
      setMatchWinner(null);
      setTurnsUsedInChallenge(0);
      setLastPlayerConfigs(configs);

      // Handle Best-of-5 Series Initialization
      if (format === 'bo5') {
        if (!keepSeries || !series || series.isComplete) {
          const newSeries = createNewSeries(configs[0], configs[1], 'bo5');
          setSeries(newSeries);
        }
      } else if (!keepSeries) {
        setSeries(null);
      }

      updateLayout();
      const currentTable = getTableConfig(selectedTableId, customDims);
      G.deskCanvas = generateDeskCanvas(
        G.deskWidth,
        G.deskHeight,
        currentTable as any,
        Math.floor(Math.random() * 1e6)
      );

      if (G.engine) {
        Events.off(G.engine, 'collisionStart', () => {});
        Composite.clear(G.engine.world, false);
      }

      G.engine = Engine.create();
      G.engine.gravity.x = 0;
      G.engine.gravity.y = 0;
      G.engine.positionIterations = 10;
      G.engine.velocityIterations = 8;

      // Matter collision event
      Events.on(G.engine, 'collisionStart', (e: any) => {
        const now = performance.now();
        for (const pair of e.pairs) {
          const a = pair.bodyA.parent;
          const b = pair.bodyB.parent;
          let rel =
            Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y) * 2 +
            Math.abs(a.angularVelocity - b.angularVelocity) * 60;

          const att = G.attacker && G.attacker.body;
          if (att && !G.struck && (a === att || b === att)) {
            G.struck = true;
            const other = a === att ? b : a;
            rel = Math.max(rel, resolveCustomStrike(att, other, pair, 0.95));
          }

          if (rel < 0.6) continue;
          if (now - G.lastHitTime > 40) {
            Sound.playHit(Math.min(1, rel / 16));
            G.lastHitTime = now;
          }

          if (rel > 2.5) {
            const support = pair.collision.supports && pair.collision.supports[0];
            G.fx.push({
              type: 'ring',
              x: support ? support.x : (a.position.x + b.position.x) / 2,
              y: support ? support.y : (a.position.y + b.position.y) / 2,
              t: 0,
              dur: 350,
              r: 8 + Math.min(30, rel * 1.6),
            });
            if (!settings.reducedMotion) {
              G.shake = Math.max(G.shake, Math.min(6, rel * 0.3));
            }
          }

          if (rel > 1.2) {
            const playerA = G.players.find((p) => p.body === a);
            const playerB = G.players.find((p) => p.body === b);
            const botCandidate = [playerA, playerB].find((p) => p && p.isBot && p.botPersonality);
            if (
              botCandidate &&
              botCandidate.botPersonality &&
              (!botCandidate.speechTime || now - botCandidate.speechTime > 3200)
            ) {
              botCandidate.speech = botCandidate.botPersonality.quips.hit;
              botCandidate.speechTime = now;
            }
          }
        }
      });

      const isPortrait = G.deskWidth < G.deskHeight;
      const spawns = getTableSpawnPositions(G.deskWidth, G.deskHeight, configs.length, isPortrait);

      G.players = configs.map((cfg, i) => {
        const skin = getSkin(cfg.skinId);
        const spawn = spawns[i];
        const body = Bodies.rectangle(spawn.x, spawn.y, PEN_LENGTH, PEN_WIDTH, {
          chamfer: { radius: 7 },
          frictionAir: currentTable.frictionAir,
          friction: 0.12,
          frictionStatic: 0.2,
          restitution: BASE_RESTITUTION,
          density: BASE_DENSITY,
          angle: spawn.a,
        });
        (body as any).deltaTime = SUB_DT;
        Composite.add(G.engine!.world, body);

        const botPersonality = cfg.isBot
          ? getBotPersonality(
              cfg.botPersonalityId ||
                (cfg.id.startsWith('bot_') ? cfg.id.replace('bot_', '') : undefined)
            )
          : undefined;

        return {
          id: cfg.id,
          name: cfg.name,
          skin,
          isBot: cfg.isBot,
          botPersonality,
          idx: i,
          body,
          alive: true,
          lastPower: 50,
          lastSide: 1,
          flickCount: 0,
          knockouts: 0,
          speech: botPersonality ? botPersonality.quips.intro : undefined,
          speechTime: botPersonality ? performance.now() : undefined,
        };
      });

      G.fallen = [];
      G.fx = [];
      beginTurn(0);
    },
    [beginTurn, customDims, selectedTableId, series, settings.reducedMotion, updateLayout]
  );

  // Start Challenge match
  const startChallengeMatch = (ch: ChallengeItem) => {
    setActiveChallenge(ch);
    setActiveTournamentMatch(null);

    const configs: PlayerConfig[] = [
      {
        id: 'player_hero',
        name: 'You',
        skinId: progress.equippedSkin,
        isBot: false,
      },
      ...ch.targets.map((t, idx) => ({
        id: `target_${idx}`,
        name: t.name,
        skinId: t.skinId,
        isBot: true,
      })),
    ];

    startMatch(configs, 'challenge');
  };

  // Start Tournament match
  const startTournamentMatch = (round: TournamentMatch) => {
    setActiveTournamentMatch(round);
    setActiveChallenge(null);

    const botId =
      round.round === 1 ? 'backbench_boss' : round.round === 2 ? 'class_captain' : 'matador_master';

    const configs: PlayerConfig[] = [
      {
        id: 'player_hero',
        name: 'You',
        skinId: progress.equippedSkin,
        isBot: false,
      },
      {
        id: 'opponent_boss',
        name: round.opponent.name,
        skinId: round.opponent.skinId,
        isBot: true,
        botPersonalityId: botId,
      },
    ];

    startMatch(configs, 'championship');
  };

  // Start Practice Range
  const startPracticeRange = () => {
    setActiveChallenge(null);
    setActiveTournamentMatch(null);

    const configs: PlayerConfig[] = [
      {
        id: 'practicing_player',
        name: 'You (Practice)',
        skinId: progress.equippedSkin,
        isBot: false,
      },
      {
        id: 'dummy_target',
        name: 'Practice Dummy',
        skinId: 'matador_alltime',
        isBot: true,
      },
    ];

    startMatch(configs, 'practice');
  };

  // Start Quick Match
  const startDefaultQuickMatch = () => {
    const defaultBot = getBotPersonality('backbench_boss');
    const configs: PlayerConfig[] = [
      {
        id: 'p1',
        name: 'Player 1',
        skinId: progress.equippedSkin,
        isBot: false,
      },
      {
        id: 'bot_backbench_boss',
        name: defaultBot.name,
        skinId: defaultBot.defaultSkinId,
        isBot: true,
        botPersonalityId: defaultBot.id,
      },
    ];
    startMatch(configs, 'quick');
  };

  // Autostart URL parameter check (mandated by Ultra-Mode testability)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startDefaultQuickMatch();
    }
  }, []);

  // Main Render & Physics Animation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(50, now - lastTime);
      lastTime = now;
      const G = gameRef.current;

      // 1. Bot shot progression
      if (G.botActive && G.botPlan && phase === 'aim') {
        const elapsed = now - G.botPlanTime;
        const k = Math.min(1, Math.max(0, elapsed / 850));
        const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

        G.aimAngle = G.botPlan.aim * ease + G.aimAngle * (1 - ease);
        setPower(Math.round(G.botPlan.power * ease + power * (1 - ease)));
        G.ghostDirty = true;

        if (elapsed > 1150) {
          G.aimAngle = G.botPlan.aim;
          setPower(G.botPlan.power);
          G.botActive = false;
          handleFlick();
        }
      }

      // 2. Launch delay
      if (phase === 'launch' && now - G.launchTime >= 160) {
        const p = G.players[currentTurn];
        if (p && p.alive) {
          Body.setDensity(p.body, BASE_DENSITY * 1.5);
          applyLaunch(p.body, G.aimAngle, power / 100, side);

          const cp = contactPoint(p.body.position, p.body.angle, side);
          G.fx.push({
            type: 'ring',
            x: cp.x,
            y: cp.y,
            t: 0,
            dur: 300,
            r: 22,
            col: 'rgba(255, 224, 102, 0.9)',
          });

          G.attacker = p;
          G.struck = false;
          setPhase('moving');
          G.stillFrames = 0;
          G.moveSteps = 0;
        }
      }

      // 3. Physics Steps
      if (G.engine && phase === 'moving') {
        for (let sub = 0; sub < 2; sub++) {
          Engine.update(G.engine, SUB_DT);
        }

        // Clamp excessive speed
        for (const p of G.players.filter((q) => q.alive)) {
          const spd = Body.getSpeed(p.body);
          if (spd > MAX_SPEED) {
            const v = Body.getVelocity(p.body);
            const scale = MAX_SPEED / spd;
            Body.setVelocity(p.body, { x: v.x * scale, y: v.y * scale });
          }
        }

        // Check falling off edge
        for (const p of G.players.filter((q) => q.alive)) {
          if (isOffDesk(p.body, G.deskWidth, G.deskHeight, settings.fall)) {
            eliminatePlayer(p);
          }
        }

        // Settle check
        const moving = G.players
          .filter((q) => q.alive)
          .some((p) => p.body.speed > 0.03 || Math.abs(p.body.angularVelocity) > 0.0015);

        G.stillFrames = moving ? 0 : G.stillFrames + 1;
        G.moveSteps++;

        const fallingPencilAnimating = G.fallen.some((f) => f.t < 1);
        if ((G.stillFrames >= 22 || G.moveSteps > 60 * 8) && !fallingPencilAnimating) {
          endTurn();
        }
      }

      // 4. Update FX & Fallen animations
      const timeScale = dt / 16.67;
      for (const f of G.fallen) {
        if (f.t >= 1) continue;
        f.t = Math.min(1, f.t + dt / 850);
        if (f.t < 0.55) {
          f.vx += f.nx * 0.35 * timeScale;
          f.vy += f.ny * 0.35 * timeScale;
        }
        f.x += f.vx * timeScale;
        f.y += f.vy * timeScale;
        f.angle += f.va * timeScale;
        const decay = Math.pow(0.93, timeScale);
        f.vx *= decay;
        f.vy *= decay;
        f.va *= decay;
      }

      for (const e of G.fx) {
        e.t += dt;
      }
      G.fx = G.fx.filter((e) => e.t < e.dur);

      // 5. Canvas Rendering
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const cw = canvas.clientWidth;
          const ch = canvas.clientHeight;

          if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
            canvas.width = Math.round(cw * dpr);
            canvas.height = Math.round(ch * dpr);
          }

          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          // Floor background
          ctx.fillStyle = '#222725';
          ctx.fillRect(0, 0, cw, ch);

          if (isPlaying && G.deskCanvas) {
            const { scale, ox, oy } = G.view;
            const sh = G.shake > 0.3 ? G.shake : 0;
            G.shake *= 0.88;
            const jx = sh ? (Math.random() - 0.5) * sh : 0;
            const jy = sh ? (Math.random() - 0.5) * sh : 0;

            ctx.setTransform(
              dpr * scale,
              0,
              0,
              dpr * scale,
              dpr * (ox + jx),
              dpr * (oy + jy)
            );

            // Shadow under wooden desk
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
            ctx.shadowBlur = 36 * scale;
            ctx.shadowOffsetY = 16 * scale;
            ctx.fillStyle = '#1c0f06';
            ctx.fillRect(0, 0, G.deskWidth, G.deskHeight);
            ctx.restore();

            // Desk wood texture
            ctx.drawImage(G.deskCanvas, 0, 0, G.deskWidth, G.deskHeight);

            // Trajectory guide line
            const curP = G.players[currentTurn];
            if (settings.guide && phase === 'aim' && curP && curP.alive) {
              if (G.ghostDirty) {
                const arena = getArena(settings.desk);
                const otherBodies = G.players
                  .filter((q) => q.alive && q.idx !== currentTurn)
                  .map((q) => ({ idx: q.idx, pos: q.body.position, angle: q.body.angle }));

                G.ghost = simulateTrajectory(
                  {
                    x: curP.body.position.x,
                    y: curP.body.position.y,
                    angle: curP.body.angle,
                  },
                  G.aimAngle,
                  power / 100,
                  side,
                  otherBodies,
                  G.deskWidth,
                  G.deskHeight,
                  arena.frictionAir,
                  settings.fall
                );
                G.ghostDirty = false;
              }

              const gh = G.ghost;
              if (gh) {
                const pwNorm = power / 100;
                const visibleDist = Math.max(50, (gh.total || 1) * (1 - 0.55 * pwNorm));
                ctx.save();
                const dotR = Math.max(2.8, 2.5 / scale);
                const gap = Math.max(14, 12 / scale);
                let nextDot = gap;

                for (const pt of gh.path) {
                  if (pt.d > visibleDist) break;
                  if (pt.d >= nextDot) {
                    nextDot += gap;
                    const alpha = 0.9 * (1 - pt.d / visibleDist) + 0.15;
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, dotR, 0, Math.PI * 2);
                    ctx.fill();
                  }
                }

                // If collision anticipated
                if (gh.hit && gh.hit.d <= visibleDist) {
                  ctx.strokeStyle = '#f5c518';
                  ctx.lineWidth = 2.4;
                  ctx.beginPath();
                  for (let i = 0; i < 8; i++) {
                    const a = (i * Math.PI) / 4 + now / 800;
                    ctx.moveTo(gh.hit.x + Math.cos(a) * 6, gh.hit.y + Math.sin(a) * 6);
                    ctx.lineTo(gh.hit.x + Math.cos(a) * 14, gh.hit.y + Math.sin(a) * 14);
                  }
                  ctx.stroke();
                } else if (gh.exit && gh.exit.d <= visibleDist) {
                  // Fall warning cross
                  const ex = gh.exit;
                  ctx.strokeStyle = '#ef4444';
                  ctx.lineWidth = 3.5;
                  ctx.beginPath();
                  ctx.moveTo(ex.x - 8, ex.y - 8);
                  ctx.lineTo(ex.x + 8, ex.y + 8);
                  ctx.moveTo(ex.x + 8, ex.y - 8);
                  ctx.lineTo(ex.x - 8, ex.y + 8);
                  ctx.stroke();
                }
                ctx.restore();
              }

              // Aim vector arrow
              const cp = contactPoint(curP.body.position, curP.body.angle, side);
              const arrowLen = 35 + 110 * (power / 100);
              const ux = Math.cos(G.aimAngle);
              const uy = Math.sin(G.aimAngle);
              const tipX = cp.x + ux * arrowLen;
              const tipY = cp.y + uy * arrowLen;

              ctx.save();
              ctx.lineCap = 'round';
              ctx.strokeStyle = 'rgba(0,0,0,0.45)';
              ctx.lineWidth = 8;
              ctx.beginPath();
              ctx.moveTo(cp.x, cp.y);
              ctx.lineTo(tipX, tipY);
              ctx.stroke();

              ctx.strokeStyle = curP.skin.ui;
              ctx.lineWidth = 4.5;
              ctx.beginPath();
              ctx.moveTo(cp.x, cp.y);
              ctx.lineTo(tipX, tipY);
              ctx.stroke();

              // Arrowhead
              ctx.fillStyle = curP.skin.ui;
              ctx.beginPath();
              ctx.moveTo(tipX + ux * 12, tipY + uy * 12);
              ctx.lineTo(tipX - uy * 8, tipY + ux * 8);
              ctx.lineTo(tipX + uy * 8, tipY - ux * 8);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }

            // Draw Alive Pens
            for (const p of G.players.filter((q) => q.alive)) {
              const b = p.body;
              let px = b.position.x;
              let py = b.position.y;
              const isActive = p === curP && (phase === 'aim' || phase === 'launch');

              // Launch cocking recoil animation
              if (phase === 'launch' && p === curP) {
                const k = Math.min(1, Math.max(0, (now - G.launchTime) / 160));
                const recoil = -10 * Math.sin(k * Math.PI);
                px += Math.cos(G.aimAngle) * recoil;
                py += Math.sin(G.aimAngle) * recoil;
              }

              ctx.save();
              ctx.translate(px, py);
              ctx.rotate(b.angle);

              // Dotted selection outline for active pen
              if (isActive && phase === 'aim') {
                ctx.save();
                drawRoundedRect(
                  ctx,
                  -PEN_LENGTH / 2 - 8,
                  -PEN_WIDTH / 2 - 8,
                  PEN_LENGTH + 16,
                  PEN_WIDTH + 16,
                  14
                );
                ctx.strokeStyle = p.skin.ui;
                ctx.lineWidth = 2.5;
                ctx.setLineDash([8, 6]);
                ctx.lineDashOffset = settings.reducedMotion ? 0 : -now / 35;
                ctx.stroke();
                ctx.restore();
              }

              drawDetailedPen(ctx, p.skin, {
                shadow: { blur: 6 * scale, x: 3 * scale, y: 5 * scale },
                activeSide: isActive ? side : null,
                aura: p.skin.rarity === 'legendary',
              });
              ctx.restore();

              // Player floating name tag above pen
              ctx.save();
              const fs = 13 / scale;
              ctx.font = `bold ${fs}px 'Hind Siliguri', sans-serif`;
              const tagText = p.name;
              const tagWidth = ctx.measureText(tagText).width + 16 / scale;
              const tagHeight = fs * 1.6;
              const tagY = b.position.y - PEN_LENGTH * 0.35;

              ctx.fillStyle = isActive ? p.skin.ui : 'rgba(20, 12, 6, 0.7)';
              drawRoundedRect(
                ctx,
                b.position.x - tagWidth / 2,
                tagY - tagHeight,
                tagWidth,
                tagHeight,
                tagHeight / 2
              );
              ctx.fill();

              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(tagText, b.position.x, tagY - tagHeight / 2 + 1 / scale);
              ctx.restore();
            }

            // Draw Fallen Pens
            for (const f of G.fallen) {
              const sc = Math.max(0.4, 1 - 0.35 * (f.t * f.t));
              ctx.save();
              ctx.translate(f.x, f.y);
              ctx.rotate(f.angle);
              ctx.scale(sc, sc);
              ctx.globalAlpha = Math.max(0.2, 1 - f.t * 0.7);
              drawDetailedPen(ctx, f.player.skin, {
                shadow: { blur: 14 * scale, x: 5 * scale, y: 10 * scale },
              });
              ctx.restore();
            }

            // Draw Particles & FX
            for (const e of G.fx) {
              const prog = e.t / e.dur;
              if (e.type === 'ring') {
                ctx.strokeStyle = e.col || `rgba(255, 255, 255, ${0.85 * (1 - prog)})`;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(e.x, e.y, (e.r || 15) * (0.4 + prog), 0, Math.PI * 2);
                ctx.stroke();
              } else if (e.type === 'text') {
                const ty = e.y - (30 * prog) / scale;
                ctx.globalAlpha = prog < 0.7 ? 1 : (1 - prog) / 0.3;
                ctx.font = `bold ${32 / scale}px 'Kalam', cursive`;
                ctx.textAlign = 'center';
                ctx.lineWidth = 6 / scale;
                ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                ctx.strokeText(e.text || '', e.x, ty);
                ctx.fillStyle = e.col || '#ffd700';
                ctx.fillText(e.text || '', e.x, ty);
                ctx.globalAlpha = 1;
              }
            }
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    currentTurn,
    eliminatePlayer,
    endTurn,
    handleFlick,
    isPlaying,
    phase,
    power,
    settings.desk,
    settings.fall,
    settings.guide,
    settings.reducedMotion,
    side,
  ]);

  // Touch and Mouse Aim Handlers on Canvas
  const handleAimPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const G = gameRef.current;
    const curP = G.players[currentTurn];
    if (phase !== 'aim' || !curP || curP.isBot || !curP.alive) return;

    const rect = canvas.getBoundingClientRect();
    const wx = (clientX - rect.left - G.view.ox) / G.view.scale;
    const wy = (clientY - rect.top - G.view.oy) / G.view.scale;

    const cp = contactPoint(curP.body.position, curP.body.angle, side);
    if (Math.hypot(wx - cp.x, wy - cp.y) < 8) return;

    G.aimAngle = Math.atan2(wy - cp.y, wx - cp.x);
    G.ghostDirty = true;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const G = gameRef.current;
    G.isDragging = true;
    handleAimPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const G = gameRef.current;
    if (G.isDragging) {
      handleAimPointer(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = () => {
    const G = gameRef.current;
    G.isDragging = false;
  };

  // Open modal helper
  const openModal = (m: ActiveModal) => {
    Sound.playClick();
    setActiveModal(m);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden select-none bg-[#1b201e]" data-testid="game-root">
      {/* Top Header Navigation */}
      <HeaderNav
        progress={progress}
        settings={settings}
        onUpdateSettings={setSettings}
        onOpenSettings={() => openModal('settings')}
        onOpenAndroidGuide={() => openModal('android_release')}
        onOpenLocker={() => openModal('locker')}
      />

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute inset-0 w-full h-full block cursor-crosshair touch-none"
      />

      {/* Main Menu Overlay if not currently in game */}
      {!isPlaying && (
        <div className="absolute inset-0 z-10 overflow-y-auto">
          <MainMenu
            progress={progress}
            onStartQuickMatch={startDefaultQuickMatch}
            onOpenSetup={(m) => {
              setSetupMode(m);
              openModal('setup');
            }}
            onStartPractice={startPracticeRange}
            onOpenLocker={() => openModal('locker')}
            onOpenArenas={() => openModal('arenas')}
            onOpenChampionship={() => openModal('championship')}
            onOpenChallenges={() => openModal('challenges')}
            onOpenHowTo={() => openModal('howto')}
          />
        </div>
      )}

      {/* In-Game HUD overlay when match active */}
      {isPlaying && (
        <GameHUD
          players={gameRef.current.players}
          currentTurnIndex={currentTurn}
          phase={phase}
          power={power}
          side={side}
          bannerMessage={banner}
          series={series}
          onSetPower={(p) => {
            setPower(p);
            gameRef.current.ghostDirty = true;
          }}
          onSetSide={(s) => {
            setSide(s);
            gameRef.current.ghostDirty = true;
          }}
          onFlick={(launchPower) => handleFlick(launchPower)}
          onRestart={() => {
            const configs = gameRef.current.players.map((p) => ({
              id: p.id,
              name: p.name,
              skinId: p.skin.id,
              isBot: p.isBot,
              botPersonalityId: p.botPersonality?.id,
            }));
            startMatch(configs, gameMode, series ? 'bo5' : 'single', true);
          }}
          onExit={() => setIsPlaying(false)}
          isPractice={gameMode === 'practice'}
        />
      )}

      {/* Match Setup Modal */}
      {activeModal === 'setup' && (
        <MatchSetupModal
          mode={setupMode}
          defaultSkinId={progress.equippedSkin}
          onClose={() => setActiveModal('none')}
          onStart={(players, fmt) => startMatch(players, setupMode, fmt || 'single')}
        />
      )}

      {/* Pen Locker Modal */}
      {activeModal === 'locker' && (
        <PenLockerModal
          progress={progress}
          onClose={() => setActiveModal('none')}
          onEquipSkin={(skinId) => {
            setProgress((prev) => ({ ...prev, equippedSkin: skinId }));
          }}
          onUnlockSkin={(skinId, price) => {
            if (progress.coins >= price) {
              setProgress((prev) => ({
                ...prev,
                coins: prev.coins - price,
                unlockedSkins: [...prev.unlockedSkins, skinId],
                equippedSkin: skinId,
              }));
              confetti({ particleCount: 50, spread: 60 });
            }
          }}
        />
      )}

      {/* Table Arenas Selector Modal */}
      {activeModal === 'arenas' && (
        <TableSelectionModal
          currentTableId={selectedTableId}
          customWidth={customDims.width}
          customHeight={customDims.height}
          onClose={() => setActiveModal('none')}
          onSelectTable={(tableId, newDims) => {
            setSelectedTableId(tableId);
            try {
              localStorage.setItem('clashofpens_table_id', tableId);
            } catch {}
            if (newDims) {
              setCustomDims(newDims);
              try {
                localStorage.setItem('clashofpens_custom_table_dims', JSON.stringify(newDims));
              } catch {}
            }
            setSettings((prev) => ({ ...prev, desk: tableId }));
            updateLayout();
          }}
        />
      )}

      {/* Challenges Modal */}
      {activeModal === 'challenges' && (
        <ChallengesModal
          progress={progress}
          onClose={() => setActiveModal('none')}
          onStartChallenge={startChallengeMatch}
        />
      )}

      {/* Championship Modal */}
      {activeModal === 'championship' && (
        <ChampionshipModal
          progress={progress}
          onClose={() => setActiveModal('none')}
          onStartRound={startTournamentMatch}
        />
      )}

      {/* Settings Modal */}
      {activeModal === 'settings' && (
        <SettingsModal
          settings={settings}
          onClose={() => setActiveModal('none')}
          onUpdateSettings={setSettings}
          onResetProgress={() => {
            setProgress({ ...INITIAL_PROGRESS });
          }}
        />
      )}

      {/* How to Play Modal */}
      {activeModal === 'howto' && <HowToModal onClose={() => setActiveModal('none')} />}

      {/* Match Over Modal */}
      {activeModal === 'match_over' && (
        <MatchOverModal
          winner={matchWinner}
          eliminatedOrder={eliminatedHistory}
          coinsAwarded={awardedRewards.coins}
          xpAwarded={awardedRewards.xp}
          series={series}
          onContinueSeries={() => {
            startMatch(lastPlayerConfigs, gameMode, 'bo5', true);
          }}
          onRematch={() => {
            if (series && series.isComplete) {
              startMatch(lastPlayerConfigs, gameMode, 'bo5', false);
            } else if (series) {
              startMatch(lastPlayerConfigs, gameMode, 'bo5', true);
            } else {
              startMatch(lastPlayerConfigs, gameMode, 'single', false);
            }
          }}
          onChangeOpponent={() => {
            setIsPlaying(false);
            setSetupMode('ai_battle');
            setActiveModal('setup');
          }}
          onExit={() => {
            setActiveModal('none');
            setIsPlaying(false);
          }}
        />
      )}

      {/* Android Play Store Release Guide */}
      {activeModal === 'android_release' && (
        <AndroidReleaseModal onClose={() => setActiveModal('none')} />
      )}
    </main>
  );
}
