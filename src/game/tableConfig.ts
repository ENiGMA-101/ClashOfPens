export type TableShapeType = 'rectangle' | 'square' | 'compact' | 'tournament' | 'custom';

export interface TableConfig {
  id: string;
  name: string;
  banglaName: string;
  shape: TableShapeType;
  baseWidth: number;
  baseHeight: number;
  surface: 'normal' | 'polished' | 'rough';
  frictionAir: number;
  desc: string;
  isCustom?: boolean;
  theme: {
    baseHue: number;
    baseSat: number;
    baseLight: number;
    rimColor: string;
    scratchColor: string;
    chalkDoodles?: boolean;
    inkStains?: boolean;
    specular?: string;
  };
}

export const TABLE_PRESETS: TableConfig[] = [
  {
    id: 'large_rectangle',
    name: 'Large Rectangle Table (Default)',
    banglaName: 'বৃহৎ আয়তাকার টেবিল',
    shape: 'rectangle',
    baseWidth: 1040,
    baseHeight: 640,
    surface: 'normal',
    frictionAir: 0.048,
    desc: 'The quintessential spacious classroom desk. Long runway for high-velocity bank shots and multi-pen collisions.',
    theme: {
      baseHue: 27,
      baseSat: 48,
      baseLight: 32,
      rimColor: 'rgba(25,12,4,0.92)',
      scratchColor: 'rgba(255,225,185,0.09)',
      chalkDoodles: true,
      inkStains: true,
    },
  },
  {
    id: 'square_table',
    name: 'Square Table',
    banglaName: 'বর্গাকার টেবিল',
    shape: 'square',
    baseWidth: 780,
    baseHeight: 780,
    surface: 'polished',
    frictionAir: 0.042,
    desc: 'Perfect 1:1 symmetrical battleground. Equal distance to all four edges makes edge-teetering defense crucial.',
    theme: {
      baseHue: 32,
      baseSat: 40,
      baseLight: 34,
      rimColor: 'rgba(38,18,8,0.92)',
      scratchColor: 'rgba(255,240,210,0.11)',
      chalkDoodles: false,
      inkStains: true,
      specular: 'rgba(255,255,255,0.12)',
    },
  },
  {
    id: 'practice_small',
    name: 'Small Practice Table',
    banglaName: 'ছোট প্র্যাকটিস টেবিল',
    shape: 'compact',
    baseWidth: 620,
    baseHeight: 520,
    surface: 'rough',
    frictionAir: 0.062,
    desc: 'Tight school bench arena. One heavy flick can send you flying over the rim—requires refined power control.',
    theme: {
      baseHue: 200,
      baseSat: 15,
      baseLight: 24,
      rimColor: 'rgba(15,22,28,0.95)',
      scratchColor: 'rgba(200,225,240,0.08)',
      chalkDoodles: true,
      inkStains: false,
    },
  },
  {
    id: 'championship_table',
    name: 'Championship Table',
    banglaName: 'গ্র্যান্ড চ্যাম্পিয়নশিপ টেবিল',
    shape: 'tournament',
    baseWidth: 1160,
    baseHeight: 720,
    surface: 'polished',
    frictionAir: 0.038,
    desc: 'Lacquered mahogany tournament arena with gold-inlaid borders and tournament-grade slickness.',
    theme: {
      baseHue: 40,
      baseSat: 32,
      baseLight: 16,
      rimColor: 'rgba(212,175,55,0.95)',
      scratchColor: 'rgba(255,215,0,0.14)',
      chalkDoodles: false,
      inkStains: false,
      specular: 'rgba(255,235,160,0.22)',
    },
  },
  {
    id: 'custom_table',
    name: 'Custom Dimensions Desk',
    banglaName: 'কাস্টম সাইজ টেবিল',
    shape: 'custom',
    baseWidth: 900,
    baseHeight: 600,
    surface: 'normal',
    frictionAir: 0.048,
    isCustom: true,
    desc: 'Player-configured desk with custom width, height, and surface friction.',
    theme: {
      baseHue: 24,
      baseSat: 42,
      baseLight: 30,
      rimColor: 'rgba(30,14,6,0.9)',
      scratchColor: 'rgba(255,210,170,0.1)',
      chalkDoodles: true,
      inkStains: true,
    },
  },
];

export const TABLES_BY_ID = Object.fromEntries(TABLE_PRESETS.map((t) => [t.id, t]));

export function getTableConfig(id: string, customDims?: { width: number; height: number; friction?: number }): TableConfig {
  const table = TABLES_BY_ID[id] || TABLE_PRESETS[0];
  if (id === 'custom_table' && customDims) {
    const safeW = Math.max(500, Math.min(1250, Math.round(customDims.width)));
    const safeH = Math.max(500, Math.min(1250, Math.round(customDims.height)));
    return {
      ...table,
      baseWidth: safeW,
      baseHeight: safeH,
      frictionAir: customDims.friction ?? 0.048,
    };
  }
  return table;
}

/**
 * Calculates responsive table dimensions for portrait or landscape orientations.
 * Square tables stay square in both orientations.
 */
export function resolveTableDimensions(
  table: TableConfig,
  isPortrait: boolean
): { width: number; height: number } {
  if (table.shape === 'square') {
    const side = Math.min(table.baseWidth, table.baseHeight);
    return { width: side, height: side };
  }

  if (isPortrait) {
    // In portrait, the table should be taller than wide
    const w = Math.min(table.baseWidth, table.baseHeight);
    const h = Math.max(table.baseWidth, table.baseHeight);
    return { width: w, height: h };
  } else {
    // In landscape, the table should be wider than tall
    const w = Math.max(table.baseWidth, table.baseHeight);
    const h = Math.min(table.baseWidth, table.baseHeight);
    return { width: w, height: h };
  }
}

/**
 * Computes fair, balanced starting pen slots for 2 or 3 players for any table shape.
 */
export function getTableSpawnPositions(
  tableWidth: number,
  tableHeight: number,
  playerCount: number,
  isPortrait: boolean
): Array<{ x: number; y: number; a: number }> {
  const cx = tableWidth / 2;
  const cy = tableHeight / 2;

  if (playerCount === 2) {
    if (isPortrait) {
      return [
        { x: cx, y: tableHeight * 0.28, a: 0.1 },
        { x: cx, y: tableHeight * 0.72, a: -0.1 },
      ];
    } else {
      return [
        { x: tableWidth * 0.28, y: cy, a: Math.PI / 2 + 0.1 },
        { x: tableWidth * 0.72, y: cy, a: Math.PI / 2 - 0.1 },
      ];
    }
  }

  // 3 or more players: Symmetrical triangular distribution around table center
  const radius = Math.min(tableWidth, tableHeight) * 0.32;
  const out = [];
  const offset = isPortrait ? 0 : Math.PI / 6;

  for (let i = 0; i < playerCount; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / playerCount + offset;
    out.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      a: angle + Math.PI / 2,
    });
  }
  return out;
}
