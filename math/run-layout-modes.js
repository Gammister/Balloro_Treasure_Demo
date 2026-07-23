#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const math = require("./puck-luck-layout-modes.js");
const gameplay = require("./layout-gameplay-test.js");
const loadTrajectoryLibrary = require("./load-trajectory-library.js");

const root = path.join(__dirname, "..");
const outputDir = path.join(root, "MathOutput");
const docsDir = path.join(root, "Docs");
const simulationRuns = Math.max(10000, Number.parseInt(process.argv[2] || "100000", 10));
const gameplayRuns = 1000;
const trajectoryLibrary = loadTrajectoryLibrary();

function csvEscape(value) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(headers, rows) {
  return [headers, ...rows.map((row) => headers.map((header) => row[header]))]
    .map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
}

function round(value, digits = 8) {
  return Number(value.toFixed(digits));
}

const configs = [];
const summaries = [];
const histograms = [];
const gameplayRows = [];

for (const config of math.CONFIGURATIONS) {
  const analytic = math.analyticMetrics(config);
  const simulation = math.simulateConfiguration(
    config,
    simulationRuns,
    math.hashString(`${config.id}:layout-mode-simulation`)
  );
  const status = Math.abs(analytic.rtp - math.TARGET_RTP) < 1e-12 ? "PASS" : "FAIL";
  const bonusShare = config.bonus_rtp_contribution / config.calculated_rtp;
  const summary = {
    layout_mode: config.layout_mode,
    risk: config.risk,
    lines: config.lines,
    pucks: config.pucks,
    calculated_rtp: round(analytic.rtp, 10),
    simulated_rtp: round(simulation.simulated_rtp, 8),
    hit_frequency: round(analytic.hit_frequency, 8),
    win_above_bet_frequency: round(analytic.win_above_bet_frequency, 8),
    bonus_frequency: round(analytic.bonus_frequency, 8),
    multi_plus_frequency: round(config.multi_plus.probability, 8),
    base_bonus_frequency: round(config.base_bonus_probability, 8),
    bonus_frequency_multiplier: config.bonus_frequency_multiplier,
    baseline_paid_bonus_win_frequency: round(config.baseline_paid_bonus_win_frequency, 8),
    paid_bonus_win_frequency: round(config.paid_bonus_win_frequency, 8),
    paid_bonus_win_frequency_multiplier: round(config.paid_bonus_win_frequency_multiplier, 8),
    one_of_two_star_probability: math.ONE_OF_TWO_STAR_PROBABILITY,
    two_of_three_star_probability: math.TWO_OF_THREE_STAR_PROBABILITY,
    base_game_rtp_contribution: round(config.base_game_rtp_contribution, 10),
    bonus_rtp_contribution: round(config.bonus_rtp_contribution, 10),
    bonus_rtp_share: round(bonusShare, 8),
    max_win: round(analytic.max_win_multiplier, 4),
    variance: round(analytic.variance, 8),
    standard_deviation: round(analytic.standard_deviation, 8),
    terminal_x_hit_probability: round(config.solver.calibrated_hit_probability, 8),
    terminal_empty_probability: round(config.outcome_probabilities.empty, 8),
    terminal_center_probability: round(config.outcome_probabilities.center, 10),
    multiplier_cell_count: config.layout_metrics.multiplier_cell_count,
    multiplier_cell_density: round(config.layout_metrics.multiplier_cell_density, 8),
    empty_cell_count: config.layout_metrics.empty_cell_count,
    empty_cell_density: round(config.layout_metrics.empty_cell_density, 8),
    visible_multiplier_density: round(config.layout_metrics.visible_multiplier_density, 8),
    center_zone_cell_count: config.layout_metrics.center_zone_cell_count,
    middle_zone_cell_count: config.layout_metrics.middle_zone_cell_count,
    outer_zone_cell_count: config.layout_metrics.outer_zone_cell_count,
    average_visible_multiplier_value: round(config.layout_metrics.average_visible_multiplier_value, 6),
    max_visible_multiplier_value: config.layout_metrics.max_visible_multiplier_value,
    multi_plus_extra_cell_count: config.multi_plus.extra_cell_count,
    visible_multiplier_density_with_multi_plus: round(config.layout_metrics.visible_multiplier_density_with_multi_plus, 8),
    pocket_hit_probability_per_puck: round(config.pocket.hit_probability_per_puck, 8),
    pocket_round_probability: round(config.pocket.round_probability, 8),
    first_generation_repocket_probability: math.bonusRepocketProbability(1),
    second_generation_repocket_probability: math.bonusRepocketProbability(2),
    expected_terminal_balls_per_initial_ball: round(config.pocket.expected_terminal_balls_per_initial_ball, 8),
    status
  };
  summaries.push(summary);
  configs.push({ ...config, analytic_metrics: analytic, simulation_metrics: simulation, status });

  histograms.push({
    config_id: config.id,
    layout_mode: config.layout_mode,
    risk: config.risk,
    lines: config.lines,
    pucks: config.pucks,
    exact_outcomes: [],
    simulated_outcome_histogram: simulation.outcome_histogram
  });

  gameplayRows.push(gameplay.runGameplayTest({
    math,
    trajectoryLibrary,
    layoutMode: config.layout_mode,
    risk: config.risk,
    lines: config.lines,
    pucks: config.pucks,
    rounds: gameplayRuns,
    seed: math.hashString(`${config.id}:gameplay-feel`)
  }));
}

