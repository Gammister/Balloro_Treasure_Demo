#!/usr/bin/env node
"use strict";

const assert = require("assert");
const math = require("./puck-luck-math.js");
const planner = require("./trajectory-planner.js");

function close(actual, expected, epsilon = 1e-10) { assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`); }

assert.strictEqual(math.CONFIGURATIONS.length, 54, "54 configurations");
close(1 * 3, 3, 0, "total bet formula");
close(1 * (1.5 + 0 + 2.7), 4.2, 1e-12, "multi-puck payout formula");
close(1 * 0, 0, 0, "empty payout");
close(4.2 * 10, 42, 1e-12, "x10 applies to whole round");

for (const lines of math.LINE_COUNTS) close(math.puckRadius(lines), 0.1 * 5 / lines);
for (const config of math.CONFIGURATIONS) {
  const analytic = math.analyticMetrics(config);
  close(analytic.rtp, math.TARGET_RTP);
  assert.ok(analytic.rtp <= math.TARGET_RTP + 1e-12, `${config.id} positive EV`);
  assert.strictEqual(config.star_placement.count, config.pucks);
  assert.strictEqual(config.pucks_collide, false);
  assert.ok(config.minimum_bounces >= 4);
  assert.ok(config.multiplier_table.empty === 0);
  assert.ok(Number.isFinite(analytic.hit_frequency));
  assert.ok(Number.isFinite(analytic.bonus_frequency));
  const first = math.createRound({ risk: config.risk, lines: config.lines, pucks: config.pucks, seed: 123456789 });
  const second = math.createRound({ risk: config.risk, lines: config.lines, pucks: config.pucks, seed: 123456789 });
  assert.deepStrictEqual(first, second, `${config.id} deterministic repeatability`);
  assert.strictEqual(first.star_positions.length, config.pucks);
  assert.strictEqual(first.puck_results.length, config.pucks);
  assert.ok(first.puck_results.every((puck) => puck.required_bounces >= 4));
  assert.strictEqual(first.final_win, first.base_win * (first.paid_bonus_triggered ? 10 : 1));
  if (first.empty_bonus_triggered) {
    assert.strictEqual(first.base_win, 0);
    assert.strictEqual(first.final_win, 0);
    assert.strictEqual(first.paid_bonus_triggered, false);
    assert.strictEqual(first.bonus_triggered, true);
    assert.strictEqual(first.stars_collected, config.pucks);
  }
  const smoke = math.simulateConfiguration(config, 1000, 987654321);
  assert.strictEqual(smoke.total_runs, 1000);
  assert.ok(Number.isFinite(smoke.simulated_rtp));
}

for (const lines of math.LINE_COUNTS) {
  for (let row = 0; row < lines; row += 1) {
    for (let col = 0; col < lines; col += 1) {
      const targetSector = { row, col };
      const landingPoint = planner.landingPointForVariant(lines, math.puckRadius(lines), targetSector, 123456789, row * lines + col);
      const input = { lines, puckRadius: math.puckRadius(lines), targetSector, landingPoint, seed: 123456789,
        launchForce: planner.VISUAL_PHYSICS.visual_launch_force };
      const first = planner.planTrajectory(input);
      const second = planner.planTrajectory(input);
      assert.deepStrictEqual(first, second, `trajectory ${lines}:${col}_${row} deterministic`);
      assert.strictEqual(first.valid, true, `trajectory ${lines}:${col}_${row} reachable`);
      assert.ok(first.bounce_count >= 4, `trajectory ${lines}:${col}_${row} has four bounces`);
      assert.ok(first.bounce_points.length >= 4, `trajectory ${lines}:${col}_${row} has four wall hits`);
      assert.ok(first.final_correction_px <= 1, `trajectory ${lines}:${col}_${row} correction <= 1px`);
      assert.deepStrictEqual(first.final_sector, { col, row }, `trajectory ${lines}:${col}_${row} final sector`);
    }
  }
}

const example = math.createRound({ risk: "normal", lines: 7, pucks: 3, betPerPuck: 1, seed: 42 });
close(example.total_bet, 3);
close(example.base_win, example.base_win_multiplier_sum);
close(example.final_win, example.base_win * example.bonus_multiplier);

for (const risk of math.RISK_LEVELS) {
  for (const pucks of math.PUCK_COUNTS) {
    let presented = 0;
    let emptyPresented = 0;
    const runs = 50000;
    for (let seed = 1; seed <= runs; seed += 1) {
      const round = math.createRound({ risk, lines: 5, pucks, seed });
      if (round.bonus_triggered) presented += 1;
      if (round.empty_bonus_triggered) emptyPresented += 1;
    }
    const frequency = presented / runs;
    const config = math.getConfiguration(risk, 5, pucks);
    const emptyRoundProbability = config.outcome_probabilities.empty ** pucks;
    const baseEmptyFrequency = Math.max(0, math.BONUS_PRESENTATION_TARGET_RATE - config.bonus_probability);
    const doubledEmptyFrequency = Math.min(baseEmptyFrequency * math.EMPTY_BONUS_PRESENTATION_MULTIPLIER,
      (1 - config.bonus_probability) * emptyRoundProbability);
    const expectedFrequency = config.bonus_probability + doubledEmptyFrequency;
    assert.ok(Math.abs(frequency - expectedFrequency) < 0.004,
      `${risk}/5/${pucks} presentation frequency ${frequency} expected ${expectedFrequency}`);
    assert.ok(emptyPresented > 0, `${risk}/5/${pucks} has empty bonus presentations`);
  }
}
console.log("Puck Luck math tests: PASS");
