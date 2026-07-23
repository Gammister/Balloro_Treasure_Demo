#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const planner = require("./trajectory-planner.js");
const math = require("./puck-luck-layout-modes.js");

const ENTRY_VARIANTS = 8;
const ROOM_WIN_VARIANTS = 16;
const ROOM_MISS_VARIANTS = 32;
const ROOM_LAUNCH_FORCE = planner.VISUAL_PHYSICS.visual_launch_force;
const ROOM_NORMALIZED_SPEED = ROOM_LAUNCH_FORCE / planner.REFERENCE_HALF_PX;
const ROOM_RESTITUTION = 0.94;
const STOP_SPEED = 0.08;
const SECRET_ROOM_CORNER_CUT_MODE = "experimental_side_corner_cuts";
const SECRET_ROOM_LEGACY_CORNER_CUT_MODE = "legacy_outer_tip";
const SECRET_ROOM_EXPERIMENTAL_SIDE_CORNER_GRID_STEPS = 1;

function round(value, digits = 6) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function createRng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function roomTargetCell(lines) {
  return math.secretRoomMultiplierCells(lines, false)[0];
}

function pointInRoomCell(u, v, cell) {
  return u >= cell.u0 && u < cell.u1 && v >= cell.v0 && v < cell.v1;
}

function roomOuterWallU(lines) {
  const cells = math.secretRoomMultiplierCells(lines, true);
  const outerWall = cells.reduce((value, cell) => Math.max(value, cell.u1), 0);
  return Math.max(0.55, Math.min(0.92, outerWall || 0.8));
}

function legacyRoomPolygon(lines) {
  const outerWallU = roomOuterWallU(lines);
  const outerCut = 1 - outerWallU;
  return [
    { u: 0, v: -1 },
    { u: 0, v: 1 },
    { u: outerWallU, v: outerCut },
    { u: outerWallU, v: -outerCut }
  ];
}

function chamferRoomPolygon(points, cornerIndexes, requestedCut) {
  return points.flatMap((point, index) => {
    if (!cornerIndexes.includes(index)) return [{ ...point }];
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const previousLength = Math.hypot(previous.u - point.u, previous.v - point.v);
    const nextLength = Math.hypot(next.u - point.u, next.v - point.v);
    const cut = Math.min(requestedCut, previousLength * 0.42, nextLength * 0.42);
    const toward = (target, length) => ({
      u: point.u + (target.u - point.u) * (cut / Math.max(1e-9, length)),
      v: point.v + (target.v - point.v) * (cut / Math.max(1e-9, length))
    });
    return [toward(previous, previousLength), toward(next, nextLength)];
  });
}

function experimentalRoomPolygon(lines) {
  const outerWallU = roomOuterWallU(lines);
  const cellSize = 2 / lines;
  const sideCutU = Math.max(0.05, Math.min(outerWallU - 0.01,
    cellSize * SECRET_ROOM_EXPERIMENTAL_SIDE_CORNER_GRID_STEPS));
  return [
    { u: sideCutU, v: -1 + sideCutU },
    { u: 0, v: -1 + sideCutU },
    { u: 0, v: 1 - sideCutU },
    { u: sideCutU, v: 1 - sideCutU },
    { u: outerWallU, v: 1 - outerWallU },
    { u: outerWallU, v: outerWallU - 1 }
  ];
}

function roomPolygon(lines) {
  if (SECRET_ROOM_CORNER_CUT_MODE === SECRET_ROOM_LEGACY_CORNER_CUT_MODE) return legacyRoomPolygon(lines);
  return experimentalRoomPolygon(lines);
}

function roomEdges(lines, radius) {
  const margin = radius * 1.04;
  const points = roomPolygon(lines);
  return points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    const edgeU = next.u - point.u;
    const edgeV = next.v - point.v;
    const length = Math.hypot(edgeU, edgeV);
    return {
      point,
      next,
      normalU: edgeV / length,
      normalV: -edgeU / length,
      margin
    };
  });
}