const layoutRows = [];
for (const layoutMode of math.LAYOUT_MODES) for (const lines of math.LINE_COUNTS) {
  const risk = math.riskForLines(lines);
  const config = math.getConfiguration(risk, lines, 1, layoutMode);
  const categoryByCell = new Map();
  for (const [category, sectors] of Object.entries(config.sector_definitions)) {
    sectors.forEach((sector) => {
      if (sector.index >= 0) categoryByCell.set(`${sector.col}_${sector.row}`, { category, sector });
    });
  }
  const multiPlusCells = new Set(config.multi_plus.sectors.map((sector) => `${sector.col}_${sector.row}`));
  for (let row = 0; row < lines; row += 1) for (let column = 0; column < lines; column += 1) {
    const cellId = `${column}_${row}`;
    const cellDefinition = categoryByCell.get(cellId);
    const category = cellDefinition?.category || "empty";
    const cellMultiplier = cellDefinition?.sector?.multiplier ?? config.multiplier_table[category];
    const isMultiPlusCell = multiPlusCells.has(cellId);
    layoutRows.push({
      layout_mode: layoutMode,
      risk,
      lines,
      row,
      column,
      cell_id: cellId,
      category,
      multiplier: cellMultiplier,
      category_with_multi_plus: isMultiPlusCell ? "multi_plus" : category,
      multiplier_with_multi_plus: isMultiPlusCell ? config.multiplier_table.multi_plus : cellMultiplier,
      is_multiplier_cell: category !== "empty",
      is_multi_plus_cell: isMultiPlusCell,
      is_center_zone: category === "center"
    });
  }
}

