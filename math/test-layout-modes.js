#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const math = require("./puck-luck-layout-modes.js");
const planner = require("./trajectory-planner.js");

const pocketLibrary = JSON.parse(fs.readFileSync(
  `${__dirname}/../MathOutput/puck_luck_secret_room_trajectories.json`, "utf8"
));
const trajectoryStats = JSON.parse(fs.readFileSync(
  `${__dirname}/../MathOutput/puck_luck_trajectory_library_stats.json`, "utf8"
));

function cellKey(cell) { return `${cell.col}_${cell.row}`; }
function categoryFor(config, col, row) {
  return Object.entries(config.sector_definitions)
    .find(([, sectors]) => sectors.some((sector) => sector.col === col && sector.row === row))?.[0];
}
function dihedralKeys(col, row, lines) {
  const last = lines - 1;
  return new Set([
    `${col}_${row}`, `${last - col}_${row}`, `${col}_${last - row}`, `${last - col}_${last - row}`,
    `${row}_${col}`, `${last - row}_${col}`, `${row}_${last - col}`, `${last - row}_${last - col}`
  ]);
}
function sumResult(result) {
  if (!result.secret_room) return result.multiplier;
  return result.release_results.reduce((sum, child) => sum + sumResult(child), 0);
}
function validateResultTree(result, config) {
  if (!result.secret_room) {
    const sector = config.sector_definitions[result.category]
      ?.find((candidate) => cellKey(candidate) === cellKey(result.sector));
    assert.strictEqual(result.multiplier, sector?.multiplier ?? config.multiplier_table[result.category]);
    assert.ok(sector
      || (result.category === "multi_plus"
        && config.multi_plus.sectors.some((sector) => cellKey(sector) === cellKey(result.sector))));
    return;
  }
  assert.strictEqual(result.multiplier, 0);
  assert.strictEqual(result.release_results.length, math.POCKET_RELEASE_COUNT);
  const pocket = math.secretRoomPocket(config.lines, result.secret_zone_id);
  assert.strictEqual(result.secret_pocket.x, pocket.x);
  assert.strictEqual(result.secret_pocket.y, pocket.y);
  result.release_results.forEach((child) => {
    assert.strictEqual(child.release_generation, result.release_generation + 1);
    validateResultTree(child, config);
  });
}
function firstArmedPocketCapture(frames, pocket, radius) {
  let armed = Math.hypot(frames[0][1] - pocket.x, frames[0][2] - pocket.y) > radius;
  for (let index = 1; index < frames.length; index += 1) {
    if (!armed) {
      if (Math.hypot(frames[index][1] - pocket.x, frames[index][2] - pocket.y) > radius) armed = true;
      continue;
    }
    const progress = planner.segmentCircleFirstIntersection(frames[index - 1], frames[index], pocket, radius);
    if (progress !== null) return { index, progress };
  }
  return null;
}

assert.strictEqual(math.TARGET_RTP, 0.9745);
assert.strictEqual(math.CONFIGURATIONS.length, 144);
assert.strictEqual(math.SESSION_EVENT_MIN_PROBABILITY, 0.025);
assert.strictEqual(math.EMPTY_BONUS_PRESENTATION_MULTIPLIER, 0);
assert.strictEqual(math.BONUS_WIN_PROBABILITY_LIFT, 0.07);
assert.strictEqual(math.DUAL_BONUS_WIN_PROBABILITY_LIFT, 0.09);
assert.strictEqual(math.POCKET_RELEASE_COUNT, 3);
assert.deepStrictEqual(math.POCKET_HIT_PROBABILITIES,
  { 5: 0.045, 6: 0.042, 7: 0.038, 8: 0.034, 9: 0.03, 10: 0.026 });
assert.deepStrictEqual(math.BONUS_REPOCKET_PROBABILITIES, { 1: 0.035, 2: 0.006 });
assert.ok(math.bonusRepocketProbability(1) > math.bonusRepocketProbability(2));
assert.strictEqual(math.bonusRepocketProbability(3), 0);

