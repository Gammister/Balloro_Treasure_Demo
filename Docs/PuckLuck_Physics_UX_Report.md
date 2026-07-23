# Puck Luck Physics and UX Report

## Summary

The browser prototype keeps its local outcome-first architecture and target RTP of **0.9745**. The authoritative math still chooses every sector, multiplier, bonus state, and payout. Animation now replays a precomputed deterministic physical path to that exact sector.

All **54** existing math configurations remain unchanged and pass their analytic RTP checks.

## High Risk UX

The former presentation treated every multiplier above zero as a positive win. In High Risk, a `0.10x` payout returns only 10% of the puck stake, so green styling and a positive sound could misrepresent the result.

Results are now classified as:

| Return | Classification | Presentation |
|---|---|---|
| `0x` | MISS | Neutral grey, no celebration |
| `0.01x`–`0.99x` | DEFLECT / partial return | Smaller orange-red text, no glow, no positive win sound |
| `1.00x` | PUSH | Amber break-even treatment, no positive win sound |
| `>1.00x` | WIN | Multiplier color, glow, positive sound when the total round return exceeds the total stake |
| High Risk center | BIG WIN | Strong win label and the existing high-value presentation |

Payouts and the High Risk multiplier table were not changed.

## Deterministic Trajectory Planning

For each authoritative target cell, the planner enumerates reflected target images in an unfolded square. It filters paths to the configured launch-angle range, requires at least three wall crossings, and solves deterministic per-step damping so the finite path naturally ends at the target center. The recorded positions and velocities are then replayed at a fixed `1/120 s` timestep.

There is no live steering, late target pull, final coordinate replacement, or payout decision based on animation. If planning fails, the round does not start, the outcome is logged as unreachable, and no wager is deducted.

Each puck has its own deterministic seed and trajectory. Pucks do not collide. The same seed and configuration produce byte-identical replay data.

## Validation Results

- Configurations covered: **54**
- Prevalidated trajectory entries: **3,195**
- Valid entries: **3,195 (100%)**
- Candidate trajectories evaluated: **423,864**
- Unreachable sectors: **0**
- Minimum wall bounces: **3**, enforced for every entry
- Maximum allowed final correction: **1 px**
- Visual snapping remaining: **No**

### By Risk

| Risk | Valid / attempted | Candidates |
|---|---:|---:|
| Low | 1,065 / 1,065 | 141,288 |
| Normal | 1,065 / 1,065 | 141,288 |
| High | 1,065 / 1,065 | 141,288 |

### By Target Category

| Category | Valid / attempted |
|---|---:|
| Empty | 2,412 / 2,412 |
| Outer | 396 / 396 |
| Middle | 288 / 288 |
| Center | 99 / 99 |

The library records configuration, risk, lines, puck count, target category and sector, seed, launch force and angle, bounce count, duration, correction, bounce points, and compressed replay frames.

## Stars and Bonus

Star cells are selected deterministically after valid puck paths exist. A triggered bonus places every required star on a natural puck path. A non-triggered bonus leaves at least one star in a cell untouched by every replay. This prevents visual and authoritative bonus states from contradicting each other.

## Debug Mode

Debug mode is disabled by default. Add `?debug=1` to the page URL to show configuration data, target and actual sectors, multipliers, launch values, bounce counts, validity, correction distance, bonus state, trajectory lines, target outlines, and bounce points.

## Files Changed

- `index.html`
- `style.css`
- `script.js`
- `math/trajectory-planner.js`
- `math/build-trajectories.js`
- `math/test-math.js`
- `math/trajectory-library-standard.js` (the optional debug JSON export is generated only with `PUCK_LUCK_WRITE_DEBUG_JSON=1`)
- `Docs/PuckLuck_Physics_UX_Report.md`
