"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  actSlot,
  canServe,
  newShop,
  openShop,
  serveOrder,
  tickShop,
  type Flavor,
} from "@/lib/shop";

const names = [
  "",
  "어서 오세요!",
  "집중해서 굽는 중",
  "야호! 잘 구웠다!",
  "앗, 어떡하지?",
  "맛있게 드세요!",
];
function Fish({ color = "#eeb454" }: { color?: string }) {
  return (
    <svg viewBox="0 0 120 70" aria-hidden="true">
      <path
        d="M91 23 113 12 108 35 113 58 91 47C71 78 9 59 9 35S71-8 91 23Z"
        fill={color}
        stroke="#754d30"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="28" cy="29" r="3.5" fill="#754d30" />
      <path
        d="M46 17q17 17 0 35m20-34q17 17 0 35M13 40q13 8 23 0"
        fill="none"
        stroke="#b27837"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
export default function PoipiShop() {
  const [shop, setShop] = useState(newShop),
    [flavor, setFlavor] = useState<Flavor>("red"),
    [best, setBest] = useState(0),
    [help, setHelp] = useState(false);
  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem("poipi-shop-best-v1")) || 0);
    } catch {}
  }, []);
  useEffect(() => {
    if (shop.mode !== "open" || shop.paused || help) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.5);
      last = now;
      setShop((s) => tickShop(s, dt));
    }, 100);
    return () => clearInterval(id);
  }, [shop.mode, shop.paused, help]);
  useEffect(() => {
    if (shop.mode !== "closed") return;
    setBest((b) => Math.max(b, shop.coins));
    try {
      const old = Number(localStorage.getItem("poipi-shop-best-v1")) || 0;
      localStorage.setItem(
        "poipi-shop-best-v1",
        String(Math.max(old, shop.coins)),
      );
    } catch {}
  }, [shop.mode, shop.coins]);
  const active = shop.mode === "open" && !shop.paused;
  return (
    <main className="shop-shell">
      <header className="shop-header">
        <Link className="brand" href="/">
          🍀 POIPI’S LITTLE SHOP
        </Link>
        <button
          className="round-button"
          onClick={() => setHelp(true)}
          aria-label="게임 방법"
        >
          ?
        </button>
      </header>
      <section className="title-row">
        <div>
          <p className="eyebrow">따끈한 행복을 굽는 시간</p>
          <h1>
            포잎이의 <span>붕어빵 가게</span>
          </h1>
          <p className="subtitle">작은 틀에서 시작하는, 나만의 달콤한 하루.</p>
        </div>
        <span className="day-stamp">
          DAY {String(shop.day).padStart(2, "0")}
          <small>{shop.mode === "open" ? "영업 중" : "골목의 작은 가게"}</small>
        </span>
      </section>
      <section className="stats" aria-label="영업 현황">
        <div>
          <span>오늘 매출</span>
          <strong>
            {shop.coins.toLocaleString()}
            <small> 원</small>
          </strong>
        </div>
        <div>
          <span>남은 영업 시간</span>
          <strong className={shop.time < 30 ? "urgent" : ""}>
            {Math.floor(Math.ceil(shop.time) / 60)}:
            {String(Math.ceil(shop.time) % 60).padStart(2, "0")}
          </strong>
        </div>
        <div>
          <span>행복한 손님</span>
          <strong>
            {shop.served}
            <small> 명</small>
          </strong>
        </div>
        <button
          className="pause"
          disabled={shop.mode !== "open"}
          onClick={() => setShop((s) => ({ ...s, paused: !s.paused }))}
        >
          {shop.paused ? "▶ 계속" : "Ⅱ 쉬기"}
        </button>
      </section>
      <div className="game-layout">
        <section className="stall" aria-label="붕어빵 가게">
          <div className="shop-awning">
            <span>🍀 포잎이네 · 갓 구운 붕어빵 🍀</span>
          </div>
          <div className="customers">
            <div className="queue-label">
              오늘도 찾아줘서 고마워요<span>{shop.orders.length} / 3</span>
            </div>
            <div className="customer-row">
              {shop.orders.map((o) => (
                <article className="customer" key={o.id}>
                  <div className="order-bubble">
                    <strong>
                      {o.red > 0 ? `팥 ${o.red}개` : ""}
                      {o.red > 0 && o.cream > 0 ? " + " : ""}
                      {o.cream > 0 ? `슈크림 ${o.cream}개` : ""}
                    </strong>
                    <span>부탁해요 ♡</span>
                  </div>
                  <div className="guest-face" aria-hidden="true">
                    {o.face}
                  </div>
                  <small>{o.name}</small>
                  <progress
                    value={o.patience}
                    max={o.max}
                    aria-label={`${o.name} 기다리는 시간`}
                  />
                  <button
                    disabled={!active || !canServe(shop, o)}
                    onClick={() => setShop((s) => serveOrder(s, o.id))}
                  >
                    {canServe(shop, o) ? "봉투 전달하기" : "굽는 중…"}
                  </button>
                </article>
              ))}
              {shop.orders.length === 0 && (
                <p className="empty-queue">
                  {shop.mode === "ready"
                    ? "곧 손님들이 찾아올 거예요."
                    : "다음 손님을 기다리는 중…"}
                  <span>🐾</span>
                </p>
              )}
            </div>
          </div>
          <div className="owner-area">
            <div className="chalkboard">
              오늘의 메뉴<strong>팥 · 슈크림</strong>
              <span>한 마리 700원</span>
              <i>정성은 듬뿍 ♡</i>
            </div>
            <div className="owner">
              <Image
                src={`/poipi/${shop.mood}.webp`}
                width={300}
                height={300}
                alt={`포잎이 사장님: ${names[shop.mood]}`}
                priority
                unoptimized
              />
              <span className="owner-label">사장님 포잎이</span>
            </div>
            <div className="tiny-plant" aria-hidden="true">
              🌱<span>행운이 자라는 가게</span>
            </div>
          </div>
          <div className="counter">
            <div className="counter-top">
              <span>지글지글, 행복을 굽고 있어요</span>
              <span>✦ HANDMADE WITH LOVE</span>
            </div>
            <div className="grill">
              {shop.slots.map((v, i) => {
                const cooking = v.stage === "front" || v.stage === "back";
                const burnt =
                  v.heat > 90 || (v.stage === "back" && v.front > 90);
                const label =
                  v.stage === "empty"
                    ? "반죽 붓기"
                    : v.stage === "batter"
                      ? `${flavor === "red" ? "팥" : "슈크림"} 넣기`
                      : burnt
                        ? "탄 빵 치우기"
                        : v.stage === "front"
                          ? "뒤집기"
                          : "꺼내기";
                return (
                  <button
                    className={`mold ${cooking ? "cooking" : ""} ${burnt ? "burnt" : ""}`}
                    key={i}
                    disabled={!active}
                    onClick={() => setShop((s) => actSlot(s, i, flavor))}
                    aria-label={`${i + 1}번 틀 ${label}`}
                  >
                    <span className="slot-number">0{i + 1}</span>
                    {v.stage === "empty" ? (
                      <div className="empty-fish">
                        <Fish color="#665c51" />
                      </div>
                    ) : (
                      <Fish
                        color={
                          v.stage === "batter"
                            ? "#f7e7b3"
                            : burnt
                              ? "#5b3929"
                              : v.heat < 45
                                ? "#f3d394"
                                : v.heat <= 75
                                  ? "#e9a946"
                                  : "#bb722e"
                        }
                      />
                    )}
                    <span className="slot-label">{label}</span>
                    {cooking ? (
                      <>
                        <div className="heat-track">
                          <span
                            style={{
                              left: `${Math.min(v.heat / 120, 1) * 100}%`,
                            }}
                          />
                        </div>
                        <small>
                          {v.flavor === "red" ? "팥" : "슈크림"} ·{" "}
                          {v.stage === "front" ? "앞면" : "뒷면"} ·{" "}
                          {burnt
                            ? "탔어요!"
                            : v.heat < 45
                              ? "조금 더"
                              : v.heat <= 75
                                ? "노릇노릇!"
                                : "곧 타요!"}
                        </small>
                      </>
                    ) : (
                      <small>
                        {v.stage === "empty"
                          ? "빈 틀을 톡 눌러요"
                          : "선택한 속을 넣어요"}
                      </small>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="heat-legend">
              <span>◌ 덜 익음</span>
              <span>● 초록 구간에 뒤집고 꺼내요</span>
              <span>● 90 넘으면 타요</span>
            </div>
          </div>
        </section>
        <aside className="side-panel">
          <section className="panel filling-panel">
            <p className="eyebrow">01 · 재료 고르기</p>
            <h2>어떤 속을 넣을까요?</h2>
            <div className="flavors">
              {(["red", "cream"] as Flavor[]).map((f) => (
                <button
                  key={f}
                  aria-pressed={flavor === f}
                  className={flavor === f ? "selected" : ""}
                  onClick={() => setFlavor(f)}
                >
                  <span>{f === "red" ? "🫘" : "🍮"}</span>
                  <strong>
                    {f === "red" ? "달콤한 팥" : "부드러운 슈크림"}
                  </strong>
                  <small>
                    {f === "red" ? "클래식한 겨울의 맛" : "한 입 가득 달콤함"}
                  </small>
                  {flavor === f && <b>✓</b>}
                </button>
              ))}
            </div>
            <p className="panel-note">
              빈 틀 → 반죽 → 속 넣기 → 뒤집기 → 꺼내기
            </p>
          </section>
          <section className="panel stock-panel">
            <p className="eyebrow">02 · 포장 준비</p>
            <h2>따끈한 붕어빵 바구니</h2>
            <div className="stock-row">
              <span>🫘 팥 붕어빵</span>
              <strong>
                {shop.stock.red}
                <small> 개</small>
              </strong>
            </div>
            <div className="stock-row">
              <span>🍮 슈크림 붕어빵</span>
              <strong>
                {shop.stock.cream}
                <small> 개</small>
              </strong>
            </div>
            <p className="panel-note">주문 수량이 모이면 손님에게 전달해요.</p>
          </section>
          <div className="message-box" role="status">
            <span>🍀 포잎이의 한마디</span>
            <p>{shop.message}</p>
          </div>
          <p className="best">
            나의 최고 매출 <strong>{best.toLocaleString()}원</strong>
          </p>
        </aside>
      </div>
      <footer className="shop-footer">
        작고 따뜻한 가게, 오늘도 당신 덕분에 문을 열어요. 🍀
      </footer>
      {(shop.mode === "ready" ||
        shop.mode === "closed" ||
        shop.paused ||
        help) && (
        <div className="modal-backdrop">
          <section
            className="welcome-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              help
                ? "게임 방법"
                : shop.paused
                  ? "잠시 쉬는 중"
                  : "포잎이의 붕어빵 가게"
            }
          >
            <Image
              src={`/poipi/${shop.mode === "closed" ? 3 : 1}.webp`}
              width={160}
              height={160}
              alt="포잎이 사장님"
              unoptimized
            />
            <p className="eyebrow">POIPI’S LITTLE SHOP</p>
            <h2>
              {help
                ? "처음 오셨나요?"
                : shop.paused
                  ? "잠깐, 쉬어가요"
                  : shop.mode === "closed"
                    ? "오늘도 수고했어요!"
                    : "포잎이네 오픈 준비 완료!"}
            </h2>
            {help ? (
              <div className="instructions">
                <p>① 빈 틀을 눌러 반죽을 부어요.</p>
                <p>② 팥 / 슈크림을 고른 뒤 같은 틀을 다시 눌러요.</p>
                <p>③ 초록 구간에 뒤집고, 뒷면도 구워 꺼내요.</p>
                <p>④ 바구니에 주문 수량이 모이면 손님에게 전달!</p>
                <small>
                  노릇한 구간은 45~75, 90을 넘으면 타요. 덜 익은 빵은 판매할 수
                  없어요. 쉬기 버튼으로 시간을 멈출 수 있어요.
                </small>
              </div>
            ) : shop.mode === "closed" ? (
              <>
                <div className="receipt">
                  <span>DAY {shop.day} 영업 일지</span>
                  <strong>{shop.coins.toLocaleString()}원</strong>
                  <p>
                    판매 {shop.served}건 · 팁 {shop.tips.toLocaleString()}원
                  </p>
                  <p>
                    놓친 손님 {shop.lost}명 · 태운 빵 {shop.burnt}개
                  </p>
                </div>
                <p>다음 날에는 손님들이 조금 더 빨리 찾아와요.</p>
              </>
            ) : (
              <p>
                {shop.paused
                  ? "손님도 붕어빵도 기다리고 있어요."
                  : "150초 동안 손님에게 따끈한 붕어빵을 구워주세요."}
              </p>
            )}
            <button
              className="primary-button"
              onClick={() => {
                if (help) {
                  setHelp(false);
                  return;
                }
                if (shop.paused) {
                  setShop((s) => ({ ...s, paused: false }));
                  return;
                }
                setShop(
                  openShop(newShop(shop.mode === "closed" ? shop.day + 1 : 1)),
                );
              }}
            >
              {help
                ? "알겠어요!"
                : shop.paused
                  ? "다시 굽기"
                  : shop.mode === "closed"
                    ? "다음 날 영업하기 →"
                    : "가게 문 열기 →"}
            </button>
            {shop.mode === "closed" && !help && (
              <button
                className="text-button"
                onClick={() => setShop(newShop())}
              >
                첫날부터 다시 하기
              </button>
            )}
            {shop.mode === "ready" && !help && (
              <button className="text-button" onClick={() => setHelp(true)}>
                게임 방법 먼저 보기
              </button>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
