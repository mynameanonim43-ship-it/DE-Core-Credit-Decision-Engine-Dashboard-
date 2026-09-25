// src/core/scoring.js
// Hitung skor 6 pilar + skor akhir

import { PILLARS, PILLAR_SUBCOMPONENTS, calcDynamicPillarWeights, calcAdjustedSubWeights } from './weights.js';
import { getBenchmark, RATIO_META } from '../data/benchmark.js';

/**
 * Interpolasi skor 0–100 berdasarkan posisi nilai vs benchmark
 * Untuk "high is better": nilai tinggi → skor tinggi
 * Untuk "low is better": nilai rendah → skor tinggi
 */
export function interpolateScore(value, bm, direction = 'high') {
  if (value === null || value === undefined) return 50; // default tengah jika tidak ada data

  const { p25, median, p75 } = bm;

  let effectiveValue = value;
  // Untuk low-is-better, balik perspektif dengan transformasi cermin
  if (direction === 'low') {
    // Gunakan kebalikan — jika nilai rendah, "skor posisi" tinggi
    // Rumus sama tapi dibalik: nilai < p25 (IDX) = terbaik
    const invertedP25 = p75;
    const invertedMedian = median;
    const invertedP75 = p25;

    if (effectiveValue <= invertedP75) return 100;
    if (effectiveValue <= invertedMedian) {
      return 75 + ((invertedMedian - effectiveValue) / (invertedMedian - invertedP75)) * 25;
    }
    if (effectiveValue <= invertedP25) {
      return 50 + ((invertedP25 - effectiveValue) / (invertedP25 - invertedMedian)) * 25;
    }
    return Math.max(0, 50 * (invertedP25 / effectiveValue));
  }

  // High is better
  if (effectiveValue >= p75)     return 100;
  if (effectiveValue >= median)  return 75 + ((effectiveValue - median) / (p75 - median)) * 25;
  if (effectiveValue >= p25)     return 50 + ((effectiveValue - p25) / (median - p25)) * 25;
  return Math.max(0, 50 * (effectiveValue / p25));
}

/**
 * Hitung skor pilar Financial Health (quanti)
 * Input: rasio + benchmark sektor
 */
export function scorePillarFinancialHealth(ratios, sector, gapResults) {
  const subWeights = calcAdjustedSubWeights('financialHealth', gapResults);
  const subs = PILLAR_SUBCOMPONENTS.financialHealth;

  let totalScore = 0;
  const detail = {};

  subs.forEach(sub => {
    const value = ratios[sub.key];
    const bm = getBenchmark(sector, sub.key);
    const meta = RATIO_META[sub.key];
    const direction = meta?.direction ?? 'high';

    let score = 50;
    if (value !== null && value !== undefined && bm) {
      score = interpolateScore(value, bm, direction);
    }

    const w = subWeights[sub.key] ?? sub.weight;
    detail[sub.key] = { score, weight: w, value, bm };
    totalScore += score * w;
  });

  return { score: Math.round(totalScore * 10) / 10, detail };
}

/**
 * Hitung skor pilar Cash Flow & Repayment (quanti)
 */
export function scorePillarCashFlow(ratios, sector, gapResults, financialData = {}) {
  const subWeights = calcAdjustedSubWeights('cashFlow', gapResults);
  const detail = {};

  const scoreMap = {};

  // DSCR
  const dscrBm = getBenchmark(sector, 'dscr');
  scoreMap.dscr = dscrBm ? interpolateScore(ratios.dscr, dscrBm, 'high') : 50;

  // ICR
  const icrBm = getBenchmark(sector, 'icr');
  scoreMap.icr = icrBm ? interpolateScore(ratios.icr, icrBm, 'high') : 50;

  // DTI
  const dtiBm = getBenchmark(sector, 'dti');
  scoreMap.dti = dtiBm ? interpolateScore(ratios.dti, dtiBm, 'low') : 50;

  // OCF Positif
  scoreMap.ocfPositive = (financialData.operatingCashFlow > 0) ? 100 : 0;

  // Cash Runway (normalize: ≥24 bulan = 100, <3 bulan = 0)
  const runway = ratios.cashRunway;
  if (runway !== null && runway !== undefined) {
    scoreMap.cashRunway = Math.min(100, Math.max(0, (runway / 24) * 100));
  } else {
    scoreMap.cashRunway = 50;
  }

  let totalScore = 0;
  const subs = PILLAR_SUBCOMPONENTS.cashFlow;
  subs.forEach(sub => {
    const score = scoreMap[sub.key] ?? 50;
    const w = subWeights[sub.key] ?? sub.weight;
    detail[sub.key] = { score, weight: w };
    totalScore += score * w;
  });

  return { score: Math.round(totalScore * 10) / 10, detail };
}

