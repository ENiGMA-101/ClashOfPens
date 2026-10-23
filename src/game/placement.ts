import { PEN_LENGTH, PEN_WIDTH } from './constants';
import { segClosest, segOf } from './physics';
import { getTableSpawnPositions } from './tableConfig';

export interface PenPlacement {
  x: number;
  y: number;
  angle: number; // In radians
}

export interface PlacementValidationResult {
  valid: boolean;
  reason?: string;
}

export const SAFE_BOUNDARY_MARGIN = 14;
export const MIN_STARTING_DISTANCE = 65;
export const PEN_OVERLAP_DISTANCE = 16;

/**
 * Calculates the 4 corner points of a rotated pen bounding box.
 */
export function getPenCorners(
  pos: { x: number; y: number },
  angle: number
): Array<{ x: number; y: number }> {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const hl = PEN_LENGTH / 2;
  const hw = PEN_WIDTH / 2;

  return [
    { x: pos.x + c * hl - s * hw, y: pos.y + s * hl + c * hw },
    { x: pos.x + c * hl + s * hw, y: pos.y + s * hl - c * hw },
    { x: pos.x - c * hl - s * hw, y: pos.y - s * hl + c * hw },
    { x: pos.x - c * hl + s * hw, y: pos.y - s * hl - c * hw },
  ];
}

/**
 * Checks whether a pen's entire physical footprint is safely inside the playable table.
 */
export function isPenInsideTable(
  pos: { x: number; y: number },
  angle: number,
  deskWidth: number,
  deskHeight: number,
  margin = SAFE_BOUNDARY_MARGIN
): boolean {
  const corners = getPenCorners(pos, angle);
  for (const corner of corners) {
    if (
      corner.x < margin ||
      corner.x > deskWidth - margin ||
      corner.y < margin ||
      corner.y > deskHeight - margin
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Shared validation function to ensure placement is completely inside the table
 * and maintains a safe distance from previously placed pens.
 */
export function validatePlacement(
  candidate: PenPlacement,
  existingPlacements: PenPlacement[],
  deskWidth: number,
  deskHeight: number
): PlacementValidationResult {
  // 1. Boundary check for entire rotated pen geometry
  if (!isPenInsideTable(candidate, candidate.angle, deskWidth, deskHeight, SAFE_BOUNDARY_MARGIN)) {
    return {
      valid: false,
      reason: 'Pen extends outside the playable table boundary.',
    };
  }

  // 2. Collision and safe separation checks against other confirmed pens
  const candSeg = segOf(candidate, candidate.angle);

  for (let i = 0; i < existingPlacements.length; i++) {
    const other = existingPlacements[i];
    const otherSeg = segOf(other, other.angle);
    const [dist] = segClosest(candSeg[0], candSeg[1], otherSeg[0], otherSeg[1]);

    if (dist < PEN_OVERLAP_DISTANCE) {
      return {
        valid: false,
        reason: 'Pens cannot overlap. Choose an open spot.',
      };
    }

    if (dist < MIN_STARTING_DISTANCE) {
      return {
        valid: false,
        reason: 'That position is too close to another pen. Maintain a safe distance.',
      };
    }
  }

  return { valid: true };
}

/**
 * Generates an organic, non-predictable suggested initial placement for human players
 * within their designated side/sector of the selected table.
 */
export function getSuggestedPlacement(
  playerIndex: number,
  totalPlayers: number,
  deskWidth: number,
  deskHeight: number,
  rng: () => number = Math.random
): PenPlacement {
  const isPortrait = deskWidth < deskHeight;
  const baseSpawns = getTableSpawnPositions(deskWidth, deskHeight, totalPlayers, isPortrait);
  const base = baseSpawns[playerIndex % baseSpawns.length] || {
    x: deskWidth / 2,
    y: deskHeight / 2,
    a: 0,
  };

  // Add subtle organic jitter so every match has a distinct, fresh starting suggestion
  const jitterX = (rng() - 0.5) * 36;
  const jitterY = (rng() - 0.5) * 36;
  const jitterA = (rng() - 0.5) * 0.35;

  let cand: PenPlacement = {
    x: base.x + jitterX,
    y: base.y + jitterY,
    angle: base.a + jitterA,
  };

  // If jitter pushed it too close to an edge, revert to base spawn
  if (!isPenInsideTable(cand, cand.angle, deskWidth, deskHeight, SAFE_BOUNDARY_MARGIN)) {
    cand = { x: base.x, y: base.y, angle: base.a };
  }

  return cand;
}

/**
 * Fair, randomized placement algorithm for bot pens.
 * Keeps entire pen inside table boundaries, maintains safe distance from human player(s),
 * accounts for any table shape, uses bounded retries with guaranteed fallback.
 */
export function generateRandomBotPlacement(
  existingPlacements: PenPlacement[],
  deskWidth: number,
  deskHeight: number,
  rng: () => number = Math.random,
  botIndex = 1,
  totalPlayers = 2
): PenPlacement {
  const isPortrait = deskWidth < deskHeight;
  const hl = PEN_LENGTH / 2 + SAFE_BOUNDARY_MARGIN;
  const minX = hl;
  const maxX = Math.max(minX + 1, deskWidth - hl);
  const minY = hl;
  const maxY = Math.max(minY + 1, deskHeight - hl);

  const minDesiredDistance = Math.max(
    MIN_STARTING_DISTANCE + 30,
    Math.min(deskWidth, deskHeight) * 0.28
  );

  // Retries with progressive relaxation
  const maxAttempts = 150;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = minX + rng() * (maxX - minX);
    const y = minY + rng() * (maxY - minY);
    const angle = rng() * Math.PI * 2;

    const candidate: PenPlacement = { x, y, angle };

    // Strict validation
    const val = validatePlacement(candidate, existingPlacements, deskWidth, deskHeight);
    if (!val.valid) continue;

    // In early attempts, enforce comfortable competitive spacing
    if (attempt < 100 && existingPlacements.length > 0) {
      const candSeg = segOf(candidate, candidate.angle);
      let satisfiesComfort = true;
      for (const other of existingPlacements) {
        const otherSeg = segOf(other, other.angle);
        const [dist] = segClosest(candSeg[0], candSeg[1], otherSeg[0], otherSeg[1]);
        if (dist < minDesiredDistance) {
          satisfiesComfort = false;
          break;
        }
      }
      if (!satisfiesComfort) continue;
    }

    return candidate;
  }

  // Safe Fallback: Derive from standard table spawn coordinates
  const fallbackSpawns = getTableSpawnPositions(deskWidth, deskHeight, totalPlayers, isPortrait);
  const fallback = fallbackSpawns[botIndex % fallbackSpawns.length] || {
    x: deskWidth * 0.7,
    y: deskHeight * 0.5,
    a: Math.PI / 2,
  };

  const fallbackCandidate: PenPlacement = {
    x: fallback.x,
    y: fallback.y,
    angle: fallback.a,
  };

  if (validatePlacement(fallbackCandidate, existingPlacements, deskWidth, deskHeight).valid) {
    return fallbackCandidate;
  }

  // Last-resort nudges
  const step = 25;
  const offsets = [
    [0, step],
    [0, -step],
    [step, 0],
    [-step, 0],
    [step, step],
    [-step, -step],
  ];

  for (const [ox, oy] of offsets) {
    const nudged: PenPlacement = {
      x: fallback.x + ox,
      y: fallback.y + oy,
      angle: fallback.a,
    };
    if (validatePlacement(nudged, existingPlacements, deskWidth, deskHeight).valid) {
      return nudged;
    }
  }

  return fallbackCandidate;
}
