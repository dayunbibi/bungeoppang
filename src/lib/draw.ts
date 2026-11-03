// All canvas drawing for the fish + mold lives here.
// The fish is drawn in "unit space": head at x = -1, tail tip around x = 1.12.

export type Splat = { x: number; y: number; r: number; a: number };
export type Steam = { x: number; y: number; r: number; life: number };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// batter color by doneness: 0 = raw batter, 120 = charcoal
const COLOR_STOPS: [number, string][] = [
  [0, "#f3e3b8"],
  [35, "#efc77a"],
  [60, "#d9922e"],
  [80, "#a65a1d"],
  [95, "#5a2e12"],
  [120, "#21140e"],
];

export function colorAt(d: number) {
  d = clamp(d, 0, 120);
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const [d0, c0] = COLOR_STOPS[i];
    const [d1, c1] = COLOR_STOPS[i + 1];
    if (d <= d1) {
      const t = (d - d0) / (d1 - d0);
      const a = hexToRgb(c0);
      const b = hexToRgb(c1);
      const r = Math.round(lerp(a[0], b[0], t));
      const g = Math.round(lerp(a[1], b[1], t));
      const bl = Math.round(lerp(a[2], b[2], t));
      return `rgb(${r},${g},${bl})`;
    }
  }
  return COLOR_STOPS[COLOR_STOPS.length - 1][1];
}

export function fishPath(c: CanvasRenderingContext2D) {
  c.beginPath();
  c.moveTo(-1.0, 0);
  c.bezierCurveTo(-0.95, -0.45, -0.4, -0.62, 0.15, -0.5);
  c.bezierCurveTo(0.45, -0.42, 0.62, -0.2, 0.72, -0.12);
  c.bezierCurveTo(0.85, -0.3, 1.0, -0.48, 1.12, -0.52);
  c.bezierCurveTo(1.02, -0.2, 1.02, 0.2, 1.12, 0.52);
  c.bezierCurveTo(1.0, 0.48, 0.85, 0.3, 0.72, 0.12);
  c.bezierCurveTo(0.62, 0.2, 0.45, 0.42, 0.15, 0.5);
  c.bezierCurveTo(-0.4, 0.62, -0.95, 0.45, -1.0, 0);
  c.closePath();
}

type FishOptions = {
  fill: number; // batter %, can go over 100 (overflow = wings)
  d: number; // doneness of the visible side
  sx?: number; // horizontal scale, used for the flip animation
  raw?: boolean; // still pouring -> wavy edge, no wings yet
  blobs?: Splat[];
  dollop?: string | null; // filling color
  t?: number; // time, only used for the wave
};

