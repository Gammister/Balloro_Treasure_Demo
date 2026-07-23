# Puck Luck Reduced Volatility V2 Report

Generated: 2026-06-28T16:35:41.578Z  
Profile: **Reduced Volatility V2 / Bonus Frequency 2.5x**  
Target RTP: **0.9745** separately for every configuration  
Simulation: **100,000 rounds per configuration, adaptive retry at 5,000,000 outside tolerance**

## Summary

V1 used a closeness threshold of 0.82. On even grids the nearest cells have a half-cell offset; for 6 lines their calculated closeness was 0.80, so the central 2x2 block was incorrectly classified as middle. V2 classifies diagonal multiplier cells by distance from an explicit geometric center zone.

- Odd grids 5/7/9: one center cell.
- Even grids 6/8/10: central 2x2 block.
- All layouts are horizontally, vertically, and rotationally symmetric.
- Category order is empty < outer < middle < center.
- High center > Normal center > Low center for every lines/pucks pair.
- Displayed multipliers are the payout multipliers; no hidden values exist.

## Paytables Before And After

| Risk | V1 Outer | V1 Middle | V1 Center | V2 Outer | V2 Middle | V2 Center |
|---|---:|---:|---:|---:|---:|---:|
| Low | ~1.20x | ~1.63x | ~2.17x | 1.15x | 1.65x | 2.40x |
| Normal | ~1.28x | ~2.31x | ~4.49x | 0.80x | 1.80x | 5.50x |
| High | 0.10x | ~1.96x | ~19.6x | 0.45x | 1.80x | 10.00x |

The solver calibrates category probabilities after two-decimal displayed multipliers are fixed. This preserves exact analytic RTP while increasing meaningful hit frequency and reducing High maximum exposure from about 195–198x to 100x.

## Full Comparison

