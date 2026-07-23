#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const math = require("./puck-luck-math.js");
const planner = require("./trajectory-planner.js");
const loadTrajectoryLibrary = require("./load-trajectory-library.js");
const payload = loadTrajectoryLibrary();
const stats = JSON.parse(fs.readFileSync(`${__dirname}/../MathOutput/puck_luck_trajectory_library_stats.json`, "utf8"));

assert.strictEqual(payload.config.trajectory_library_mode, "precomputed");
assert.strictEqual(payload.config.allow_runtime_generation, false);
assert.strictEqual(payload.config.pocket_non_hit_clearance_multiplier,
  planner.POCKET_CAPTURE_RADIUS_MULTIPLIER);
assert.strictEqual(stats.totals.target_cells, 355);
assert.strictEqual(stats.totals.trajectories, 71000);
assert.strictEqual(stats.totals.unreachable_cells, 0);
assert.strictEqual(stats.totals.variants_per_cell, 200);
assert.ok(stats.totals.average_duration < 2.4);
assert.ok(stats.totals.maximum_duration <= 2.8);
assert.ok(stats.totals.minimum_bounce_count >= 4);
assert.ok(stats.totals.maximum_bounce_count <= 8);
assert.ok(stats.totals.minimum_wall_hit_count >= 4);
assert.ok(stats.totals.off_center_stop_percent > 89);
assert.ok(stats.star_collection_timing.before_first_bounce_percent >= 10);
assert.ok(stats.star_collection_timing.before_first_bounce_percent <= 25);
assert.ok(Object.values(stats.star_collection_timing.counts).every((count) => count > 0));

let checked = 0;
for (const lines of math.LINE_COUNTS) {
  for (const [cellId, variants] of Object.entries(payload.library[lines])) {
    assert.strictEqual(variants.length, 200, `${lines}:${cellId} variant count`);
    assert.strictEqual(new Set(variants.map((item) => item.id)).size, 200);
    for (const descriptor of variants) {
      assert.ok(descriptor.bounce_count >= 4 && descriptor.bounce_count <= 8);
      assert.ok(descriptor.bounce_points.length >= 4);
      assert.strictEqual(descriptor.final_correction_px, 0);
      const hydrated = planner.hydrateTrajectory(descriptor);
      assert.strictEqual(hydrated.valid, true, descriptor.id);
      assert.deepStrictEqual(hydrated.final_sector, descriptor.target_sector, descriptor.id);
      assert.ok(planner.trajectoryClearsPockets(hydrated.frames, descriptor.puck_radius),
        `${descriptor.id} must visibly clear every inactive pocket`);
      const finalFrame = hydrated.frames[hydrated.frames.length - 1];
      const tailThreshold = Math.max(2 / planner.REFERENCE_HALF_PX, descriptor.puck_radius * 0.12);
      const earlyStop = hydrated.frames.find((frame) => frame[5] >= descriptor.bounce_count
        && Math.hypot(frame[1] - finalFrame[1], frame[2] - finalFrame[2]) <= tailThreshold);
      assert.ok(earlyStop, `${descriptor.id} has a safe invisible tail cutoff`);
      assert.deepStrictEqual(planner.sectorFromPoint(lines, earlyStop[1], earlyStop[2]), descriptor.target_sector,
        `${descriptor.id} early stop remains in target cell`);
      assert.deepStrictEqual(planner.hydrateTrajectory(descriptor).frames, hydrated.frames, `${descriptor.id} replay repeatability`);
      checked += 1;
    }
    const recent = [];
    const usage = {};
    for (let round = 0; round < 20; round += 1) {
      const selected = planner.selectTrajectoryDescriptor(variants, round + 1, recent, usage, 20);
      assert.ok(!recent.includes(selected.id), `${lines}:${cellId} anti-repeat`);
      recent.push(selected.id);
      usage[selected.id] = (usage[selected.id] || 0) + 1;
    }
  }
}

const clientSource = fs.readFileSync(`${__dirname}/../script.js`, "utf8");
const runtimePlannerBody = clientSource.slice(clientSource.indexOf("function buildTrajectoryPlans"), clientSource.indexOf("function buildVisualStarPlan"));
assert.ok(!runtimePlannerBody.includes("planTrajectory("), "runtime must not search trajectories");
assert.ok(runtimePlannerBody.includes("hydrateTrajectory("), "runtime replays prevalidated descriptors");
assert.ok(runtimePlannerBody.includes("usedThisRound"), "runtime must reserve trajectories inside each round");
assert.ok(clientSource.includes("function ensureUniqueRoundTrajectories"), "runtime must repair duplicate trajectories after bonus planning");
assert.ok(clientSource.includes("function trajectoriesLookDuplicated"), "runtime must detect visually duplicated paths, not just duplicated ids");
assert.ok(clientSource.includes("selectDistinctTrajectoryDescriptor"), "runtime must select round-distinct trajectory descriptors");
assert.ok(clientSource.includes("EARLY_POCKET_ENTRY_VISUAL_PROBABILITY"),
  "runtime must keep early pocket entry as a visual-only probability");