export function drawFish(c: CanvasRenderingContext2D, cx: number, cy: number, s: number, o: FishOptions) {
  const { fill, d, sx = 1, raw = false, blobs = [], dollop = null, t = 0 } = o;
  const over = Math.max(0, fill - 100);

  c.save();
  c.translate(cx, cy);
  c.scale(s * sx, s);

  // overflow = crispy "wings" around the fish
  if (over > 0 && !raw) {
    c.save();
    c.fillStyle = colorAt(d + 12);
    c.strokeStyle = colorAt(d + 12);
    c.lineJoin = "round";
    c.lineWidth = 0.03 + over * 0.007;
    fishPath(c);
    c.fill();
    c.stroke();
    for (const b of blobs) {
      c.beginPath();
      c.ellipse(b.x, b.y, b.r * 1.4, b.r, b.a, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  c.save();
  fishPath(c);
  c.clip();

  // batter fills from head to tail
  const front = -1.05 + (2.2 * Math.min(fill, 100)) / 100;
  c.fillStyle = colorAt(d);
  if (raw) {
    c.beginPath();
    c.moveTo(-1.2, -0.7);
    for (let y = -0.7; y <= 0.71; y += 0.05) {
      c.lineTo(front + Math.sin(y * 9 + t * 7) * 0.035, y);
    }
    c.lineTo(-1.2, 0.7);
    c.closePath();
    c.fill();
  } else {
    c.fillRect(-1.2, -0.7, front + 1.2, 1.4);
  }

  const shade = c.createRadialGradient(-0.3, -0.25, 0.05, -0.1, 0, 1.1);
  shade.addColorStop(0, "rgba(255,240,200,0.28)");
  shade.addColorStop(1, "rgba(60,20,0,0.18)");
  c.fillStyle = shade;
  c.fillRect(-1.2, -0.7, front + 1.2, 1.4);

  // eye, gills, scales show up as it cooks
  const detail = raw ? 0 : clamp((d - 12) / 40, 0, 1) * 0.75;
  if (detail > 0) {
    c.globalAlpha = detail;
    c.strokeStyle = colorAt(d + 30);
    c.fillStyle = colorAt(d + 35);
    c.lineWidth = 0.035;
    c.lineCap = "round";

    // eye
    c.beginPath();
    c.arc(-0.7, -0.13, 0.075, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(-0.72, -0.15, 0.022, 0, Math.PI * 2);
    c.fillStyle = colorAt(d - 25);
    c.fill();

    // mouth
    c.beginPath();
    c.moveTo(-0.97, 0.04);
    c.quadraticCurveTo(-0.88, 0.1, -0.84, 0.05);
    c.stroke();

    // gill
    c.beginPath();
    c.arc(-0.55, 0.02, 0.32, -1.1, 1.0);
    c.stroke();

    // scales
    c.lineWidth = 0.028;
    for (let col = 0; col < 5; col++) {
      for (let row = -2; row <= 2; row++) {
        const x = -0.28 + col * 0.18;
        const y = row * 0.16 + (col % 2 ? 0.08 : 0);
        if (Math.abs(y) > 0.42 - col * 0.04) continue;
        c.beginPath();
        c.arc(x, y, 0.09, -1.3, 1.3);
        c.stroke();
      }
    }

    // tail lines
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(0.78, i * 0.04);
      c.lineTo(1.06, i * 0.17);
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  c.restore();

  if (dollop) {
    c.fillStyle = dollop;
    c.beginPath();
    c.ellipse(-0.15, 0, 0.32, 0.22, 0.1, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.25)";
    c.beginPath();
    c.ellipse(-0.24, -0.07, 0.1, 0.05, 0.3, 0, Math.PI * 2);
    c.fill();
  }

  c.restore();
}

export function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// cast iron mold with a fish-shaped hole
export function drawMold(c: CanvasRenderingContext2D, W: number, H: number) {
  const mx = W * 0.04;
  const my = H * 0.08;
  const mw = W * 0.92;
  const mh = H * 0.84;

  const iron = c.createLinearGradient(0, my, 0, my + mh);
  iron.addColorStop(0, "#3a383d");
  iron.addColorStop(1, "#1f1e22");
  c.fillStyle = iron;
  roundRect(c, mx, my, mw, mh, 22);
  c.fill();
  c.strokeStyle = "#4c4a50";
  c.lineWidth = 2;
  c.stroke();

  // bolts in the corners
  c.fillStyle = "#56535a";
  const bolts = [
    [mx + 18, my + 18],
    [mx + mw - 18, my + 18],
    [mx + 18, my + mh - 18],
    [mx + mw - 18, my + mh - 18],
  ];
  for (const [x, y] of bolts) {
    c.beginPath();
    c.arc(x, y, 5, 0, Math.PI * 2);
    c.fill();
  }

  const { cx, cy, s } = fishSpot(W, H);
  c.save();
  c.translate(cx, cy);
  c.scale(s * 1.07, s * 1.07);
  fishPath(c);
  c.fillStyle = "#141316";
  c.fill();
  c.lineWidth = 0.02;
  c.strokeStyle = "#000";
  c.stroke();
  c.restore();
}

// where the fish sits inside the mold canvas
export function fishSpot(W: number, H: number) {
  return { cx: W * 0.47, cy: H * 0.5, s: W * 0.37 };
}

export function drawSteam(c: CanvasRenderingContext2D, W: number, H: number, steam: Steam[]) {
  c.fillStyle = "#ffffff";
  for (const st of steam) {
    c.globalAlpha = st.life * 0.22;
    c.beginPath();
    c.arc(st.x * W, st.y * H, st.r * (1.6 - st.life), 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}