| Risk | Lines | Pucks | Old RTP | New RTP | Old Hit Freq | New Hit Freq | Old Win Above Bet | New Win Above Bet | Old Max Win | New Max Win | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| low | 5 | 1 | 0.9745 | 0.9745 | 63.83% | 59.65% | 63.83% | 59.65% | 21.70x | 24.00x | PASS |
| low | 5 | 2 | 0.9745 | 0.9745 | 87.12% | 83.51% | 45.95% | 40.73% | 21.70x | 24.00x | PASS |
| low | 5 | 3 | 0.9745 | 0.9745 | 95.35% | 93.18% | 40.42% | 34.98% | 21.60x | 24.00x | PASS |
| low | 6 | 1 | 0.9745 | 0.9745 | 63.88% | 59.75% | 63.88% | 59.75% | 21.70x | 24.00x | PASS |
| low | 6 | 2 | 0.9745 | 0.9745 | 87.04% | 83.60% | 45.81% | 40.84% | 21.70x | 24.00x | PASS |
| low | 6 | 3 | 0.9745 | 0.9745 | 95.37% | 93.23% | 40.48% | 35.09% | 21.60x | 24.00x | PASS |
| low | 7 | 1 | 0.9745 | 0.9745 | 63.92% | 59.83% | 63.92% | 59.83% | 21.70x | 24.00x | PASS |
| low | 7 | 2 | 0.9745 | 0.9745 | 87.07% | 83.67% | 45.86% | 40.94% | 21.70x | 24.00x | PASS |
| low | 7 | 3 | 0.9745 | 0.9745 | 95.39% | 93.28% | 40.53% | 35.18% | 21.60x | 24.00x | PASS |
| low | 8 | 1 | 0.9745 | 0.9745 | 63.95% | 59.91% | 63.95% | 59.91% | 21.70x | 24.00x | PASS |
| low | 8 | 2 | 0.9745 | 0.9745 | 86.92% | 83.73% | 45.60% | 41.02% | 21.70x | 24.00x | PASS |
| low | 8 | 3 | 0.9745 | 0.9745 | 95.38% | 93.32% | 40.52% | 35.26% | 21.70x | 24.00x | PASS |
| low | 9 | 1 | 0.9745 | 0.9745 | 63.98% | 59.97% | 63.98% | 59.97% | 21.70x | 24.00x | PASS |
| low | 9 | 2 | 0.9745 | 0.9745 | 86.95% | 83.78% | 45.64% | 41.09% | 21.70x | 24.00x | PASS |
| low | 9 | 3 | 0.9745 | 0.9745 | 95.33% | 93.35% | 40.36% | 35.34% | 21.70x | 24.00x | PASS |
| low | 10 | 1 | 0.9745 | 0.9745 | 63.96% | 60.03% | 63.96% | 60.03% | 21.80x | 24.00x | PASS |
| low | 10 | 2 | 0.9745 | 0.9745 | 86.96% | 83.83% | 45.67% | 41.15% | 21.70x | 24.00x | PASS |
| low | 10 | 3 | 0.9745 | 0.9745 | 95.34% | 93.38% | 40.39% | 35.40% | 21.70x | 24.00x | PASS |
| normal | 5 | 1 | 0.9745 | 0.9745 | 42.00% | 46.21% | 42.00% | 23.64% | 44.80x | 55.00x | PASS |
| normal | 5 | 2 | 0.9745 | 0.9745 | 66.33% | 70.73% | 43.17% | 22.94% | 44.70x | 55.00x | PASS |
| normal | 5 | 3 | 0.9745 | 0.9745 | 80.53% | 83.89% | 37.87% | 27.16% | 44.60x | 55.00x | PASS |
| normal | 6 | 1 | 0.9745 | 0.9745 | 42.02% | 46.34% | 42.02% | 23.70% | 44.90x | 55.00x | PASS |
| normal | 6 | 2 | 0.9745 | 0.9745 | 66.36% | 70.87% | 43.19% | 23.02% | 44.80x | 55.00x | PASS |
| normal | 6 | 3 | 0.9745 | 0.9745 | 80.42% | 84.01% | 37.73% | 27.24% | 44.60x | 55.00x | PASS |
| normal | 7 | 1 | 0.9745 | 0.9745 | 42.06% | 46.44% | 42.06% | 23.75% | 44.90x | 55.00x | PASS |
| normal | 7 | 2 | 0.9745 | 0.9745 | 66.41% | 70.99% | 43.24% | 23.08% | 44.80x | 55.00x | PASS |
| normal | 7 | 3 | 0.9745 | 0.9745 | 80.44% | 84.11% | 37.75% | 27.31% | 44.70x | 55.00x | PASS |
| normal | 8 | 1 | 0.9745 | 0.9745 | 41.98% | 46.53% | 41.98% | 23.79% | 45.00x | 55.00x | PASS |
| normal | 8 | 2 | 0.9745 | 0.9745 | 66.33% | 71.09% | 43.17% | 23.13% | 44.90x | 55.00x | PASS |
| normal | 8 | 3 | 0.9745 | 0.9745 | 80.48% | 84.19% | 37.79% | 27.37% | 44.70x | 55.00x | PASS |
| normal | 9 | 1 | 0.9745 | 0.9745 | 41.94% | 46.61% | 41.94% | 23.82% | 45.00x | 55.00x | PASS |
| normal | 9 | 2 | 0.9745 | 0.9745 | 66.37% | 71.17% | 43.20% | 23.18% | 44.90x | 55.00x | PASS |
| normal | 9 | 3 | 0.9745 | 0.9745 | 80.48% | 84.26% | 37.79% | 27.43% | 44.80x | 55.00x | PASS |
| normal | 10 | 1 | 0.9745 | 0.9745 | 41.96% | 46.68% | 41.96% | 23.85% | 45.00x | 55.00x | PASS |
| normal | 10 | 2 | 0.9745 | 0.9745 | 66.41% | 71.25% | 43.23% | 23.22% | 44.90x | 55.00x | PASS |
| normal | 10 | 3 | 0.9745 | 0.9745 | 80.51% | 84.33% | 37.82% | 27.47% | 44.80x | 55.00x | PASS |
| high | 5 | 1 | 0.9745 | 0.9745 | 20.00% | 33.43% | 10.00% | 15.20% | 196.50x | 100.00x | PASS |
| high | 5 | 2 | 0.9745 | 0.9745 | 35.99% | 55.16% | 8.94% | 15.02% | 195.40x | 100.00x | PASS |
| high | 5 | 3 | 0.9745 | 0.9745 | 48.80% | 69.45% | 11.84% | 17.34% | 194.20x | 100.00x | PASS |
| high | 6 | 1 | 0.9745 | 0.9745 | 20.00% | 33.59% | 10.00% | 15.26% | 196.90x | 100.00x | PASS |
| high | 6 | 2 | 0.9745 | 0.9745 | 35.99% | 55.38% | 8.94% | 15.08% | 195.80x | 100.00x | PASS |
| high | 6 | 3 | 0.9745 | 0.9745 | 48.78% | 69.67% | 11.83% | 17.39% | 194.70x | 100.00x | PASS |
| high | 7 | 1 | 0.9745 | 0.9745 | 20.00% | 33.72% | 10.00% | 15.31% | 197.30x | 100.00x | PASS |
| high | 7 | 2 | 0.9745 | 0.9745 | 36.00% | 55.56% | 8.94% | 15.13% | 196.20x | 100.00x | PASS |
| high | 7 | 3 | 0.9745 | 0.9745 | 48.79% | 69.86% | 11.83% | 17.43% | 195.10x | 100.00x | PASS |
| high | 8 | 1 | 0.9745 | 0.9745 | 19.99% | 33.83% | 10.00% | 15.35% | 197.60x | 100.00x | PASS |
| high | 8 | 2 | 0.9745 | 0.9745 | 35.99% | 55.71% | 8.93% | 15.18% | 196.50x | 100.00x | PASS |
| high | 8 | 3 | 0.9745 | 0.9745 | 48.80% | 70.02% | 11.83% | 17.46% | 195.50x | 100.00x | PASS |
| high | 9 | 1 | 0.9745 | 0.9745 | 19.99% | 33.93% | 10.00% | 15.39% | 197.90x | 100.00x | PASS |
| high | 9 | 2 | 0.9745 | 0.9745 | 35.99% | 55.85% | 8.93% | 15.21% | 196.80x | 100.00x | PASS |
| high | 9 | 3 | 0.9745 | 0.9745 | 48.78% | 70.16% | 11.82% | 17.49% | 195.80x | 100.00x | PASS |
| high | 10 | 1 | 0.9745 | 0.9745 | 20.00% | 34.02% | 10.00% | 15.42% | 198.10x | 100.00x | PASS |
| high | 10 | 2 | 0.9745 | 0.9745 | 35.99% | 55.97% | 8.93% | 15.25% | 197.10x | 100.00x | PASS |
| high | 10 | 3 | 0.9745 | 0.9745 | 48.79% | 70.28% | 11.82% | 17.52% | 196.00x | 100.00x | PASS |