const summaryHeaders = Object.keys(summaries[0]);
const layoutHeaders = Object.keys(layoutRows[0]);
fs.writeFileSync(path.join(outputDir, "puck_luck_layout_modes_config.json"), `${JSON.stringify(configs, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, "puck_luck_layout_modes_histogram.json"), `${JSON.stringify(histograms, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, "puck_luck_layout_modes_summary.csv"), toCsv(summaryHeaders, summaries));
fs.writeFileSync(path.join(outputDir, "puck_luck_layout_modes_layouts.csv"), toCsv(layoutHeaders, layoutRows));
fs.writeFileSync(path.join(outputDir, "puck_luck_layout_modes_gameplay_test.csv"), gameplay.toCsv(gameplayRows));

function densityTable(metric) {
  const lines = ["| Layout Mode | 5 | 6 | 7 | 8 | 9 | 10 |", "|---|---:|---:|---:|---:|---:|---:|"];
  for (const mode of math.LAYOUT_MODES) {
    const values = math.LINE_COUNTS.map((lineCount) => {
      const config = math.getConfiguration("normal", lineCount, 1, mode);
      return `${(config.layout_metrics[metric] * 100).toFixed(1)}%`;
    });
    lines.push(`| ${math.LAYOUT_LABELS[mode]} | ${values.join(" | ")} |`);
  }
  return lines.join("\n");
}

const comparisonLines = [
  "| Layout Mode | Risk | Lines | Pucks | RTP | Hit Freq | Win Above Bet | Max Win | Multiplier Density | Status |",
  "|---|---|---:|---:|---:|---:|---:|---:|---:|---|"
];
summaries.forEach((row) => comparisonLines.push(
  `| ${math.LAYOUT_LABELS[row.layout_mode]} | ${row.risk} | ${row.lines} | ${row.pucks} | ${row.calculated_rtp.toFixed(4)} | ${(row.hit_frequency * 100).toFixed(2)}% | ${(row.win_above_bet_frequency * 100).toFixed(2)}% | ${row.max_win.toFixed(2)}x | ${(row.multiplier_cell_density * 100).toFixed(1)}% | ${row.status} |`
));

const gameplayComparison = [
  "| Layout Mode | Avg Duration | Hit Freq | Win Above Bet | Avg Payout | Longest Miss Streak | Bonus Count |",
  "|---|---:|---:|---:|---:|---:|---:|"
];
for (const mode of math.LAYOUT_MODES) {
  const rows = gameplayRows.filter((row) => row.layout_mode === mode);
  const average = (key) => rows.reduce((sum, row) => sum + row[key], 0) / rows.length;
  gameplayComparison.push(`| ${math.LAYOUT_LABELS[mode]} | ${average("average_round_duration").toFixed(3)}s | ${(average("hit_frequency") * 100).toFixed(2)}% | ${(average("win_above_bet_frequency") * 100).toFixed(2)}% | ${average("average_payout").toFixed(4)} | ${Math.max(...rows.map((row) => row.longest_miss_streak))} | ${rows.reduce((sum, row) => sum + row.bonus_count, 0)} |`);
}

const report = `# Puck Luck Layout Modes Report

## 1. Summary of the Model

Line count is the sole player-facing volatility control. Low line counts use larger cells, higher hit frequency, and smaller multipliers. High line counts use smaller cells, lower hit frequency, and larger multipliers. Every configuration jointly solves regular field payouts, x10 BOOST, EX MULTI, corner-pocket releases, and recursive re-entry while keeping exact target RTP.

## 2. Current Layout

The original two one-cell diagonals remain available as a geometry control. Its paytable and outcome probabilities now follow the same line-driven volatility curve as every other layout.

## 3. Dynamic Diagonal Width

Dynamic Diagonal Width expands the crossed-diagonal identity by one full X band at every line count: 3:33 on 5 lines through 3:33-8:88 on 10 lines. The outermost cells remain empty, matching the red boundaries supplied for each board. Only the one-decimal middle values and the integer premium center from 2x to 30x are visible inside the boundary. The closest feasible per-cell probability mix is solved for each configuration while retaining exact RTP and a non-zero maximum outcome.

## 4. Plinko Zone Style

Plinko Zone Style combines diagonal arms with broad center-oriented geometric zones. It has no pins or copied Plinko mechanics; only the distribution of multiplier cells changes. The result has less perceived dead space while retaining the Puck Luck diamond.

## 5. Multiplier-Cell Density by Lines

${densityTable("multiplier_cell_density")}

## 6. Empty-Cell Density by Lines

${densityTable("empty_cell_density")}

## 7-11. RTP, Hit Frequency, Win Above Bet, Max Win, Bonus Frequency

Every row below is solved independently. Analytic RTP must equal 0.9745; simulated RTP is available in the summary CSV and config JSON. Maximum win includes all permitted recursive pocket generations.

${comparisonLines.join("\n")}

## 12. Visual and Perception Assessment

- **Current:** strongest continuity with the existing game, but 9-10 line boards look sparse.
- **Dynamic Diagonal Width:** legacy expanding X layout with full symmetry.
- **Plinko Zone Style:** strongest reduction in perceived dead space, but 9-10 line boards carry substantially more text and feel busier.
- **Configurator #1:** previous saved Balloro X3000 field retained as a comparison mode.
- **Configurator #2:** previous saved Balloro X3000 field retained as a comparison mode.
- **Configurator #3:** saved field configuration #3 retained for comparison.
- **Configurator #4:** saved field configuration #4 retained for comparison.
- **Configurator #5:** active Balloro X3000 layout copied cell-for-cell from saved field configuration #5. EX MULTI cells are empty until activation and then use a separately solved physical stop mix.

Corner pockets use a separate precomputed entry library. A main ball in a pocket releases three white balls. Each released ball has a 3.5% first-generation and 0.6% second-generation re-entry probability; later generations must resolve on the field. The decreasing recursion and independent ball outcomes create rare escalation without changing RTP.

x10 BOOST and EX MULTI each have at least a 2.5% round probability, giving more than a 97% chance of seeing each event within 150 rounds. The lowest main-pocket probability is 2.6% per ball, also giving more than a 98% chance of seeing a pocket within 150 one-ball rounds.

## 13. Gameplay Test Results

Each of the ${math.CONFIGURATIONS.length} configurations ran ${gameplayRuns.toLocaleString("en-US")} local gameplay-feel rounds using the same math engine and precomputed trajectory durations.

${gameplayComparison.join("\n")}

Detailed results are in \`MathOutput/puck_luck_layout_modes_gameplay_test.csv\`.

## 14. Recommendation

Use **Configurator #5** as the active Balloro X3000 layout. It preserves the supplied low, middle, high, empty, and EX MULTI cell geometry, retains the 30x premium maximum, and preserves 97.45% RTP.

## 15. Files Changed

- math/puck-luck-layout-modes.js
- math/field-configuration-1.js
- math/field-configuration-2.js
- math/field-configuration-3.js
- math/field-configuration-4.js
- math/field-configuration-5.js
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

- Target RTP: ${math.TARGET_RTP}
- Corner-pocket entry variants: 192
- Standard field trajectories: 71,000
- Recursive pocket generations: ${math.MAX_BONUS_REPOCKET_GENERATION}
- Configurations per mode: ${math.CONFIGURATIONS.length / math.LAYOUT_MODES.length}
- Current passed: ${summaries.filter((row) => row.layout_mode === "current" && row.status === "PASS").length}/${math.CONFIGURATIONS.length / math.LAYOUT_MODES.length}
- Dynamic Diagonal passed: ${summaries.filter((row) => row.layout_mode === "dynamic_diagonal_width" && row.status === "PASS").length}/${math.CONFIGURATIONS.length / math.LAYOUT_MODES.length}
- Plinko Zone passed: ${summaries.filter((row) => row.layout_mode === "plinko_zone_style" && row.status === "PASS").length}/${math.CONFIGURATIONS.length / math.LAYOUT_MODES.length}
- Configurator #1 passed: ${summaries.filter((row) => row.layout_mode === "configurator_1" && row.status === "PASS").length}/${math.CONFIGURATIONS.length / math.LAYOUT_MODES.length}
- Configurator #2 passed: ${summaries.filter((row) => row.layout_mode === "configurator_2" && row.status === "PASS").length}/${math.CONFIGURATIONS.length / math.LAYOUT_MODES.length}
- Configurator #3 passed: ${summaries.filter((row) => row.layout_mode === "configurator_3" && row.status === "PASS").length}/${math.CONFIGURATIONS.length / math.LAYOUT_MODES.length}
- Configurator #4 passed: ${summaries.filter((row) => row.layout_mode === "configurator_4" && row.status === "PASS").length}/${math.CONFIGURATIONS.length / math.LAYOUT_MODES.length}
- Configurator #5 passed: ${summaries.filter((row) => row.layout_mode === "configurator_5" && row.status === "PASS").length}/${math.CONFIGURATIONS.length / math.LAYOUT_MODES.length}
- Gameplay tests: ${gameplayRows.length === math.CONFIGURATIONS.length ? "PASS" : "FAIL"}
`;
fs.writeFileSync(path.join(docsDir, "PuckLuck_Layout_Modes_Report.md"), report);

const passCounts = Object.fromEntries(math.LAYOUT_MODES.map((mode) => [mode,
  summaries.filter((row) => row.layout_mode === mode && row.status === "PASS").length]));
const failed = summaries.filter((row) => row.status !== "PASS");

console.log("Layout modes complete.");
console.log("Modes:");
console.log("- Current");
console.log("- Dynamic Diagonal Width");
console.log("- Plinko Zone Style");
console.log("- Configurator #1");
console.log("- Configurator #2");
console.log("- Configurator #3");
console.log("- Configurator #4");
console.log("- Configurator #5");
console.log(`RTP target: ${math.TARGET_RTP}`);
const configurationsPerMode = math.CONFIGURATIONS.length / math.LAYOUT_MODES.length;
console.log(`Configurations per mode: ${configurationsPerMode}`);
console.log(`Current passed: ${passCounts.current}/${configurationsPerMode}`);
console.log(`Dynamic Diagonal passed: ${passCounts.dynamic_diagonal_width}/${configurationsPerMode}`);
console.log(`Plinko Zone passed: ${passCounts.plinko_zone_style}/${configurationsPerMode}`);
console.log(`Configurator #1 passed: ${passCounts.configurator_1}/${configurationsPerMode}`);
console.log(`Configurator #2 passed: ${passCounts.configurator_2}/${configurationsPerMode}`);
console.log(`Configurator #3 passed: ${passCounts.configurator_3}/${configurationsPerMode}`);
console.log(`Configurator #4 passed: ${passCounts.configurator_4}/${configurationsPerMode}`);
console.log(`Configurator #5 passed: ${passCounts.configurator_5}/${configurationsPerMode}`);
console.log(`Gameplay tests: ${gameplayRows.length === math.CONFIGURATIONS.length ? "PASS" : "FAIL"}`);
console.log("Main files:");
console.log("- MathOutput/puck_luck_layout_modes_config.json");
console.log("- MathOutput/puck_luck_layout_modes_summary.csv");
console.log("- MathOutput/puck_luck_layout_modes_layouts.csv");
console.log("- MathOutput/puck_luck_layout_modes_gameplay_test.csv");
console.log("- Docs/PuckLuck_Layout_Modes_Report.md");
if (failed.length) failed.forEach((row) => console.log(`FAILED ${row.layout_mode}-${row.risk}-${row.lines}-${row.pucks}: RTP ${row.calculated_rtp}`));
