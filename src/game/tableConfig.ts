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
    id: 'school_bench',
    name: 'School Bench',
    banglaName: 'স্কুল বেঞ্চ',
    shape: 'rectangle',
    baseWidth: 1200,
    baseHeight: 650,
    surface: 'normal',
    frictionAir: 0.046,
    desc: 'The classic Bangladeshi classroom wooden school bench. Long rectangular wooden tabletop with natural horizontal grain, engraved ruler markings, and authentic pen-fighting runway.',
    theme: {
      baseHue: 28,
      baseSat: 46,
      baseLight: 30,
      rimColor: 'rgba(28,14,5,0.96)',
      scratchColor: 'rgba(255,220,175,0.12)',
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
    baseWidth: 720,
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
    baseWidth: 1260,
    baseHeight: 680,
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
    baseWidth: 1000,
    baseHeight: 620,
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
  const normalizedId = id === 'large_rectangle' ? 'school_bench' : id;
  const table = TABLES_BY_ID[normalizedId] || TABLE_PRESETS[0];
  if (normalizedId === 'custom_table' && customDims) {
    const safeW = Math.max(500, Math.min(1350, Math.round(customDims.width)));
    const safeH = Math.max(450, Math.min(1000, Math.round(customDims.height)));
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
 * Calculates responsive table dimensions.
 * The School Bench and rectangular tables maintain their authentic rectangular aspect ratio.
 * The camera fits the table cleanly into the available viewport without stretching or distorting.
 */
export function resolveTableDimensions(
  table: TableConfig,
  _isPortrait?: boolean
): { width: number; height: number } {
  if (table.shape === 'square') {
    const side = Math.min(table.baseWidth, table.baseHeight);
    return { width: side, height: side };
  }

  // Preserve the authentic landscape rectangular aspect ratio across all devices
  return { width: table.baseWidth, height: table.baseHeight };
}

/**
 * Computes fair, balanced starting pen slots for 2 or 3 players for any table shape.
 */
export function getTableSpawnPositions(
  tableWidth: number,
  tableHeight: number,
  playerCount: number,
  _isPortrait?: boolean
): Array<{ x: number; y: number; a: number }> {
  const cx = tableWidth / 2;
  const cy = tableHeight / 2;

  if (playerCount === 2) {
    // Symmetrical positioning across the long School Bench runway
    return [
      { x: tableWidth * 0.22, y: cy, a: Math.PI / 2 },
      { x: tableWidth * 0.78, y: cy, a: -Math.PI / 2 },
    ];
  }

  // 3 or more players: Symmetrical triangular distribution around table center
  const radius = Math.min(tableWidth, tableHeight) * 0.30;
  const out = [];
  const offset = -Math.PI / 2;

  for (let i = 0; i < playerCount; i++) {
    const angle = offset + (i * 2 * Math.PI) / playerCount;
    out.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      a: angle + Math.PI / 2,
    });
  }
  return out;
}
