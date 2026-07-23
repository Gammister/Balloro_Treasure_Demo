# Puck Luck Math Report

Generated: 2026-06-27T09:11:03.101Z  
Target RTP: **0.9745 (97.45%)**  
Configurations: **54**  
Simulation runs: **1,000,000 per configuration / 54,000,000 total**

## Summary

- All configurations are solved and evaluated separately.
- Payouts use the displayed two-decimal multipliers; there are no hidden payout values.
- Analytic RTP is used for certification; deterministic Monte Carlo is exported as an independent validation signal.
- x10 bonus contribution is separated from base-game contribution.
- Fixed visual timestep is 0.008333333333333333s and every visual plan requires at least four separate wall hits.
- Mathematical outcome generation reports no unreachable sector categories. Unity trajectory reachability remains unverified because this repository has no Unity project.
- Non-PASS configurations: 0.

## RTP By Configuration

| Risk | Lines | Pucks | RTP | Hit Freq | Bonus Freq | Max Win | Volatility | Status |
|---|---:|---:|---:|---:|---:|---:|---|---|
| low | 5 | 1 | 0.9745 | 63.83% | 0.563% | 21.70x | LOW | PASS |
| low | 5 | 2 | 0.9745 | 87.12% | 0.585% | 21.70x | LOW | PASS |
| low | 5 | 3 | 0.9745 | 95.35% | 0.606% | 21.60x | LOW | PASS |
| low | 6 | 1 | 0.9745 | 63.88% | 0.555% | 21.70x | LOW | PASS |
| low | 6 | 2 | 0.9745 | 87.04% | 0.576% | 21.70x | LOW | PASS |
| low | 6 | 3 | 0.9745 | 95.37% | 0.597% | 21.60x | LOW | PASS |
| low | 7 | 1 | 0.9745 | 63.92% | 0.548% | 21.70x | LOW | PASS |
| low | 7 | 2 | 0.9745 | 87.07% | 0.568% | 21.70x | LOW | PASS |
| low | 7 | 3 | 0.9745 | 95.39% | 0.589% | 21.60x | LOW | PASS |
| low | 8 | 1 | 0.9745 | 63.95% | 0.541% | 21.70x | LOW | PASS |
| low | 8 | 2 | 0.9745 | 86.92% | 0.562% | 21.70x | LOW | PASS |
| low | 8 | 3 | 0.9745 | 95.38% | 0.583% | 21.70x | LOW | PASS |
| low | 9 | 1 | 0.9745 | 63.98% | 0.536% | 21.70x | LOW | PASS |
| low | 9 | 2 | 0.9745 | 86.95% | 0.557% | 21.70x | LOW | PASS |
| low | 9 | 3 | 0.9745 | 95.33% | 0.577% | 21.70x | LOW | PASS |
| low | 10 | 1 | 0.9745 | 63.96% | 0.531% | 21.80x | LOW | PASS |
| low | 10 | 2 | 0.9745 | 86.96% | 0.552% | 21.70x | LOW | PASS |
| low | 10 | 3 | 0.9745 | 95.34% | 0.572% | 21.70x | LOW | PASS |
| normal | 5 | 1 | 0.9745 | 42.00% | 0.930% | 44.80x | MEDIUM | PASS |
| normal | 5 | 2 | 0.9745 | 66.33% | 0.966% | 44.70x | MEDIUM | PASS |
| normal | 5 | 3 | 0.9745 | 80.53% | 1.003% | 44.60x | MEDIUM | PASS |
| normal | 6 | 1 | 0.9745 | 42.02% | 0.915% | 44.90x | MEDIUM | PASS |
| normal | 6 | 2 | 0.9745 | 66.36% | 0.951% | 44.80x | MEDIUM | PASS |
| normal | 6 | 3 | 0.9745 | 80.42% | 0.987% | 44.60x | MEDIUM | PASS |
| normal | 7 | 1 | 0.9745 | 42.06% | 0.903% | 44.90x | MEDIUM | PASS |
| normal | 7 | 2 | 0.9745 | 66.41% | 0.938% | 44.80x | MEDIUM | PASS |
| normal | 7 | 3 | 0.9745 | 80.44% | 0.974% | 44.70x | MEDIUM | PASS |
| normal | 8 | 1 | 0.9745 | 41.98% | 0.892% | 45.00x | MEDIUM | PASS |
| normal | 8 | 2 | 0.9745 | 66.33% | 0.928% | 44.90x | MEDIUM | PASS |
| normal | 8 | 3 | 0.9745 | 80.48% | 0.963% | 44.70x | MEDIUM | PASS |
| normal | 9 | 1 | 0.9745 | 41.94% | 0.883% | 45.00x | MEDIUM | PASS |
| normal | 9 | 2 | 0.9745 | 66.37% | 0.918% | 44.90x | MEDIUM | PASS |
| normal | 9 | 3 | 0.9745 | 80.48% | 0.953% | 44.80x | MEDIUM | PASS |
| normal | 10 | 1 | 0.9745 | 41.96% | 0.875% | 45.00x | MEDIUM | PASS |
| normal | 10 | 2 | 0.9745 | 66.41% | 0.910% | 44.90x | MEDIUM | PASS |
| normal | 10 | 3 | 0.9745 | 80.51% | 0.944% | 44.80x | MEDIUM | PASS |
| high | 5 | 1 | 0.9745 | 20.00% | 1.736% | 196.50x | HIGH | PASS |
| high | 5 | 2 | 0.9745 | 35.99% | 1.809% | 195.40x | HIGH | PASS |
| high | 5 | 3 | 0.9745 | 48.80% | 1.883% | 194.20x | HIGH | PASS |
| high | 6 | 1 | 0.9745 | 20.00% | 1.707% | 196.90x | HIGH | PASS |
| high | 6 | 2 | 0.9745 | 35.99% | 1.778% | 195.80x | HIGH | PASS |
| high | 6 | 3 | 0.9745 | 48.78% | 1.851% | 194.70x | HIGH | PASS |
| high | 7 | 1 | 0.9745 | 20.00% | 1.683% | 197.30x | HIGH | PASS |
| high | 7 | 2 | 0.9745 | 36.00% | 1.753% | 196.20x | HIGH | PASS |
| high | 7 | 3 | 0.9745 | 48.79% | 1.825% | 195.10x | HIGH | PASS |
| high | 8 | 1 | 0.9745 | 19.99% | 1.662% | 197.60x | HIGH | PASS |
| high | 8 | 2 | 0.9745 | 35.99% | 1.732% | 196.50x | HIGH | PASS |
| high | 8 | 3 | 0.9745 | 48.80% | 1.802% | 195.50x | HIGH | PASS |
| high | 9 | 1 | 0.9745 | 19.99% | 1.644% | 197.90x | HIGH | PASS |
| high | 9 | 2 | 0.9745 | 35.99% | 1.713% | 196.80x | HIGH | PASS |
| high | 9 | 3 | 0.9745 | 48.78% | 1.782% | 195.80x | HIGH | PASS |
| high | 10 | 1 | 0.9745 | 20.00% | 1.628% | 198.10x | HIGH | PASS |
| high | 10 | 2 | 0.9745 | 35.99% | 1.696% | 197.10x | HIGH | PASS |
| high | 10 | 3 | 0.9745 | 48.79% | 1.765% | 196.00x | HIGH | PASS |

