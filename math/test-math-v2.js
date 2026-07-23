#!/usr/bin/env node
"use strict";

const assert = require("assert");
const oldMath = require("./puck-luck-math.js");
const math = require("./puck-luck-math-v2.js");

assert.strictEqual(math.CONFIGURATIONS.length, 54);
assert.strictEqual(math.TARGET_RTP, 0.9745);
assert.strictEqual(math.EMPTY_BONUS_PRESENTATION_MULTIPLIER, 4);
assert.strictEqual(math.BONUS_FREQUENCY_MULTIPLIER, 2.5);
assert.strictEqual(math.ONE_OF_TWO_STAR_PROBABILITY, 0.85);
assert.strictEqual(math.TWO_OF_THREE_STAR_PROBABILITY, 0.85);

const partialRngTwo = math.createRng(20260627);
let oneStarRounds = 0;
const oneStarSamples = 30000;
for (let index = 0; index < oneStarSamples; index += 1) {
  if (math.samplePartialStarCount(partialRngTwo, 2) === 1) oneStarRounds += 1;
}
assert.ok(Math.abs(oneStarRounds / oneStarSamples - 0.85) < 0.015, "two-puck partial star frequency");
const partialRngThree = math.createRng(20260628);
let twoStarRounds = 0;
const partialSamples = 30000;
for (let index = 0; index < partialSamples; index += 1) {
  if (math.samplePartialStarCount(partialRngThree, 3) === 2) twoStarRounds += 1;
}
assert.ok(Math.abs(twoStarRounds / partialSamples - 0.85) < 0.015, "three-puck partial star frequency");

function cellSet(sectors) { return new Set(sectors.map((sector) => `${sector.col}_${sector.row}`)); }

for (const lines of math.LINE_COUNTS) {
  const sectors = math.buildSectorDefinitions(lines);
  const expectedCenterCount = lines % 2 === 0 ? 4 : 1;
  assert.strictEqual(sectors.center.length, expectedCenterCount, `${lines} center count`);
  const expectedCenterIndices = lines % 2 === 0 ? [lines / 2 - 1, lines / 2] : [Math.floor(lines / 2)];
  const expectedCenters = new Set();
  for (const row of expectedCenterIndices) for (const col of expectedCenterIndices) expectedCenters.add(`${col}_${row}`);
  assert.deepStrictEqual(cellSet(sectors.center), expectedCenters, `${lines} geometric center zone`);

  const categoryByCell = new Map();
  for (const [category, cells] of Object.entries(sectors)) cells.forEach((cell) => {
    if (cell.index >= 0) categoryByCell.set(`${cell.col}_${cell.row}`, category);
  });
  for (const [key, category] of categoryByCell) {
    const [col, row] = key.split("_").map(Number);
    const mirrors = [`${lines - 1 - col}_${row}`, `${col}_${lines - 1 - row}`, `${lines - 1 - col}_${lines - 1 - row}`];
    mirrors.forEach((mirror) => assert.strictEqual(categoryByCell.get(mirror), category, `${lines} symmetry ${key}/${mirror}`));
  }
}

for (const config of math.CONFIGURATIONS) {
  const analytic = math.analyticMetrics(config);
  assert.ok(Math.abs(analytic.rtp - math.TARGET_RTP) < 1e-12, `${config.id} RTP`);
  assert.ok(config.paid_bonus_win_frequency_multiplier >= 2, `${config.id} paid bonus win frequency`);
  assert.ok(config.multiplier_table.empty === 0);
  assert.ok(config.multiplier_table.outer < config.multiplier_table.middle);
  assert.ok(config.multiplier_table.middle < config.multiplier_table.center);
  assert.ok(config.sector_definitions.center.length === (config.lines % 2 === 0 ? 4 : 1));
  const repeated = math.createRound({ risk: config.risk, lines: config.lines, pucks: config.pucks, seed: 123456 });
  const repeatedAgain = math.createRound({ risk: config.risk, lines: config.lines, pucks: config.pucks, seed: 123456 });
  assert.deepStrictEqual(repeated, repeatedAgain, `${config.id} deterministic`);
  assert.strictEqual(repeated.final_win, repeated.base_win * (repeated.paid_bonus_triggered ? 10 : 1));
  const emptyRoundProbability = config.outcome_probabilities.empty ** config.pucks;
  const baseEmptyBonusChance = Math.max(0,
    (math.BONUS_PRESENTATION_TARGET_RATE - config.base_bonus_probability)
    / ((1 - config.bonus_probability) * emptyRoundProbability)
  );
  assert.ok(
    Math.abs(repeated.empty_bonus_chance - Math.min(1, baseEmptyBonusChance * 4)) < 1e-12,
    `${config.id} doubled empty bonus presentation`
  );
}

for (const lines of math.LINE_COUNTS) for (const pucks of math.PUCK_COUNTS) {
  const low = math.getConfiguration("low", lines, pucks);
  const normal = math.getConfiguration("normal", lines, pucks);
  const high = math.getConfiguration("high", lines, pucks);
  assert.ok(high.multiplier_table.center > normal.multiplier_table.center, `${lines}/${pucks} high > normal center`);
  assert.ok(normal.multiplier_table.center > low.multiplier_table.center, `${lines}/${pucks} normal > low center`);
  assert.ok(high.multiplier_table.center > normal.multiplier_table.middle, `${lines}/${pucks} high center > normal middle`);
}

for (const risk of math.RISK_LEVELS) {
  const current = math.analyticMetrics(math.getConfiguration(risk, 5, 1));
  const previous = oldMath.analyticMetrics(oldMath.getConfiguration(risk, 5, 1));
  if (risk !== "low") assert.ok(current.hit_frequency > previous.hit_frequency, `${risk} hit frequency improves`);
  if (risk === "high") assert.ok(current.max_win_multiplier < previous.max_win_multiplier, `${risk} max win reduced`);
}

const lowOne = math.analyticMetrics(math.getConfiguration("low", 5, 1));
const normalOne = math.analyticMetrics(math.getConfiguration("normal", 5, 1));
const highOne = math.analyticMetrics(math.getConfiguration("high", 5, 1));
assert.ok(lowOne.hit_frequency >= 0.57 && lowOne.hit_frequency <= 0.70);
assert.ok(lowOne.win_above_bet_frequency >= 0.45 && lowOne.win_above_bet_frequency <= 0.65);
assert.ok(normalOne.hit_frequency >= 0.45 && normalOne.hit_frequency <= 0.60);
assert.ok(normalOne.win_above_bet_frequency >= 0.20 && normalOne.win_above_bet_frequency <= 0.45);
assert.ok(highOne.max_win_multiplier >= 80 && highOne.max_win_multiplier <= 120);

console.log("Puck Luck Reduced Volatility V2 tests: PASS (54 configurations, layouts 5-10)");
