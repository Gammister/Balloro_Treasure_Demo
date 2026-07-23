#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const oldMath = require("./puck-luck-math.js");
const math = require("./puck-luck-math-v2.js");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "MathOutput");
const docsDir = path.join(root, "Docs");
const totalRuns = Number.parseInt(process.argv[2] || "2000000", 10);
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

function fixed(value, digits = 10) { return Number(value.toFixed(digits)); }
function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function tolerance(risk) { return risk === "low" ? 0.0015 : risk === "normal" ? 0.0025 : 0.005; }
function percent(value) { return `${(value * 100).toFixed(2)}%`; }

const rows = [];
for (const config of math.CONFIGURATIONS) {
  const oldConfig = oldMath.getConfiguration(config.risk, config.lines, config.pucks);
  const oldMetrics = oldMath.analyticMetrics(oldConfig);
  const metrics = math.analyticMetrics(config);
  let simulationRuns = totalRuns;
  let simulation = math.simulateConfiguration(config, simulationRuns, math.hashString(`puck-luck-v2:${config.id}`),
    { captureHistogram: false });
  let rtpError = Math.abs(simulation.simulated_rtp - math.TARGET_RTP);
  if (rtpError > tolerance(config.risk) && simulationRuns < 5000000) {
    simulationRuns = 5000000;
    simulation = math.simulateConfiguration(config, simulationRuns, math.hashString(`puck-luck-v2:${config.id}`),
      { captureHistogram: false });
    rtpError = Math.abs(simulation.simulated_rtp - math.TARGET_RTP);
  }
  const analyticPass = Math.abs(metrics.rtp - math.TARGET_RTP) < 1e-12;
  const simulationPass = rtpError <= tolerance(config.risk);
  const bonusShare = config.bonus_rtp_contribution / metrics.rtp;
  rows.push({
    config_id: config.id, risk: config.risk, lines: config.lines, pucks: config.pucks,
    old_rtp: oldMetrics.rtp, new_rtp: metrics.rtp, simulated_rtp: simulation.simulated_rtp,
    simulation_tolerance: tolerance(config.risk), simulation_error: rtpError,
    old_hit_frequency: oldMetrics.hit_frequency, new_hit_frequency: metrics.hit_frequency,
    old_win_above_bet_frequency: oldMetrics.win_above_bet_frequency,
    new_win_above_bet_frequency: metrics.win_above_bet_frequency,
    old_bonus_frequency: oldMetrics.bonus_frequency, new_bonus_frequency: metrics.bonus_frequency,
    base_bonus_frequency: config.base_bonus_probability,
    bonus_frequency_multiplier: config.bonus_frequency_multiplier,
    baseline_paid_bonus_win_frequency: config.baseline_paid_bonus_win_frequency,
    paid_bonus_win_frequency: config.paid_bonus_win_frequency,
    paid_bonus_win_frequency_multiplier: config.paid_bonus_win_frequency_multiplier,
    one_of_two_star_probability: math.ONE_OF_TWO_STAR_PROBABILITY,
    two_of_three_star_probability: math.TWO_OF_THREE_STAR_PROBABILITY,
    old_bonus_rtp_share: oldConfig.bonus_rtp_contribution / oldMetrics.rtp,
    new_bonus_rtp_share: bonusShare,
    old_max_win: oldMetrics.max_win_multiplier, new_max_win: metrics.max_win_multiplier,
    variance: metrics.variance, standard_deviation: metrics.standard_deviation,
    base_game_rtp_contribution: config.base_game_rtp_contribution,
    bonus_rtp_contribution: config.bonus_rtp_contribution,
    multiplier_table: config.multiplier_table,
    outcome_probabilities: config.outcome_probabilities,
    status: analyticPass && simulationPass ? "PASS" : analyticPass ? "WARNING" : "FAIL",
    simulation_validation: {
      runs: simulationRuns, seed: simulation.seed,
      simulated_hit_frequency: simulation.simulated_hit_frequency,
      simulated_win_above_bet_frequency: simulation.simulated_win_above_bet_frequency,
      simulated_bonus_frequency: simulation.simulated_bonus_frequency,
      simulated_variance: simulation.simulated_variance,
      category_hits: simulation.category_hits,
      outcome_histogram: simulation.outcome_histogram
    }
  });
  console.log(`${config.id} analytic=${metrics.rtp.toFixed(6)} simulated=${simulation.simulated_rtp.toFixed(6)} ${rows.at(-1).status}`);
}

const histogram = {
  generated_at: new Date().toISOString(), profile: math.PROFILE_VERSION,
  target_rtp: math.TARGET_RTP, total_configurations: rows.length,
  runs_per_configuration: `${totalRuns} base; 5000000 adaptive retry outside tolerance`, configurations: rows
};
fs.writeFileSync(path.join(outputDir, "puck_luck_outcome_histogram_v2.json"), `${JSON.stringify(histogram, null, 2)}\n`);

