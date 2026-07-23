# Puck Luck Trajectory and Stars Report

## Summary

Puck Luck continues to use the local outcome-first math engine. The authoritative result selects the cell, multiplier, bonus state, and payout. The visual layer selects and replays a matching prevalidated trajectory. RTP, payout formulas, and the 54 multiplier configurations were not changed.

## Trajectory Library

- Preset: **STANDARD**
- Indexed by: `lines`, `target_cell_id`, `target_category`
- Line counts: **5–10**
- Reachable target cells: **355**
- Trajectories: **17,750**
- Variants per cell: **50**
- Incomplete or unreachable cells: **0**
- JSON size: approximately **11 MB**

| Lines | Cells | Trajectories |
|---:|---:|---:|
| 5 | 25 | 1,250 |
| 6 | 36 | 1,800 |
| 7 | 49 | 2,450 |
| 8 | 64 | 3,200 |
| 9 | 81 | 4,050 |
| 10 | 100 | 5,000 |

Each cell has exactly 50 variants. Variants are deduplicated using launch angle, bounce count, bounce-point signature, duration, and final-position bucket.

## Pacing and Bounces

- Average stored trajectory duration: **2.302 seconds**
- Main-flight playback speed: approximately **20% slower** than the prior version, with the final speed preserved through a smooth blend
- Minimum duration: **1.8 seconds**
- Maximum duration: **2.8 seconds**
- Average bounce count: **4.712**
- Minimum bounces: **4**
- Maximum bounces: **6**
- Multi-puck launch: **simultaneous**, with all selected pucks starting on the same frame

The visual launch force is higher and damping is stronger than the previous replay set. Slow 6–14 second paths are rejected. Every accepted path stops naturally without late steering or coordinate replacement.

## Landing Positions

The safe landing zone is inset by the puck radius plus 2 reference pixels.

| Bucket | Count | Share |
|---|---:|---:|
| Broad | 8,856 | 49.89% |
| Edge-safe | 8,464 | 47.68% |
| Near center | 430 | 2.42% |

Off-center stops account for **97.58%** of the library. The final cell always equals the authoritative target cell. `final_correction_px` is **0** for every trajectory; tiny floating-point closure error is reported separately and is never applied to the puck.

## Anti-Repeat Selection

The client keeps the last 20 trajectory IDs and per-ID usage counts. For a matching cell it:

1. Excludes recently used IDs when alternatives exist.
2. Prefers variants with the lowest recent usage.
3. Uses an outcome-seeded deterministic choice among equally preferred variants.
4. Falls back only to another prevalidated variant for the same exact target cell.

No runtime trajectory search occurs after BET. The browser only selects a compact descriptor, expands its deterministic replay frames, chooses star timing windows, and animates them.

## Star Timing

Offline timing analysis over 17,750 trajectory samples produced:

| Pickup phase | Share |
|---|---:|
| Before first bounce | 16.45% |
| After one bounce | 21.81% |
| After 2–3 bounces | 30.07% |
| After 4+ bounces / late movement | 26.00% |
| Final slowdown | 5.66% |

When the authoritative bonus is triggered, every required star is placed on an actual trajectory intersection. When it is not triggered, the planner preserves enough cells untouched by every selected puck path for the uncollected stars. On dense 5×5 multi-puck rounds it may choose another prevalidated trajectory ID for the same target cell; it never changes the target outcome.

## Runtime and Debugging

Normal mode uses `trajectory_library_mode: precomputed` and `allow_runtime_generation: false`. The optional debug overlay remains disabled unless `?debug=1` is added. It shows trajectory ID, target/final cell and category, launch values, damping, duration, bounces, final in-cell position, center distance, recent usage, safe landing zone, star cell, expected/actual pickup, pickup time, phase, and bounce count.

## Validation

- Math configurations: **54/54 PASS**
- RTP: **0.9745 for all 54 configurations**
- Multiplier tables: unchanged against the exported baseline
- Payout formulas: unchanged
- Deterministic trajectories tested: **17,750/17,750 PASS**
- Variants per cell: **50/50**
- Final target cell match: **100%**
- Minimum four separate wall hits: **100%**
- Final visual snap: **none**
- Uncontrolled `Math.random()` in the client: **none**

## Files Changed

- `index.html`
- `script.js`
- `math/trajectory-planner.js`
- `math/trajectory-library-standard.js`
- `math/build-trajectories.js`
- `math/test-math.js`
- `math/test-trajectories.js`
- `math/trajectory-library-standard.js` (the optional debug JSON export is generated only with `PUCK_LUCK_WRITE_DEBUG_JSON=1`)
- `MathOutput/puck_luck_trajectory_library_stats.json`
- `Docs/PuckLuck_Trajectory_And_Stars_Report.md`
