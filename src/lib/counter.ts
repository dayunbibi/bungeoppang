// "오늘 구운 붕어빵 n개" — stored per browser, resets every day
const KEY = "bungeo";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function getTodayCount() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    return saved.day === today() ? (saved.n as number) : 0;
  } catch {
    return 0;
  }
}

export function bumpTodayCount() {
  const n = getTodayCount() + 1;
  try {
    localStorage.setItem(KEY, JSON.stringify({ day: today(), n }));
  } catch {
    // private mode etc. — not a big deal
  }
  return n;
}
