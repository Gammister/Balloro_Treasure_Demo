#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const math = require("./puck-luck-layout-modes.js");
const planner = require("./trajectory-planner.js");

const PRESETS = Object.freeze({ FAST_DEV: 20, STANDARD: 200, PRODUCTION: 300, STRESS_TEST: 600 });
const preset = process.env.PUCK_LUCK_TRAJECTORY_PRESET || "STANDARD";
const variantsPerCell = PRESETS[preset] || PRESETS.STANDARD;
const library = {};
const cellStats = [];
const unreachable = [];
const allDescriptors = [];
const starCandidateSets = [];

function categoryMap(lines) {
  const config = math.getConfiguration(math.riskForLines(lines), lines, 1, "dynamic_diagonal_width");
  const map = new Map();
  for (const [category, sectors] of Object.entries(config.sector_definitions)) {
    sectors.forEach((sector) => { if (sector.index >= 0) map.set(`${sector.col}_${sector.row}`, category); });
  }
  return map;
}

function signature(trajectory) {
  const bounces = trajectory.bounce_points.map((point) => `${Math.round(point[1] * 12)}_${Math.round(point[2] * 12)}`).join("|");
  const landing = `${Math.round(trajectory.landing_point.x * 80)}_${Math.round(trajectory.landing_point.y * 80)}`;
  return `${Math.round(trajectory.launch_angle_degrees * 20)}:${trajectory.bounce_count}:${Math.round(trajectory.duration * 20)}:${landing}:${bounces}`;
}

for (const lines of math.LINE_COUNTS) {
  const radius = math.puckRadius(lines);
  const categories = categoryMap(lines);
  library[lines] = {};
  for (let row = 0; row < lines; row += 1) {
    for (let col = 0; col < lines; col += 1) {
      const cellId = `${col}_${row}`;
      const targetSector = { col, row };
      const variants = [];
      const signatures = new Set();
      let attempts = 0;
      while (variants.length < variantsPerCell && attempts < variantsPerCell * 100) {
        const seed = math.hashString(`${preset}:${lines}:${cellId}:${attempts}`);
        const landing = planner.landingPointForVariant(lines, radius, targetSector, seed, attempts);
        const trajectory = planner.planTrajectory({
          lines,
          puckRadius: radius,
          targetSector,
          seed,
          landingPoint: landing,
          candidateOffset: attempts,
          launchForce: planner.VISUAL_PHYSICS.visual_launch_force
        });
        attempts += 1;
        if (!trajectory.valid) continue;
        if (!planner.trajectoryClearsPockets(trajectory.frames, radius)) continue;
        trajectory.landing_bucket = landing.bucket;
        const key = signature(trajectory);
        if (signatures.has(key)) continue;
        signatures.add(key);
        const descriptor = planner.descriptorFromTrajectory(trajectory, `${lines}-${cellId}-${variants.length}`);
        descriptor.lines = lines;
        descriptor.target_category = categories.get(cellId);
        const hydrated = planner.hydrateTrajectory(descriptor);
        if (!hydrated.valid || hydrated.bounce_points.length < planner.VISUAL_PHYSICS.min_bounces) continue;
        if (!planner.trajectoryClearsPockets(hydrated.frames, radius)) continue;
        const starCandidates = planner.findStarCandidates(hydrated, lines, radius)
          .filter((candidate) => candidate.row * lines + candidate.col !== lines * lines - 1);
        variants.push(descriptor);
        allDescriptors.push(descriptor);
        starCandidateSets.push(starCandidates);
      }
      library[lines][cellId] = variants;
      cellStats.push({ lines, target_cell_id: cellId, category: categories.get(cellId), variants: variants.length, attempts });
      if (variants.length < variantsPerCell) unreachable.push({ lines, target_cell_id: cellId, generated: variants.length, required: variantsPerCell });
    }
  }
}

