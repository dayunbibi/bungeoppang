export type Flavor = "red" | "cream";
export type Slot = {
  stage: "empty" | "batter" | "front" | "back";
  flavor: Flavor | null;
  heat: number;
  front: number;
};
export type Order = {
  id: number;
  name: string;
  face: string;
  red: number;
  cream: number;
  patience: number;
  max: number;
};
export type Shop = {
  mode: "ready" | "open" | "closed";
  paused: boolean;
  day: number;
  time: number;
  coins: number;
  tips: number;
  served: number;
  lost: number;
  burnt: number;
  slots: Slot[];
  stock: Record<Flavor, number>;
  orders: Order[];
  nextId: number;
  spawn: number;
  mood: number;
  moodTime: number;
  message: string;
};
export const emptySlot = (): Slot => ({
  stage: "empty",
  flavor: null,
  heat: 0,
  front: 0,
});
const guests = [
  ["토끼 손님", "🐰"],
  ["곰돌이 손님", "🐻"],
  ["여우 손님", "🦊"],
  ["햄스터 손님", "🐹"],
  ["고양이 손님", "🐱"],
];
export function createOrder(id: number, day: number): Order {
  const [name, face] = guests[(id - 1) % guests.length];
  const red = id % 3 === 0 ? 0 : id % 4 === 0 ? 2 : 1;
  const cream = id % 3 === 0 ? 2 : id % 2 === 0 ? 1 : 0;
  const max = Math.max(32, 56 - day * 2);
  return { id, name, face, red, cream, patience: max, max };
}
export function newShop(day = 1): Shop {
  return {
    mode: "ready",
    paused: false,
    day,
    time: 150,
    coins: 0,
    tips: 0,
    served: 0,
    lost: 0,
    burnt: 0,
    slots: Array.from({ length: 4 }, emptySlot),
    stock: { red: 0, cream: 0 },
    orders: [],
    nextId: 1,
    spawn: 0,
    mood: 1,
    moodTime: 0,
    message: "포잎이의 첫 영업을 함께해요!",
  };
}
export function openShop(s: Shop): Shop {
  return {
    ...s,
    mode: "open",
    orders: [createOrder(1, s.day)],
    nextId: 2,
    spawn: 9,
    message: "첫 손님이에요! 빈 틀을 눌러 반죽을 부어요.",
  };
}
export function tickShop(s: Shop, dt: number): Shop {
  if (s.mode !== "open" || s.paused) return s;
  const slots = s.slots.map((v) =>
    v.stage === "front" || v.stage === "back"
      ? { ...v, heat: Math.min(120, v.heat + dt * 13) }
      : v,
  );
  const expired = s.orders.filter((o) => o.patience <= dt).length;
  let orders = s.orders
    .filter((o) => o.patience > dt)
    .map((o) => ({ ...o, patience: o.patience - dt }));
  let nextId = s.nextId,
    spawn = s.spawn - dt;
  if (spawn <= 0 && orders.length < 3) {
    orders = [...orders, createOrder(nextId++, s.day)];
    spawn = Math.max(6, 11 - s.day);
  }
  const time = Math.max(0, s.time - dt),
    moodTime = Math.max(0, s.moodTime - dt);
  return {
    ...s,
    slots,
    orders,
    nextId,
    spawn,
    time,
    mode: time === 0 ? "closed" : "open",
    lost: s.lost + expired,
    mood: expired ? 4 : moodTime === 0 ? 1 : s.mood,
    moodTime: expired ? 2.5 : moodTime,
    message: expired ? "손님이 돌아갔어요. 다음 주문을 준비해봐요!" : s.message,
  };
}
export function actSlot(s: Shop, index: number, flavor: Flavor): Shop {
  if (s.mode !== "open" || s.paused) return s;
  const v = s.slots[index];
  if (!v) return s;
  let slot: Slot,
    message: string,
    mood = 2,
    burnt = s.burnt,
    stock = s.stock;
  if (v.stage === "empty") {
    slot = { ...emptySlot(), stage: "batter" };
    message = "반죽 쏙! 한 번 더 누르면 선택한 속이 들어가요.";
  } else if (v.stage === "batter") {
    slot = { ...v, stage: "front", flavor };
    message = `${flavor === "red" ? "팥" : "슈크림"} 굽는 중! 초록 구간에서 뒤집어요.`;
  } else if (v.heat > 90 || (v.stage === "back" && v.front > 90)) {
    slot = emptySlot();
    burnt++;
    mood = 4;
    message = "앗, 타버렸어요! 틀을 비웠으니 다시 도전해요.";
  } else if (v.stage === "front") {
    slot = { ...v, stage: "back", front: v.heat, heat: 0 };
    message = "휙! 뒷면도 초록 구간까지 구워요.";
  } else if (v.heat < 45 || v.front < 45) {
    slot = emptySlot();
    mood = 4;
    message = "아직 덜 익었어요. 다음엔 양쪽 모두 조금 더 구워요!";
  } else {
    slot = emptySlot();
    stock = { ...stock, [v.flavor!]: stock[v.flavor!] + 1 };
    message = "노릇노릇 완성! 주문이 준비되면 손님의 전달 버튼을 눌러요.";
    mood = 3;
  }
  return {
    ...s,
    slots: s.slots.map((a, i) => (i === index ? slot : a)),
    stock,
    burnt,
    message,
    mood,
    moodTime: 2.5,
  };
}
export function canServe(s: Shop, o: Order) {
  return s.stock.red >= o.red && s.stock.cream >= o.cream;
}
export function serveOrder(s: Shop, id: number): Shop {
  const o = s.orders.find((v) => v.id === id);
  if (s.mode !== "open" || s.paused || !o || !canServe(s, o)) return s;
  const tip = Math.round((300 * o.patience) / o.max / 10) * 10;
  return {
    ...s,
    orders: s.orders.filter((v) => v.id !== id),
    stock: { red: s.stock.red - o.red, cream: s.stock.cream - o.cream },
    coins: s.coins + (o.red + o.cream) * 700 + tip,
    tips: s.tips + tip,
    served: s.served + 1,
    mood: 5,
    moodTime: 2.5,
    message: `맛있게 드세요! 판매 완료 · 팁 +${tip}원`,
  };
}