assert.ok(clientSource.includes("preferEarlyPocketEntry: shouldUseEarlyPocketEntry(result)"),
  "runtime must route the rare early pocket variant through the precomputed library");
assert.ok(clientSource.includes("descriptorsLookDuplicated(choice.descriptor, option.descriptor"),
  "fixed bonus planner must reject visually duplicated descriptor combinations");
const pocketDrawBody = clientSource.slice(clientSource.indexOf("function drawSecretPocket("),
  clientSource.indexOf("function drawSecretPocketRimsOverlay"));
assert.ok(!pocketDrawBody.includes("if (isSealed) return"), "corner pockets remain visible during capture");
assert.ok(clientSource.includes("const BLUE_POCKET_WAVE_TIME_SCALE_MS = 72.5")
  && pocketDrawBody.includes("Math.sin(performance.now() / BLUE_POCKET_WAVE_TIME_SCALE_MS)"),
"field-pocket ready wave uses the faster smooth pulse");
const fieldDrawBody = clientSource.slice(clientSource.indexOf("function drawField()"),
  clientSource.indexOf("function getRiskBands"));
assert.ok(clientSource.includes("function traceRoundedPolygon"),
  "field rendering has a dedicated rounded visual path");
assert.ok(fieldDrawBody.includes("const cornerRadius = getFieldCornerRadius();")
  && fieldDrawBody.includes("traceRoundedPolygon(corners, cornerRadius);"),
"field mask and border use the visual corner radius");
assert.ok(fieldDrawBody.includes("drawPurpleNeonPolygonStroke(corners, 9, cornerRadius)"),
  "purple field border uses the same visual corner radius");
const renderBody = clientSource.slice(clientSource.indexOf("function render()"),
  clientSource.indexOf("function updatePhysicsDebug"));
const fieldIndex = renderBody.indexOf("drawField();");
const multiplierIndex = renderBody.indexOf("drawMainFieldMultiplierLabels(");
const launchPreviewIndex = renderBody.indexOf("drawLaunchPrimePreview();");
const pucksIndex = renderBody.indexOf("drawPucks();");
assert.ok(fieldIndex >= 0 && multiplierIndex > fieldIndex,
  "multiplier text renders above field walls and pocket rims");
assert.ok(launchPreviewIndex > multiplierIndex && pucksIndex > multiplierIndex,
  "launch preview and active balls render above field multiplier text");
const fieldMultiplierLabelBody = clientSource.slice(clientSource.indexOf("function drawMainFieldMultiplierLabels"),
  clientSource.indexOf("function drawField"));
assert.ok(fieldMultiplierLabelBody.includes('group.category === "multi_plus"')
  && fieldMultiplierLabelBody.includes('category === "multi_plus"'),
"merged and individual EX multipliers use the reveal animation");
assert.ok(fieldMultiplierLabelBody.includes("getMultiplierRevealMotion(state.multiPlusActivatedAt"),
  "EX multipliers share the result multiplier reveal motion");
const multiPlusCollectBody = clientSource.slice(clientSource.indexOf("function collectMultiPlus(puck"),
  clientSource.indexOf("function collectPlannedMultiPlus"));
assert.ok(multiPlusCollectBody.includes("startResultRevealAnimation();"),
  "EX activation keeps the reveal animation rendering until completion");
const bonusTouchBody = clientSource.slice(clientSource.indexOf("function collectPocketReleaseSymbolsByTouch"),
  clientSource.indexOf("function collectPlannedStars"));
assert.ok(!bonusTouchBody.includes("assignedResultPath !=="),
  "any physically touching bonus ball collects an authorized diamond");
assert.ok(clientSource.includes("function reconcileUncollectedSymbols"),
  "uncollected symbols are checked against main and pocket-release paths");
assert.ok(clientSource.includes("normalizedDistanceToTrajectory(symbol.x, symbol.y, trajectory)"),
  "symbol path checks use continuous trajectory segments");

for (const config of math.CONFIGURATIONS) {
  assert.ok(Math.abs(math.analyticMetrics(config).rtp - 0.9745) < 1e-12);
}
const baseline = JSON.parse(fs.readFileSync(`${__dirname}/../MathOutput/puck_luck_math_config.json`, "utf8"));
assert.strictEqual(baseline.length, math.CONFIGURATIONS.length);
baseline.forEach((config, index) => assert.deepStrictEqual(config.multiplier_table, math.CONFIGURATIONS[index].multiplier_table));

console.log(`Puck Luck trajectory tests: PASS (${checked} deterministic trajectories)`);
