export type MatchFormat = 'single' | 'bo5';

export interface MatchSlotRecord {
  slotNumber: number; // 1 to 5
  winnerId: string | null; // null if draw
  winnerName: string | null;
  drawCountInSlot: number;
  completed: boolean;
  matchInstanceId: string;
}

export interface SeriesState {
  seriesId: string;
  format: MatchFormat;
  player1: { id: string; name: string; wins: number };
  player2: { id: string; name: string; wins: number };
  targetWins: number; // 3 for bo5
  currentSlot: number; // 1 to 5
  totalDraws: number;
  pendingDrawReplay: boolean;
  isComplete: boolean;
  championId: string | null;
  championName: string | null;
  slots: MatchSlotRecord[];
  processedMatchIds: string[];
}

const SERIES_STORAGE_KEY = 'clashofpens_series_v2';

export function createNewSeries(
  p1: { id: string; name: string },
  p2: { id: string; name: string },
  format: MatchFormat = 'bo5'
): SeriesState {
  const seriesId = `series_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const targetWins = format === 'bo5' ? 3 : 1;

  const slots: MatchSlotRecord[] = Array.from({ length: 5 }, (_, i) => ({
    slotNumber: i + 1,
    winnerId: null,
    winnerName: null,
    drawCountInSlot: 0,
    completed: false,
    matchInstanceId: `${seriesId}_slot_${i + 1}_initial`,
  }));

  const state: SeriesState = {
    seriesId,
    format,
    player1: { id: p1.id, name: p1.name, wins: 0 },
    player2: { id: p2.id, name: p2.name, wins: 0 },
    targetWins,
    currentSlot: 1,
    totalDraws: 0,
    pendingDrawReplay: false,
    isComplete: false,
    championId: null,
    championName: null,
    slots,
    processedMatchIds: [],
  };

  saveSeriesState(state);
  return state;
}

export function saveSeriesState(state: SeriesState | null): void {
  try {
    if (!state) {
      localStorage.removeItem(SERIES_STORAGE_KEY);
    } else {
      localStorage.setItem(SERIES_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // ignore local storage errors
  }
}

export function loadSavedSeriesState(): SeriesState | null {
  try {
    const raw = localStorage.getItem(SERIES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SeriesState;
    if (parsed && parsed.seriesId && parsed.slots) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Commits a match result idempotently.
 * If matchInstanceId was already processed, returns unchanged state.
 */
export function commitSeriesMatchResult(
  series: SeriesState,
  matchInstanceId: string,
  winnerId: string | null, // null means draw
  winnerName: string | null
): { updatedSeries: SeriesState; wasNew: boolean } {
  if (series.isComplete) {
    return { updatedSeries: series, wasNew: false };
  }

  // Idempotency check: prevent duplicate counting if component re-renders
  if (series.processedMatchIds.includes(matchInstanceId)) {
    return { updatedSeries: series, wasNew: false };
  }

  const nextState: SeriesState = JSON.parse(JSON.stringify(series));
  nextState.processedMatchIds.push(matchInstanceId);

  const slotIndex = nextState.currentSlot - 1;
  const currentSlot = nextState.slots[slotIndex] || nextState.slots[0];

  if (!winnerId) {
    // DRAW: Drawn matches award no points and trigger a pending draw-replay in this slot
    nextState.totalDraws += 1;
    nextState.pendingDrawReplay = true;
    currentSlot.drawCountInSlot += 1;
    // Slot remains uncompleted, awaiting replay
  } else {
    // DECISIVE WIN
    nextState.pendingDrawReplay = false;
    currentSlot.completed = true;
    currentSlot.winnerId = winnerId;
    currentSlot.winnerName = winnerName;
    currentSlot.matchInstanceId = matchInstanceId;

    if (winnerId === nextState.player1.id) {
      nextState.player1.wins += 1;
    } else if (winnerId === nextState.player2.id) {
      nextState.player2.wins += 1;
    }

    // Check if target wins reached
    if (nextState.player1.wins >= nextState.targetWins) {
      nextState.isComplete = true;
      nextState.championId = nextState.player1.id;
      nextState.championName = nextState.player1.name;
    } else if (nextState.player2.wins >= nextState.targetWins) {
      nextState.isComplete = true;
      nextState.championId = nextState.player2.id;
      nextState.championName = nextState.player2.name;
    } else {
      // Advance to next match slot
      if (nextState.currentSlot < 5) {
        nextState.currentSlot += 1;
      }
    }
  }

  saveSeriesState(nextState);
  return { updatedSeries: nextState, wasNew: true };
}

/**
 * Generates unique match instance ID for the next game in this series.
 */
export function getNextMatchInstanceId(series: SeriesState): string {
  const slot = series.currentSlot;
  const slotData = series.slots[slot - 1];
  const draws = slotData ? slotData.drawCountInSlot : 0;
  return `${series.seriesId}_slot${slot}_draw${draws}_${Date.now()}`;
}