const expectedPocketCoordinates = {
  top: [-1, -1], right: [1, -1], bottom: [1, 1], left: [-1, 1]
};
for (const lines of math.LINE_COUNTS) {
  for (const [zoneId, [x, y]] of Object.entries(expectedPocketCoordinates)) {
    const pocket = math.secretRoomPocket(lines, zoneId);
    assert.strictEqual(pocket.x, x);
    assert.strictEqual(pocket.y, y);
  }
  const oneBallConfig = math.getConfiguration("ignored", lines, 1, "dynamic_diagonal_width");
  assert.ok(oneBallConfig.bonus_probability >= math.SESSION_EVENT_MIN_PROBABILITY);
  assert.ok(oneBallConfig.multi_plus.probability >= math.SESSION_EVENT_MIN_PROBABILITY);
  assert.ok(1 - (1 - oneBallConfig.pocket.hit_probability_per_puck) ** 150 > 0.98,
    `${lines} lines exposes a pocket in a 150-round session`);
  assert.ok(1 - (1 - oneBallConfig.bonus_probability) ** 150 > 0.97,
    `${lines} lines exposes x10 in a 150-round session`);
  assert.ok(1 - (1 - oneBallConfig.multi_plus.probability) ** 150 > 0.97,
    `${lines} lines exposes EX MULTI in a 150-round session`);
}

for (const config of math.CONFIGURATIONS) {
  const metrics = math.analyticMetrics(config);
  assert.ok(Math.abs(config.calculated_rtp - math.TARGET_RTP) < 1e-12, `${config.id} solved RTP`);
  assert.ok(Math.abs(metrics.rtp - math.TARGET_RTP) < 1e-12, `${config.id} analytic RTP`);
  assert.strictEqual(config.secret_room, config.pocket);
  assert.strictEqual(config.pocket.multiplier, 0);
  assert.strictEqual(config.pocket.release_count, 3);
  assert.ok(config.solver.calibrated_hit_probability > 0
    && config.solver.calibrated_hit_probability < 1, `${config.id} hit probability`);
  const probabilitySum = Object.values(config.outcome_probabilities).reduce((sum, value) => sum + value, 0);
  const multiProbabilitySum = Object.values(config.multi_plus.outcome_probabilities)
    .reduce((sum, value) => sum + value, 0);
  const bonusProbabilitySum = Object.values(config.bonus_outcome_probabilities)
    .reduce((sum, value) => sum + value, 0);
  const dualBonusProbabilitySum = Object.values(config.multi_plus.bonus_outcome_probabilities)
    .reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(probabilitySum - 1) < 1e-12, `${config.id} base probabilities`);
  assert.ok(Math.abs(multiProbabilitySum - 1) < 1e-12, `${config.id} EX probabilities`);
  assert.ok(Math.abs(bonusProbabilitySum - 1) < 1e-12, `${config.id} x10 probabilities`);
  assert.ok(Math.abs(dualBonusProbabilitySum - 1) < 1e-12, `${config.id} dual bonus probabilities`);
  assert.ok(config.bonus_outcome_probabilities.empty < config.outcome_probabilities.empty,
    `${config.id} x10 reduces empty stops`);
  assert.ok(config.multi_plus.bonus_outcome_probabilities.empty
    < config.multi_plus.outcome_probabilities.empty, `${config.id} dual bonus reduces empty stops`);
  assert.ok(config.solver.initial_zero_probability_with_bonus
    < config.solver.initial_zero_probability, `${config.id} x10 improves round hit rate`);
  assert.ok(config.solver.initial_zero_probability_with_both_bonuses
    < config.solver.initial_zero_probability_with_multi_plus,
  `${config.id} dual bonus improves round hit rate`);

  const perCell = Object.fromEntries(["outer", "middle", "center"].map((category) => {
    const cellCount = config.sector_definitions[category].length;
    return [category, cellCount ? config.outcome_probabilities[category] / cellCount : 0];
  }));
  if (config.solver.physical_stop_mix) {
    assert.strictEqual(config.solver.physical_stop_mix, true, `${config.id} physical stop mix`);
    assert.ok(Object.values(config.solver.per_cell_probabilities)
      .every((probability) => probability >= 0), `${config.id} non-negative cell probabilities`);
    assert.ok(Math.abs(config.solver.per_cell_probabilities.outer - perCell.outer) < 1e-12,
      `${config.id} outer cell probability audit`);
    assert.ok(Math.abs(config.solver.per_cell_probabilities.middle - perCell.middle) < 1e-12,
      `${config.id} middle cell probability audit`);
    if (config.sector_definitions.center.length) {
      assert.ok(perCell.center > 0, `${config.id} premium center remains possible`);
    }
  } else {
    assert.ok(Math.max(...Object.values(perCell)) - Math.min(...Object.values(perCell)) < 1e-12,
      `${config.id} uniform cell chance`);
  }

  const round = math.createRound({
    layoutMode: config.layout_mode,
    lines: config.lines,
    pucks: config.pucks,
    betPerPuck: 1,
    seed: 839201
  });
  const repeated = math.createRound({
    layoutMode: config.layout_mode,
    lines: config.lines,
    pucks: config.pucks,
    betPerPuck: 1,
    seed: 839201
  });
  assert.deepStrictEqual(round, repeated, `${config.id} deterministic round`);
  round.puck_results.forEach((result) => validateResultTree(result, config));
  const baseSum = round.puck_results.reduce((sum, result) => sum + sumResult(result), 0);
  assert.strictEqual(round.base_win_multiplier_sum, baseSum);
  assert.strictEqual(round.final_win, baseSum * (round.paid_bonus_triggered ? 10 : 1));
  assert.strictEqual(round.empty_bonus_triggered, false, `${config.id} has no fake empty bonus`);
  assert.strictEqual(round.bonus_triggered, round.paid_bonus_triggered,
    `${config.id} only presents a real x10 bonus`);
}

