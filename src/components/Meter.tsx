import type { RefObject } from "react";

type Zone = { from: number; to: number; color: string };

type Props = {
  max: number;
  zones: Zone[];
  legend: [string, string];
  needleRef: RefObject<HTMLSpanElement | null>;
};

// The needle position is updated straight from the game loop (via needleRef)
// so the meter doesn't re-render 60 times a second.
export default function Meter({ max, zones, legend, needleRef }: Props) {
  return (
    <div>
      <div className="relative h-[18px] overflow-hidden rounded-full border border-line bg-night-2">
        {zones.map((z) => (
          <span
            key={z.from}
            className="absolute inset-y-0"
            style={{
              left: `${(z.from / max) * 100}%`,
              width: `${((z.to - z.from) / max) * 100}%`,
              background: z.color,
            }}
          />
        ))}
        <span
          ref={needleRef}
          className="absolute -inset-y-0.5 -ml-0.5 w-1 rounded bg-ink shadow-[0_0_6px_rgba(255,255,255,0.6)]"
          style={{ left: "0%" }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-ink-dim">
        <span>{legend[0]}</span>
        <span>{legend[1]}</span>
      </div>
    </div>
  );
}
