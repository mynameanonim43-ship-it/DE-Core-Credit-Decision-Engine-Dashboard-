// src/core/gap.js
// Menghitung gap antara nilai borrower vs benchmark industri

import { getBenchmark, RATIO_META } from '../data/benchmark.js';

/**
 * Hitung gap ratio satu rasio
 * gap_ratio = (nilai_borrower - median) / |median|
 * gap_score = clamp(gap_ratio × 100, -100, +100)
 * 
 * Untuk rasio "low is better" (DER, DAR, LTV, DTI):
 * gap dibalik — nilai di bawah median = positif (bagus)
 */
export function calcGapScore(ratioKey, borrowerValue, sector) {
  if (borrowerValue === null || borrowerValue === undefined) return null;

  const bm = getBenchmark(sector, ratioKey);
  if (!bm) return null;

  const meta = RATIO_META[ratioKey];
  const direction = meta?.direction ?? 'high';
  const median = bm.median;

  if (Math.abs(median) < 0.0001) return 0;

  let gapRatio = (borrowerValue - median) / Math.abs(median);

  // Untuk rasio "low is better", balik sign
  if (direction === 'low') {
    gapRatio = -gapRatio;
  }

  const gapScore = Math.max(-100, Math.min(100, gapRatio * 100));
  return gapScore;
}

/**
 * Hitung gap semua rasio sekaligus
 * @param {Object} ratios - { roa, roe, dscr, ... } nilai borrower
 * @param {string} sector - kode sektor
 * @returns {Object} { roa: { value, gapScore, percentGap, status }, ... }
 */
export function calcAllGaps(ratios, sector) {
  const result = {};

  for (const [key, value] of Object.entries(ratios)) {
    if (value === null || value === undefined) continue;

    const bm = getBenchmark(sector, key);
    if (!bm) continue;

    const gapScore = calcGapScore(key, value, sector);
    const meta = RATIO_META[key];
    const direction = meta?.direction ?? 'high';
    const median = bm.median;

    const rawGap = (value - median) / Math.abs(median) * 100;
    const effectiveGap = direction === 'low' ? -rawGap : rawGap;

    result[key] = {
      value,
      bm,
      gapScore,
      percentGap: effectiveGap,
      status: getGapStatus(gapScore),
      direction,
    };
  }

  return result;
}

/**
 * Status label berdasarkan gap score
 */
export function getGapStatus(gapScore) {
  if (gapScore === null) return 'n/a';
  if (gapScore >= 30)  return 'excellent';   // unggul
  if (gapScore >= 10)  return 'good';         // di atas median
  if (gapScore >= -10) return 'neutral';      // setara industri
  if (gapScore >= -30) return 'warning';      // sedikit di bawah
  return 'danger';                            // jauh di bawah (red flag)
}

/**
 * Analisis gap agregat — apakah rata-rata gap terlalu negatif?
 * Rule: avg_gap < -30 ATAU ≥3 rasio utama gap < -30 → reject
 * @returns { avgGap, criticalCount, isCritical }
 */
export function analyzeGapCriticality(gapResults) {
  const coreRatios = ['roa', 'roe', 'dscr', 'icr', 'currentRatio', 'der', 'dti', 'altmanZ'];

  const scores = Object.values(gapResults)
    .map(g => g.gapScore)
    .filter(s => s !== null);

  const avgGap = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  const criticalCount = coreRatios.filter(r => {
    const g = gapResults[r];
    return g && g.gapScore < -30;
  }).length;

  const isCritical = avgGap < -30 || criticalCount >= 3;

  return { avgGap, criticalCount, isCritical };
}
