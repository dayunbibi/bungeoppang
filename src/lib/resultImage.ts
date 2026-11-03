import { drawFish, type Splat } from "./draw";
import { FILLINGS, type FillingKey } from "./fillings";
import { sideLabel, type Verdict } from "./judge";

type CardInput = {
  verdict: Verdict;
  fill: number;
  dA: number;
  dB: number;
  filling: FillingKey;
  blobs: Splat[];
  count: number;
};

function wrapText(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (c.measureText(test).width > maxW && line) {
      c.fillText(line, x, yy);
      line = w;
      yy += lineH;
    } else {
      line = test;
    }
  }
  c.fillText(line, x, yy);
}

// Google Fonts splits Korean fonts into small chunks and only downloads the ones
// the page actually shows. Text that only exists on the canvas never triggers a download,
// so document.fonts.ready isn't enough — load each font for the exact text first.
async function loadFontsFor(text: string) {
  const families = ['"Black Han Sans"', "Jua", '"Gowun Dodum"'];
  try {
    await Promise.all(families.map((f) => document.fonts.load(`40px ${f}`, text)));
  } catch {
    // worst case the card uses a fallback font, still fine
  }
}

// 1080x1920 (9:16) so it drops straight into an Instagram story
export async function makeResultImage(input: CardInput): Promise<Blob> {
  const { verdict, fill, dA, dB, filling, blobs, count } = input;
  const fl = FILLINGS[filling];

  const sides = `앞면 ${sideLabel(dA)} · 뒷면 ${sideLabel(dB)}`;
  const fillingLine = `속: ${fl.name} (${fl.type})`;
  const footer = count ? `온라인 붕어빵 굽기 · 오늘 ${count}번째` : "온라인 붕어빵 굽기";
  await loadFontsFor(["오늘의 붕어빵", verdict.title, verdict.line, sides, fillingLine, `${verdict.score}점`, footer].join(""));

  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d")!;

  c.fillStyle = "#221a1d";
  c.fillRect(0, 0, W, H);

  // striped awning
  for (let x = 0; x < W; x += 120) {
    c.fillStyle = (x / 120) % 2 ? "#f3e6cf" : "#c8432f";
    c.fillRect(x, 0, 120, 110);
    c.beginPath();
    c.arc(x + 60, 110, 60, 0, Math.PI);
    c.fill();
  }

  c.textAlign = "center";
  c.fillStyle = "#b9a99c";
  c.font = "44px Jua, sans-serif";
  c.fillText("오늘의 붕어빵", W / 2, 330);

  c.fillStyle = "#f5b041";
  c.font = '96px "Black Han Sans", sans-serif';
  wrapText(c, verdict.title, W / 2, 450, 960, 110);

  const glow = c.createRadialGradient(W / 2, 900, 40, W / 2, 900, 520);
  glow.addColorStop(0, "rgba(245,176,65,0.35)");
  glow.addColorStop(1, "rgba(245,176,65,0)");
  c.fillStyle = glow;
  c.fillRect(0, 380, W, 1040);

  drawFish(c, W / 2 - 20, 920, 400, { fill, d: dB, blobs });

  c.fillStyle = "#f6ece0";
  c.font = '48px "Gowun Dodum", sans-serif';
  wrapText(c, verdict.line, W / 2, 1320, 900, 64);

  c.font = "42px Jua, sans-serif";
  c.fillStyle = "#b9a99c";
  c.fillText(sides, W / 2, 1500);
  c.fillText(fillingLine, W / 2, 1570);

  c.fillStyle = "#f5b041";
  c.font = '140px "Black Han Sans", sans-serif';
  c.fillText(`${verdict.score}점`, W / 2, 1760);

  c.fillStyle = "#7d6d70";
  c.font = "34px Jua, sans-serif";
  c.fillText(footer, W / 2, 1860);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}
