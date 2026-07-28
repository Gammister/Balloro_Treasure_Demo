"use strict";

const assert = require("assert");
const math = require("./balloro-treasure-math.js");

assert.strictEqual(math.TARGET_RTP, 0.9745);
assert.strictEqual(math.DIAMONDS_REQUIRED, 3);
assert.deepStrictEqual(math.LOSS_CELL_COUNTS, { 5: 6, 6: 11, 7: 17, 8: 26, 9: 33, 10: 45 });

for (const lines of math.LINE_COUNTS) {
  for (const pucks of [1, 2, 3]) {
    const round = math.createRound({ lines, pucks, seed: 12345 + pucks, bet: 1 });
    assert.strictEqual(round.cells.length, lines * lines);
    assert.strictEqual(round.cells.filter((cell) => cell.kind === "loss").length, math.LOSS_CELL_COUNTS[lines]);
    assert.strictEqual(round.cells.filter((cell) => cell.kind === "red").length, 0);
    assert.strictEqual(round.cells.filter((cell) => cell.kind === "empty").length, 0);
    assert.strictEqual(round.cells.filter((cell) => cell.kind === "diamond").length, math.DIAMONDS_REQUIRED);
    assert.strictEqual(round.cells.filter((cell) => cell.kind === "pocket").length, 1);
    assert.ok(round.cells.filter((cell) => cell.kind !== "loss")
      .every((cell) => ["multiplier", "diamond", "pocket"].includes(cell.kind)),
      `${lines} lines must keep every dark-green cell safe and content-bearing`);
    const multiplierCells = round.cells.filter((cell) => cell.kind === "multiplier" && !cell.neutral);
    const neutralCells = round.cells.filter((cell) => cell.kind === "multiplier" && cell.neutral);
    assert.ok(multiplierCells.every((cell) => cell.displayMultiplier > 1));
    assert.strictEqual(neutralCells.length, 0,
      `${lines} lines must not contain a safe no-op outcome`);
    const greenHighCount = multiplierCells.filter((cell) => !cell.purpleOnly && cell.tier === "high").length;
    const purpleHighCount = multiplierCells.filter((cell) => cell.purpleOnly && cell.tier === "high").length;
    assert.strictEqual(greenHighCount, math.GREEN_TIER_COUNTS[lines].high,
      `${lines} lines must use the adaptive high-tier count`);
    assert.strictEqual(purpleHighCount, 0, `${lines} lines must keep high values unique to the green field`);
    for (const tier of ["low", "medium", "high"]) {
      assert.strictEqual(
        multiplierCells.filter((cell) => !cell.purpleOnly && cell.tier === tier).length,
        math.GREEN_TIER_COUNTS[lines][tier],
        `${lines} lines must use the disclosed green ${tier} count`
      );
    }
    assert.ok(Math.abs(round.purpleWinShare - math.PURPLE_WIN_SHARE) < 0.03,
      `${lines} lines / ${pucks} balls purple multiplier budget share`);
    assert.ok(round.greenMultiplierCellCount < round.cells.filter((cell) => cell.kind === "multiplier").length);
    assert.strictEqual(new Set(round.cells.map((cell) => `${cell.col}_${cell.row}`)).size, lines * lines);
    const initialDistribution = math.selectionProbabilities(round);
    const initialProbability = initialDistribution.reduce((sum, item) => sum + item.probability, 0);
    const initialLossProbability = initialDistribution
      .filter((item) => item.cell.kind === "loss")
      .reduce((sum, item) => sum + item.probability, 0);
    const initialExpectedCashout = initialDistribution.reduce((sum, item) =>
      sum + item.probability * math.candidateCashoutMultiplier(round, item.cell), 0);
    assert.ok(Math.abs(initialProbability - 1) < 1e-12, `${lines} lines / ${pucks} balls probabilities`);
    assert.ok(Math.abs(initialLossProbability
      - math.LOSS_CELL_COUNTS[lines] / (lines * lines) * math.LOSS_HIT_PROBABILITY_SCALE) < 1e-12,
      `${lines} lines / ${pucks} balls black-loss probability must preserve the calibrated risk scale`);
    assert.ok(Math.abs(initialExpectedCashout - math.TARGET_RTP) < 1e-12,
      `${lines} lines / ${pucks} balls multiplicative cashout RTP`);
    assert.ok(Math.abs(math.conditionalExpectedRatio(round) - 1) < 1e-12,
      `${lines} lines / ${pucks} balls must begin conditionally RTP-neutral`);

    const safeOrder = round.cells.filter((cell) => !math.isLossOutcome(cell));
    for (const cell of safeOrder) {
      assert.ok(Math.abs(math.conditionalExpectedRatio(round) - 1) < 1e-12,
        `${lines} lines / ${pucks} balls / reveal ${round.safeOpened + 1} must remain RTP-neutral`);
      math.revealCell(round, cell.index);
      assert.strictEqual(round.cashoutMultiplier, math.playerCashoutMultiplier(round),
        `${lines} lines / ${pucks} balls authoritative cashout must equal multiplicative player cashout`);
      if (!round.active) break;
    }
    assert.strictEqual(round.diamondsCollected, math.DIAMONDS_REQUIRED);
    assert.strictEqual(round.boostActive, true);
    assert.ok(round.cells.filter((cell) => cell.kind === "multiplier" && !cell.neutral)
      .every((cell) => cell.displayMultiplier === cell.baseMultiplier * math.BOOST_MULTIPLIER));
    assert.ok(Math.max(...round.cells
      .filter((cell) => cell.kind === "multiplier" && !cell.neutral)
      .map((cell) => cell.displayMultiplier)) <= 100,
      `${lines} lines must cap the displayed x10 multiplier at 100x`);
    const repeatMultiplier = round.cells.find((cell) =>
      cell.kind === "multiplier" && !cell.neutral && cell.opened);
    const openedCountBeforeRepeat = round.openedCount;
    const diamondsBeforeRepeat = round.diamondsCollected;
    assert.ok(Math.abs(math.conditionalExpectedRatio(round) - 1) < 1e-12,
      `${lines} lines / ${pucks} balls must remain RTP-neutral with opened cells selectable`);
    math.revealCell(round, repeatMultiplier.index);
    assert.strictEqual(repeatMultiplier.landingCount, 2);
    assert.strictEqual(round.openedCount, openedCountBeforeRepeat);
    assert.strictEqual(round.diamondsCollected, diamondsBeforeRepeat);
    const openedDiamond = round.cells.find((cell) => cell.kind === "diamond" && cell.opened);
    assert.strictEqual(math.rawCellWeight(round, openedDiamond), 0,
      "an opened diamond cell must become a black-loss repeat landing");
    const forcedRepeat = math.selectShotCells(
      round,
      1,
      777,
      round.cells.filter((cell) => cell.index !== repeatMultiplier.index).map((cell) => cell.index)
    );
    assert.strictEqual(forcedRepeat[0].index, repeatMultiplier.index,
      "opened safe cells remain valid landing targets");
    assert.strictEqual(math.expectedCashoutRtp(lines, Math.min(3, round.safeOpened)), math.TARGET_RTP);
  }
}

