(function initPuckLuckMath(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PuckLuckMath = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMathApi() {
  "use strict";

  const TARGET_RTP = 0.9745;
  const BONUS_PRESENTATION_TARGET_RATE = 0.03;
  const EMPTY_BONUS_PRESENTATION_MULTIPLIER = 4;
  const BONUS_FREQUENCY_MULTIPLIER = 2.5;
  const ONE_OF_TWO_STAR_PROBABILITY = 0.85;
  const TWO_OF_THREE_STAR_PROBABILITY = 0.85;
  const RISK_LEVELS = ["low", "normal", "high"];
  const LINE_COUNTS = [5, 6, 7, 8, 9, 10];
  const PUCK_COUNTS = [1, 2, 3];
  const FIXED_TIMESTEP = 1 / 120;
  const BASE_PUCK_RADIUS_5 = 0.1;
  const FIXED_LAUNCH_FORCE = 1250;
  const CATEGORIES = ["empty", "outer", "middle", "center"];
  const PROFILE_VERSION = "Reduced Volatility V2 / Bonus Frequency 2.5x";
  const PAYTABLES = {
    low: { empty: 0, outer: 1.15, middle: 1.65, center: 2.40 },
    normal: { empty: 0, outer: 0.80, middle: 1.80, center: 5.50 },
    high: { empty: 0, outer: 0.45, middle: 1.80, center: 10.00 }
  };
  const PROFILE = {
    low: { hit: 0.64, shares: { outer: 0.55, middle: 0.35, center: 0.1 }, bonusShare: 0.05 },
    normal: { hit: 0.52, shares: { outer: 0.50, middle: 0.38, center: 0.12 }, bonusShare: 0.08 },
    high: { hit: 0.40, shares: { outer: 0.57, middle: 0.30, center: 0.13 }, bonusShare: 0.14 }
  };

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function round2(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function createRng(seed) {
    let value = (seed >>> 0) || 0x6d2b79f5;
    return {
      next() {
        value = (value + 0x6d2b79f5) >>> 0;
        let result = value;
        result = Math.imul(result ^ (result >>> 15), result | 1);
        result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
        return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
      },
      uint32() { return Math.floor(this.next() * 4294967296) >>> 0; },
      int(max) { return Math.floor(this.next() * max); }
    };
  }
  function configId(risk, lines, pucks) { return `${risk}-${lines}-${pucks}`; }
  function puckRadius(lines, baseRadius = BASE_PUCK_RADIUS_5) { return baseRadius * 5 / lines; }

  function buildSectorDefinitions(lines) {
    const sectors = { empty: [], outer: [], middle: [], center: [] };
    const centerIndices = lines % 2 === 0 ? [lines / 2 - 1, lines / 2] : [Math.floor(lines / 2)];
    const distanceToCenterZone = (value) => Math.min(...centerIndices.map((center) => Math.abs(value - center)));
    const maxRing = Math.max(distanceToCenterZone(0), distanceToCenterZone(lines - 1));
    for (let row = 0; row < lines; row += 1) {
      for (let col = 0; col < lines; col += 1) {
        const sector = { index: row * lines + col, row, col };
        const isMultiplier = col === row || col + row === lines - 1;
        if (!isMultiplier) {
          sectors.empty.push(sector);
          continue;
        }
        const ring = Math.max(distanceToCenterZone(col), distanceToCenterZone(row));
        if (ring === 0) sectors.center.push(sector);
        else if (ring === maxRing) sectors.outer.push(sector);
        else sectors.middle.push(sector);
      }
    }
    if (!sectors.empty.length) sectors.empty.push({ index: -1, row: -1, col: -1 });
    return sectors;
  }

  function solveConfiguration(risk, lines, pucks) {
    const profile = PROFILE[risk];
    const lineFactor = Math.pow(5 / lines, 0.08);
    const puckFactor = 1 + (pucks - 2) * 0.035;
    const desiredBonusShare = clamp(profile.bonusShare * lineFactor * puckFactor, 0.025, 0.18);
    const baseBonusProbability = desiredBonusShare / (9 * (1 - desiredBonusShare));
    const bonusProbability = baseBonusProbability * BONUS_FREQUENCY_MULTIPLIER;
    const baseTarget = TARGET_RTP / (1 + 9 * bonusProbability);
    const multipliers = { ...PAYTABLES[risk] };
    const weightedRounded = profile.shares.outer * multipliers.outer
      + profile.shares.middle * multipliers.middle
      + profile.shares.center * multipliers.center;
    const calibratedHit = baseTarget / weightedRounded;
    const baselineHit = (TARGET_RTP / (1 + 9 * baseBonusProbability)) / weightedRounded;
    if (!(calibratedHit > 0 && calibratedHit < 1)) {
      throw new Error(`Unsolvable hit probability for ${configId(risk, lines, pucks)}`);
    }
    const probabilities = {
      empty: 1 - calibratedHit,
      outer: calibratedHit * profile.shares.outer,
      middle: calibratedHit * profile.shares.middle,
      center: calibratedHit * profile.shares.center
    };
    const baseRtp = probabilities.outer * multipliers.outer
      + probabilities.middle * multipliers.middle
      + probabilities.center * multipliers.center;
    const bonusRtp = baseRtp * 9 * bonusProbability;
    const calculatedRtp = baseRtp + bonusRtp;
    const baselinePaidBonusWinFrequency = baseBonusProbability * (1 - (1 - baselineHit) ** pucks);
    const paidBonusWinFrequency = bonusProbability * (1 - (1 - calibratedHit) ** pucks);
    const sectors = buildSectorDefinitions(lines);
    return {
      id: configId(risk, lines, pucks), risk, lines, pucks,
      profile_version: PROFILE_VERSION,
      target_rtp: TARGET_RTP,
      calculated_rtp: calculatedRtp,
      multiplier_table: multipliers,
      outcome_probabilities: probabilities,
      sector_definitions: sectors,
      star_placement: { count: pucks, unique_sectors: true, exclude_launch_sector: true },
      puck_radius: puckRadius(lines),
      base_puck_radius_5: BASE_PUCK_RADIUS_5,
      fixed_launch_force: FIXED_LAUNCH_FORCE,
      launch_angle_range_degrees: [-34, 34],
      fixed_timestep: FIXED_TIMESTEP,
      minimum_bounces: 4,
      pucks_collide: false,
      bonus_probability: bonusProbability,
      base_bonus_probability: baseBonusProbability,
      bonus_frequency_multiplier: BONUS_FREQUENCY_MULTIPLIER,
      baseline_paid_bonus_win_frequency: baselinePaidBonusWinFrequency,
      paid_bonus_win_frequency: paidBonusWinFrequency,
      paid_bonus_win_frequency_multiplier: paidBonusWinFrequency / baselinePaidBonusWinFrequency,
      base_game_rtp_contribution: baseRtp,
      bonus_rtp_contribution: bonusRtp,
      base_desired_bonus_share: desiredBonusShare,
      desired_bonus_share: bonusRtp / calculatedRtp,
      solver: { displayed_paytable: multipliers, target_hit_probability: profile.hit,
        baseline_hit_probability: baselineHit, calibrated_hit_probability: calibratedHit,
        category_shares: profile.shares }
    };
  }

  function buildConfigurations() {
    const configs = [];
    for (const risk of RISK_LEVELS) for (const lines of LINE_COUNTS) for (const pucks of PUCK_COUNTS) {
      configs.push(solveConfiguration(risk, lines, pucks));
    }
    return configs;
  }
  const CONFIGURATIONS = buildConfigurations();
  const CONFIG_BY_ID = Object.fromEntries(CONFIGURATIONS.map((config) => [config.id, config]));
  function getConfiguration(risk, lines, pucks) {
    const config = CONFIG_BY_ID[configId(risk, Number(lines), Number(pucks))];
    if (!config) throw new Error(`Unknown Puck Luck configuration: ${risk}/${lines}/${pucks}`);
    return config;
  }

  function sampleCategory(rng, probabilities) {
    const roll = rng.next();
    let cursor = probabilities.empty;
    if (roll < cursor) return "empty";
    cursor += probabilities.outer;
    if (roll < cursor) return "outer";
    cursor += probabilities.middle;
    return roll < cursor ? "middle" : "center";
  }
  function pickSector(rng, sectors) { return sectors[rng.int(sectors.length)]; }
  function samplePartialStarCount(rng, pucks) {
    const roll = rng.next();
    if (pucks === 2) return roll < ONE_OF_TWO_STAR_PROBABILITY ? 1 : 0;
    if (pucks === 3) {
      if (roll < TWO_OF_THREE_STAR_PROBABILITY) return 2;
      return roll < 0.95 ? 1 : 0;
    }
    return 0;
  }
  function placeStars(rng, config) {
    const launchIndex = config.lines * config.lines - 1;
    const available = [];
    for (let index = 0; index < config.lines * config.lines; index += 1) if (index !== launchIndex) available.push(index);
    const stars = [];
    for (let i = 0; i < config.pucks; i += 1) {
      const offset = rng.int(available.length);
      const index = available.splice(offset, 1)[0];
      stars.push({ index, row: Math.floor(index / config.lines), col: index % config.lines });
    }
    return stars;
  }

  function createRound({ risk, lines, pucks, betPerPuck = 1, seed = 1 }) {
    const config = getConfiguration(risk, lines, pucks);
    const rng = createRng((seed ^ hashString(config.id)) >>> 0);
    const stars = placeStars(rng, config);
    const paidBonusTriggered = rng.next() < config.bonus_probability;
    const baselineCollectedCount = paidBonusTriggered ? pucks : samplePartialStarCount(rng, pucks);
    const puckResults = [];
    let baseMultiplierSum = 0;
    for (let i = 0; i < pucks; i += 1) {
      const category = sampleCategory(rng, config.outcome_probabilities);
      const sector = pickSector(rng, config.sector_definitions[category]);
      const multiplier = config.multiplier_table[category];
      baseMultiplierSum += multiplier;
      puckResults.push({
        puck_index: i,
        category,
        sector,
        multiplier,
        empty: category === "empty",
        visual_seed: rng.uint32(),
        launch_angle_degrees: config.launch_angle_range_degrees[0]
          + rng.next() * (config.launch_angle_range_degrees[1] - config.launch_angle_range_degrees[0]),
        launch_force: config.fixed_launch_force,
        required_bounces: config.minimum_bounces + rng.int(4)
      });
    }
    const emptyRound = baseMultiplierSum === 0;
    const emptyRoundProbability = config.outcome_probabilities.empty ** pucks;
    const baseEmptyBonusChance = Math.max(0,
      (BONUS_PRESENTATION_TARGET_RATE - config.base_bonus_probability)
      / ((1 - config.bonus_probability) * emptyRoundProbability)
    );
    const emptyBonusChance = Math.min(1, baseEmptyBonusChance * EMPTY_BONUS_PRESENTATION_MULTIPLIER);
    const emptyBonusRng = createRng((seed ^ hashString(`${config.id}:empty-bonus`)) >>> 0);
    const emptyBonusTriggered = !paidBonusTriggered && emptyRound && emptyBonusRng.next() < emptyBonusChance;
    const bonusTriggered = paidBonusTriggered || emptyBonusTriggered;
    const collectedCount = bonusTriggered ? pucks : baselineCollectedCount;
    const starResults = stars.map((star, index) => ({ ...star, collected: index < collectedCount }));
    const bonusMultiplier = paidBonusTriggered ? 10 : 1;
    const totalBet = betPerPuck * pucks;
    const baseWin = betPerPuck * baseMultiplierSum;
    const finalWin = baseWin * bonusMultiplier;
    return {
      config_id: config.id, risk, lines, pucks, seed: seed >>> 0,
      bet_per_puck: betPerPuck,
      total_bet: totalBet,
      star_positions: starResults,
      puck_results: puckResults,
      stars_collected: collectedCount,
      bonus_triggered: bonusTriggered,
      paid_bonus_triggered: paidBonusTriggered,
      empty_bonus_triggered: emptyBonusTriggered,
      empty_bonus_chance: emptyBonusChance,
      bonus_multiplier: bonusTriggered ? 10 : 1,
      base_win_multiplier_sum: baseMultiplierSum,
      final_win_multiplier_sum: baseMultiplierSum * bonusMultiplier,
      base_win: baseWin,
      final_win: finalWin,
      rtp_contribution: finalWin / totalBet,
      authoritative: true
    };
  }

  function enumerateOutcomes(config) {
    const results = [];
    function visit(depth, categories, probability, sum) {
      if (depth === config.pucks) {
        for (const bonus of [false, true]) {
          const bonusProbability = bonus ? config.bonus_probability : 1 - config.bonus_probability;
          results.push({
            categories: [...categories], bonus,
            probability: probability * bonusProbability,
            base_multiplier_sum: sum,
            final_multiplier_sum: sum * (bonus ? 10 : 1),
            payout_ratio: sum * (bonus ? 10 : 1) / config.pucks
          });
        }
        return;
      }
      for (const category of CATEGORIES) {
        visit(depth + 1, [...categories, category], probability * config.outcome_probabilities[category], sum + config.multiplier_table[category]);
      }
    }
    visit(0, [], 1, 0);
    return results;
  }

  function analyticMetrics(config) {
    const outcomes = enumerateOutcomes(config);
    let mean = 0, secondMoment = 0, hit = 0, aboveBet = 0, bonus = 0, max = 0;
    for (const outcome of outcomes) {
      mean += outcome.probability * outcome.payout_ratio;
      secondMoment += outcome.probability * outcome.payout_ratio * outcome.payout_ratio;
      if (outcome.final_multiplier_sum > 0) hit += outcome.probability;
      if (outcome.payout_ratio > 1) aboveBet += outcome.probability;
      if (outcome.bonus) bonus += outcome.probability;
      max = Math.max(max, outcome.payout_ratio);
    }
    const variance = Math.max(0, secondMoment - mean * mean);
    const top20 = outcomes.sort((a, b) => b.payout_ratio - a.payout_ratio || b.probability - a.probability).slice(0, 20);
    return { rtp: mean, hit_frequency: hit, win_above_bet_frequency: aboveBet, bonus_frequency: bonus,
      max_win_multiplier: max, variance, standard_deviation: Math.sqrt(variance), top20 };
  }

  function simulateConfiguration(config, totalRuns = 1000000, seed = hashString(config.id), options = {}) {
    const captureHistogram = options.captureHistogram !== false;
    const rng = createRng(seed);
    let payoutSum = 0, basePayoutSum = 0, bonusExtraSum = 0, hitCount = 0, aboveBetCount = 0, bonusCount = 0;
    let mean = 0, m2 = 0, maxWin = 0;
    const categoryHits = { empty: 0, outer: 0, middle: 0, center: 0 };
    const starCellHits = new Array(config.lines * config.lines).fill(0);
    const outcomeHistogram = Object.create(null);
    for (let run = 0; run < totalRuns; run += 1) {
      for (let star = 0; star < config.pucks; star += 1) starCellHits[rng.int(starCellHits.length - 1)] += 1;
      const bonus = rng.next() < config.bonus_probability;
      let base = 0;
      const categories = [];
      for (let puck = 0; puck < config.pucks; puck += 1) {
        const category = sampleCategory(rng, config.outcome_probabilities);
        categoryHits[category] += 1;
        categories.push(category[0]);
        base += config.multiplier_table[category];
      }
      const final = base * (bonus ? 10 : 1);
      const payoutRatio = final / config.pucks;
      payoutSum += payoutRatio;
      basePayoutSum += base / config.pucks;
      bonusExtraSum += (final - base) / config.pucks;
      if (final > 0) hitCount += 1;
      if (payoutRatio > 1) aboveBetCount += 1;
      if (bonus) bonusCount += 1;
      if (payoutRatio > maxWin) maxWin = payoutRatio;
      const delta = payoutRatio - mean;
      mean += delta / (run + 1);
      m2 += delta * (payoutRatio - mean);
      if (captureHistogram) {
        const key = `${categories.join("")}|${bonus ? "B" : "N"}|${final.toFixed(2)}`;
        outcomeHistogram[key] = (outcomeHistogram[key] || 0) + 1;
      }
    }
    return {
      total_runs: totalRuns,
      seed: seed >>> 0,
      simulated_rtp: payoutSum / totalRuns,
      simulated_base_rtp: basePayoutSum / totalRuns,
      simulated_bonus_rtp: bonusExtraSum / totalRuns,
      simulated_hit_frequency: hitCount / totalRuns,
      simulated_win_above_bet_frequency: aboveBetCount / totalRuns,
      simulated_bonus_frequency: bonusCount / totalRuns,
      simulated_max_win_multiplier: maxWin,
      simulated_variance: totalRuns > 1 ? m2 / (totalRuns - 1) : 0,
      category_hits: categoryHits,
      star_cell_hits: starCellHits,
      outcome_histogram: outcomeHistogram
    };
  }

  return {
    TARGET_RTP, BONUS_PRESENTATION_TARGET_RATE, EMPTY_BONUS_PRESENTATION_MULTIPLIER,
    BONUS_FREQUENCY_MULTIPLIER, ONE_OF_TWO_STAR_PROBABILITY, TWO_OF_THREE_STAR_PROBABILITY,
    PROFILE_VERSION, PAYTABLES,
    RISK_LEVELS, LINE_COUNTS, PUCK_COUNTS, FIXED_TIMESTEP, BASE_PUCK_RADIUS_5,
    FIXED_LAUNCH_FORCE, CONFIGURATIONS, createRng, hashString, puckRadius, getConfiguration,
    createRound, enumerateOutcomes, analyticMetrics, simulateConfiguration, solveConfiguration,
    samplePartialStarCount,
    buildSectorDefinitions
  };
});