function simulateRoomTrajectory(lines, angle, damping, targetCell = roomTargetCell(lines), blockedCells = [targetCell]) {
  const radius = math.puckRadius(lines);
  const edges = roomEdges(lines, radius);
  let u = radius * 1.08;
  let v = 0;
  let un = Math.cos(angle) * ROOM_NORMALIZED_SPEED;
  let vt = Math.sin(angle) * ROOM_NORMALIZED_SPEED;
  let bounceCount = 0;
  const bouncePoints = [];
  const frames = [[0, round(u), round(v), round(un), round(vt), 0]];

  for (let frameIndex = 1; frameIndex < 480; frameIndex += 1) {
    u += un * planner.FIXED_TIMESTEP;
    v += vt * planner.FIXED_TIMESTEP;
    un *= damping;
    vt *= damping;
    let bounced = false;

    for (let resolvePass = 0; resolvePass < 8; resolvePass += 1) {
      let corrected = false;
      for (const edge of edges) {
        const distance = (u - edge.point.u) * edge.normalU + (v - edge.point.v) * edge.normalV;
        const correction = edge.margin - distance;
        if (correction <= 0) continue;
        u += edge.normalU * correction;
        v += edge.normalV * correction;
        corrected = true;
        const velocityIntoWall = un * edge.normalU + vt * edge.normalV;
        if (velocityIntoWall < 0) {
          un -= (1 + ROOM_RESTITUTION) * velocityIntoWall * edge.normalU;
          vt -= (1 + ROOM_RESTITUTION) * velocityIntoWall * edge.normalV;
          bounced = true;
        }
      }
      if (!corrected) break;
    }

    if (bounced) {
      bounceCount += 1;
      bouncePoints.push([round(frameIndex * planner.FIXED_TIMESTEP, 4), round(u), round(v), bounceCount]);
    }
    frames.push([
      round(frameIndex * planner.FIXED_TIMESTEP, 4),
      round(u), round(v), round(un), round(vt), bounceCount
    ]);
    if (frameIndex > 120 && Math.hypot(un, vt) < STOP_SPEED) break;
  }

  const landsInTarget = pointInRoomCell(u, v, targetCell);
  const landsInBlockedCell = blockedCells.some((cell) => pointInRoomCell(u, v, cell));
  return {
    valid: bounceCount >= 4,
    lands_in_target: landsInTarget,
    lands_in_blocked_cell: landsInBlockedCell,
    frames,
    bounce_points: bouncePoints,
    bounce_count: bounceCount,
    duration: frames.at(-1)[0],
    final_speed: round(Math.hypot(un, vt)),
    landing_point: { u: round(u), v: round(v) },
    puck_radius: radius,
    target_cell: targetCell,
    target_cell_key: targetCell.key,
    launch_angle_radians: round(angle),
    damping_per_step: round(damping, 9),
    fixed_timestep: planner.FIXED_TIMESTEP,
    launch_force: ROOM_LAUNCH_FORCE
  };
}

function buildRoomVariants(lines, outcome, count, targetCell = roomTargetCell(lines), blockedCells = [targetCell], idSuffix = "") {
  const random = createRng(0x5ec7e7 ^ Math.imul(lines, 0x9e3779b1)
    ^ math.hashString(`${outcome}:${targetCell.key}:${idSuffix}`));
  const variants = [];
  const signatures = new Set();
  for (let attempt = 0; attempt < 300000 && variants.length < count; attempt += 1) {
    const angle = -0.72 + random() * 1.44;
    const damping = 0.968 + random() * 0.012;
    const trajectory = simulateRoomTrajectory(lines, angle, damping, targetCell, blockedCells);
    if (!trajectory.valid) continue;
    if (outcome === "win" && !trajectory.lands_in_target) continue;
    if (outcome === "miss" && trajectory.lands_in_blocked_cell) continue;
    const signature = `${Math.round(angle * 100)}:${Math.round(damping * 10000)}`;
    if (signatures.has(signature)) continue;
    signatures.add(signature);
    variants.push({ id: `secret-room-${outcome}-${lines}-${idSuffix || targetCell.key}-${variants.length}`, outcome, ...trajectory });
  }
  if (variants.length !== count) {
    throw new Error(`Only ${variants.length}/${count} ${outcome} room trajectories generated for ${lines} lines / ${targetCell.key}`);
  }
  return variants;
}

