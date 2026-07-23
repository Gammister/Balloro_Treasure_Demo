# Puck Luck Math Audit

## Scope

The repository is a browser prototype, not a Unity/server project. The runtime consists of `index.html`, `style.css`, and `script.js`; gameplay is rendered on a canvas.

## Existing implementation

| Area | Current behavior before refactor | File |
|---|---|---|
| Grid generation | Diamond canvas with a configurable 5-10 square grid | `script.js`: `setupCanvas`, `drawField` |
| Multiplier placement | Two diagonals; values selected from outer/middle/center risk bands | `script.js`: `getRiskBands`, `getCellMultiplier` |
| Star placement | Unique random cells, excluding launch corner, using `Math.random()` | `script.js`: `createBonusStars` |
| Puck launch | Random speed and angle from the lower corner | `script.js`: `createPuck` |
| Collision/bounce | Canvas boundary checks, random restitution and random angular jitter | `script.js`: `stepPuck`, `nudgeVelocity` |
| Final outcome | The sector containing the client puck when it becomes slow | `script.js`: `getResultCell`, `settlePuck` |
| Payout | Client-side bet multiplied by the multiplier in the physics-selected sector | `script.js`: `settlePuck`, `settleRound` |
| Bonus | Physical star touches set client state; all required stars multiply the complete round win by 10 | `script.js`: `collectBonusStarByTouch`, `settleRound` |
| RTP | No RTP configuration, calculation, simulation, or validation existed | N/A |

## What determined the outcome

The client physics and `Math.random()` determined the final position. Randomness affected launch velocity, bounce restitution, angular jitter, star positions, and therefore payout. The browser was the source of truth.

## Determinism and FPS dependency

Movement used a variable animation-frame delta capped at 34 ms. Friction was approximately normalized to 60 FPS, but collision order, random calls, stopping time, and final sector could vary by frame cadence and device. There was no fixed-step accumulator, seed, bounce counter, replay contract, or repeatability test.

## Where RTP could break

1. Sector geometry and physical landing frequency were not measured.
2. Changing line count changed puck-to-cell geometry and outcome frequencies.
3. The x10 bonus was driven by physical contacts and could dominate RTP.
4. Multi-puck rounds summed client-selected outcomes without a per-configuration probability model.
5. Displayed multiplier edits immediately changed EV without validation.
6. No configuration-specific balancing existed for the 54 risk/line/puck combinations.
7. A slow device could produce a different collision sequence and payout.

## Required change

The smallest safe refactor is an outcome-first layer shared by a server implementation and this prototype:

1. A seeded math engine selects sectors, multipliers, stars, bonus state, and payout.
2. The outcome object is authoritative.
3. Canvas physics receives a deterministic visual plan and cannot change payout.
4. A fixed timestep and per-puck seeded RNG drive animation.
5. A standalone simulator validates every configuration independently.

## Added architecture

- `math/puck-luck-math.js`: deterministic RNG, 54 configs, solver, authoritative outcomes, analytic metrics, simulator.
- `math/run-math.js`: batch runner and JSON/CSV/report exporter.
- `math/test-math.js`: formula, configuration, determinism, radius, bounce, and RTP tests.
- `MathOutput/`: generated aggregated distributions.
- `Docs/PuckLuck_Math_Report.md`: generated final report.

## Important limitation

This browser prototype cannot certify Unity reachability because no Unity scene, PhysX version, colliders, or server exists in the repository. The harness exports deterministic visual plans with at least three required bounces. A production Unity client must build and validate a seed-to-sector trajectory library against its exact fixed-step physics and report any `unreachable_outcome` before release.