const durations = allDescriptors.map((item) => item.duration);
const bounces = allDescriptors.map((item) => item.bounce_count);
const bounceEvents = allDescriptors.map((item) => item.bounce_points.length);
const buckets = allDescriptors.reduce((result, item) => {
  result[item.landing_bucket] = (result[item.landing_bucket] || 0) + 1;
  return result;
}, {});
const phaseOrder = ["before_first_bounce", "after_1_bounce", "after_2_3_bounces", "late", "final_slowdown"];
const phaseWeights = [0.15, 0.25, 0.25, 0.25, 0.10];
const starTiming = Object.fromEntries(phaseOrder.map((phase) => [phase, 0]));
allDescriptors.forEach((descriptor, index) => {
  let roll = ((math.hashString(`${descriptor.id}:star`) % 100000) / 100000);
  let desired = phaseOrder[phaseOrder.length - 1];
  for (let phaseIndex = 0; phaseIndex < phaseOrder.length; phaseIndex += 1) {
    roll -= phaseWeights[phaseIndex];
    if (roll <= 0) { desired = phaseOrder[phaseIndex]; break; }
  }
  const candidates = starCandidateSets[index];
  const selected = candidates.find((candidate) => candidate.phase === desired) || candidates[index % candidates.length];
  if (selected) starTiming[selected.phase] += 1;
});
const starTimingTotal = Object.values(starTiming).reduce((sum, value) => sum + value, 0);
const stats = {
  schema_version: 2,
  generated_at: new Date().toISOString(),
  preset,
  trajectory_library_mode: "precomputed",
  allow_runtime_generation: false,
  developer_regenerate_library: true,
  recent_history_size: 20,
  target_rtp: math.TARGET_RTP,
  landing_position_distribution: { center_weight: 0.02, broad_weight: 0.50, edge_weight: 0.48, min_distance_from_cell_border_px: 2 },
  visual_physics: planner.VISUAL_PHYSICS,
  totals: {
    line_counts: math.LINE_COUNTS.length,
    target_cells: cellStats.length,
    trajectories: allDescriptors.length,
    variants_per_cell: variantsPerCell,
    unreachable_cells: unreachable.length,
    average_duration: durations.reduce((sum, value) => sum + value, 0) / durations.length,
    minimum_duration: Math.min(...durations),
    maximum_duration: Math.max(...durations),
    average_bounce_count: bounces.reduce((sum, value) => sum + value, 0) / bounces.length,
    minimum_bounce_count: Math.min(...bounces),
    maximum_bounce_count: Math.max(...bounces),
    average_wall_hit_count: bounceEvents.reduce((sum, value) => sum + value, 0) / bounceEvents.length,
    minimum_wall_hit_count: Math.min(...bounceEvents),
    maximum_wall_hit_count: Math.max(...bounceEvents),
    landing_buckets: buckets,
    center_stop_percent: buckets.center / allDescriptors.length * 100,
    off_center_stop_percent: (1 - buckets.center / allDescriptors.length) * 100
  },
  star_collection_timing: {
    samples: starTimingTotal,
    counts: starTiming,
    percentages: Object.fromEntries(Object.entries(starTiming).map(([phase, count]) => [phase, count / starTimingTotal * 100])),
    before_first_bounce_percent: starTiming.before_first_bounce / starTimingTotal * 100
  },
  trajectories_by_lines: Object.fromEntries(math.LINE_COUNTS.map((lines) => [lines, allDescriptors.filter((item) => item.lines === lines).length])),
  cells: cellStats,
  unreachable
};

const payload = {
  schema_version: 2,
  preset,
  index: ["lines", "target_cell_id", "target_category"],
  config: {
    trajectory_library_mode: "precomputed",
    allow_runtime_generation: false,
    developer_regenerate_library: true,
    recent_history_size: 20,
    pocket_non_hit_clearance_multiplier: planner.POCKET_CAPTURE_RADIUS_MULTIPLIER,
    landing_position_distribution: stats.landing_position_distribution,
    visual_physics: planner.VISUAL_PHYSICS
  },
  library
};

const root = path.join(__dirname, "..");
if (process.env.PUCK_LUCK_WRITE_DEBUG_JSON === "1") {
  fs.writeFileSync(path.join(root, "MathOutput", "puck_luck_trajectory_library.json"), `${JSON.stringify(payload)}\n`);
}
fs.writeFileSync(path.join(root, "MathOutput", "puck_luck_trajectory_library_stats.json"), `${JSON.stringify(stats, null, 2)}\n`);
fs.writeFileSync(path.join(__dirname, "trajectory-library-standard.js"), `(function(root){root.PuckLuckTrajectoryLibrary=${JSON.stringify(payload)};})(typeof globalThis!=="undefined"?globalThis:this);\n`);
console.log(`${preset}: ${allDescriptors.length} trajectories, ${unreachable.length} incomplete cells, avg ${stats.totals.average_duration.toFixed(3)}s`);