function buildEntryVariants(lines, zoneId) {
  const pocket = math.secretRoomPocket(lines, zoneId);
  const radius = math.puckRadius(lines);
  const captureRadius = radius * planner.POCKET_CAPTURE_RADIUS_MULTIPLIER;
  const candidates = [];
  const signatures = new Set();
  const otherPockets = math.SECRET_ROOM_IDS.filter((id) => id !== zoneId)
    .map((id) => math.secretRoomPocket(lines, id));

  const findCapture = (frames) => {
    let armed = Math.hypot(frames[0][1] - pocket.x, frames[0][2] - pocket.y) > captureRadius;
    for (let frameIndex = 1; frameIndex < frames.length; frameIndex += 1) {
      const first = frames[frameIndex - 1];
      const second = frames[frameIndex];
      if (!armed) {
        if (Math.hypot(second[1] - pocket.x, second[2] - pocket.y) > captureRadius) armed = true;
        continue;
      }
      const progress = planner.segmentCircleFirstIntersection(first, second, pocket, captureRadius);
      if (progress === null) continue;
      const vx = first[3] + (second[3] - first[3]) * progress;
      const vy = first[4] + (second[4] - first[4]) * progress;
      return {
        frame_index: frameIndex,
        segment_progress: progress,
        speed: Math.hypot(vx, vy),
        bounce_count: progress < 0.5 ? first[5] : second[5],
        trajectory_progress: (frameIndex - 1 + progress) / Math.max(1, frames.length - 1)
      };
    }
    return null;
  };

  for (let attempt = 0; attempt < 8000 && candidates.length < ENTRY_VARIANTS; attempt += 1) {
    const seed = math.hashString(`secret-entry:${lines}:${zoneId}:${attempt}`);
    const directApproach = attempt % 2 === 0;
    const targetSector = directApproach
      ? { col: pocket.col, row: pocket.row }
      : { col: attempt % lines, row: Math.floor(attempt / lines) % lines };
    const inwardX = pocket.x < 0 ? 1 : -1;
    const inwardY = pocket.y < 0 ? 1 : -1;
    const directSpreadX = 0.66 + ((seed >>> 8) % 700) / 1000;
    const directSpreadY = 0.66 + ((seed >>> 18) % 700) / 1000;
    const landingPoint = directApproach
      ? {
        x: pocket.x + inwardX * radius * directSpreadX,
        y: pocket.y + inwardY * radius * directSpreadY
      }
      : planner.landingPointForVariant(lines, radius, targetSector, seed, attempt);
    const trajectory = planner.planTrajectory({
      lines,
      puckRadius: radius,
      targetSector,
      landingPoint,
      seed,
      launchForce: ROOM_LAUNCH_FORCE,
      candidateOffset: attempt
    });
    if (!trajectory.valid) continue;
    trajectory.landing_bucket = directApproach ? "secret-pocket" : landingPoint.bucket;
    const descriptor = planner.descriptorFromTrajectory(trajectory, `secret-entry-candidate-${lines}-${zoneId}-${attempt}`);
    descriptor.lines = lines;
    const hydrated = planner.hydrateTrajectory(descriptor);
    if (!hydrated.valid) continue;
    const capture = findCapture(hydrated.frames);
    if (!capture) continue;
    const entryFrames = hydrated.frames.slice(0, capture.frame_index + 1);
    const clearsOtherPockets = planner.trajectoryClearsPockets(
      entryFrames,
      radius,
      otherPockets
    );
    if (!clearsOtherPockets) continue;
    const signature = `${Math.round(descriptor.launch_angle_degrees * 10)}:${capture.bounce_count}`
      + `:${Math.round(capture.speed * 4)}:${targetSector.col}_${targetSector.row}`;
    if (signatures.has(signature)) continue;
    signatures.add(signature);
    candidates.push({ descriptor, capture });
  }

  const profiles = [
    { speed: 0.18, bounces: 5, progress: 0.82 },
    { speed: 0.35, bounces: 3, progress: 0.7 },
    { speed: 0.7, bounces: 6, progress: 0.62 },
    { speed: 1.2, bounces: 2, progress: 0.5 },
    { speed: 2.2, bounces: 4, progress: 0.45 },
    { speed: 3.5, bounces: 1, progress: 0.32 },
    { speed: 5.2, bounces: 5, progress: 0.55 },
    { speed: 7.2, bounces: 2, progress: 0.26 },
    { speed: 9.5, bounces: 4, progress: 0.38 },
    { speed: 12, bounces: 1, progress: 0.2 },
    { speed: 15, bounces: 3, progress: 0.3 },
    { speed: 19, bounces: 2, progress: 0.18 }
  ];
  const remaining = [...candidates];
  const variants = profiles.map((profile, index) => {
    if (!remaining.length) return null;
    remaining.sort((first, second) => {
      const score = (candidate) => Math.abs(Math.log((candidate.capture.speed + 0.05) / (profile.speed + 0.05)))
        + Math.abs(candidate.capture.bounce_count - profile.bounces) * 0.16
        + Math.abs(candidate.capture.trajectory_progress - profile.progress) * 0.3;
      return score(first) - score(second);
    });
    const selected = remaining.shift();
    return {
      ...selected.descriptor,
      id: `secret-entry-${lines}-${zoneId}-${index}`,
      lines,
      target_category: "secret",
      zone_id: zoneId,
      capture_frame_index: selected.capture.frame_index,
      capture_segment_progress: round(selected.capture.segment_progress),
      capture_speed: round(selected.capture.speed),
      capture_bounce_count: selected.capture.bounce_count,
      capture_trajectory_progress: round(selected.capture.trajectory_progress),
      pocket: { ...pocket }
    };
  }).filter(Boolean);
  if (variants.length !== ENTRY_VARIANTS) {
    throw new Error(`Only ${variants.length}/${ENTRY_VARIANTS} diverse secret entries generated for ${lines}/${zoneId}`);
  }
  return variants;
}