for (const lines of math.LINE_COUNTS) {
  const config = math.getConfiguration("ignored", lines, 1, "dynamic_diagonal_width");
  const visible = new Set();
  for (const category of ["outer", "middle", "center"]) {
    config.sector_definitions[category].forEach((sector) => visible.add(cellKey(sector)));
  }
  config.multi_plus.sectors.forEach((sector) => visible.add(cellKey(sector)));
  for (const key of visible) {
    const [col, row] = key.split("_").map(Number);
    for (const mirror of dihedralKeys(col, row, lines)) {
      assert.ok(visible.has(mirror), `${lines} lines full symmetry ${key}/${mirror}`);
    }
  }
}

const expectedDynamicCounts = { 5: 5, 6: 12, 7: 21, 8: 32, 9: 45, 10: 60 };
const expectedMultiPlusCounts = { 5: 4, 6: 8, 7: 12, 8: 12, 9: 8, 10: 12 };
const expectedDynamicPaytables = {
  5: { outer: 0.55, middle: 1.3, center: 2 },
  6: { outer: 0.65, middle: 1.5, center: 3 },
  7: { outer: 0.60, middle: 1.5, center: 6 },
  8: { outer: 1.00, middle: 2.4, center: 9 },
  9: { outer: 1.30, middle: 3.2, center: 18 },
  10: { outer: 1.30, middle: 3.6, center: 30 }
};
let previousCenterMultiplier = 0;
for (const lines of math.LINE_COUNTS) {
  const config = math.getConfiguration("ignored", lines, 1, "dynamic_diagonal_width");
  const visible = new Set(["outer", "middle", "center"].flatMap((category) =>
    config.sector_definitions[category].map(cellKey)));
  const multiplierByCell = new Map(["outer", "middle", "center"].flatMap((category) =>
    config.sector_definitions[category].map((sector) =>
      [cellKey(sector), sector.multiplier ?? config.multiplier_table[category]])));
  assert.strictEqual(visible.size, expectedDynamicCounts[lines], `${lines}-line expanding X cell count`);
  assert.strictEqual(config.sector_definitions.empty.filter((sector) => sector.index >= 0).length,
    lines * lines - expectedDynamicCounts[lines], `${lines}-line red-boundary empty cell count`);
  assert.strictEqual(config.sector_definitions.outer.length, 0,
    `${lines}-line multipliers outside the red boundary are empty`);
  assert.strictEqual(config.outcome_probabilities.outer, 0,
    `${lines}-line outside-boundary outcome probability is zero`);
  assert.strictEqual(config.multi_plus.sectors.length, expectedMultiPlusCounts[lines],
    `${lines}-line symmetric EX MULTI count`);
  assert.deepStrictEqual({
    outer: config.multiplier_table.outer,
    middle: config.multiplier_table.middle,
    center: config.multiplier_table.center
  }, expectedDynamicPaytables[lines], `${lines}-line three-zone paytable`);
  assert.ok(Number.isInteger(config.multiplier_table.center), `${lines}-line integer center`);
  assert.ok(Math.abs(config.multiplier_table.middle * 10
    - Math.round(config.multiplier_table.middle * 10)) < 1e-12, `${lines}-line one-decimal middle`);
  assert.ok(Math.abs(config.multiplier_table.outer * 100
    - Math.round(config.multiplier_table.outer * 100)) < 1e-12, `${lines}-line two-decimal outer`);
  for (let row = 0; row < lines; row += 1) for (let col = 0; col < lines; col += 1) {
    const insideRedBoundary = col > 0 && col < lines - 1 && row > 0 && row < lines - 1;
    const expectedVisible = insideRedBoundary
      && ((col >= 2 && col <= lines - 3) || (row >= 2 && row <= lines - 3));
    assert.strictEqual(visible.has(`${col}_${row}`), expectedVisible,
      `${lines}-line red-boundary X geometry ${col}/${row}`);
  }
  multiplierByCell.forEach((multiplier, key) => {
    const [col, row] = key.split("_").map(Number);
    for (const mirror of dihedralKeys(col, row, lines)) {
      assert.strictEqual(multiplierByCell.get(mirror), multiplier,
        `${lines}-line multiplier symmetry ${key}/${mirror}`);
    }
  });
  assert.ok(config.multiplier_table.center > previousCenterMultiplier,
    `${lines}-line center multiplier rises with line count`);
  previousCenterMultiplier = config.multiplier_table.center;
}

