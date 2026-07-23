#!/usr/bin/env node
"use strict";

const assert = require("assert");
const model = require("../field-generator-model.js");
const math = require("./puck-luck-layout-modes.js");

assert.deepStrictEqual(model.LINE_COUNTS, [5, 6, 7, 8, 9, 10]);
assert.deepStrictEqual(model.CELL_STATES, ["empty", "low", "middle", "high", "ex_multi"]);
assert.strictEqual(model.cycleCellState(0), 1);
assert.strictEqual(model.cycleCellState(1), 2);
assert.strictEqual(model.cycleCellState(2), 3);
assert.strictEqual(model.cycleCellState(3), 4);
assert.strictEqual(model.cycleCellState(4), 0);

const layouts = model.emptyLayouts();
for (const lines of model.LINE_COUNTS) {
  assert.strictEqual(layouts[lines].length, lines * lines);
  assert.ok(layouts[lines].every((state) => state === 0));
}

layouts[5][0] = 1;
layouts[5][1] = 2;
layouts[5][2] = 3;
layouts[5][3] = 4;
const snapshot = model.createSnapshot(1, layouts, 5, "2026-07-15T00:00:00.000Z");
assert.strictEqual(snapshot.id, 1);
assert.deepStrictEqual(model.countStates(snapshot.layouts[5]), {
  empty: 21,
  low: 1,
  middle: 1,
  high: 1,
  ex_multi: 1
});

const mergedLayouts = Array(25).fill(0);
[0, 1, 5, 6].forEach((index) => { mergedLayouts[index] = 2; });
[3, 4, 8, 9].forEach((index) => { mergedLayouts[index] = 4; });
assert.deepStrictEqual(model.findMergedBlocks(mergedLayouts, 5), [
  { row: 0, column: 0, state: 2, indexes: [0, 1, 5, 6] },
  { row: 0, column: 3, state: 4, indexes: [3, 4, 8, 9] }
]);
assert.deepStrictEqual(model.findMergedBlocks(Array(25).fill(0), 5), []);

layouts[5][0] = 0;
assert.strictEqual(snapshot.layouts[5][0], 1, "saved snapshot is immutable from draft mutations");

const store = model.normalizeStore({ nextId: 1, selectedLine: 9, layouts, configurations: [snapshot] });
assert.strictEqual(store.nextId, 2);
assert.strictEqual(store.selectedLine, 9);
assert.strictEqual(store.configurations.length, 1);
assert.strictEqual(store.configurations[0].layouts[5][0], 1);

const legacyStore = model.normalizeStore({
  version: 1,
  selectedLine: 5,
  layouts: { 5: [0, 1, 2, 3] },
  configurations: []
});
assert.deepStrictEqual(legacyStore.layouts[5].slice(0, 4), [0, 1, 2, 3]);
assert.strictEqual(legacyStore.version, 2);

for (const lines of model.LINE_COUNTS) {
  const config = math.getConfiguration(math.riskForLines(lines), lines, 1, math.CONFIGURATOR_LAYOUT_MODE);
  const referenceCells = math.FIELD_CONFIGURATION_1.layouts[lines];
  const budget = model.calculateWeightBudget({
    cells: referenceCells,
    referenceCells,
    lines,
    multipliers: {
      low: config.multiplier_table.outer,
      middle: config.multiplier_table.middle,
      high: config.multiplier_table.center
    },
    puckRadius: config.puck_radius,
    multiPlusProbability: config.multi_plus.probability,
    targetRtp: math.TARGET_RTP
  });
  assert.ok(Math.abs(budget.percent - 100) < 1e-10, `${lines} reference field budget`);
  assert.ok(Math.abs(budget.estimatedRtp - math.TARGET_RTP) < 1e-12, `${lines} estimated RTP`);
  assert.ok(budget.weights.low < budget.weights.middle, `${lines} low < middle weight`);
  assert.ok(budget.weights.middle < budget.weights.high, `${lines} middle < high weight`);
  assert.ok(budget.weights.ex_multi < budget.weights.middle, `${lines} EX MULTI weighted by activation`);
  assert.strictEqual(budget.level, "yellow", `${lines} reference is in target zone`);

  const overBudgetCells = [...referenceCells];
  const emptyIndex = overBudgetCells.findIndex((state) => state === 0);
  overBudgetCells[emptyIndex] = 3;
  const overBudget = model.calculateWeightBudget({
    cells: overBudgetCells,
    referenceCells,
    lines,
    multipliers: {
      low: config.multiplier_table.outer,
      middle: config.multiplier_table.middle,
      high: config.multiplier_table.center
    },
    puckRadius: config.puck_radius,
    multiPlusProbability: config.multi_plus.probability,
    targetRtp: math.TARGET_RTP
  });
  assert.ok(overBudget.percent > 100, `${lines} extra premium cell exceeds budget`);
  assert.strictEqual(overBudget.level, "red", `${lines} over budget level`);
}

console.log("BalloroX field generator model: PASS");
