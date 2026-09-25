// src/core/eligibility.js
// Decision Engine — 3 lapis: Hard Rules → Skor → Gap

import { analyzeGapCriticality } from './gap.js';

/**
 * Keputusan: LAYAK / LAYAK_BERSYARAT / REVIEW / TIDAK_LAYAK
 */
export const DECISIONS = {
  LAYAK:            { key: 'LAYAK',            label: '✅ LAYAK',             badge: 'approve',      color: '#10b981' },
  LAYAK_BERSYARAT:  { key: 'LAYAK_BERSYARAT',  label: '⚖️ LAYAK BERSYARAT',  badge: 'conditional',  color: '#f59e0b' },
  REVIEW:           { key: 'REVIEW',            label: '🔍 PERLU REVIEW',      badge: 'review',       color: '#6366f1' },
  TIDAK_LAYAK:      { key: 'TIDAK_LAYAK',       label: '❌ TIDAK LAYAK',       badge: 'reject',       color: '#ef4444' },
};

/**
 * LAPIS 1 — Hard Rules
 * Jika salah satu trigger, langsung TIDAK_LAYAK (tidak bisa di-override)
 *
 * @param {Object} ratios    - hasil computeAllRatios()
 * @param {Object} extras    - { ocfNegativePeriods, arrearsOver90, ocfPositive }
 * @returns {{ passed: boolean, triggers: string[] }}
 */
export function checkHardRules(ratios, extras = {}) {
  const triggers = [];

  // DSCR < 1.0
  if (ratios.dscr !== null && ratios.dscr < 1.0) {
    triggers.push(`DSCR ${ratios.dscr?.toFixed(2)}x < 1.0x — arus kas tidak cukup bayar kewajiban`);
  }

  // ICR < 1.0
  if (ratios.icr !== null && ratios.icr < 1.0) {
    triggers.push(`ICR ${ratios.icr?.toFixed(2)}x < 1.0x — EBIT tidak cukup menutup bunga`);
  }

  // Arus kas operasional negatif ≥ 2 periode berturut-turut
  if (extras.ocfNegativePeriods >= 2) {
    triggers.push(`Arus kas operasional negatif ${extras.ocfNegativePeriods} periode berturut-turut`);
  }

  // Keterlambatan bayar > 90 hari (arrears/kolektibilitas)
  if (extras.arrearsOver90) {
    triggers.push('Terdapat arrears/keterlambatan pembayaran > 90 hari');
  }

  // DAR >= 0.90 (over-leveraged)
  if (ratios.dar !== null && ratios.dar >= 0.90) {
    triggers.push(`DAR ${ratios.dar?.toFixed(2)} ≥ 0.90 — over-leveraged`);
  }

  // Altman Z < 1.8 (danger zone)
  if (ratios.altmanZ !== null && ratios.altmanZ < 1.81) {
    triggers.push(`Altman Z-Score ${ratios.altmanZ?.toFixed(2)} < 1.81 — zona bahaya kebangkrutan`);
  }

  return { passed: triggers.length === 0, triggers };
}

/**
 * LAPIS 2 — Skor
 * ≥75 LAYAK | 60–74 LAYAK BERSYARAT | 45–59 REVIEW | <45 TIDAK LAYAK
 */
export function decisionFromScore(finalScore) {
  if (finalScore >= 75) return DECISIONS.LAYAK;
  if (finalScore >= 60) return DECISIONS.LAYAK_BERSYARAT;
  if (finalScore >= 45) return DECISIONS.REVIEW;
  return DECISIONS.TIDAK_LAYAK;
}

/**
 * LAPIS 3 — Gap Override
 * Jika rata-rata gap < -30 ATAU ≥3 rasio utama gap < -30 → TIDAK_LAYAK
 */
export function checkGapOverride(gapResults) {
  const { avgGap, criticalCount, isCritical } = analyzeGapCriticality(gapResults);

  const reasons = [];
  if (avgGap < -30) {
    reasons.push(`Rata-rata gap seluruh rasio ${avgGap.toFixed(1)}% (< -30%) — borrower jauh di bawah industri`);
  }
  if (criticalCount >= 3) {
    reasons.push(`${criticalCount} rasio utama gap < -30% — fundamental merah`);
  }

  return { override: isCritical, reasons, avgGap, criticalCount };
}

/**
 * Hitung confidence score (0–100%)
 * Makin tinggi skor dan makin kecil selisih ke threshold berikutnya, makin tinggi confidence
 */