const table = {
  schema_version: 4,
  description: "Precomputed physical trajectories from the launch corner into the four corner pockets.",
  config: {
    entry_variants_per_zone: ENTRY_VARIANTS,
    hit_probability_by_lines: Object.fromEntries(math.LINE_COUNTS.map((lines) =>
      [lines, math.secretRoomHitProbability(lines)])),
    repocket_probability_by_generation: { ...math.BONUS_REPOCKET_PROBABILITIES },
    release_count: math.POCKET_RELEASE_COUNT,
    launch_force: ROOM_LAUNCH_FORCE,
    fixed_timestep: planner.FIXED_TIMESTEP
  },
  library: {}
};

for (const lines of math.LINE_COUNTS) {
  table.library[lines] = {
    entries: {}
  };
  for (const zoneId of math.SECRET_ROOM_IDS) {
    table.library[lines].entries[zoneId] = buildEntryVariants(lines, zoneId);
  }
}

const outputDir = path.resolve(__dirname, "../MathOutput");
const jsonPath = path.join(outputDir, "puck_luck_secret_room_trajectories.json");
const csvPath = path.join(outputDir, "puck_luck_secret_room_trajectories.csv");
const browserPath = path.resolve(__dirname, "secret-room-trajectories.js");
fs.writeFileSync(jsonPath, `${JSON.stringify(table, null, 2)}\n`);
fs.writeFileSync(browserPath,
  `(function(root){root.PuckLuckSecretRoomTrajectories=${JSON.stringify(table)};})(typeof globalThis!=="undefined"?globalThis:this);\n`);

const csv = [["kind", "lines", "zone", "id", "target_cell", "duration", "bounces", "launch_force", "landing_a", "landing_b"]];
for (const [lines, group] of Object.entries(table.library)) {
  for (const [zoneId, variants] of Object.entries(group.entries)) {
    for (const variant of variants) csv.push([
      "entry", lines, zoneId, variant.id, "", variant.duration, variant.bounce_count,
      variant.launch_force, variant.landing_point.x, variant.landing_point.y
    ]);
  }
}
fs.writeFileSync(csvPath, `${csv.map((row) => row.join(",")).join("\n")}\n`);

console.log(`Corner-pocket trajectories: ${math.LINE_COUNTS.length * math.SECRET_ROOM_IDS.length * ENTRY_VARIANTS} entry variants`);