/**
 * Hitung skor pilar Collateral (mixed)
 * ltvScore: pakai benchmark
 * collateralType: 1=properti(100), 2=kendaraan(75), 3=mesin(60), 4=piutang(40), 5=tanpa(0)
 * personalGuarantee: ada(100) / tidak(0)
 */
export function scorePillarCollateral(ratios, sector, collateralInputs = {}) {
  const { collateralType = 1, personalGuarantee = false } = collateralInputs;

  const ltvBm = getBenchmark(sector, 'ltv');
  const ltvScore = ltvBm ? interpolateScore(ratios.ltv, ltvBm, 'low') : 50;

  const typeScoreMap = { 1: 100, 2: 75, 3: 60, 4: 40, 5: 0 };
  const typeScore = typeScoreMap[collateralType] ?? 50;

  const pgScore = personalGuarantee ? 100 : 40;

  const subs = PILLAR_SUBCOMPONENTS.collateral;
  let totalScore = 0;
  const scoreMap = { ltv: ltvScore, collateralType: typeScore, personalGuarantee: pgScore };
  const detail = {};

  subs.forEach(sub => {
    const score = scoreMap[sub.key] ?? 50;
    detail[sub.key] = { score, weight: sub.weight };
    totalScore += score * sub.weight;
  });

  return { score: Math.round(totalScore * 10) / 10, detail };
}

/**
 * Hitung skor pilar kualitatif (BusinessViability, Management, IndustryRisk)
 * Input: { subKey: nilai 0–100 dari form AHP }
 */
export function scorePillarQualitative(pillarKey, qualiInputs = {}) {
  const subs = PILLAR_SUBCOMPONENTS[pillarKey] ?? [];
  let totalScore = 0;
  const detail = {};

  subs.forEach(sub => {
    const score = qualiInputs[sub.key] ?? 50;
    detail[sub.key] = { score, weight: sub.weight };
    totalScore += score * sub.weight;
  });

  return { score: Math.round(totalScore * 10) / 10, detail };
}

/**
 * MASTER scoring: hitung semua 6 pilar + skor akhir
 *
 * @param {Object} params
 * @param {Object} params.ratios       - hasil computeAllRatios()
 * @param {Object} params.gapResults   - hasil calcAllGaps()
 * @param {string} params.sector       - sektor borrower
 * @param {string} params.profileKey   - profil company
 * @param {Object} params.qualiInputs  - { businessViability: {…}, management: {…}, industryRisk: {…} }
 * @param {Object} params.collateralInputs
 * @param {Object} params.financialData - raw financial data
 *
 * @returns {{ pillarScores, finalScore, pillarWeights }}
 */
export function calcFinalScore({ ratios, gapResults, sector, profileKey, qualiInputs = {}, collateralInputs = {}, financialData = {} }) {
  const pillarWeights = calcDynamicPillarWeights(profileKey, gapResults);

  const pillarScores = {
    businessViability: scorePillarQualitative('businessViability', qualiInputs.businessViability),
    financialHealth:   scorePillarFinancialHealth(ratios, sector, gapResults),
    cashFlow:          scorePillarCashFlow(ratios, sector, gapResults, financialData),
    management:        scorePillarQualitative('management', qualiInputs.management),
    collateral:        scorePillarCollateral(ratios, sector, collateralInputs),
    industryRisk:      scorePillarQualitative('industryRisk', qualiInputs.industryRisk),
  };

  // Skor Akhir = Σ (Skor_Pilar × Bobot_Pilar)
  let finalScore = 0;
  Object.entries(pillarScores).forEach(([key, { score }]) => {
    finalScore += score * (pillarWeights[key] ?? 0);
  });

  return {
    pillarScores,
    finalScore: Math.round(finalScore * 10) / 10,
    pillarWeights,
  };
}