export function calcConfidence(finalScore, gapResults) {
  const { avgGap } = analyzeGapCriticality(gapResults);

  // Base confidence dari skor
  let base;
  if (finalScore >= 85)      base = 95;
  else if (finalScore >= 75) base = 85 + (finalScore - 75) * 1;
  else if (finalScore >= 60) base = 65 + (finalScore - 60) * 1.33;
  else if (finalScore >= 45) base = 45 + (finalScore - 45) * 1.33;
  else                       base = Math.max(10, finalScore * 0.9);

  // Adjust berdasarkan gap
  const gapAdj = Math.max(-15, Math.min(10, avgGap * 0.2));
  return Math.round(Math.min(99, Math.max(10, base + gapAdj)));
}

/**
 * MASTER eligibility function — menggabungkan 3 lapis
 *
 * @param {Object} params
 * @returns {Object} { decision, confidence, hardRuleTriggers, gapOverride, reasons, syarat }
 */
export function determineEligibility({ ratios, finalScore, gapResults, extras = {} }) {
  // Lapis 1
  const hardRules = checkHardRules(ratios, extras);
  if (!hardRules.passed) {
    return {
      decision: DECISIONS.TIDAK_LAYAK,
      confidence: 99,
      hardRuleTriggers: hardRules.triggers,
      gapOverride: { override: false, reasons: [] },
      reasons: hardRules.triggers,
      syarat: [],
      layer: 'hard_rules',
    };
  }

  // Lapis 2
  const scoreDecision = decisionFromScore(finalScore);

  // Lapis 3
  const gapOverride = checkGapOverride(gapResults);
  if (gapOverride.override) {
    return {
      decision: DECISIONS.TIDAK_LAYAK,
      confidence: 90,
      hardRuleTriggers: [],
      gapOverride,
      reasons: gapOverride.reasons,
      syarat: [],
      layer: 'gap_override',
    };
  }

  // Build reasons & syarat
  const reasons = buildReasons(finalScore, ratios, gapResults);
  const syarat  = buildSyarat(scoreDecision.key, ratios, gapResults);
  const confidence = calcConfidence(finalScore, gapResults);

  return {
    decision: scoreDecision,
    confidence,
    hardRuleTriggers: [],
    gapOverride: { override: false, reasons: [] },
    reasons,
    syarat,
    layer: 'score',
  };
}

function buildReasons(finalScore, ratios, gapResults) {
  const reasons = [];

  if (finalScore >= 75) reasons.push(`Skor total ${finalScore} ≥ 75 — memenuhi threshold kelayakan`);
  else if (finalScore >= 60) reasons.push(`Skor total ${finalScore} antara 60–74 — layak bersyarat`);
  else reasons.push(`Skor total ${finalScore} di bawah threshold minimum`);

  if (ratios.dscr) reasons.push(`DSCR ${ratios.dscr.toFixed(2)}x ${ratios.dscr >= 1.2 ? '✓' : '⚠️'}`);
  if (ratios.icr)  reasons.push(`ICR ${ratios.icr.toFixed(2)}x ${ratios.icr >= 1.5 ? '✓' : '⚠️'}`);

  const gaps = Object.entries(gapResults).filter(([,g]) => g.gapScore < -20);
  if (gaps.length > 0) {
    reasons.push(`Rasio di bawah median industri: ${gaps.map(([k]) => k).join(', ')}`);
  }

  return reasons;
}

function buildSyarat(decisionKey, ratios, gapResults) {
  if (decisionKey === 'LAYAK') return [];

  const syarat = [];

  if (decisionKey === 'LAYAK_BERSYARAT' || decisionKey === 'REVIEW') {
    if (ratios.dscr && ratios.dscr < 1.3) {
      syarat.push('Tingkatkan DSCR minimal 1.3x melalui peningkatan EBIT atau pengurangan beban hutang');
    }
    if (ratios.der && ratios.der > 1.5) {
      syarat.push('Restrukturisasi modal — kurangi DER di bawah 1.5x');
    }
    const lowGaps = Object.entries(gapResults).filter(([,g]) => g.gapScore < -30);
    if (lowGaps.length > 0) {
      syarat.push(`Perbaiki rasio yang signifikan di bawah benchmark: ${lowGaps.map(([k]) => k).join(', ')}`);
    }
    syarat.push('Tambah agunan atau personal guarantee untuk mengurangi eksposur risiko');
    syarat.push('Laporkan laporan keuangan terbaru (3 bulan terakhir) sebelum pencairan');
  }

  return syarat;
}