const seven = math.getConfiguration("ignored", 7, 1, "dynamic_diagonal_width");
assert.strictEqual(seven.sector_definitions.center.length, 9, "7-line center is a 3x3 premium zone");
for (let row = 2; row <= 4; row += 1) for (let col = 2; col <= 4; col += 1) {
  assert.strictEqual(categoryFor(seven, col, row), "center", `7-line premium center ${col}/${row}`);
}
const ten = math.getConfiguration("ignored", 10, 3, "dynamic_diagonal_width");
assert.strictEqual(ten.multiplier_table.center, 30, "10-line 30x maximum remains available");
assert.ok(ten.outcome_probabilities.center > 0, "10-line 30x maximum remains non-zero");

assert.strictEqual(math.FIELD_CONFIGURATION_1.schema, "balloro-x3000-field-configuration");
assert.strictEqual(math.FIELD_CONFIGURATION_1.version, 2);
assert.strictEqual(math.FIELD_CONFIGURATION_1.id, 1);
assert.strictEqual(math.FIELD_CONFIGURATION_2.schema, "balloro-x3000-field-configuration");
assert.strictEqual(math.FIELD_CONFIGURATION_2.version, 2);
assert.strictEqual(math.FIELD_CONFIGURATION_2.id, 2);
assert.strictEqual(math.FIELD_CONFIGURATION_3.schema, "balloro-x3000-field-configuration");
assert.strictEqual(math.FIELD_CONFIGURATION_3.version, 2);
assert.strictEqual(math.FIELD_CONFIGURATION_3.id, 3);
assert.strictEqual(math.FIELD_CONFIGURATION_4.schema, "balloro-x3000-field-configuration");
assert.strictEqual(math.FIELD_CONFIGURATION_4.version, 2);
assert.strictEqual(math.FIELD_CONFIGURATION_4.id, 4);
assert.strictEqual(math.FIELD_CONFIGURATION_5.schema, "balloro-x3000-field-configuration");
assert.strictEqual(math.FIELD_CONFIGURATION_5.version, 2);
assert.strictEqual(math.FIELD_CONFIGURATION_5.id, 5);
assert.strictEqual(math.CONFIGURATOR_LAYOUT_MODE, math.CONFIGURATOR_5_LAYOUT_MODE);
const configuratorStateCategory = ["empty", "outer", "middle", "center", "empty"];
const expectedConfiguratorCounts = {
  [math.CONFIGURATOR_1_LAYOUT_MODE]: {
    5: [4, 8, 1, 0, 12],
    6: [10, 12, 2, 0, 12],
    7: [20, 8, 8, 1, 12],
    8: [36, 6, 8, 2, 12],
    9: [48, 8, 9, 4, 12],
    10: [64, 8, 12, 4, 12]
  },
  [math.CONFIGURATOR_2_LAYOUT_MODE]: {
    5: [9, 8, 4, 0, 4],
    6: [20, 8, 4, 0, 4],
    7: [24, 8, 8, 1, 8],
    8: [38, 8, 9, 1, 8],
    9: [49, 8, 8, 4, 12],
    10: [68, 8, 8, 4, 12]
  },
  [math.CONFIGURATOR_3_LAYOUT_MODE]: {
    5: [12, 6, 3, 0, 4],
    6: [16, 6, 6, 0, 8],
    7: [24, 8, 8, 1, 8],
    8: [36, 12, 6, 2, 8],
    9: [52, 12, 8, 4, 5],
    10: [68, 8, 12, 4, 8]
  },
  [math.CONFIGURATOR_4_LAYOUT_MODE]: {
    5: [4, 8, 1, 0, 12],
    6: [8, 8, 4, 0, 16],
    7: [12, 12, 4, 1, 20],
    8: [24, 8, 6, 2, 24],
    9: [32, 4, 14, 3, 28],
    10: [48, 4, 12, 4, 32]
  },
  [math.CONFIGURATOR_5_LAYOUT_MODE]: {
    5: [4, 8, 1, 0, 12],
    6: [8, 10, 2, 0, 16],
    7: [12, 12, 4, 1, 20],
    8: [24, 8, 6, 2, 24],
    9: [32, 4, 14, 3, 28],
    10: [48, 4, 12, 4, 32]
  }
};
const expectedConfiguratorPaytables = {
  5: { outer: 1.5, middle: 2.0, center: 2.5 },
  6: { outer: 1.8, middle: 2.4, center: 3.0 },
  7: { outer: 1.40, middle: 2.2, center: 6 },
  8: { outer: 1.10, middle: 2.7, center: 9 },
  9: { outer: 1.30, middle: 3.2, center: 18 },
  10: { outer: 1.30, middle: 3.6, center: 30 }
};
for (const layoutMode of math.CONFIGURATOR_LAYOUT_MODES) {
  for (const lines of math.LINE_COUNTS) {
    const cells = math.FIELD_CONFIGURATIONS[layoutMode].layouts[lines];
    const config = math.getConfiguration("ignored", lines, 3, layoutMode);
    const counts = [0, 0, 0, 0, 0];
    cells.forEach((state) => { counts[state] += 1; });
    assert.strictEqual(cells.length, lines * lines, `${layoutMode}/${lines} cell count`);
    assert.deepStrictEqual(counts, expectedConfiguratorCounts[layoutMode][lines],
      `${layoutMode}/${lines} state counts`);
    assert.deepStrictEqual({
      outer: config.multiplier_table.outer,
      middle: config.multiplier_table.middle,
      center: config.multiplier_table.center
    }, expectedConfiguratorPaytables[lines], `${layoutMode}/${lines} paytable`);
    assert.strictEqual(config.multi_plus.sectors.length, counts[4], `${layoutMode}/${lines} EX MULTI cells`);
    assert.strictEqual(config.solver.physical_stop_mix, true, `${layoutMode}/${lines} physical path mix`);
    assert.ok(config.solver.multi_plus_per_cell_probabilities, `${layoutMode}/${lines} EX physical path mix`);
    assert.ok(Math.abs(math.analyticMetrics(config).rtp - 0.9745) < 1e-12,
      `${layoutMode}/${lines} exact RTP`);

    const multiPlusKeys = new Set(config.multi_plus.sectors.map(cellKey));
    cells.forEach((state, index) => {
      const col = index % lines;
      const row = Math.floor(index / lines);
      assert.strictEqual(categoryFor(config, col, row), configuratorStateCategory[state],
        `${layoutMode}/${lines} configured category ${col}/${row}`);
      assert.strictEqual(multiPlusKeys.has(`${col}_${row}`), state === 4,
        `${layoutMode}/${lines} configured EX MULTI ${col}/${row}`);
    });
  }
}
const configuratorTen = math.getConfiguration("ignored", 10, 3, math.CONFIGURATOR_LAYOUT_MODE);
assert.strictEqual(configuratorTen.multiplier_table.center, 30, "configurator 30x maximum remains available");
assert.ok(configuratorTen.outcome_probabilities.center > 0,
  "configurator 30x maximum remains non-zero");