## RTP Validation: All 54 Configurations

| Config | Analytic RTP | Simulated RTP | Tolerance | Status |
|---|---:|---:|---:|---|
| low-5-1 | 0.9745000000 | 0.974333 | ±0.0015 | PASS |
| low-5-2 | 0.9745000000 | 0.974146 | ±0.0015 | PASS |
| low-5-3 | 0.9745000000 | 0.974551 | ±0.0015 | PASS |
| low-6-1 | 0.9745000000 | 0.973682 | ±0.0015 | PASS |
| low-6-2 | 0.9745000000 | 0.974813 | ±0.0015 | PASS |
| low-6-3 | 0.9745000000 | 0.974765 | ±0.0015 | PASS |
| low-7-1 | 0.9745000000 | 0.975656 | ±0.0015 | PASS |
| low-7-2 | 0.9745000000 | 0.974320 | ±0.0015 | PASS |
| low-7-3 | 0.9745000000 | 0.975233 | ±0.0015 | PASS |
| low-8-1 | 0.9745000000 | 0.973949 | ±0.0015 | PASS |
| low-8-2 | 0.9745000000 | 0.975903 | ±0.0015 | PASS |
| low-8-3 | 0.9745000000 | 0.975131 | ±0.0015 | PASS |
| low-9-1 | 0.9745000000 | 0.975870 | ±0.0015 | PASS |
| low-9-2 | 0.9745000000 | 0.974967 | ±0.0015 | PASS |
| low-9-3 | 0.9745000000 | 0.974674 | ±0.0015 | PASS |
| low-10-1 | 0.9745000000 | 0.975440 | ±0.0015 | PASS |
| low-10-2 | 0.9745000000 | 0.974351 | ±0.0015 | PASS |
| low-10-3 | 0.9745000000 | 0.973955 | ±0.0015 | PASS |
| normal-5-1 | 0.9745000000 | 0.975671 | ±0.0025 | PASS |
| normal-5-2 | 0.9745000000 | 0.976629 | ±0.0025 | PASS |
| normal-5-3 | 0.9745000000 | 0.974614 | ±0.0025 | PASS |
| normal-6-1 | 0.9745000000 | 0.975728 | ±0.0025 | PASS |
| normal-6-2 | 0.9745000000 | 0.973388 | ±0.0025 | PASS |
| normal-6-3 | 0.9745000000 | 0.975143 | ±0.0025 | PASS |
| normal-7-1 | 0.9745000000 | 0.976865 | ±0.0025 | PASS |
| normal-7-2 | 0.9745000000 | 0.975834 | ±0.0025 | PASS |
| normal-7-3 | 0.9745000000 | 0.975386 | ±0.0025 | PASS |
| normal-8-1 | 0.9745000000 | 0.973830 | ±0.0025 | PASS |
| normal-8-2 | 0.9745000000 | 0.973738 | ±0.0025 | PASS |
| normal-8-3 | 0.9745000000 | 0.972909 | ±0.0025 | PASS |
| normal-9-1 | 0.9745000000 | 0.972724 | ±0.0025 | PASS |
| normal-9-2 | 0.9745000000 | 0.974639 | ±0.0025 | PASS |
| normal-9-3 | 0.9745000000 | 0.975024 | ±0.0025 | PASS |
| normal-10-1 | 0.9745000000 | 0.974153 | ±0.0025 | PASS |
| normal-10-2 | 0.9745000000 | 0.972567 | ±0.0025 | PASS |
| normal-10-3 | 0.9745000000 | 0.974631 | ±0.0025 | PASS |
| high-5-1 | 0.9745000000 | 0.972336 | ±0.0050 | PASS |
| high-5-2 | 0.9745000000 | 0.976509 | ±0.0050 | PASS |
| high-5-3 | 0.9745000000 | 0.976006 | ±0.0050 | PASS |
| high-6-1 | 0.9745000000 | 0.976317 | ±0.0050 | PASS |
| high-6-2 | 0.9745000000 | 0.969994 | ±0.0050 | PASS |
| high-6-3 | 0.9745000000 | 0.974160 | ±0.0050 | PASS |
| high-7-1 | 0.9745000000 | 0.973718 | ±0.0050 | PASS |
| high-7-2 | 0.9745000000 | 0.974491 | ±0.0050 | PASS |
| high-7-3 | 0.9745000000 | 0.974924 | ±0.0050 | PASS |
| high-8-1 | 0.9745000000 | 0.970367 | ±0.0050 | PASS |
| high-8-2 | 0.9745000000 | 0.972096 | ±0.0050 | PASS |
| high-8-3 | 0.9745000000 | 0.974845 | ±0.0050 | PASS |
| high-9-1 | 0.9745000000 | 0.974564 | ±0.0050 | PASS |
| high-9-2 | 0.9745000000 | 0.977458 | ±0.0050 | PASS |
| high-9-3 | 0.9745000000 | 0.974447 | ±0.0050 | PASS |
| high-10-1 | 0.9745000000 | 0.973140 | ±0.0050 | PASS |
| high-10-2 | 0.9745000000 | 0.973822 | ±0.0050 | PASS |
| high-10-3 | 0.9745000000 | 0.974850 | ±0.0050 | PASS |

