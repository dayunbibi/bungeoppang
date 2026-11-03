export type FillingKey = "red" | "cream" | "pizza" | "sweet";

export type Filling = {
  name: string;
  type: string; // fun label shown on the result card
  color: string;
};

export const FILLINGS: Record<FillingKey, Filling> = {
  red: { name: "팥", type: "정통파", color: "#4b1e1c" },
  cream: { name: "슈크림", type: "달달파", color: "#f4d47c" },
  pizza: { name: "피자", type: "모험가", color: "#d6452b" },
  sweet: { name: "고구마", type: "겨울감성", color: "#e9a23b" },
};

export const FILLING_KEYS = Object.keys(FILLINGS) as FillingKey[];