assert.strictEqual(trajectoryStats.totals.target_cells, 355);
assert.strictEqual(trajectoryStats.totals.unreachable_cells, 0);
assert.strictEqual(trajectoryStats.totals.variants_per_cell, 200);

assert.strictEqual(pocketLibrary.schema_version, 4);
assert.strictEqual(pocketLibrary.config.entry_variants_per_zone, 8);
for (const lines of math.LINE_COUNTS) {
  const radius = math.puckRadius(lines);
  for (const zoneId of math.SECRET_ROOM_IDS) {
    const variants = pocketLibrary.library[lines].entries[zoneId];
    assert.strictEqual(variants.length, 8, `${lines}/${zoneId} pocket paths`);
    assert.strictEqual(new Set(variants.map((variant) => variant.id)).size, 8);
    variants.forEach((descriptor) => {
      const trajectory = planner.hydrateTrajectory(descriptor);
      const pocket = math.secretRoomPocket(lines, zoneId);
      const captureRadius = radius * planner.POCKET_CAPTURE_RADIUS_MULTIPLIER;
      const capture = firstArmedPocketCapture(trajectory.frames, pocket, captureRadius);
      assert.ok(capture, `${descriptor.id} physically enters its corner pocket`);
      assert.ok(descriptor.bounce_count >= 4, `${descriptor.id} has at least four wall bounces`);
      const otherPockets = math.SECRET_ROOM_IDS.filter((id) => id !== zoneId)
        .map((id) => math.secretRoomPocket(lines, id));
      assert.ok(planner.trajectoryClearsPockets(
        trajectory.frames.slice(0, capture.index + 1), radius, otherPockets
      ), `${descriptor.id} clears inactive pockets`);
    });
  }
}

