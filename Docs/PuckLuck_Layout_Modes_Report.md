# Puck Luck Layout Modes Report

## 1. Summary of the Model

Line count is the sole player-facing volatility control. Low line counts use larger cells, higher hit frequency, and smaller multipliers. High line counts use smaller cells, lower hit frequency, and larger multipliers. Every configuration jointly solves regular field payouts, x10 BOOST, EX MULTI, corner-pocket releases, and recursive re-entry while keeping exact target RTP.

## 2. Current Layout

The original two one-cell diagonals remain available as a geometry control. Its paytable and outcome probabilities now follow the same line-driven volatility curve as every other layout.

## 3. Dynamic Diagonal Width

Dynamic Diagonal Width expands the crossed-diagonal identity by one full X band at every line count: 3:33 on 5 lines through 3:33-8:88 on 10 lines. The outermost cells remain empty, matching the red boundaries supplied for each board. Only the one-decimal middle values and the integer premium center from 2x to 30x are visible inside the boundary. The closest feasible per-cell probability mix is solved for each configuration while retaining exact RTP and a non-zero maximum outcome.

## 4. Plinko Zone Style

Plinko Zone Style combines diagonal arms with broad center-oriented geometric zones. It has no pins or copied Plinko mechanics; only the distribution of multiplier cells changes. The result has less perceived dead space while retaining the Puck Luck diamond.

## 5. Multiplier-Cell Density by Lines

| Layout Mode | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---:|---:|---:|---:|---:|---:|
| Current | 36.0% | 55.6% | 26.5% | 43.8% | 21.0% | 36.0% |
| Dynamic Diagonal Width | 20.0% | 33.3% | 42.9% | 50.0% | 55.6% | 60.0% |
| Plinko Zone Style | 36.0% | 55.6% | 34.7% | 50.0% | 35.8% | 48.0% |
| Configurator #1 | 36.0% | 38.9% | 34.7% | 25.0% | 25.9% | 24.0% |
| Configurator #2 | 48.0% | 33.3% | 34.7% | 28.1% | 24.7% | 20.0% |
| Configurator #3 | 36.0% | 33.3% | 34.7% | 31.3% | 29.6% | 24.0% |

## 6. Empty-Cell Density by Lines

| Layout Mode | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---:|---:|---:|---:|---:|---:|
| Current | 64.0% | 44.4% | 73.5% | 56.3% | 79.0% | 64.0% |
| Dynamic Diagonal Width | 80.0% | 66.7% | 57.1% | 50.0% | 44.4% | 40.0% |
| Plinko Zone Style | 64.0% | 44.4% | 65.3% | 50.0% | 64.2% | 52.0% |
| Configurator #1 | 64.0% | 61.1% | 65.3% | 75.0% | 74.1% | 76.0% |
| Configurator #2 | 52.0% | 66.7% | 65.3% | 71.9% | 75.3% | 80.0% |
| Configurator #3 | 64.0% | 66.7% | 65.3% | 68.8% | 70.4% | 76.0% |

## 7-11. RTP, Hit Frequency, Win Above Bet, Max Win, Bonus Frequency

Every row below is solved independently. Analytic RTP must equal 0.9745; simulated RTP is available in the summary CSV and config JSON. Maximum win includes all permitted recursive pocket generations.