const sequential = math.createRound({ lines: 6, pucks: 3, seed: 4242, bet: 1 });
const sequentialSafeCells = sequential.cells.filter((cell) => cell.kind !== "loss").slice(0, 3);
const sequentialExclusions = [];
for (const cell of sequentialSafeCells) {
  assert.ok(Math.abs(math.conditionalExpectedRatio(sequential, sequentialExclusions) - 1) < 1e-12,
    "multi-ball selection must remain RTP-neutral after same-shot exclusions");
  const multiplier = math.stepMultiplierForCell(sequential, cell, sequentialExclusions);
  math.revealCell(sequential, cell.index, {
    excludedIndexes: sequentialExclusions,
    stepMultiplier: multiplier
  });
  sequentialExclusions.push(cell.index);
}

const productExample = math.createRound({ lines: 5, pucks: 1, seed: 321, bet: 300 });
productExample.playerMultiplierHits = [
  { baseMultiplier: 1.2, boosted: false },
  { baseMultiplier: 1.5, boosted: false }
];
assert.ok(Math.abs(math.playerCashoutMultiplier(productExample) - 1.8) < 1e-12,
  "1.20x and 1.50x must multiply to 1.80x");
assert.ok(Math.abs(productExample.bet * math.playerCashoutMultiplier(productExample) - 540) < 1e-9,
  "a $300 stake with 1.20x and 1.50x must pay $540");

const first = math.createRound({ lines: 7, pucks: 2, seed: 99, bet: 3 });
const second = math.createRound({ lines: 7, pucks: 2, seed: 100, bet: 3 });
assert.notDeepStrictEqual(
  first.cells.map((cell) => [cell.kind, cell.tier]),
  second.cells.map((cell) => [cell.kind, cell.tier]),
  "new round seeds must produce different hidden layouts"
);

const selected = math.selectShotCells(first, 3, 111);
const reserved = selected.map((cell) => cell.index);
const released = math.selectShotCells(first, 3, 222, reserved);
assert.strictEqual(selected.length, 3);
assert.strictEqual(released.length, 3);
assert.strictEqual(new Set([...selected, ...released].map((cell) => cell.index)).size, 6);

