#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const math = require("./puck-luck-math.js");

const columns = [
  "config_id", "risk", "lines", "pucks", "row", "col", "cell_id",
  "category", "multiplier", "display_multiplier", "is_empty"
];
const rows = [columns];

for (const config of math.CONFIGURATIONS) {
  const categoryByCell = new Map();
  for (const [category, sectors] of Object.entries(config.sector_definitions)) {
    for (const sector of sectors) {
      if (sector.index >= 0) categoryByCell.set(`${sector.col}_${sector.row}`, { category, sector });
    }
  }
  for (let row = 0; row < config.lines; row += 1) {
    for (let col = 0; col < config.lines; col += 1) {
      const cellId = `${col}_${row}`;
      const definition = categoryByCell.get(cellId);
      const category = definition?.category || "empty";
      const multiplier = definition?.sector?.multiplier ?? config.multiplier_table[category] ?? 0;
      rows.push([
        config.id, config.risk, config.lines, config.pucks, row, col, cellId,
        category, multiplier, `${multiplier.toFixed(2)}x`, multiplier === 0
      ]);
    }
  }
}

function csvCell(value) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const output = rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
const outputPath = path.join(__dirname, "..", "MathOutput", "puck_luck_multiplier_layouts.csv");
fs.writeFileSync(outputPath, output);
console.log(`Multiplier layout CSV: ${rows.length - 1} cells across ${math.CONFIGURATIONS.length} configurations`);