| Layout Mode | Risk | Lines | Pucks | RTP | Hit Freq | Win Above Bet | Max Win | Multiplier Density | Status |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| Current | low | 5 | 1 | 0.9745 | 67.87% | 40.24% | 618.30x | 36.0% | PASS |
| Current | low | 5 | 2 | 0.9745 | 89.62% | 28.34% | 618.30x | 36.0% | PASS |
| Current | low | 5 | 3 | 0.9745 | 96.64% | 31.62% | 618.30x | 36.0% | PASS |
| Current | low | 6 | 1 | 0.9745 | 49.51% | 31.03% | 842.40x | 55.6% | PASS |
| Current | low | 6 | 2 | 0.9745 | 74.49% | 33.02% | 842.40x | 55.6% | PASS |
| Current | low | 6 | 3 | 0.9745 | 87.10% | 39.23% | 842.40x | 55.6% | PASS |
| Current | normal | 7 | 1 | 0.9745 | 33.47% | 33.44% | 1579.50x | 26.5% | PASS |
| Current | normal | 7 | 2 | 0.9745 | 55.72% | 42.61% | 1579.50x | 26.5% | PASS |
| Current | normal | 7 | 3 | 0.9745 | 70.52% | 29.93% | 1579.50x | 26.5% | PASS |
| Current | normal | 8 | 1 | 0.9745 | 22.52% | 22.70% | 2457.00x | 43.8% | PASS |
| Current | normal | 8 | 2 | 0.9745 | 39.96% | 30.66% | 2457.00x | 43.8% | PASS |
| Current | normal | 8 | 3 | 0.9745 | 53.47% | 41.48% | 2457.00x | 43.8% | PASS |
| Current | high | 9 | 1 | 0.9745 | 15.40% | 15.40% | 5054.40x | 21.0% | PASS |
| Current | high | 9 | 2 | 0.9745 | 28.22% | 22.53% | 5054.40x | 21.0% | PASS |
| Current | high | 9 | 3 | 0.9745 | 38.92% | 31.93% | 5054.40x | 21.0% | PASS |
| Current | high | 10 | 1 | 0.9745 | 8.86% | 8.74% | 8424.00x | 36.0% | PASS |
| Current | high | 10 | 2 | 0.9745 | 16.78% | 16.88% | 8424.00x | 36.0% | PASS |
| Current | high | 10 | 3 | 0.9745 | 23.88% | 19.27% | 8424.00x | 36.0% | PASS |
| Dynamic Diagonal Width | low | 5 | 1 | 0.9745 | 50.72% | 51.13% | 540.00x | 20.0% | PASS |
| Dynamic Diagonal Width | low | 5 | 2 | 0.9745 | 75.65% | 29.15% | 540.00x | 20.0% | PASS |
| Dynamic Diagonal Width | low | 5 | 3 | 0.9745 | 87.94% | 34.35% | 540.00x | 20.0% | PASS |
| Dynamic Diagonal Width | low | 6 | 1 | 0.9745 | 37.71% | 37.84% | 810.00x | 33.3% | PASS |
| Dynamic Diagonal Width | low | 6 | 2 | 0.9745 | 61.17% | 32.87% | 810.00x | 33.3% | PASS |
| Dynamic Diagonal Width | low | 6 | 3 | 0.9745 | 75.78% | 24.04% | 810.00x | 33.3% | PASS |
| Dynamic Diagonal Width | normal | 7 | 1 | 0.9745 | 32.13% | 31.79% | 1620.00x | 42.9% | PASS |
| Dynamic Diagonal Width | normal | 7 | 2 | 0.9745 | 53.92% | 20.78% | 1620.00x | 42.9% | PASS |
| Dynamic Diagonal Width | normal | 7 | 3 | 0.9745 | 68.71% | 22.02% | 1620.00x | 42.9% | PASS |
| Dynamic Diagonal Width | normal | 8 | 1 | 0.9745 | 32.11% | 32.10% | 2430.00x | 50.0% | PASS |
| Dynamic Diagonal Width | normal | 8 | 2 | 0.9745 | 53.91% | 54.14% | 2430.00x | 50.0% | PASS |
| Dynamic Diagonal Width | normal | 8 | 3 | 0.9745 | 68.70% | 27.14% | 2430.00x | 50.0% | PASS |
| Dynamic Diagonal Width | high | 9 | 1 | 0.9745 | 23.77% | 24.18% | 4860.00x | 55.6% | PASS |
| Dynamic Diagonal Width | high | 9 | 2 | 0.9745 | 41.61% | 41.73% | 4860.00x | 55.6% | PASS |
| Dynamic Diagonal Width | high | 9 | 3 | 0.9745 | 55.05% | 55.17% | 4860.00x | 55.6% | PASS |
| Dynamic Diagonal Width | high | 10 | 1 | 0.9745 | 20.36% | 20.31% | 8100.00x | 60.0% | PASS |
| Dynamic Diagonal Width | high | 10 | 2 | 0.9745 | 36.27% | 36.12% | 8100.00x | 60.0% | PASS |
| Dynamic Diagonal Width | high | 10 | 3 | 0.9745 | 48.76% | 48.84% | 8100.00x | 60.0% | PASS |
| Plinko Zone Style | low | 5 | 1 | 0.9745 | 71.69% | 42.38% | 583.20x | 36.0% | PASS |
| Plinko Zone Style | low | 5 | 2 | 0.9745 | 91.98% | 30.55% | 583.20x | 36.0% | PASS |
| Plinko Zone Style | low | 5 | 3 | 0.9745 | 97.73% | 26.08% | 583.20x | 36.0% | PASS |
| Plinko Zone Style | low | 6 | 1 | 0.9745 | 52.43% | 32.11% | 793.80x | 55.6% | PASS |
| Plinko Zone Style | low | 6 | 2 | 0.9745 | 77.37% | 35.97% | 793.80x | 55.6% | PASS |
| Plinko Zone Style | low | 6 | 3 | 0.9745 | 89.24% | 29.10% | 793.80x | 55.6% | PASS |
| Plinko Zone Style | normal | 7 | 1 | 0.9745 | 48.40% | 16.21% | 1487.70x | 34.7% | PASS |
| Plinko Zone Style | normal | 7 | 2 | 0.9745 | 73.38% | 29.21% | 1487.70x | 34.7% | PASS |
| Plinko Zone Style | normal | 7 | 3 | 0.9745 | 86.26% | 31.04% | 1487.70x | 34.7% | PASS |
| Plinko Zone Style | normal | 8 | 1 | 0.9745 | 29.99% | 29.95% | 2313.90x | 50.0% | PASS |
| Plinko Zone Style | normal | 8 | 2 | 0.9745 | 50.98% | 26.14% | 2313.90x | 50.0% | PASS |
| Plinko Zone Style | normal | 8 | 3 | 0.9745 | 65.68% | 21.43% | 2313.90x | 50.0% | PASS |
| Plinko Zone Style | high | 9 | 1 | 0.9745 | 27.48% | 27.33% | 4762.80x | 35.8% | PASS |
| Plinko Zone Style | high | 9 | 2 | 0.9745 | 47.10% | 16.09% | 4762.80x | 35.8% | PASS |
| Plinko Zone Style | high | 9 | 3 | 0.9745 | 61.18% | 27.36% | 4762.80x | 35.8% | PASS |
| Plinko Zone Style | high | 10 | 1 | 0.9745 | 14.34% | 14.43% | 7938.00x | 48.0% | PASS |
| Plinko Zone Style | high | 10 | 2 | 0.9745 | 26.39% | 26.34% | 7938.00x | 48.0% | PASS |
| Plinko Zone Style | high | 10 | 3 | 0.9745 | 36.55% | 14.17% | 7938.00x | 48.0% | PASS |
| Configurator #1 | low | 5 | 1 | 0.9745 | 41.42% | 41.59% | 648.00x | 36.0% | PASS |
| Configurator #1 | low | 5 | 2 | 0.9745 | 65.68% | 25.88% | 648.00x | 36.0% | PASS |
| Configurator #1 | low | 5 | 3 | 0.9745 | 79.90% | 40.10% | 648.00x | 36.0% | PASS |
| Configurator #1 | low | 6 | 1 | 0.9745 | 42.34% | 42.53% | 540.00x | 38.9% | PASS |
| Configurator #1 | low | 6 | 2 | 0.9745 | 66.75% | 20.60% | 540.00x | 38.9% | PASS |
| Configurator #1 | low | 6 | 3 | 0.9745 | 80.83% | 41.47% | 540.00x | 38.9% | PASS |
| Configurator #1 | normal | 7 | 1 | 0.9745 | 37.15% | 37.06% | 1620.00x | 34.7% | PASS |
| Configurator #1 | normal | 7 | 2 | 0.9745 | 60.49% | 40.63% | 1620.00x | 34.7% | PASS |
| Configurator #1 | normal | 7 | 3 | 0.9745 | 75.16% | 31.27% | 1620.00x | 34.7% | PASS |
| Configurator #1 | normal | 8 | 1 | 0.9745 | 26.79% | 26.80% | 2430.00x | 25.0% | PASS |
| Configurator #1 | normal | 8 | 2 | 0.9745 | 46.38% | 32.46% | 2430.00x | 25.0% | PASS |
| Configurator #1 | normal | 8 | 3 | 0.9745 | 60.72% | 22.86% | 2430.00x | 25.0% | PASS |
| Configurator #1 | high | 9 | 1 | 0.9745 | 22.86% | 23.30% | 4860.00x | 25.9% | PASS |
| Configurator #1 | high | 9 | 2 | 0.9745 | 40.41% | 25.31% | 4860.00x | 25.9% | PASS |
| Configurator #1 | high | 9 | 3 | 0.9745 | 53.91% | 34.12% | 4860.00x | 25.9% | PASS |
| Configurator #1 | high | 10 | 1 | 0.9745 | 21.00% | 21.23% | 8100.00x | 24.0% | PASS |
| Configurator #1 | high | 10 | 2 | 0.9745 | 37.53% | 25.17% | 8100.00x | 24.0% | PASS |
| Configurator #1 | high | 10 | 3 | 0.9745 | 50.56% | 33.92% | 8100.00x | 24.0% | PASS |
| Configurator #2 | low | 5 | 1 | 0.9745 | 39.03% | 38.79% | 648.00x | 48.0% | PASS |
| Configurator #2 | low | 5 | 2 | 0.9745 | 62.83% | 31.45% | 648.00x | 48.0% | PASS |
| Configurator #2 | low | 5 | 3 | 0.9745 | 77.34% | 35.94% | 648.00x | 48.0% | PASS |
| Configurator #2 | low | 6 | 1 | 0.9745 | 41.29% | 41.08% | 540.00x | 33.3% | PASS |
| Configurator #2 | low | 6 | 2 | 0.9745 | 65.53% | 20.05% | 540.00x | 33.3% | PASS |
| Configurator #2 | low | 6 | 3 | 0.9745 | 79.76% | 39.36% | 540.00x | 33.3% | PASS |
| Configurator #2 | normal | 7 | 1 | 0.9745 | 37.15% | 36.73% | 1620.00x | 34.7% | PASS |
| Configurator #2 | normal | 7 | 2 | 0.9745 | 60.49% | 40.69% | 1620.00x | 34.7% | PASS |
| Configurator #2 | normal | 7 | 3 | 0.9745 | 75.16% | 31.05% | 1620.00x | 34.7% | PASS |
| Configurator #2 | normal | 8 | 1 | 0.9745 | 31.48% | 31.11% | 2430.00x | 28.1% | PASS |
| Configurator #2 | normal | 8 | 2 | 0.9745 | 53.05% | 36.01% | 2430.00x | 28.1% | PASS |
| Configurator #2 | normal | 8 | 3 | 0.9745 | 67.82% | 24.77% | 2430.00x | 28.1% | PASS |
| Configurator #2 | high | 9 | 1 | 0.9745 | 21.94% | 21.70% | 4860.00x | 24.7% | PASS |
| Configurator #2 | high | 9 | 2 | 0.9745 | 38.97% | 23.50% | 4860.00x | 24.7% | PASS |
| Configurator #2 | high | 9 | 3 | 0.9745 | 52.23% | 31.68% | 4860.00x | 24.7% | PASS |
| Configurator #2 | high | 10 | 1 | 0.9745 | 17.65% | 17.57% | 8100.00x | 20.0% | PASS |
| Configurator #2 | high | 10 | 2 | 0.9745 | 32.13% | 19.05% | 8100.00x | 20.0% | PASS |
| Configurator #2 | high | 10 | 3 | 0.9745 | 44.01% | 26.22% | 8100.00x | 20.0% | PASS |
| Configurator #3 | low | 5 | 1 | 0.9745 | 38.45% | 38.27% | 648.00x | 36.0% | PASS |
| Configurator #3 | low | 5 | 2 | 0.9745 | 62.11% | 33.16% | 648.00x | 36.0% | PASS |
| Configurator #3 | low | 5 | 3 | 0.9745 | 76.67% | 35.43% | 648.00x | 36.0% | PASS |
| Configurator #3 | low | 6 | 1 | 0.9745 | 40.41% | 40.24% | 540.00x | 33.3% | PASS |
| Configurator #3 | low | 6 | 2 | 0.9745 | 64.49% | 19.46% | 540.00x | 33.3% | PASS |
| Configurator #3 | low | 6 | 3 | 0.9745 | 78.84% | 38.20% | 540.00x | 33.3% | PASS |
| Configurator #3 | normal | 7 | 1 | 0.9745 | 37.15% | 36.58% | 1620.00x | 34.7% | PASS |
| Configurator #3 | normal | 7 | 2 | 0.9745 | 60.49% | 40.22% | 1620.00x | 34.7% | PASS |
| Configurator #3 | normal | 7 | 3 | 0.9745 | 75.16% | 30.72% | 1620.00x | 34.7% | PASS |
| Configurator #3 | normal | 8 | 1 | 0.9745 | 32.75% | 32.95% | 2430.00x | 31.3% | PASS |
| Configurator #3 | normal | 8 | 2 | 0.9745 | 54.76% | 29.95% | 2430.00x | 31.3% | PASS |
| Configurator #3 | normal | 8 | 3 | 0.9745 | 69.56% | 23.76% | 2430.00x | 31.3% | PASS |
| Configurator #3 | high | 9 | 1 | 0.9745 | 26.53% | 26.53% | 4860.00x | 29.6% | PASS |
| Configurator #3 | high | 9 | 2 | 0.9745 | 45.95% | 24.41% | 4860.00x | 29.6% | PASS |
| Configurator #3 | high | 9 | 3 | 0.9745 | 60.20% | 31.24% | 4860.00x | 29.6% | PASS |
| Configurator #3 | high | 10 | 1 | 0.9745 | 21.00% | 20.50% | 8100.00x | 24.0% | PASS |
| Configurator #3 | high | 10 | 2 | 0.9745 | 37.53% | 24.58% | 8100.00x | 24.0% | PASS |
| Configurator #3 | high | 10 | 3 | 0.9745 | 50.56% | 34.01% | 8100.00x | 24.0% | PASS |