## Final Multiplier Tables

| Risk | Lines | Pucks | Outer | Middle | Center |
|---|---:|---:|---:|---:|---:|
| low | 5 | 1 | 1.21x | 1.63x | 2.17x |
| low | 5 | 2 | 1.20x | 1.62x | 2.17x |
| low | 5 | 3 | 1.20x | 1.62x | 2.16x |
| low | 6 | 1 | 1.21x | 1.63x | 2.17x |
| low | 6 | 2 | 1.20x | 1.63x | 2.17x |
| low | 6 | 3 | 1.20x | 1.62x | 2.16x |
| low | 7 | 1 | 1.21x | 1.63x | 2.17x |
| low | 7 | 2 | 1.20x | 1.63x | 2.17x |
| low | 7 | 3 | 1.20x | 1.62x | 2.16x |
| low | 8 | 1 | 1.21x | 1.63x | 2.17x |
| low | 8 | 2 | 1.21x | 1.63x | 2.17x |
| low | 8 | 3 | 1.20x | 1.62x | 2.17x |
| low | 9 | 1 | 1.21x | 1.63x | 2.17x |
| low | 9 | 2 | 1.21x | 1.63x | 2.17x |
| low | 9 | 3 | 1.20x | 1.63x | 2.17x |
| low | 10 | 1 | 1.21x | 1.63x | 2.18x |
| low | 10 | 2 | 1.21x | 1.63x | 2.17x |
| low | 10 | 3 | 1.20x | 1.63x | 2.17x |
| normal | 5 | 1 | 1.28x | 2.31x | 4.48x |
| normal | 5 | 2 | 1.28x | 2.30x | 4.47x |
| normal | 5 | 3 | 1.27x | 2.29x | 4.46x |
| normal | 6 | 1 | 1.28x | 2.31x | 4.49x |
| normal | 6 | 2 | 1.28x | 2.30x | 4.48x |
| normal | 6 | 3 | 1.28x | 2.30x | 4.46x |
| normal | 7 | 1 | 1.28x | 2.31x | 4.49x |
| normal | 7 | 2 | 1.28x | 2.30x | 4.48x |
| normal | 7 | 3 | 1.28x | 2.30x | 4.47x |
| normal | 8 | 1 | 1.29x | 2.31x | 4.50x |
| normal | 8 | 2 | 1.28x | 2.31x | 4.49x |
| normal | 8 | 3 | 1.28x | 2.30x | 4.47x |
| normal | 9 | 1 | 1.29x | 2.32x | 4.50x |
| normal | 9 | 2 | 1.28x | 2.31x | 4.49x |
| normal | 9 | 3 | 1.28x | 2.30x | 4.48x |
| normal | 10 | 1 | 1.29x | 2.32x | 4.50x |
| normal | 10 | 2 | 1.28x | 2.31x | 4.49x |
| normal | 10 | 3 | 1.28x | 2.30x | 4.48x |
| high | 5 | 1 | 0.10x | 1.96x | 19.65x |
| high | 5 | 2 | 0.10x | 1.95x | 19.54x |
| high | 5 | 3 | 0.10x | 1.94x | 19.42x |
| high | 6 | 1 | 0.10x | 1.97x | 19.69x |
| high | 6 | 2 | 0.10x | 1.96x | 19.58x |
| high | 6 | 3 | 0.10x | 1.95x | 19.47x |
| high | 7 | 1 | 0.10x | 1.97x | 19.73x |
| high | 7 | 2 | 0.10x | 1.96x | 19.62x |
| high | 7 | 3 | 0.10x | 1.95x | 19.51x |
| high | 8 | 1 | 0.10x | 1.98x | 19.76x |
| high | 8 | 2 | 0.10x | 1.97x | 19.65x |
| high | 8 | 3 | 0.10x | 1.95x | 19.55x |
| high | 9 | 1 | 0.10x | 1.98x | 19.79x |
| high | 9 | 2 | 0.10x | 1.97x | 19.68x |
| high | 9 | 3 | 0.10x | 1.96x | 19.58x |
| high | 10 | 1 | 0.10x | 1.98x | 19.81x |
| high | 10 | 2 | 0.10x | 1.97x | 19.71x |
| high | 10 | 3 | 0.10x | 1.96x | 19.60x |

