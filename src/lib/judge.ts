export type Verdict = {
  title: string;
  line: string;
  score: number;
};

// golden zone for each side is 55 ~ 75
export function sideLabel(d: number) {
  if (d < 45) return "덜 익음";
  if (d < 55) return "노릇 직전";
  if (d <= 75) return "황금빛";
  if (d <= 90) return "진한 갈색";
  return "탐";
}

export function judge(fill: number, dA: number, dB: number): Verdict {
  let pour: "burst" | "wing" | "good" | "low" | "short";
  let pourPts: number;

  if (fill > 112) {
    pour = "burst";
    pourPts = 8;
  } else if (fill > 100) {
    pour = "wing";
    pourPts = 36;
  } else if (fill >= 88) {
    pour = "good";
    pourPts = 40;
  } else if (fill >= 75) {
    pour = "low";
    pourPts = 28;
  } else {
    pour = "short";
    pourPts = 15;
  }

  const sidePts = (d: number) => Math.max(0, 30 - Math.abs(d - 65));
  const score = Math.round(pourPts + sidePts(dA) + sidePts(dB));
  const golden = (d: number) => d >= 55 && d <= 75;

  // order matters: the worst problem wins the title
  if (pour === "burst") {
    return { score, title: "반죽 터진 붕어빵", line: "틀 밖으로 탈출한 반죽… 그래도 먹을 순 있어요." };
  }
  if (dA > 90 || dB > 90) {
    return { score, title: "새까만 붕어빵", line: "숯 향 가득. 겨울밤 손난로로는 합격." };
  }
  if (dA < 45 || dB < 45) {
    return { score, title: "덜 익은 붕어빵", line: "아직 반죽이 출렁출렁. 조금만 더 기다려줘요." };
  }
  if (pour === "short") {
    return { score, title: "꼬리 없는 붕어빵", line: "꼬리는 어디 갔을까. 머리부터 먹는 파는 오히려 좋아." };
  }
  if (golden(dA) && golden(dB) && pour === "wing") {
    return { score, title: "날개 달린 황금 붕어빵", line: "바삭한 날개까지. 사장님 몰래 먹는 그 맛." };
  }
  if (golden(dA) && golden(dB) && pour === "good") {
    return { score, title: "황금 붕어빵", line: "이 정도면 노점 사장님이 스카우트하러 와요." };
  }
  if (pour === "wing") {
    return { score, title: "날개 달린 붕어빵", line: "반죽 조금 넘친 게 오히려 이득." };
  }
  return { score, title: "동네 붕어빵", line: "딱 천 원어치의 행복." };
}