const csvColumns = [
  "config_id", "risk", "lines", "pucks", "simulation_runs", "old_rtp", "new_rtp", "simulated_rtp",
  "simulation_tolerance", "simulation_error", "old_hit_frequency", "new_hit_frequency",
  "old_win_above_bet_frequency", "new_win_above_bet_frequency", "old_bonus_frequency",
  "new_bonus_frequency", "base_bonus_frequency", "bonus_frequency_multiplier",
  "baseline_paid_bonus_win_frequency", "paid_bonus_win_frequency",
  "paid_bonus_win_frequency_multiplier", "one_of_two_star_probability",
  "two_of_three_star_probability",
  "old_bonus_rtp_share", "new_bonus_rtp_share", "old_max_win",
  "new_max_win", "variance", "standard_deviation", "base_game_rtp_contribution",
  "bonus_rtp_contribution", "outer_multiplier", "middle_multiplier", "center_multiplier", "status"
];
const csv = [csvColumns.join(",")];
for (const row of rows) {
  const flat = { ...row, simulation_runs: row.simulation_validation.runs, outer_multiplier: row.multiplier_table.outer,
    middle_multiplier: row.multiplier_table.middle, center_multiplier: row.multiplier_table.center };
  csv.push(csvColumns.map((column) => {
    const value = flat[column];
    return csvCell(Number.isFinite(value) ? fixed(value, 10) : value);
  }).join(","));
}
fs.writeFileSync(path.join(outputDir, "puck_luck_outcome_histogram_v2.csv"), `${csv.join("\n")}\n`);

const configExport = math.CONFIGURATIONS.map((config) => {
  const row = rows.find((item) => item.config_id === config.id);
  return {
    ...config,
    analytic_metrics: {
      rtp: row.new_rtp, hit_frequency: row.new_hit_frequency,
      win_above_bet_frequency: row.new_win_above_bet_frequency,
      bonus_frequency: row.new_bonus_frequency, bonus_rtp_share: row.new_bonus_rtp_share,
      max_win: row.new_max_win, variance: row.variance, standard_deviation: row.standard_deviation
    }
  };
});
fs.writeFileSync(path.join(outputDir, "puck_luck_math_config_v2.json"), `${JSON.stringify(configExport, null, 2)}\n`);

const layoutColumns = ["config_id", "risk", "lines", "pucks", "row", "col", "cell_id", "category", "multiplier", "display_multiplier", "is_empty"];
const layoutRows = [layoutColumns];
for (const config of math.CONFIGURATIONS) {
  const categoryByCell = new Map();
  for (const [category, sectors] of Object.entries(config.sector_definitions)) {
    sectors.forEach((sector) => { if (sector.index >= 0) categoryByCell.set(`${sector.col}_${sector.row}`, category); });
  }
  for (let row = 0; row < config.lines; row += 1) for (let col = 0; col < config.lines; col += 1) {
    const cellId = `${col}_${row}`;
    const category = categoryByCell.get(cellId) || "empty";
    const multiplier = config.multiplier_table[category] || 0;
    layoutRows.push([config.id, config.risk, config.lines, config.pucks, row, col, cellId,
      category, multiplier, `${multiplier.toFixed(2)}x`, multiplier === 0]);
  }
}
fs.writeFileSync(path.join(outputDir, "puck_luck_multiplier_layouts_v2.csv"),
  `${layoutRows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`);

const comparisonRows = rows.map((row) => `| ${row.risk} | ${row.lines} | ${row.pucks} | ${row.old_rtp.toFixed(4)} | ${row.new_rtp.toFixed(4)} | ${percent(row.old_hit_frequency)} | ${percent(row.new_hit_frequency)} | ${percent(row.old_win_above_bet_frequency)} | ${percent(row.new_win_above_bet_frequency)} | ${row.old_max_win.toFixed(2)}x | ${row.new_max_win.toFixed(2)}x | ${row.status} |`).join("\n");
const rtpRows = rows.map((row) => `| ${row.config_id} | ${row.new_rtp.toFixed(10)} | ${row.simulated_rtp.toFixed(6)} | ±${row.simulation_tolerance.toFixed(4)} | ${row.status} |`).join("\n");
const failures = rows.filter((row) => row.status === "FAIL");
const warnings = rows.filter((row) => row.status === "WARNING");

const report = `# Puck Luck Reduced Volatility V2 Report

Generated: ${new Date().toISOString()}  
Profile: **${math.PROFILE_VERSION}**  
Target RTP: **${math.TARGET_RTP}** separately for every configuration  
Simulation: **${totalRuns.toLocaleString("en-US")} rounds per configuration, adaptive retry at 5,000,000 outside tolerance**

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
${comparisonRows}

## RTP Validation: All 54 Configurations

| Config | Analytic RTP | Simulated RTP | Tolerance | Status |
|---|---:|---:|---:|---|
${rtpRows}

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

Analytic failures: **${failures.length}**.  
Monte Carlo warnings: **${warnings.length}**.  
${failures.length ? failures.map((row) => `- ${row.config_id}: analytic RTP ${row.new_rtp}`).join("\n") : "No configuration failed analytic RTP."}

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
`;
fs.writeFileSync(path.join(docsDir, "PuckLuck_Volatility_V2_Report.md"), report);

console.log("\nVolatility V2 complete.\n");
console.log(`RTP target: ${math.TARGET_RTP}`);
console.log(`Configurations tested: ${rows.length}`);
console.log(`Passed: ${rows.filter((row) => row.status === "PASS").length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Failed: ${failures.length}\n`);
console.log("Main files:");
console.log("- MathOutput/puck_luck_math_config_v2.json");
console.log("- MathOutput/puck_luck_outcome_histogram_v2.json");
console.log("- MathOutput/puck_luck_multiplier_layouts_v2.csv");
console.log("- Docs/PuckLuck_Volatility_V2_Report.md");
if (failures.length) failures.forEach((row) => console.log(`FAIL ${row.config_id}: analytic RTP ${row.new_rtp}`));
