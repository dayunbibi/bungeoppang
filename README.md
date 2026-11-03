# 🐟 온라인 붕어빵 굽기 (Online Bungeoppang)

A tiny browser game where you bake a Korean street-cart fish bread (붕어빵).
Pour the batter, pick a filling, flip it at the right moment, and get a story-sized result card to share.

## How to play

1. **Pour** — hold the button to pour batter into the mold. Release near the tail.
   - 88–100% is perfect, 100–112% gives you crispy "wings", more than that and it bursts.
2. **Filling** — 팥 (red bean), 슈크림 (custard), 피자 (pizza), or 고구마 (sweet potato).
3. **Cook & flip** — flip when the side turns golden. Cooking speed changes a little every round.
4. **Take it out** — get a grade (황금 붕어빵, 날개 달린 붕어빵, 새까만 붕어빵 …) and a score out of 100.

The result card is 1080×1920 so it fits an Instagram story. On mobile, "공유하기" sends the image straight to the share sheet.

## Tech

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Canvas 2D for the mold, batter and fish (no image assets)

## Project structure

```
src/
  app/
    layout.tsx        # fonts, metadata
    page.tsx          # header + price board
    globals.css       # theme tokens, awning, buttons
  components/
    BungeoGame.tsx    # game state machine + render loop
    Meter.tsx         # pour / doneness gauge
    ResultCard.tsx    # result image, save & share
  lib/
    draw.ts           # fish shape, mold, steam drawing
    judge.ts          # scoring and grade titles
    resultImage.ts    # builds the shareable PNG
    fillings.ts       # filling options
    counter.ts        # "today's count" in localStorage
```

### Why the game state lives in a ref

The batter level and doneness change every frame. Keeping them in `useRef` and drawing straight to the canvas
avoids re-rendering React 60 times a second. React state is only used for things the UI actually needs to switch on
(the current phase, the picked filling, the result).

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Ideas for later

- 팥 vs 슈크림 live vote (Supabase)
- Sizzling sound effect
- Open Graph image for link previews
- Make 3 at once (the price board says 3개 2,000원 after all)
