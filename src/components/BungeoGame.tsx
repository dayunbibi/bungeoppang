"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { colorAt, drawFish, drawMold, drawSteam, fishSpot, type Splat, type Steam } from "@/lib/draw";
import { FILLINGS, FILLING_KEYS, type FillingKey } from "@/lib/fillings";
import { judge, sideLabel } from "@/lib/judge";
import { bumpTodayCount, getTodayCount } from "@/lib/counter";
import { makeResultImage } from "@/lib/resultImage";
import Meter from "./Meter";
import ResultCard from "./ResultCard";

type Phase = "pour" | "filling" | "cookA" | "flip" | "cookB" | "done";

// everything that changes every frame lives in a ref, not in React state
type Game = {
  fill: number;
  pouring: boolean;
  filling: FillingKey | null;
  dA: number; // doneness, side A
  dB: number; // doneness, side B
  rate: number; // cooking speed, a bit random each round
  flipT: number; // 0 -> 1 during the flip animation
  blobs: Splat[];
  steam: Steam[];
  t: number;
};

function newGame(): Game {
  return { fill: 0, pouring: false, filling: null, dA: 0, dB: 0, rate: 13, flipT: 0, blobs: [], steam: [], t: 0 };
}

const POUR_MAX = 135;
const COOK_MAX = 120;

const STEPS: { key: Phase; label: string }[] = [
  { key: "pour", label: "반죽" },
  { key: "filling", label: "속" },
  { key: "cookA", label: "굽기" },
  { key: "cookB", label: "뒤집기" },
  { key: "done", label: "꺼내기" },
];

type Result = {
  url: string;
  blob: Blob;
  title: string;
  score: number;
};