for (const lines of math.LINE_COUNTS) {
  const config = math.getConfiguration("ignored", lines, 3, math.CONFIGURATOR_5_LAYOUT_MODE);
  const radius = math.puckRadius(lines);
  const pocketSector = config.sector_definitions.empty.find((sector) => sector.index >= 0
    && !(sector.col === lines - 1 && sector.row === lines - 1));
  const targetSector = config.sector_definitions.middle[0] || config.sector_definitions.outer[0];
  const pocket = planner.sectorCenter(lines, pocketSector);
  let releaseTrajectory = null;
  for (let attempt = 0; attempt < 48 && !releaseTrajectory; attempt += 1) {
    const candidate = planner.planTrajectory({
      lines,
      puckRadius: radius,
      targetSector,
      seed: (0x51000000 + lines * 97 + attempt) >>> 0,
      launchForce: planner.VISUAL_PHYSICS.visual_launch_force,
      landingPoint: planner.landingPointForVariant(lines, radius, targetSector, 91 + attempt, attempt),
      candidateOffset: attempt,
      startPoint: pocket,
      allowAnyDirection: true,
      angleCenter: 0,
      angleMin: -180,
      angleMax: 180
    });
    if (candidate.valid && planner.trajectoryClearsPockets(candidate.frames, radius, [pocket])) {
      releaseTrajectory = candidate;
    }
  }
  assert.ok(releaseTrajectory, `${lines} lines launches from a field pocket to a result cell`);
  assert.ok(Math.hypot(releaseTrajectory.frames[0][1] - pocket.x,
    releaseTrajectory.frames[0][2] - pocket.y) < 1e-5, `${lines} lines starts at field pocket center`);
  assert.ok(releaseTrajectory.bounce_count >= 4, `${lines} lines field release has four wall bounces`);

  let repocketTrajectory = null;
  for (let attempt = 0; attempt < 48 && !repocketTrajectory; attempt += 1) {
    const candidate = planner.planTrajectory({
      lines,
      puckRadius: radius,
      targetSector: pocketSector,
      seed: (0x52000000 + lines * 131 + attempt) >>> 0,
      launchForce: planner.VISUAL_PHYSICS.visual_launch_force,
      landingPoint: pocket,
      candidateOffset: attempt,
      startPoint: pocket,
      allowAnyDirection: true,
      angleCenter: 0,
      angleMin: -180,
      angleMax: 180
    });
    if (candidate.valid && firstArmedPocketCapture(
      candidate.frames, pocket, radius * planner.POCKET_CAPTURE_RADIUS_MULTIPLIER
    )) repocketTrajectory = candidate;
  }
  assert.ok(repocketTrajectory, `${lines} lines supports physical field repocketing`);
  assert.ok(repocketTrajectory.bounce_count >= 4, `${lines} lines repocket path has four wall bounces`);
}