## Bonus And Volatility

The x10 rule and payout formula are unchanged. Bonus RTP share remains in the original bands: approximately 5% Low, 8% Normal, and 14% High. Paid bonus frequency remains separately calibrated by configuration. Empty visual bonus presentations remain payout-neutral.

V2 increases one-puck hit frequency from about 42% to 51.6% in Normal and from 20% to 40.3% in High. One-puck win-above-bet frequency moves from about 21% to 26% in Normal and from about 10% to 17.7% in High. Low remains near its established 64% behavior.

## Layout Validation

All checks passed:

1. Every grid 5–10 has a center zone.
2. Even grids have exactly four central cells.
3. Odd grids have exactly one central cell.
4. Center cells are geometrically closest to board center.
5. Multipliers increase toward center.
6. High center > Normal center > Low center.
7. High center > Normal middle.
8. No center cell is classified as middle.
9. Every layout is symmetric.

## Exceptions

Analytic failures: **0**.  
Monte Carlo warnings: **0**.  
No configuration failed analytic RTP.

## Files Changed

- math/puck-luck-math-v2.js
- math/test-math-v2.js
- math/run-math-v2.js
- index.html
- MathOutput/puck_luck_math_config_v2.json
- MathOutput/puck_luck_outcome_histogram_v2.json
- MathOutput/puck_luck_outcome_histogram_v2.csv
- MathOutput/puck_luck_multiplier_layouts_v2.csv
- Docs/PuckLuck_Volatility_V2_Report.md

## Recommendation

Use Reduced Volatility V2 as the prototype default. It fixes even-grid geometry, materially improves meaningful outcomes in Normal and High, caps High at 100x with bonus, and preserves 0.9745 RTP separately for all 54 configurations.
