const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
const vm = require("node:vm");
const exports_ = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("src/lib/shop.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: exports_ },
);
const { newShop, openShop, tickShop, actSlot, serveOrder } = exports_;
function bake(s, index = 0, flavor = "red", seconds = 4.5) {
  s = actSlot(s, index, flavor);
  s = actSlot(s, index, flavor);
  s = tickShop(s, seconds);
  s = actSlot(s, index, flavor);
  s = tickShop(s, seconds);
  return actSlot(s, index, flavor);
}
test("cook both sides, fulfill an order once, and award payment", () => {
  let s = bake(openShop(newShop()));
  assert.equal(s.stock.red, 1);
  s = serveOrder(s, 1);
  assert.equal(s.stock.red, 0);
  assert.equal(s.served, 1);
  assert.ok(s.coins > 700);
  assert.equal(serveOrder(s, 1).coins, s.coins);
});
test("undercooked and burned fish never enter sale inventory", () => {
  let s = bake(openShop(newShop()), 0, "red", 1);
  assert.equal(s.stock.red, 0);
  s = bake(openShop(newShop()), 0, "cream", 8);
  assert.equal(s.stock.cream, 0);
  assert.equal(s.burnt, 1);
});
test("parallel molds cook independently and flavor stays attached", () => {
  let s = openShop(newShop());
  s = actSlot(actSlot(s, 0, "red"), 0, "red");
  s = tickShop(s, 2);
  s = actSlot(actSlot(s, 1, "cream"), 1, "cream");
  s = tickShop(s, 2);
  assert.equal(s.slots[0].heat, 52);
  assert.equal(s.slots[1].heat, 26);
  assert.equal(s.slots[0].flavor, "red");
  assert.equal(s.slots[1].flavor, "cream");
});
test("pause and closed day freeze clock and reject actions", () => {
  let s = { ...openShop(newShop()), paused: true };
  assert.equal(tickShop(s, 4), s);
  assert.equal(actSlot(s, 0, "red"), s);
  s = tickShop({ ...s, paused: false, time: 0.1 }, 1);
  assert.equal(s.mode, "closed");
  assert.equal(actSlot(s, 0, "red"), s);
});
test("expired guests leave, incomplete orders cannot sell, queue stays capped", () => {
  let s = openShop(newShop());
  assert.equal(serveOrder(s, 1), s);
  for (let i = 0; i < 90; i++) s = tickShop(s, 1);
  assert.ok(s.lost > 0);
  assert.ok(s.orders.length <= 3);
});