let recursiveRound = null;
for (let seed = 1; seed <= 100000 && !recursiveRound; seed += 1) {
  const round = math.createRound({
    layoutMode: "dynamic_diagonal_width", lines: 5, pucks: 3, betPerPuck: 1, seed
  });
  if (round.recursive_pocket_count > 0) recursiveRound = round;
}
assert.ok(recursiveRound, "deterministic recursive pocket round exists");
assert.ok(recursiveRound.maximum_release_generation >= 2);

for (const lines of math.LINE_COUNTS) {
  const config = math.getConfiguration("ignored", lines, 3, "dynamic_diagonal_width");
  const simulation = math.simulateConfiguration(
    config, 1000000, math.hashString(`rtp-audit:${lines}`), { captureHistogram: false }
  );
  assert.ok(Math.abs(simulation.simulated_rtp - math.TARGET_RTP) < 0.012,
    `${lines} lines million-round RTP ${simulation.simulated_rtp}`);
}

for (const layoutMode of math.CONFIGURATOR_LAYOUT_MODES) {
  for (const lines of math.LINE_COUNTS) {
    const config = math.getConfiguration("ignored", lines, 3, layoutMode);
    const simulation = math.simulateConfiguration(
      config, 1000000, math.hashString(`${layoutMode}-rtp-audit:${lines}`), { captureHistogram: false }
    );
    assert.ok(Math.abs(simulation.simulated_rtp - math.TARGET_RTP) < 0.012,
      `${layoutMode}/${lines} million-round RTP ${simulation.simulated_rtp}`);
  }
}

console.log("BalloroX math/layout tests: PASS (144 exact RTP configs, configurators #1/#2/#3/#4/#5, recursive corner and field pockets)");
