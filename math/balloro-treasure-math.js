(function initBalloroTreasureMath(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BalloroTreasureMath = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createTreasureMath() {
  "use strict";

  const TARGET_RTP = 0.9745;
  const BOOST_MULTIPLIER = 10;
  const DIAMONDS_REQUIRED = 3;
  // Apply the requested additional 30% reduction to the already-reduced
  // green multiplier density: 0.70 × 0.70 = 0.49 of the original layout.
  const MULTIPLIER_CELL_RETENTION = 0.49;
  const PURPLE_WIN_SHARE = 0.50;
  const LINE_COUNTS = Object.freeze([5, 6, 7, 8, 9, 10]);
  // Black cells replace the former red-pocket outcomes one-for-one so the
  // existing loss frequency and volatility profile remain unchanged.
  const LOSS_CELL_COUNTS = Object.freeze({ 5: 4, 6: 6, 7: 8, 8: 10, 9: 13, 10: 16 });
  const MULTIPLIER_TABLES = Object.freeze({
    5: Object.freeze({ low: 1.2, medium: 1.5, high: 2.5 }),
    6: Object.freeze({ low: 1.2, medium: 1.8, high: 3 }),
    7: Object.freeze({ low: 1.3, medium: 2, high: 4 }),
    8: Object.freeze({ low: 1.4, medium: 2.5, high: 6 }),
    9: Object.freeze({ low: 1.5, medium: 3, high: 10 }),
    // Keep the highest displayed Treasure multiplier at 100x after x10.
    10: Object.freeze({ low: 1.6, medium: 4, high: 10 })
  });
  // Scale volatility with the board: the 5-line field has one high cell;
  // larger fields trade low cells for progressively more medium/high cells.
  const GREEN_TIER_COUNTS = Object.freeze({
    5: Object.freeze({ low: 5, medium: 2, high: 1 }),
    6: Object.freeze({ low: 4, medium: 4, high: 2 }),
    7: Object.freeze({ low: 3, medium: 5, high: 3 }),
    8: Object.freeze({ low: 2, medium: 6, high: 4 }),
    9: Object.freeze({ low: 1, medium: 7, high: 5 }),
    10: Object.freeze({ low: 1, medium: 8, high: 6 })
  });
  const EMPTY_CELL_COUNTS = Object.freeze({ 5: 2, 6: 5, 7: 9, 8: 14, 9: 20, 10: 28 });
  // The geometric black-cell area remains visible on the board, while the
  // conditional risk ladder favours safe cells slightly more often. Its
  // solver still normalizes every pick to the exact target RTP.
  const LOSS_HIT_PROBABILITY_SCALE = 0.75;
  const EMPTY_WEIGHT = 0.55;
  const DIAMOND_WEIGHT = 1;
  const POCKET_WEIGHT = 1;
  const OPENED_CELL_REPEAT_WEIGHT = 0.24;
  // Keep the conditional RTP solver as the source of payout fairness while
  // making the visual path cadence feel less empty. Empty outcomes retain a
  // positive probability, but multiplier/bonus cells get a stronger prior.
  const EMPTY_SELECTION_PRIOR = 0.24;
  const MULTIPLIER_SELECTION_PRIOR = 1.42;
  const MULTIPLIER_TIER_PRIORS = Object.freeze({ low: 4.8, medium: 0.78, high: 0.12 });
  const DIAMOND_SELECTION_PRIOR = 1.16;
  const POCKET_SELECTION_PRIOR = 1.12;
  // A modest extra risk reserve is used only after the x10 field activates.
  // It funds a more regular multiplier cadence while the conditional payout
  // solver still normalizes every next pick to TARGET_RTP.
  const PURPLE_BONUS_LOSS_PROBABILITY = 0.28;

  function hashString(value) {
    let hash = 2166136261;
    const text = String(value);
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createRng(seed = 1) {
    let value = seed >>> 0 || 0x9e3779b9;
    return {
      next() {
        value += 0x6d2b79f5;
        let result = value;
        result = Math.imul(result ^ result >>> 15, result | 1);
        result ^= result + Math.imul(result ^ result >>> 7, result | 61);
        return ((result ^ result >>> 14) >>> 0) / 4294967296;
      },
      int(maxExclusive) {
        if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) return 0;
        return Math.floor(this.next() * maxExclusive);
      },
      uint32() {
        return Math.floor(this.next() * 4294967296) >>> 0;
      }
    };
  }

  function assertLines(lines) {
    const numericLines = Number(lines);
    if (!LINE_COUNTS.includes(numericLines)) {
      throw new Error(`Unsupported Balloro Treasure line count: ${lines}`);
    }
    return numericLines;
  }

  function shuffle(items, rng) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = rng.int(index + 1);
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function choosePurpleCounts(table, targetValue, maxCount) {
    const tiers = ["low", "medium", "high"];
    const values = tiers.map((tier) => table[tier]);
    const minimumValue = Math.min(...values);
    const maxTierCount = Math.min(maxCount, Math.ceil(targetValue / minimumValue) + 2);
    let best = { low: 0, medium: 0, high: 0, value: 0, score: Math.abs(targetValue) };
    // Keep high values unique to the green field; this keeps the x10 reserve
    // from adding extra premium peaks beyond the line-count progression.
    for (let high = 0; high <= 0; high += 1) {
      for (let medium = 0; medium <= maxTierCount - high; medium += 1) {
        const remainder = targetValue - high * table.high - medium * table.medium;
        const lowEstimate = remainder / table.low;
        const lowCandidates = new Set([
          0,
          Math.floor(lowEstimate),
          Math.ceil(lowEstimate),
          Math.floor(lowEstimate) - 1,
          Math.ceil(lowEstimate) + 1
        ]);
        lowCandidates.forEach((low) => {
          if (low < 0 || high + medium + low > maxCount) return;
          const value = low * table.low + medium * table.medium + high * table.high;
          // Prefer a larger number of low-tier cells when two mixes carry
          // nearly the same multiplier budget. This keeps the purple field
          // readable and prevents a long run of medium values after x10.
          const score = Math.abs(targetValue - value)
            + medium * 0.15
            + (low + medium + high) * 1e-4;
          if (score < best.score) best = { low, medium, high, value, score };
        });
      }
    }
    return { low: best.low, medium: best.medium, high: best.high };
  }

  function contentCounts(lines, safeCellCount, diamondsRequired) {
    const reserved = Math.min(safeCellCount, Math.max(1, diamondsRequired) + 1);
    const available = Math.max(0, safeCellCount - reserved);
    const requested = GREEN_TIER_COUNTS[lines];
    const counts = { low: 0, medium: 0, high: 0 };
    let remaining = available;
    for (const tier of ["high", "medium", "low"]) {
      counts[tier] = Math.min(requested[tier], remaining);
      remaining -= counts[tier];
    }
    const table = MULTIPLIER_TABLES[lines];
    const greenMultiplierValue = ["low", "medium", "high"]
      .reduce((sum, tier) => sum + counts[tier] * table[tier], 0);
    const purpleTargetValue = greenMultiplierValue * PURPLE_WIN_SHARE / (1 - PURPLE_WIN_SHARE);
    const desiredEmpty = Math.min(remaining, EMPTY_CELL_COUNTS[lines]);
    const purpleCapacity = Math.max(0, remaining - desiredEmpty);
    const purple = choosePurpleCounts(table, purpleTargetValue, purpleCapacity);
    const purpleCount = purple.low + purple.medium + purple.high;
    return {
      ...counts,
      purple,
      empty: Math.max(0, remaining - purpleCount),
      diamond: Math.max(1, diamondsRequired),
      pocket: 1
    };
  }

  function buildSafeContents(lines, safeCellCount, diamondsRequired, rng) {
    const counts = contentCounts(lines, safeCellCount, diamondsRequired);
    const table = MULTIPLIER_TABLES[lines];
    const contents = [];
    for (const tier of ["low", "medium", "high"]) {
      for (let index = 0; index < counts[tier]; index += 1) {
        contents.push({ kind: "multiplier", tier, baseMultiplier: table[tier], purpleOnly: false });
      }
      for (let index = 0; index < counts.purple[tier]; index += 1) {
        contents.push({
          kind: "multiplier",
          tier,
          baseMultiplier: table[tier],
          purpleOnly: true
        });
      }
    }
    // A neutral 1x is the visible safe replacement for the previous empty
    // outcome. It returns the current value unchanged and never receives x10.
    for (let index = 0; index < counts.empty; index += 1) {
      contents.push({
        kind: "multiplier",
        tier: "neutral",
        baseMultiplier: 1,
        neutral: true,
        purpleOnly: false
      });
    }
    for (let index = 0; index < counts.diamond; index += 1) contents.push({ kind: "diamond" });
    for (let index = 0; index < counts.pocket; index += 1) contents.push({ kind: "pocket" });
    if (contents.length !== safeCellCount) {
      throw new Error(`Treasure content count mismatch for ${lines} lines: ${contents.length}/${safeCellCount}`);
    }
    return shuffle(contents, rng);
  }

  function createRound({ lines, pucks = 1, seed = 1, bet = 1 }) {
    const size = assertLines(lines);
    const puckCount = Math.max(1, Math.min(3, Number(pucks) || 1));
    const totalCells = size * size;
    const lossCellCount = LOSS_CELL_COUNTS[size];
    const safeCellCount = totalCells - lossCellCount;
    const rng = createRng((Number(seed) ^ hashString(`balloro-treasure:${size}:${puckCount}`)) >>> 0);
    const shuffledIndexes = shuffle(Array.from({ length: totalCells }, (_, index) => index), rng);
    const lossIndexes = new Set(shuffledIndexes.slice(0, lossCellCount));
    const safeContents = buildSafeContents(size, safeCellCount, DIAMONDS_REQUIRED, rng);
    let safeCursor = 0;
    const cells = Array.from({ length: totalCells }, (_, index) => {
      const coordinates = { index, col: index % size, row: Math.floor(index / size) };
      if (lossIndexes.has(index)) {
        return { ...coordinates, kind: "loss", opened: false, revealOrder: null, stepMultiplier: null };
      }
      const content = safeContents[safeCursor++];
      return {
        ...coordinates,
        ...content,
        displayMultiplier: content.kind === "multiplier" ? content.baseMultiplier : null,
        boostedDisplay: false,
        opened: false,
        revealOrder: null,
        stepMultiplier: null
      };
    });
    const multiplierValueTotals = cells.reduce((totals, cell) => {
      if (cell.kind !== "multiplier" || cell.neutral) return totals;
      if (cell.purpleOnly) totals.purple += cell.baseMultiplier;
      else totals.green += cell.baseMultiplier;
      return totals;
    }, { green: 0, purple: 0 });
    const totalMultiplierValue = multiplierValueTotals.green + multiplierValueTotals.purple;
    return {
      schema: "balloro-treasure-round-v4",
      lines: size,
      pucks: puckCount,
      initialPucks: puckCount,
      remainingPucks: puckCount,
      resolvedPuckCount: 0,
      seed: Number(seed) >>> 0,
      bet: Number(bet),
      totalCells,
      lossCellCount,
      safeCellCount,
      cells,
      greenMultiplierCellCount: cells.filter((cell) =>
        cell.kind === "multiplier" && !cell.neutral && !cell.purpleOnly).length,
      purpleMultiplierCellCount: cells.filter((cell) =>
        cell.kind === "multiplier" && !cell.neutral && cell.purpleOnly).length,
      greenMultiplierValue: multiplierValueTotals.green,
      purpleMultiplierValue: multiplierValueTotals.purple,
      purpleWinShare: totalMultiplierValue > 0
        ? multiplierValueTotals.purple / totalMultiplierValue
        : 0,
      safeOpened: 0,
      openedCount: 0,
      shotCount: 0,
      diamondsRequired: DIAMONDS_REQUIRED,
      diamondsCollected: 0,
      boostActive: false,
      pocketOpened: false,
      emptyStreak: 0,
      lastSafeKind: null,
      playerMultiplierHits: [],
      playerCashoutMultiplier: 0,
      cashoutMultiplier: TARGET_RTP,
      lost: false,
      active: true
    };
  }

  function rawCellWeight(round, cell) {
    if (!cell || cell.kind === "loss") return 0;
    if (cell.kind === "multiplier" && cell.neutral) return EMPTY_WEIGHT;
    const effectiveKind = cell.opened && cell.kind === "diamond" ? "empty" : cell.kind;
    if (effectiveKind === "empty") return EMPTY_WEIGHT;
    if (cell.kind === "pocket") return POCKET_WEIGHT;
    if (cell.kind === "diamond") {
      const completesBoost = !round.boostActive
        && round.diamondsCollected + 1 >= round.diamondsRequired;
      return completesBoost ? BOOST_MULTIPLIER : DIAMOND_WEIGHT;
    }
    if (cell.kind === "multiplier" && cell.purpleOnly && !round.boostActive && !cell.boostedDisplay) {
      return EMPTY_WEIGHT;
    }
    if (cell.kind === "multiplier") {
      return cell.baseMultiplier * ((cell.boostedDisplay || round.boostActive) ? BOOST_MULTIPLIER : 1);
    }
    return 1;
  }

  function hiddenCells(round) {
    return round.cells.filter((cell) => !cell.opened);
  }

  function selectableCells(round, excludedIndexes = []) {
    const excluded = new Set((Array.isArray(excludedIndexes) ? excludedIndexes : []).map(Number));
    return round.cells.filter((cell) => !(cell.opened && cell.kind === "loss")
      && !excluded.has(cell.index));
  }

  function playerRewardMultiplier(round, extraCell = null) {
    if (!round) return 0;
    const hits = Array.isArray(round.playerMultiplierHits)
      ? round.playerMultiplierHits
        .map((hit) => ({
          baseMultiplier: Number(hit?.baseMultiplier),
          boosted: Boolean(hit?.boosted)
        }))
        .filter((hit) => hit.baseMultiplier > 1)
      : [];
    const extraMultiplierActive = extraCell?.kind === "multiplier"
      && (!extraCell.purpleOnly || round.boostActive || extraCell.boostedDisplay);
    if (extraMultiplierActive && Number(extraCell.baseMultiplier) > 1) {
      hits.push({
        baseMultiplier: Number(extraCell.baseMultiplier),
        boosted: Boolean(extraCell.boostedDisplay || round.boostActive)
      });
    }
    if (!hits.length) return 1;
    return hits.reduce((product, hit) =>
      product * hit.baseMultiplier * (hit.boosted ? BOOST_MULTIPLIER : 1), 1);
  }

  function playerCashoutMultiplier(round, extraCell = null, remainingPucks = null) {
    if (!round) return 0;
    const initialPucks = Math.max(1, Number(round.initialPucks ?? round.pucks) || 1);
    const survivors = Math.max(
      0,
      Math.min(initialPucks, Number(remainingPucks ?? round.remainingPucks ?? initialPucks) || 0)
    );
    return playerRewardMultiplier(round, extraCell) * survivors / initialPucks;
  }

  function fairCashoutBeforeNextPick(round) {
    if (!round || round.lost || !round.active) return 0;
    return Number(round.resolvedPuckCount) > 0
      ? playerCashoutMultiplier(round)
      : TARGET_RTP;
  }

  function candidateCashoutMultiplier(round, cell) {
    if (!cell) return 0;
    if (cell.kind === "loss") {
      return playerCashoutMultiplier(round, null, Math.max(0, Number(round.remainingPucks) - 1));
    }
    return playerCashoutMultiplier(round, cell);
  }

  function tiltedProbabilities(values, target, baseWeights = []) {
    if (!values.length) return [];
    const priors = values.map((_, index) => {
      const weight = Number(baseWeights[index]);
      return Number.isFinite(weight) && weight > 0 ? weight : 1;
    });
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    if (maximum - minimum < 1e-12) {
      const totalPrior = priors.reduce((sum, weight) => sum + weight, 0);
      return priors.map((weight) => weight / totalPrior);
    }
    const targetUnit = Math.max(0, Math.min(1, (target - minimum) / (maximum - minimum)));
    if (targetUnit <= 1e-12) {
      const totalPrior = values.reduce((sum, value, index) =>
        sum + (Math.abs(value - minimum) < 1e-12 ? priors[index] : 0), 0);
      return values.map((value, index) =>
        Math.abs(value - minimum) < 1e-12 ? priors[index] / totalPrior : 0);
    }
    if (targetUnit >= 1 - 1e-12) {
      const totalPrior = values.reduce((sum, value, index) =>
        sum + (Math.abs(value - maximum) < 1e-12 ? priors[index] : 0), 0);
      return values.map((value, index) =>
        Math.abs(value - maximum) < 1e-12 ? priors[index] / totalPrior : 0);
    }

    const units = values.map((value) => (value - minimum) / (maximum - minimum));
    const meanAt = (lambda) => {
      const exponents = units.map((unit) => lambda * unit);
      const maxExponent = Math.max(...exponents);
      const weights = exponents.map((exponent, index) =>
        priors[index] * Math.exp(exponent - maxExponent));
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      const mean = weights.reduce((sum, weight, index) => sum + weight * units[index], 0) / totalWeight;
      return { mean, weights, totalWeight };
    };

    let lower = -80;
    let upper = 80;
    for (let iteration = 0; iteration < 90; iteration += 1) {
      const middle = (lower + upper) / 2;
      if (meanAt(middle).mean < targetUnit) lower = middle;
      else upper = middle;
    }
    const solved = meanAt((lower + upper) / 2);
    return solved.weights.map((weight) => weight / solved.totalWeight);
  }

  function selectionProbabilities(round, excludedIndexes = []) {
    const selectable = selectableCells(round, excludedIndexes);
    if (!selectable.length) return [];
    const lossCells = selectable.filter((cell) => cell.kind === "loss");
    const safeCells = selectable.filter((cell) => cell.kind !== "loss");
    if (!safeCells.length) {
      return lossCells.map((cell) => ({ cell, probability: 1 / lossCells.length }));
    }

    const fairCashout = fairCashoutBeforeNextPick(round);
    const safeValues = safeCells.map((cell) => candidateCashoutMultiplier(round, cell));
    const minimumSafe = Math.min(...safeValues);
    const maximumSafe = Math.max(...safeValues);
    const lossValue = lossCells.length
      ? candidateCashoutMultiplier(round, lossCells[0])
      : 0;
    const visibleLossProbability = lossCells.length / selectable.length;
    const preferredLossProbability = round.boostActive
      ? Math.max(visibleLossProbability * LOSS_HIT_PROBABILITY_SCALE, PURPLE_BONUS_LOSS_PROBABILITY)
      : visibleLossProbability * LOSS_HIT_PROBABILITY_SCALE;
    const probabilityForSafeMean = (safeMean) => {
      const denominator = safeMean - lossValue;
      if (Math.abs(denominator) < 1e-12) return 0;
      return (safeMean - fairCashout) / denominator;
    };
    const firstBoundary = probabilityForSafeMean(minimumSafe);
    const secondBoundary = probabilityForSafeMean(maximumSafe);
    const minimumLossProbability = Math.max(0, Math.min(firstBoundary, secondBoundary));
    const maximumLossProbability = Math.min(1, Math.max(firstBoundary, secondBoundary));
    const lossProbability = lossCells.length
      ? Math.max(minimumLossProbability, Math.min(maximumLossProbability, preferredLossProbability))
      : 0;
    const safeProbability = 1 - lossProbability;
    const targetSafeCashout = safeProbability > 0
      ? (fairCashout - lossProbability * lossValue) / safeProbability
      : maximumSafe;
    const emptyStreak = Math.max(0, Number(round.emptyStreak) || 0);
    const emptyStreakFactor = emptyStreak >= 2 ? 0.24 : emptyStreak === 1 ? 0.52 : 1;
    const multiplierStreakFactor = emptyStreak > 0 ? 1.7 : 1;
    const safeSelectionPrior = (cell) => {
      const repeatWeight = cell.opened ? OPENED_CELL_REPEAT_WEIGHT : 1;
      const inactivePurpleMultiplier = cell.kind === "multiplier"
        && cell.purpleOnly
        && !round.boostActive
        && !cell.boostedDisplay;
      const effectiveKind = cell.opened && cell.kind === "diamond"
        || (cell.kind === "multiplier" && cell.neutral)
        || inactivePurpleMultiplier
        ? "empty"
        : cell.kind;
      if (effectiveKind === "empty") return repeatWeight * EMPTY_SELECTION_PRIOR * emptyStreakFactor;
      if (effectiveKind === "multiplier") {
        const tierPrior = MULTIPLIER_TIER_PRIORS[cell.tier] || 1;
        return repeatWeight * MULTIPLIER_SELECTION_PRIOR * tierPrior * multiplierStreakFactor;
      }
      if (effectiveKind === "diamond") return repeatWeight * DIAMOND_SELECTION_PRIOR;
      if (effectiveKind === "pocket") return repeatWeight * POCKET_SELECTION_PRIOR;
      return repeatWeight;
    };
    const safeShares = tiltedProbabilities(
      safeValues,
      targetSafeCashout,
      safeCells.map(safeSelectionPrior)
    );
    const result = safeCells.map((cell, index) => ({
      cell,
      probability: safeProbability * safeShares[index]
    }));
    if (lossCells.length) {
      const perLossCell = lossProbability / lossCells.length;
      lossCells.forEach((cell) => result.push({ cell, probability: perLossCell }));
    }
    return result;
  }

  function expectedSafeWeight(round, excludedIndexes = []) {
    const safeCells = selectableCells(round, excludedIndexes).filter((cell) => cell.kind !== "loss");
    if (!safeCells.length) return 1;
    return safeCells.reduce((sum, cell) => sum + rawCellWeight(round, cell), 0) / safeCells.length;
  }

  function stepMultiplierForCell(round, cell, excludedIndexes = []) {
    if (!round || round.lost || !round.active || !cell || cell.kind === "loss") return 0;
    const selectable = selectableCells(round, excludedIndexes);
    if (!selectable.some((candidate) => candidate.index === cell.index)) return 0;
    const safeCellCount = selectable.filter((candidate) => candidate.kind !== "loss").length;
    if (!safeCellCount) return 0;
    const survivalCompensation = selectable.length / safeCellCount;
    return survivalCompensation * rawCellWeight(round, cell) / expectedSafeWeight(round, excludedIndexes);
  }

  function stepMultiplier(round, tier, safeOpenedBefore = round.safeOpened) {
    const cell = hiddenCells(round).find((candidate) => candidate.kind === "multiplier" && candidate.tier === tier);
    if (!cell) return 0;
    return stepMultiplierForCell(round, cell, safeOpenedBefore);
  }

  function selectShotCells(round, count, seed, excludedIndexes = []) {
    if (!round?.active || round.lost) return [];
    const exclusionCount = Array.isArray(excludedIndexes) ? new Set(excludedIndexes.map(Number)).size : 0;
    const rng = createRng((Number(seed) ^ hashString(`${round.seed}:${round.shotCount}:${exclusionCount}`)) >>> 0);
    const selected = [];
    const exclusions = new Set((Array.isArray(excludedIndexes) ? excludedIndexes : []).map(Number));
    const requested = Math.max(0, Number(count) || 0);
    while (selected.length < requested) {
      const probabilities = selectionProbabilities(round, [...exclusions]);
      if (!probabilities.length) break;
      let cursor = rng.next();
      let chosen = probabilities[probabilities.length - 1].cell;
      for (const item of probabilities) {
        cursor -= item.probability;
        if (cursor <= 1e-12) {
          chosen = item.cell;
          break;
        }
      }
      selected.push(chosen);
      exclusions.add(chosen.index);
    }
    return selected;
  }

  function activateBoostForShot(round, shotKey) {
    if (!round) return;
    const key = shotKey == null ? null : String(shotKey);
    round.playerMultiplierHits?.forEach((hit) => {
      if (key !== null && String(hit?.shotKey || "") !== key) return;
      hit.boosted = true;
      const cell = round.cells?.[Number(hit.cellIndex)];
      if (cell?.kind === "multiplier") {
        cell.boostedDisplay = true;
        cell.displayMultiplier = cell.baseMultiplier * BOOST_MULTIPLIER;
      }
    });
    if (key === null) {
      round.cells?.forEach((cell) => {
        if (cell.kind !== "multiplier" || cell.neutral) return;
        cell.boostedDisplay = true;
        cell.displayMultiplier = cell.baseMultiplier * BOOST_MULTIPLIER;
      });
    }
  }

  function revealCell(round, cellIndex, options = {}) {
    if (!round?.active || round.lost) return null;
    const cell = round.cells[Number(cellIndex)];
    if (!cell) return null;
    const wasOpened = cell.opened;
    const configuredStep = Number(options.stepMultiplier);
    const resolvedStep = Number.isFinite(configuredStep)
      ? configuredStep
      : stepMultiplierForCell(round, cell, options.excludedIndexes || []);
    cell.landingCount = (cell.landingCount || 0) + 1;
    if (!wasOpened) {
      cell.opened = true;
      cell.revealOrder = round.openedCount;
      round.openedCount += 1;
    }
    const consumesLife = options.consumeLife !== false;
    if (consumesLife) round.resolvedPuckCount = (Number(round.resolvedPuckCount) || 0) + 1;
    if (cell.kind === "loss") {
      if (consumesLife) {
        round.remainingPucks = Math.max(0, Number(round.remainingPucks) - 1);
      }
      round.lost = Number(round.remainingPucks) <= 0;
      round.active = !round.lost;
      round.playerCashoutMultiplier = round.lost ? 0 : playerCashoutMultiplier(round);
      round.cashoutMultiplier = round.playerCashoutMultiplier;
      return cell;
    }
    const emptyOutcome = cell.kind === "empty"
      || (cell.kind === "multiplier" && cell.neutral)
      || (cell.kind === "diamond" && wasOpened)
      || (cell.kind === "multiplier"
        && cell.purpleOnly
        && !round.boostActive
        && !cell.boostedDisplay);
    round.emptyStreak = emptyOutcome ? (Number(round.emptyStreak) || 0) + 1 : 0;
    round.lastSafeKind = emptyOutcome ? "empty" : cell.kind;
    cell.stepMultiplier = resolvedStep;
    round.safeOpened += 1;
    if (!wasOpened && cell.kind === "diamond") {
      round.diamondsCollected = Math.min(round.diamondsRequired, round.diamondsCollected + 1);
      if (!round.boostActive && round.diamondsCollected >= round.diamondsRequired) {
        round.boostActive = true;
        activateBoostForShot(round, options.shotKey);
      }
    }
    if (cell.kind === "pocket") round.pocketOpened = true;
    const multiplierActive = cell.kind === "multiplier"
      && !cell.neutral
      && (!cell.purpleOnly || round.boostActive || cell.boostedDisplay);
    if (multiplierActive && Number(cell.baseMultiplier) > 1) {
      if (!Array.isArray(round.playerMultiplierHits)) round.playerMultiplierHits = [];
      round.playerMultiplierHits.push({
        cellIndex: cell.index,
        baseMultiplier: Number(cell.baseMultiplier),
        landingCount: cell.landingCount,
        shotKey: options.shotKey == null ? null : String(options.shotKey),
        boosted: Boolean(cell.boostedDisplay || round.boostActive)
      });
      if (round.boostActive) {
        cell.boostedDisplay = true;
        cell.displayMultiplier = cell.baseMultiplier * BOOST_MULTIPLIER;
      }
    }
    round.playerCashoutMultiplier = playerCashoutMultiplier(round);
    round.cashoutMultiplier = round.playerCashoutMultiplier;
    return cell;
  }

  function conditionalExpectedRatio(round, excludedIndexes = []) {
    if (!round?.active || round.lost) return 0;
    const fairCashout = fairCashoutBeforeNextPick(round);
    if (!(fairCashout > 0)) return 0;
    const probabilities = selectionProbabilities(round, excludedIndexes);
    if (!probabilities.length) return 1;
    const expectedCashout = probabilities.reduce((sum, item) =>
      sum + item.probability * candidateCashoutMultiplier(round, item.cell), 0);
    return expectedCashout / fairCashout;
  }

  function expectedCashoutRtp() {
    return TARGET_RTP;
  }

  return Object.freeze({
    TARGET_RTP,
    BOOST_MULTIPLIER,
    DIAMONDS_REQUIRED,
    MULTIPLIER_CELL_RETENTION,
    PURPLE_WIN_SHARE,
    LINE_COUNTS,
    LOSS_CELL_COUNTS,
    MULTIPLIER_TABLES,
    GREEN_TIER_COUNTS,
    LOSS_HIT_PROBABILITY_SCALE,
    EMPTY_WEIGHT,
    DIAMOND_WEIGHT,
    POCKET_WEIGHT,
    EMPTY_SELECTION_PRIOR,
    MULTIPLIER_SELECTION_PRIOR,
    MULTIPLIER_TIER_PRIORS,
    DIAMOND_SELECTION_PRIOR,
    POCKET_SELECTION_PRIOR,
    PURPLE_BONUS_LOSS_PROBABILITY,
    hashString,
    createRng,
    createRound,
    rawCellWeight,
    selectableCells,
    playerCashoutMultiplier,
    playerRewardMultiplier,
    fairCashoutBeforeNextPick,
    candidateCashoutMultiplier,
    selectionProbabilities,
    expectedSafeWeight,
    stepMultiplier,
    stepMultiplierForCell,
    selectShotCells,
    revealCell,
    conditionalExpectedRatio,
    expectedCashoutRtp
  });
});
