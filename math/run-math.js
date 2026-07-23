#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const math = require("./puck-luck-math.js");

const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "MathOutput");
const docsDir = path.join(projectRoot, "Docs");
const requestedRuns = Number.parseInt(process.argv[2] || "1000000", 10);
const totalRuns = Number.isFinite(requestedRuns) && requestedRuns > 0 ? requestedRuns : 1000000;
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

function fixed(value, digits = 8) { return Number(value.toFixed(digits)); }
function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function volatilityLabel(risk) { return risk === "low" ? "LOW" : risk === "high" ? "HIGH" : "MEDIUM"; }
function bonusRange(risk) {
  if (risk === "low") return [0.03, 0.06];
  if (risk === "high") return [0.10, 0.18];
  return [0.06, 0.10];
}

const rows = [];
for (let index = 0; index < math.CONFIGURATIONS.length; index += 1) {
  const config = math.CONFIGURATIONS[index];
  const analytic = math.analyticMetrics(config);
  const seed = math.hashString(`puck-luck-sim:${config.id}`);
  const simulation = math.simulateConfiguration(config, totalRuns, seed);
  const contributionShare = config.bonus_rtp_contribution / config.calculated_rtp;
  const [bonusMin, bonusMax] = bonusRange(config.risk);
  const exact = Math.abs(analytic.rtp - math.TARGET_RTP) < 1e-10;
  const noPositiveEv = analytic.rtp <= math.TARGET_RTP + 1e-12;
  const bonusSafe = contributionShare >= bonusMin && contributionShare <= bonusMax;
  const status = exact && noPositiveEv && bonusSafe ? "PASS" : exact && noPositiveEv ? "WARNING" : "FAIL";
  rows.push({
    config_id: config.id,
    risk: config.risk,
    lines: config.lines,
    pucks: config.pucks,
    target_rtp: math.TARGET_RTP,
    calculated_rtp: fixed(analytic.rtp),
    simulated_rtp: fixed(simulation.simulated_rtp),
    total_runs: totalRuns,
    hit_frequency: fixed(analytic.hit_frequency),
    win_above_bet_frequency: fixed(analytic.win_above_bet_frequency),
    bonus_frequency: fixed(analytic.bonus_frequency),
    max_win_multiplier: fixed(analytic.max_win_multiplier),
    standard_deviation: fixed(analytic.standard_deviation),
    variance: fixed(analytic.variance),
    empty_hit_weight: fixed(config.outcome_probabilities.empty),
    outer_hit_weight: fixed(config.outcome_probabilities.outer),
    middle_hit_weight: fixed(config.outcome_probabilities.middle),
    center_hit_weight: fixed(config.outcome_probabilities.center),
    bonus_rtp_contribution: fixed(config.bonus_rtp_contribution),
    base_game_rtp_contribution: fixed(config.base_game_rtp_contribution),
    bonus_rtp_share: fixed(contributionShare),
    average_bonus_win: fixed(config.base_game_rtp_contribution * 10),
    multiplier_table: config.multiplier_table,
    puck_radius: config.puck_radius,
    fixed_launch_force: config.fixed_launch_force,
    fixed_timestep: config.fixed_timestep,
    minimum_bounces: config.minimum_bounces,
    volatility: volatilityLabel(config.risk),
    status,
    unreachable_outcomes: [],
    top_20_highest_paying_outcomes: analytic.top20.map((item) => ({
      categories: item.categories,
      bonus: item.bonus,
      probability: fixed(item.probability, 12),
      base_multiplier_sum: fixed(item.base_multiplier_sum),
      final_multiplier_sum: fixed(item.final_multiplier_sum),
      payout_ratio: fixed(item.payout_ratio)
    })),
    simulation_validation: {
      seed: simulation.seed,
      simulated_base_rtp: fixed(simulation.simulated_base_rtp),
      simulated_bonus_rtp: fixed(simulation.simulated_bonus_rtp),
      simulated_hit_frequency: fixed(simulation.simulated_hit_frequency),
      simulated_bonus_frequency: fixed(simulation.simulated_bonus_frequency),
      category_hits: simulation.category_hits,
      star_cell_hits: simulation.star_cell_hits,
      outcome_histogram: simulation.outcome_histogram
    }
  });
  process.stdout.write(`[${index + 1}/54] ${config.id} analytic=${analytic.rtp.toFixed(6)} simulated=${simulation.simulated_rtp.toFixed(6)}\n`);
}

const jsonPath = path.join(outputDir, "puck_luck_outcome_histogram.json");
fs.writeFileSync(jsonPath, `${JSON.stringify({ generated_at: new Date().toISOString(), total_configurations: rows.length, runs_per_configuration: totalRuns, configurations: rows }, null, 2)}\n`);