## 12. Visual and Perception Assessment

- **Current:** strongest continuity with the existing game, but 9-10 line boards look sparse.
- **Dynamic Diagonal Width:** legacy expanding X layout with full symmetry.
- **Plinko Zone Style:** strongest reduction in perceived dead space, but 9-10 line boards carry substantially more text and feel busier.
- **Configurator #1:** previous saved Balloro X3000 field retained as a comparison mode.
- **Configurator #2:** previous saved Balloro X3000 field retained as a comparison mode.
- **Configurator #3:** active Balloro X3000 layout copied cell-for-cell from saved field configuration #3. EX MULTI cells are empty until activation and then use a separately solved physical stop mix.

Corner pockets use a separate precomputed entry library. A main ball in a pocket releases three white balls. Each released ball has a 3.5% first-generation and 0.6% second-generation re-entry probability; later generations must resolve on the field. The decreasing recursion and independent ball outcomes create rare escalation without changing RTP.

x10 BOOST and EX MULTI each have at least a 2.5% round probability, giving more than a 97% chance of seeing each event within 150 rounds. The lowest main-pocket probability is 2.6% per ball, also giving more than a 98% chance of seeing a pocket within 150 one-ball rounds.

## 13. Gameplay Test Results

Each of the 108 configurations ran 1,000 local gameplay-feel rounds using the same math engine and precomputed trajectory durations.