const blackLossRound = math.createRound({ lines: 5, pucks: 3, seed: 9101, bet: 3 });
const blackLossCells = blackLossRound.cells.filter((cell) => cell.kind === "loss");
math.revealCell(blackLossRound, blackLossCells[0].index);
assert.strictEqual(blackLossCells[0].opened, true);
assert.strictEqual(blackLossRound.remainingPucks, 2);
assert.strictEqual(blackLossRound.lost, false);
assert.strictEqual(blackLossRound.active, true);
assert.ok(Math.abs(blackLossRound.cashoutMultiplier - 2 / 3) < 1e-12);
assert.ok(Math.abs(math.conditionalExpectedRatio(blackLossRound) - 1) < 1e-12,
  "two surviving balls must keep the next free risk conditionally RTP-neutral");
math.revealCell(blackLossRound, blackLossCells[1].index);
assert.strictEqual(blackLossRound.remainingPucks, 1);
assert.strictEqual(blackLossRound.lost, false);
assert.strictEqual(blackLossRound.active, true);
assert.ok(Math.abs(blackLossRound.cashoutMultiplier - 1 / 3) < 1e-12);
assert.ok(Math.abs(math.conditionalExpectedRatio(blackLossRound) - 1) < 1e-12,
  "one surviving ball must keep the next free risk conditionally RTP-neutral");
math.revealCell(blackLossRound, blackLossCells[2].index);
assert.strictEqual(blackLossRound.remainingPucks, 0);
assert.strictEqual(blackLossRound.lost, true);
assert.strictEqual(blackLossRound.active, false);
assert.strictEqual(blackLossRound.cashoutMultiplier, 0);

const partialSurvivalRound = math.createRound({ lines: 6, pucks: 3, seed: 9103, bet: 3 });
const partialLossCells = partialSurvivalRound.cells.filter((cell) => cell.kind === "loss");
const partialSafeCell = partialSurvivalRound.cells.find((cell) =>
  cell.kind === "multiplier");
math.revealCell(partialSurvivalRound, partialLossCells[0].index);
math.revealCell(partialSurvivalRound, partialLossCells[1].index);
math.revealCell(partialSurvivalRound, partialSafeCell.index);
assert.strictEqual(partialSurvivalRound.remainingPucks, 1);
assert.strictEqual(partialSurvivalRound.active, true);
assert.strictEqual(partialSurvivalRound.lost, false);
assert.ok(Math.abs(math.playerCashoutMultiplier(partialSurvivalRound)
  - partialSafeCell.baseMultiplier / 3) < 1e-12);

const pocketSurvivalRound = math.createRound({ lines: 10, pucks: 1, seed: 9102, bet: 1 });
const pocketBonusCell = pocketSurvivalRound.cells.find((cell) => cell.kind === "pocket");
assert.strictEqual(math.candidateCashoutMultiplier(pocketSurvivalRound, pocketBonusCell), 3,
  "a blue pocket must turn one current ball into three RTP-valued balls");
math.revealCell(pocketSurvivalRound, pocketBonusCell.index);
pocketSurvivalRound.remainingPucks += 2;
const pocketLossCells = pocketSurvivalRound.cells.filter((cell) => cell.kind === "loss");
math.revealCell(pocketSurvivalRound, pocketLossCells[0].index);
assert.ok(Math.abs(math.conditionalExpectedRatio(pocketSurvivalRound) - 1) < 1e-12,
  "two surviving pocket balls must remain conditionally RTP-neutral");
math.revealCell(pocketSurvivalRound, pocketLossCells[1].index);
assert.ok(Math.abs(math.conditionalExpectedRatio(pocketSurvivalRound) - 1) < 1e-12,
  "one surviving pocket ball must remain conditionally RTP-neutral");
const pocketSafeCell = pocketSurvivalRound.cells.find((cell) => cell.kind === "multiplier");
math.revealCell(pocketSurvivalRound, pocketSafeCell.index);
assert.strictEqual(pocketSurvivalRound.remainingPucks, 1);
assert.strictEqual(pocketSurvivalRound.lost, false);
assert.strictEqual(pocketSurvivalRound.active, true);
assert.ok(math.playerCashoutMultiplier(pocketSurvivalRound) > 0,
  "a surviving pocket bonus ball must remain available for the next risk");

console.log("Balloro Treasure survivor risk ladder: PASS (RTP 97.45%, per-ball black losses, dark-green rewards, diamonds, pocket, x10)");