export default function BungeoGame() {
  const [phase, setPhaseState] = useState<Phase>("pour");
  const [result, setResult] = useState<Result | null>(null);
  const [count, setCount] = useState(0);
  const [pressing, setPressing] = useState(false);
  const [filling, setFilling] = useState<FillingKey | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const needleRef = useRef<HTMLSpanElement>(null);
  const game = useRef<Game>(newGame());
  const phaseRef = useRef<Phase>("pour");
  const size = useRef({ W: 0, H: 0, dpr: 1 });

  // keep the ref and the state in sync (the game loop reads the ref)
  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  useEffect(() => {
    setCount(getTodayCount());
  }, []);

  // canvas size follows its CSS size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      size.current = { W: rect.width, H: rect.height, dpr };
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [result]); // canvas is re-mounted after "한 판 더"

  // main loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    function tick(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = game.current;
      const p = phaseRef.current;
      g.t += dt;

      if (p === "pour" && g.pouring) g.fill = Math.min(POUR_MAX, g.fill + dt * 40);
      if (p === "cookA") g.dA = Math.min(COOK_MAX, g.dA + dt * g.rate);
      if (p === "cookB") g.dB = Math.min(COOK_MAX, g.dB + dt * g.rate);
      if (p === "flip") {
        g.flipT += dt / 0.45;
        if (g.flipT >= 1) {
          g.flipT = 1;
          setPhase("cookB");
        }
      }

      if (p === "cookA" || p === "cookB" || p === "flip") {
        const heat = p === "cookB" ? g.dB : g.dA;
        if (Math.random() < 0.25 + heat / 200) {
          g.steam.push({ x: 0.25 + Math.random() * 0.45, y: 0.55, r: 8 + Math.random() * 10, life: 1 });
        }
      }
      for (const st of g.steam) {
        st.y -= dt * 0.18;
        st.x += Math.sin(st.y * 20) * 0.001;
        st.life -= dt * 0.7;
      }
      g.steam = g.steam.filter((st) => st.life > 0);

      if (p !== "done") {
        render();
        moveNeedle();
      }
      raf = requestAnimationFrame(tick);
    }

    function render() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const { W, H, dpr } = size.current;
      const g = game.current;
      const p = phaseRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      drawMold(ctx, W, H);

      let d = 0;
      let sx = 1;
      const raw = p === "pour" || p === "filling";
      if (p === "cookA") d = g.dA;
      if (p === "cookB") d = g.dB;
      if (p === "flip") {
        sx = Math.cos(g.flipT * Math.PI);
        d = sx > 0 ? g.dA : g.dB;
      }

      const { cx, cy, s } = fishSpot(W, H);
      if (g.fill > 0) {
        drawFish(ctx, cx, cy, s, {
          fill: g.fill,
          d,
          sx,
          raw,
          blobs: g.blobs,
          dollop: p === "filling" && g.filling ? FILLINGS[g.filling].color : null,
          t: g.t,
        });
      }

      drawSteam(ctx, W, H, g.steam);

      // batter stream from the top while pouring
      if (p === "pour" && g.pouring) {
        const front = cx + s * (-1.05 + (2.2 * Math.min(g.fill, 100)) / 100);
        ctx.strokeStyle = colorAt(0);
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(front - 4, 0);
        ctx.lineTo(front - 4 + Math.sin(g.t * 20) * 1.5, cy);
        ctx.stroke();
      }
    }

    function moveNeedle() {
      const el = needleRef.current;
      if (!el) return;
      const g = game.current;
      const p = phaseRef.current;
      let v = 0;
      let max = COOK_MAX;
      if (p === "pour" || p === "filling") {
        v = g.fill;
        max = POUR_MAX;
      } else if (p === "cookA") v = g.dA;
      else v = g.dB;
      el.style.left = `${(Math.min(v, max) / max) * 100}%`;
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setPhase]);

  // ---------- actions ----------

  function startPour() {
    if (phaseRef.current !== "pour") return;
    game.current.pouring = true;
    setPressing(true);
  }

  function stopPour() {
    const g = game.current;
    if (!g.pouring) return;
    g.pouring = false;
    setPressing(false);
    if (g.fill < 3) return; // just a tap, ignore

    // make the overflow splatter once so it doesn't jump around while cooking
    const over = g.fill - 100;
    g.blobs = [];
    if (over > 12) {
      const n = Math.round((over - 12) / 3) + 3;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        g.blobs.push({ x: Math.cos(a) * 0.95, y: Math.sin(a) * 0.62, r: 0.06 + Math.random() * 0.1, a: Math.random() * 3 });
      }
    }
    setPhase("filling");
  }

  function pickFilling(key: FillingKey) {
    const g = game.current;
    if (g.filling) return;
    g.filling = key;
    setFilling(key);
    setTimeout(() => {
      g.rate = 11 + Math.random() * 5;
      setPhase("cookA");
    }, 700);
  }

  function flip() {
    game.current.flipT = 0;
    game.current.dB = 8;
    setPhase("flip");
  }

  async function takeOut() {
    setPhase("done");
    const g = game.current;
    const verdict = judge(g.fill, g.dA, g.dB);
    const n = bumpTodayCount();
    setCount(n);

    const blob = await makeResultImage({
      verdict,
      fill: g.fill,
      dA: g.dA,
      dB: g.dB,
      filling: g.filling ?? "red",
      blobs: g.blobs,
      count: n,
    });
    setResult({ url: URL.createObjectURL(blob), blob, title: verdict.title, score: verdict.score });
  }

  function again() {
    if (result) URL.revokeObjectURL(result.url);
    game.current = newGame();
    setFilling(null);
    setResult(null);
    setPhase("pour");
  }

  // ---------- UI ----------

  const g = game.current;
  const stepKey = phase === "flip" ? "cookB" : phase;
  const stepIndex = STEPS.findIndex((s) => s.key === stepKey);

  let hint: React.ReactNode = null;
  if (phase === "pour") {
    hint = (
      <>
        틀에 반죽을 부어주세요
        <small>버튼을 꾹 누르고 있다가 꼬리 끝에서 떼기</small>
      </>
    );
  } else if (phase === "filling") {
    hint = filling ? `${FILLINGS[filling].name} 듬뿍. 뚜껑 닫는 중…` : `반죽 ${Math.round(g.fill)}% 완료. 속은 뭘로 할까요?`;
  } else if (phase === "cookA") {
    hint = (
      <>
        지글지글… 황금빛일 때 뒤집으세요
        <small>너무 오래 두면 탑니다</small>
      </>
    );
  } else if (phase === "flip") {
    hint = "휙!";
  } else if (phase === "cookB") {
    hint = (
      <>
        앞면은 <b className="font-normal text-lamp">{sideLabel(g.dA)}</b>. 이제 뒷면 차례
      </>
    );
  } else if (phase === "done" && !result) {
    hint = "꺼내는 중…";
  }

  const isPourMeter = phase === "pour" || phase === "filling";

  return (
    <div className="flex flex-col gap-[18px]">
      <ol className="flex gap-1.5 font-ui text-[13px]">
        {STEPS.map((s, i) => (
          <li
            key={s.key}
            className={`flex-1 border-b-[3px] py-1 text-center ${
              i < stepIndex ? "border-ink-dim text-ink" : i === stepIndex ? "border-lamp text-lamp" : "border-line text-ink-dim"
            }`}
          >
            {s.label}
          </li>
        ))}
      </ol>

      {result ? (
        <ResultCard imageUrl={result.url} imageBlob={result.blob} title={result.title} score={result.score} onAgain={again} />
      ) : (
        <>
          <canvas
            ref={canvasRef}
            aria-label="붕어빵 틀"
            className="block aspect-[4/3] w-full touch-none rounded-[14px]"
          />

          <p className="hint">{hint}</p>

          {phase !== "done" &&
            (isPourMeter ? (
              <Meter
                key="pour"
                max={POUR_MAX}
                needleRef={needleRef}
                zones={[
                  { from: 88, to: 100, color: "var(--color-good)" },
                  { from: 100, to: 112, color: "var(--color-warn)" },
                  { from: 112, to: POUR_MAX, color: "var(--color-bad)" },
                ]}
                legend={["모자람", "딱 좋음 · 날개 · 넘침"]}
              />
            ) : (
              <Meter
                key="cook"
                max={COOK_MAX}
                needleRef={needleRef}
                zones={[
                  { from: 55, to: 75, color: "var(--color-good)" },
                  { from: 75, to: 90, color: "var(--color-warn)" },
                  { from: 90, to: COOK_MAX, color: "var(--color-bad)" },
                ]}
                legend={["덜 익음", "황금빛 · 진함 · 탐"]}
              />
            ))}

          <div className="flex flex-wrap justify-center gap-2.5">
            {phase === "pour" && (
              <button
                className={`btn btn-big flex-1 touch-none select-none ${pressing ? "pressing" : ""}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  startPour();
                }}
                onPointerUp={stopPour}
                onPointerLeave={stopPour}
                onPointerCancel={stopPour}
                onKeyDown={(e) => {
                  if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                    e.preventDefault();
                    startPour();
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === " " || e.key === "Enter") stopPour();
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                꾹 눌러서 반죽 붓기
              </button>
            )}

            {phase === "filling" &&
              FILLING_KEYS.map((key) => (
                <button
                  key={key}
                  className="btn btn-chip basis-[40%] grow"
                  disabled={!!filling}
                  onClick={() => pickFilling(key)}
                >
                  <span className="mr-1.5 inline-block size-3 rounded-full align-[-1px]" style={{ background: FILLINGS[key].color }} />
                  {FILLINGS[key].name}
                </button>
              ))}

            {phase === "cookA" && (
              <button className="btn btn-big flex-1" onClick={flip}>
                뒤집기!
              </button>
            )}

            {phase === "cookB" && (
              <button className="btn btn-big flex-1" onClick={takeOut}>
                꺼내기!
              </button>
            )}
          </div>
        </>
      )}

      {count > 0 && <p className="text-center text-[13px] tabular-nums text-ink-dim">오늘 구운 붕어빵 {count}개</p>}
    </div>
  );
}
