"use strict";

// Reproducible Monte Carlo check for the paid first shot in Treasure mode.
// The following shots are free continuations; the math unit tests separately
// verify the conditional RTP ladder after each safe reveal.
const math = require("./balloro-treasure-math.js");

const BETS_PER_LINE = 10_000_000;

function createLcg(seed) {
  let value = seed >>> 0 || 0x9e3779b9;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function selectByProbability(items, random) {
  let cursor = random();
  for (const item of items) {
    cursor -= item.probability;
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
}

function simulateLine(lines) {
  const round = math.createRound({ lines, pucks: 1, seed: 0x51e7 + lines, bet: 1 });
  const probabilities = math.selectionProbabilities(round);
  const expectedRtp = probabilities.reduce(
    (sum, item) => sum + item.probability * math.candidateCashoutMultiplier(round, item.cell),
    0
  );
  if (Math.abs(expectedRtp - math.TARGET_RTP) > 1e-12) {
    throw new Error(`Expected RTP drift on ${lines} lines: ${expectedRtp}`);
  }

  const random = createLcg(0x9e3779b9 ^ lines * 0x45d9f3b);
  let totalPayout = 0;
  let wins = 0;
  for (let bet = 0; bet < BETS_PER_LINE; bet += 1) {
    const selected = selectByProbability(probabilities, random);
    const payoutMultiplier = math.candidateCashoutMultiplier(round, selected.cell);
    totalPayout += payoutMultiplier;
    if (payoutMultiplier > 0) wins += 1;
  }

  const simulatedRtp = totalPayout / BETS_PER_LINE;
  return {
    lines,
    bets: BETS_PER_LINE,
    target_rtp: math.TARGET_RTP,
    expected_rtp: Number(expectedRtp.toFixed(12)),
    simulated_rtp: Number(simulatedRtp.toFixed(8)),
    deviation: Number((simulatedRtp - math.TARGET_RTP).toFixed(8)),
    hit_rate: Number((wins / BETS_PER_LINE).toFixed(8))
  };
}

const rows = math.LINE_COUNTS.map(simulateLine);
console.log(JSON.stringify(rows, null, 2));
