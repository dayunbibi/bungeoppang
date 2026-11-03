import BungeoGame from "@/components/BungeoGame";

export default function Home() {
  return (
    <>
      <div className="awning" aria-hidden="true" />
      <main className="mx-auto flex max-w-[460px] flex-col gap-[18px] px-4 pt-7 pb-10">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="m-0 font-sign text-[34px] leading-[1.05] font-normal tracking-tight text-balance">
            온라인
            <br />
            <span className="text-lamp">붕어빵</span> 굽기
          </h1>
          {/* price board like a real street cart */}
          <div className="-rotate-3 rounded bg-tarp-light px-2.5 py-1.5 font-ui whitespace-nowrap text-night shadow-[2px_3px_0_rgba(0,0,0,0.35)]">
            붕어빵 3개 <b className="font-normal text-tarp">2,000원</b>
          </div>
        </header>

        <BungeoGame />

        {/* same series, send people to the other game */}
        <footer className="mt-4 border-t border-line pt-4 text-center text-sm text-ink-dim">
          김장철이라면{" "}
          <a
            href="https://kimjang-five.vercel.app"
            className="font-ui text-ink underline decoration-lamp decoration-2 underline-offset-4"
          >
            🥬 온라인 김장하기
          </a>
        </footer>
      </main>
    </>
  );
}