| Layout Mode | Avg Duration | Hit Freq | Win Above Bet | Avg Payout | Longest Miss Streak | Bonus Count |
|---|---:|---:|---:|---:|---:|---:|
| Current | 2.441s | 48.08% | 28.46% | 0.9244 | 68 | 1920 |
| Dynamic Diagonal Width | 2.441s | 51.27% | 34.26% | 0.9757 | 32 | 2000 |
| Plinko Zone Style | 2.439s | 58.03% | 25.80% | 0.9888 | 38 | 1891 |
| Configurator #1 | 2.437s | 50.42% | 31.25% | 1.0017 | 28 | 1976 |
| Configurator #2 | 2.437s | 49.63% | 30.16% | 0.9951 | 33 | 2026 |
| Configurator #3 | 2.440s | 52.08% | 31.45% | 1.0044 | 25 | 2013 |

Detailed results are in `MathOutput/puck_luck_layout_modes_gameplay_test.csv`.

## 14. Recommendation

Use **Configurator #3** as the active Balloro X3000 layout. It preserves the supplied low, middle, high, empty, and EX MULTI cell geometry, retains the 30x premium maximum, and preserves 97.45% RTP.

## 15. Files Changed

- math/puck-luck-layout-modes.js
- math/field-configuration-1.js
- math/field-configuration-2.js
- math/field-configuration-3.js
- math/layout-gameplay-test.js
- math/test-layout-modes.js
- math/run-layout-modes.js
- index.html
- style.css
- script.js
- MathOutput/puck_luck_layout_modes_config.json
- MathOutput/puck_luck_layout_modes_histogram.json
- MathOutput/puck_luck_layout_modes_summary.csv
- MathOutput/puck_luck_layout_modes_layouts.csv
- MathOutput/puck_luck_layout_modes_gameplay_test.csv
- Docs/PuckLuck_Layout_Modes_Report.md

## Validation

- Target RTP: 0.9745
- Corner-pocket entry variants: 192
- Standard field trajectories: 71,000
- Recursive pocket generations: 2
- Configurations per mode: 18
- Current passed: 18/18
- Dynamic Diagonal passed: 18/18
- Plinko Zone passed: 18/18
- Configurator #1 passed: 18/18
- Configurator #2 passed: 18/18
- Configurator #3 passed: 18/18
- Gameplay tests: PASS