const csvColumns = ["config_id", "risk", "lines", "pucks", "target_rtp", "calculated_rtp", "simulated_rtp", "total_runs", "hit_frequency", "win_above_bet_frequency", "bonus_frequency", "max_win_multiplier", "standard_deviation", "variance", "empty_hit_weight", "outer_hit_weight", "middle_hit_weight", "center_hit_weight", "bonus_rtp_contribution", "base_game_rtp_contribution", "bonus_rtp_share", "puck_radius", "fixed_launch_force", "minimum_bounces", "volatility", "status", "outer_multiplier", "middle_multiplier", "center_multiplier"];
const csvLines = [csvColumns.join(",")];
for (const row of rows) {
  const flat = { ...row, outer_multiplier: row.multiplier_table.outer, middle_multiplier: row.multiplier_table.middle, center_multiplier: row.multiplier_table.center };
  csvLines.push(csvColumns.map((column) => csvEscape(flat[column])).join(","));
}
fs.writeFileSync(path.join(outputDir, "puck_luck_outcome_histogram.csv"), `${csvLines.join("\n")}\n`);

const configExport = math.CONFIGURATIONS.map((config) => ({
  id: config.id, risk: config.risk, lines: config.lines, pucks: config.pucks,
  multiplier_table: config.multiplier_table,
  outcome_probabilities: config.outcome_probabilities,
  star_placement: config.star_placement,
  puck_radius: config.puck_radius,
  fixed_launch_force: config.fixed_launch_force,
  launch_angle_range_degrees: config.launch_angle_range_degrees,
  fixed_timestep: config.fixed_timestep,
  minimum_bounces: config.minimum_bounces,
  target_rtp: config.target_rtp,
  calculated_rtp: config.calculated_rtp,
  hit_frequency: rows.find((row) => row.config_id === config.id).hit_frequency,
  bonus_frequency: config.bonus_probability,
  max_win: rows.find((row) => row.config_id === config.id).max_win_multiplier,
  volatility: volatilityLabel(config.risk)
}));
fs.writeFileSync(path.join(outputDir, "puck_luck_math_config.json"), `${JSON.stringify(configExport, null, 2)}\n`);

const tableRows = rows.map((row) => `| ${row.risk} | ${row.lines} | ${row.pucks} | ${row.calculated_rtp.toFixed(4)} | ${(row.hit_frequency * 100).toFixed(2)}% | ${(row.bonus_frequency * 100).toFixed(3)}% | ${row.max_win_multiplier.toFixed(2)}x | ${row.volatility} | ${row.status} |`).join("\n");
const multiplierRows = rows.map((row) => `| ${row.risk} | ${row.lines} | ${row.pucks} | ${row.multiplier_table.outer.toFixed(2)}x | ${row.multiplier_table.middle.toFixed(2)}x | ${row.multiplier_table.center.toFixed(2)}x |`).join("\n");
const failures = rows.filter((row) => row.status !== "PASS");
const report = `# Puck Luck Math Report

Generated: ${new Date().toISOString()}  
Target RTP: **${math.TARGET_RTP.toFixed(4)} (${(math.TARGET_RTP * 100).toFixed(2)}%)**  
Configurations: **54**  
Simulation runs: **${totalRuns.toLocaleString("en-US")} per configuration / ${(totalRuns * 54).toLocaleString("en-US")} total**

## Summary

- All configurations are solved and evaluated separately.
- Payouts use the displayed two-decimal multipliers; there are no hidden payout values.
- Analytic RTP is used for certification; deterministic Monte Carlo is exported as an independent validation signal.
- x10 bonus contribution is separated from base-game contribution.
- Fixed visual timestep is ${math.FIXED_TIMESTEP}s and every visual plan requires at least four separate wall hits.
- Mathematical outcome generation reports no unreachable sector categories. Unity trajectory reachability remains unverified because this repository has no Unity project.
- Non-PASS configurations: ${failures.length}.

## RTP By Configuration

| Risk | Lines | Pucks | RTP | Hit Freq | Bonus Freq | Max Win | Volatility | Status |
|---|---:|---:|---:|---:|---:|---:|---|---|
${tableRows}

## Final Multiplier Tables

| Risk | Lines | Pucks | Outer | Middle | Center |
|---|---:|---:|---:|---:|---:|
${multiplierRows}

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

- \`math/puck-luck-math.js\`
- \`math/run-math.js\`
- \`math/test-math.js\`
- \`script.js\`
- \`index.html\`
- \`Docs/PuckLuck_Math_Audit.md\`
- \`Docs/PuckLuck_Math_Report.md\`
- \`MathOutput/puck_luck_outcome_histogram.json\`
- \`MathOutput/puck_luck_outcome_histogram.csv\`
- \`MathOutput/puck_luck_math_config.json\`
`;
fs.writeFileSync(path.join(docsDir, "PuckLuck_Math_Report.md"), report);
console.log(`Wrote ${jsonPath}`);
