import { ArenaDesk, AttackSideIndex, PenSkin } from '../types/game';
import { ATTACK_SIDES, PEN_LENGTH, PEN_WIDTH } from './constants';

export function shadeColor(hex: string, percent: number): string {
  let color = hex;
  if (color.startsWith('#')) {
    color = color.slice(1);
  }
  if (color.length === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
  }
  const num = parseInt(color, 16);
  if (isNaN(num)) return hex;

  let r = (num >> 16) + Math.round(255 * percent);
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * percent);
  let b = (num & 0x0000ff) + Math.round(255 * percent);

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `rgb(${r},${g},${b})`;
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawPenPattern(
  ctx: CanvasRenderingContext2D,
  skin: PenSkin,
  x0: number,
  x1: number,
  h: number
): void {
  ctx.strokeStyle = skin.accent || '#ffffff';
  ctx.fillStyle = skin.accent || '#ffffff';

  switch (skin.pattern) {
    case 'stripes':
      for (let x = x0 + 4; x < x1; x += 13) {
        ctx.beginPath();
        ctx.moveTo(x, -h);
        ctx.quadraticCurveTo(x + 5, -h * 0.3, x + 1.5, -h * 0.02);
        ctx.lineTo(x + 4, -h);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + 6, h);
        ctx.quadraticCurveTo(x + 11, h * 0.3, x + 7.5, h * 0.04);
        ctx.lineTo(x + 10, h);
        ctx.fill();
      }
      break;

    case 'rain':
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      for (let x = x0 + 3, i = 0; x < x1; x += 6.5, i++) {
        const y = ((i * 37) % 11) - 5.5;
        ctx.beginPath();
        ctx.moveTo(x, y - 2.5);
        ctx.lineTo(x - 1.8, y + 2.5);
        ctx.stroke();
      }
      break;

    case 'bolt': {
      ctx.lineWidth = 1.9;
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      let up = true;
      for (let x = x0; x < x1 - 4; x += 9) {
        ctx.lineTo(x + 9, up ? -h * 0.55 : h * 0.55);
        up = !up;
      }
      ctx.stroke();
      break;
    }

    case 'petals':
      for (let x = x0 + 9; x < x1 - 4; x += 17) {
        ctx.beginPath();
        ctx.ellipse(x, -h * 0.38, 4.6, 2.1, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x, h * 0.38, 4.6, 2.1, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 3.8, 0, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'chevron':
      ctx.lineWidth = 1.8;
      for (let x = x0 + 4; x < x1 - 4; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, -h * 0.7);
        ctx.lineTo(x + 5, 0);
        ctx.lineTo(x, h * 0.7);
        ctx.stroke();
      }
      break;

    case 'weave':
      ctx.lineWidth = 0.9;
      ctx.globalAlpha = 0.65;
      for (let x = x0 - 20; x < x1; x += 5) {
        ctx.beginPath();
        ctx.moveTo(x, -h);
        ctx.lineTo(x + 16, h);
        ctx.moveTo(x + 16, -h);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;

    case 'gold':
      // Gold lustrous reflective bands
      ctx.fillStyle = 'rgba(255, 250, 220, 0.75)';
      for (let x = x0 + 8; x < x1; x += 18) {
        ctx.fillRect(x, -h * 0.85, 3.5, h * 1.7);
      }
      break;

    case 'neon':
      // Glowing circuit lines
      ctx.lineWidth = 1.6;
      ctx.shadowColor = skin.accent || '#06b6d4';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(x0, -h * 0.4);
      ctx.lineTo(x1, -h * 0.4);
      ctx.moveTo(x0, h * 0.4);
      ctx.lineTo(x1, h * 0.4);
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;

    case 'stars':
      // Cosmic stardust
      for (let x = x0 + 6; x < x1; x += 9) {
        const sy = Math.sin(x * 12.3) * h * 0.6;
        ctx.beginPath();
        ctx.arc(x, sy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    default:
      break;
  }
}

export interface DrawPenOptions {
  shadow?: { blur: number; x: number; y: number };
  activeSide?: AttackSideIndex | null;
  aura?: boolean;
}

export function drawDetailedPen(
  ctx: CanvasRenderingContext2D,
  skin: PenSkin,
  options: DrawPenOptions = {}
): void {
  const h = PEN_WIDTH / 2;
  const back = -PEN_LENGTH / 2;
  const tip = PEN_LENGTH / 2;
  const coneStart = tip - 16;
  const gripStart = tip - 40;

  // 1. Drop Shadow
  ctx.save();
  if (options.shadow) {
    ctx.shadowColor = 'rgba(20, 8, 2, 0.55)';
    ctx.shadowBlur = options.shadow.blur;
    ctx.shadowOffsetX = options.shadow.x;
    ctx.shadowOffsetY = options.shadow.y;
  }
  ctx.fillStyle = skin.translucent ? 'rgba(210, 218, 226, 0.95)' : skin.body;
  drawRoundedRect(ctx, back, -h, coneStart - back + 1, PEN_WIDTH, 4);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(coneStart, -h * 0.8);
  ctx.lineTo(tip - 1, -1.3);
  ctx.lineTo(tip - 1, 1.3);
  ctx.lineTo(coneStart, h * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. Main Barrel
  const barrelGradient = ctx.createLinearGradient(0, -h, 0, h);
  if (skin.translucent) {
    barrelGradient.addColorStop(0, 'rgba(170, 180, 195, 0.96)');
    barrelGradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.98)');
    barrelGradient.addColorStop(0.5, 'rgba(225, 232, 240, 0.94)');
    barrelGradient.addColorStop(1, 'rgba(145, 155, 170, 0.96)');
  } else {
    barrelGradient.addColorStop(0, shadeColor(skin.body, -0.35));
    barrelGradient.addColorStop(0.28, shadeColor(skin.body, 0.3));
    barrelGradient.addColorStop(0.55, skin.body);
    barrelGradient.addColorStop(1, shadeColor(skin.body, -0.45));
  }
  ctx.fillStyle = barrelGradient;
  drawRoundedRect(ctx, back + 2, -h, gripStart - back - 1, PEN_WIDTH, 3);
  ctx.fill();

  // 3. Translucent Inner Refill Tube OR Pattern
  if (skin.translucent) {
    // Ink reservoir inside plastic
    ctx.fillStyle = skin.body;
    drawRoundedRect(ctx, back + 14, -1.9, coneStart - back - 12, 3.8, 1.9);
    ctx.fill();
    // Inner tube highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(back + 15, -1.4, coneStart - back - 15, 0.9);
    // Inner plastic walls
    ctx.strokeStyle = 'rgba(110, 122, 136, 0.35)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(back + 12, -h * 0.5);
    ctx.lineTo(gripStart, -h * 0.5);
    ctx.moveTo(back + 12, h * 0.5);
    ctx.lineTo(gripStart, h * 0.5);
    ctx.stroke();
  } else if (skin.pattern && skin.pattern !== 'none') {
    ctx.save();
    drawRoundedRect(ctx, back + 2, -h, gripStart - back - 1, PEN_WIDTH, 3);
    ctx.clip();
    drawPenPattern(ctx, skin, back + 12, gripStart, h);
    ctx.restore();
  }

  // 4. Barrel Specular Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.fillRect(back + 12, -h * 0.58, gripStart - back - 14, 1.6);

  // 5. Rubber Grip
  const gripGradient = ctx.createLinearGradient(0, -h, 0, h);
  gripGradient.addColorStop(0, shadeColor(skin.grip, -0.3));
  gripGradient.addColorStop(0.35, shadeColor(skin.grip, 0.22));
  gripGradient.addColorStop(1, shadeColor(skin.grip, -0.4));
  ctx.fillStyle = gripGradient;
  drawRoundedRect(ctx, gripStart, -h + 0.6, coneStart - gripStart + 1, PEN_WIDTH - 1.2, 2);
  ctx.fill();

  // Grip finger ribs
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let x = gripStart + 3; x < coneStart - 1; x += 3.2) {
    ctx.moveTo(x, -h + 1.5);
    ctx.lineTo(x, h - 1.5);
  }
  ctx.stroke();

  // 6. Metal Cone & Ballpoint Tip
  const coneGrad = ctx.createLinearGradient(0, -h, 0, h);
  coneGrad.addColorStop(0, '#787e86');
  coneGrad.addColorStop(0.32, '#f8f9fa');
  coneGrad.addColorStop(0.62, '#b8bdc4');
  coneGrad.addColorStop(1, '#5c6168');
  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(coneStart, -h * 0.8);
  ctx.lineTo(tip - 2.2, -1.4);
  ctx.lineTo(tip - 2.2, 1.4);
  ctx.lineTo(coneStart, h * 0.8);
  ctx.closePath();
  ctx.fill();

  // Ballpoint sphere
  ctx.fillStyle = '#2d3034';
  ctx.beginPath();
  ctx.arc(tip - 1.7, 0, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // 7. Back Plug
  const plugGrad = ctx.createLinearGradient(0, -h, 0, h);
  plugGrad.addColorStop(0, shadeColor(skin.cap, -0.3));
  plugGrad.addColorStop(0.3, shadeColor(skin.cap, 0.3));
  plugGrad.addColorStop(1, shadeColor(skin.cap, -0.45));
  ctx.fillStyle = plugGrad;
  drawRoundedRect(ctx, back, -h - 0.5, 13, PEN_WIDTH + 1, 4.5);
  ctx.fill();

  // 8. Pocket Clip
  const clipStart = back + 5;
  const clipEnd = back + 64;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  drawRoundedRect(ctx, clipStart + 1, -1.4, clipEnd - clipStart, 5.2, 2.6);
  ctx.fill();

  const clipGrad = ctx.createLinearGradient(0, -2.6, 0, 2.6);
  clipGrad.addColorStop(0, shadeColor(skin.clip, 0.35));
  clipGrad.addColorStop(1, shadeColor(skin.clip, -0.35));
  ctx.fillStyle = clipGrad;
  drawRoundedRect(ctx, clipStart, -2.6, clipEnd - clipStart, 5.2, 2.6);
  ctx.fill();

  // Clip metallic sheen
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillRect(clipStart + 3, -1.7, clipEnd - clipStart - 9, 1);

  if (skin.emblem) {
    ctx.fillStyle = skin.accent || '#ffd700';
    ctx.beginPath();
    ctx.arc(back + 46, 0, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // 9. Attack Side Markers (Top, Middle, Bottom)
  if (options.activeSide !== undefined && options.activeSide !== null) {
    for (let i = 0; i < 3; i++) {
      const x = ATTACK_SIDES[i].offset * PEN_LENGTH;
      if (i === options.activeSide) {
        ctx.fillStyle = 'rgba(255, 224, 102, 0.95)';
        ctx.beginPath();
        ctx.arc(x, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#172f86';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.fillStyle = '#172f86';
        ctx.font = 'bold 8px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(['T', 'M', 'B'][i], x, 0.5);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(x, 0, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

// Procedural Wooden Desk Texture Generator
export function generateDeskCanvas(
  tw: number,
  th: number,
  arena: ArenaDesk,
  seed = 42
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const scale = 1.35;
  canvas.width = Math.round(tw * scale);
  canvas.height = Math.round(th * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(scale, scale);

  // Deterministic RNG
  let s = seed | 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const isLandscape = tw >= th;
  const w = isLandscape ? tw : th;
  const h = isLandscape ? th : tw;

  ctx.save();
  if (!isLandscape) {
    ctx.translate(tw, 0);
    ctx.rotate(Math.PI / 2);
  }

  // Wooden planks
  const plankCount = 5;
  const plankHeight = h / plankCount;
  const { baseHue, baseSat, baseLight } = arena.theme;

  for (let i = 0; i < plankCount; i++) {
    const y0 = i * plankHeight;
    ctx.fillStyle = `hsl(${baseHue + rand() * 6} ${baseSat}% ${baseLight + rand() * 7}%)`;
    ctx.fillRect(0, y0, w, plankHeight + 1);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y0, w, plankHeight);
    ctx.clip();

    // Wood wave shadows
    for (let j = 0; j < 7; j++) {
      const yy = y0 + rand() * plankHeight;
      const grad = ctx.createLinearGradient(0, yy - 14, 0, yy + 14);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(
        0.5,
        rand() < 0.55 ? 'rgba(50,20,6,0.18)' : 'rgba(255,210,150,0.08)'
      );
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, yy - 14, w, 28);
    }

    // Wood Grain lines
    for (let j = 0; j < 85; j++) {
      const yy = y0 + rand() * plankHeight;
      const a1 = 0.6 + rand() * 2.2;
      const f1 = 0.002 + rand() * 0.006;
      const p1 = rand() * 6.28;

      ctx.beginPath();
      for (let xx = -10; xx <= w + 10; xx += 10) {
        const v = yy + Math.sin(xx * f1 + p1) * a1 * 3;
        if (xx < 0) ctx.moveTo(xx, v);
        else ctx.lineTo(xx, v);
      }
      const dark = rand() < 0.78;
      ctx.strokeStyle = dark
        ? `rgba(40,16,4,${0.05 + rand() * 0.15})`
        : `rgba(255,215,160,${0.03 + rand() * 0.08})`;
      ctx.lineWidth = 0.4 + rand() * 1.5;
      ctx.stroke();
    }

    // Knots
    if (rand() < 0.65) {
      const kx = rand() * w;
      const ky = y0 + plankHeight * (0.3 + rand() * 0.4);
      for (let r = 1; r < 9; r++) {
        ctx.beginPath();
        ctx.ellipse(kx, ky, r * 5.2, r * 1.6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(45,18,5,${0.2 - r * 0.02})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(35,14,3,0.42)';
      ctx.beginPath();
      ctx.ellipse(kx, ky, 4.8, 1.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Plank seams
    if (i > 0) {
      ctx.fillStyle = 'rgba(20,8,2,0.65)';
      ctx.fillRect(0, y0 - 1, w, 2);
      ctx.fillStyle = 'rgba(255,220,170,0.12)';
      ctx.fillRect(0, y0 + 1, w, 1);
    }
  }
  ctx.restore();

  // Scratches across desk
  for (let i = 0; i < 65; i++) {
    const sx = rand() * tw;
    const sy = rand() * th;
    const a = rand() * 6.28;
    const len = 8 + rand() * 38;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
    ctx.strokeStyle = arena.theme.scratchColor;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  // Classroom doodles & tic-tac-toe if enabled
  if (arena.theme.chalkDoodles) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,230,195,0.18)';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';

    const tx = tw * 0.07;
    const ty = th * 0.76;
    const ts = 46;
    ctx.beginPath();
    ctx.moveTo(tx + ts / 3, ty);
    ctx.lineTo(tx + ts / 3, ty + ts);
    ctx.moveTo(tx + (2 * ts) / 3, ty);
    ctx.lineTo(tx + (2 * ts) / 3, ty + ts);
    ctx.moveTo(tx, ty + ts / 3);
    ctx.lineTo(tx + ts, ty + ts / 3);
    ctx.moveTo(tx, ty + (2 * ts) / 3);
    ctx.lineTo(tx + ts, ty + (2 * ts) / 3);

    // X and O in tic-tac-toe
    ctx.moveTo(tx + 4, ty + 4);
    ctx.lineTo(tx + 11, ty + 11);
    ctx.moveTo(tx + 11, ty + 4);
    ctx.lineTo(tx + 4, ty + 11);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(tx + ts / 2, ty + ts / 2, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Compass geometry circle
    ctx.beginPath();
    ctx.arc(tw * 0.88, th * 0.18, 28, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,230,195,0.08)';
    ctx.stroke();
    ctx.restore();
  }

  // Ink drops
  if (arena.theme.inkStains) {
    const bx = tw * (0.6 + rand() * 0.25);
    const by = th * (0.7 + rand() * 0.15);
    ctx.fillStyle = 'rgba(30,50,150,0.3)';
    ctx.beginPath();
    ctx.ellipse(bx, by, 11, 8, rand() * 3, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(bx + (rand() - 0.5) * 40, by + (rand() - 0.5) * 28, 1 + rand() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Desk Rim and lighting gradient
  const radGrad = ctx.createRadialGradient(
    tw * 0.45,
    th * 0.4,
    15,
    tw * 0.5,
    th * 0.5,
    Math.max(tw, th) * 0.78
  );
  radGrad.addColorStop(0, 'rgba(255,240,210,0.12)');
  radGrad.addColorStop(0.65, 'rgba(0,0,0,0)');
  radGrad.addColorStop(1, 'rgba(15,6,0,0.4)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, tw, th);

  // Beveled desk edges
  const bevel = 14;
  let edgeGrad = ctx.createLinearGradient(0, 0, 0, bevel);
  edgeGrad.addColorStop(0, 'rgba(255,230,185,0.24)');
  edgeGrad.addColorStop(1, 'rgba(255,230,185,0)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, tw, bevel);

  edgeGrad = ctx.createLinearGradient(0, th, 0, th - bevel);
  edgeGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
  edgeGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, th - bevel, tw, bevel);

  // Outer border rim
  ctx.strokeStyle = arena.theme.rimColor;
  ctx.lineWidth = 3.5;
  ctx.strokeRect(1.5, 1.5, tw - 3, th - 3);

  ctx.strokeStyle = 'rgba(255,225,180,0.2)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(5, 5, tw - 10, th - 10);

  return canvas;
}