## Bonus Contribution

The JSON and CSV exports contain exact base-game RTP, bonus RTP, bonus share, bonus frequency, and average bonus win for every configuration. Configured bonus shares target 3-6% for Low, 6-10% for Normal, and 10-18% for High.

## Determinism And Bounce Validation

The outcome engine uses a seeded PRNG. Each puck receives a deterministic visual seed, fixed launch force, launch angle, target sector, and a required bounce count of 4-7. Tests verify identical seed/config outcomes and the minimum-four-wall-hit contract.

## Unreachable Outcomes

No mathematical category is unreachable in the outcome generator. Production Unity certification is still required: build a fixed-step seed/angle trajectory library for every target sector and reject any seed that does not reach its authoritative target after at least four separate wall hits.

## Current Risks

1. The repository has no remote server; the browser math module is a local stand-in for the server contract.
2. The repository has no Unity scene, so PhysX-level deterministic reachability cannot be certified here.
3. Monte Carlo values fluctuate around the exact analytic RTP; they are validation data, not the certification source.
4. Any production change to bonus probability, outcome weights, or displayed multipliers requires regenerating all outputs and rerunning tests.

## Files Changed

- `math/puck-luck-math.js`
- `math/run-math.js`
- `math/test-math.js`
- `script.js`
- `index.html`
- `Docs/PuckLuck_Math_Audit.md`
- `Docs/PuckLuck_Math_Report.md`
- `MathOutput/puck_luck_outcome_histogram.json`
- `MathOutput/puck_luck_outcome_histogram.csv`
- `MathOutput/puck_luck_math_config.json`
