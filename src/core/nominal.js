// src/core/nominal.js
// Rekomendasi nominal pinjaman dalam Rupiah

import { calcMonthlyPayment } from './ratios.js';

const ROUND_TO = 50_000_000; // Rp 50 juta
const LTV_MAX  = 0.80;
const DSCR_TARGET = 1.25; // target DSCR minimum konservatif

/**
 * Hitung nominal dari kapasitas bayar (DSCR-based)
 *
 * angsuran_maks = (EBIT / DSCR_target) - total_bunga_lain
 * Nominal_kapasitas = PMT^-1(angsuran_maks, r, n)
 */
export function calcCapacityNominal({ ebit, otherInterest = 0, annualRatePct, tenorMonths, dscrTarget = DSCR_TARGET }) {
  const maxDebtService = ebit / dscrTarget;
  const maxMonthlyDS  = maxDebtService / 12;
  const maxMonthlyPrincipal = maxMonthlyDS - otherInterest / 12;

  if (maxMonthlyPrincipal <= 0) return 0;

  // Inverse PMT: P = PMT × [1-(1+r)^-n] / r
  const r = annualRatePct / 100 / 12;
  if (r === 0) return maxMonthlyPrincipal * tenorMonths;

  const pvFactor = (1 - Math.pow(1 + r, -tenorMonths)) / r;
  return maxMonthlyPrincipal * pvFactor;
}

/**
 * Hitung nominal dari agunan
 * Nominal_agunan = Nilai_Agunan × LTV_maks
 */
export function calcCollateralNominal(collateralValue, ltvMax = LTV_MAX) {
  return collateralValue * ltvMax;
}

/**
 * Bulatkan ke kelipatan Rp 50 juta
 */
export function roundToNearest(value, step = ROUND_TO) {
  return Math.round(value / step) * step;
}

/**
 * Hitung rekomendasi nominal final
 *
 * Logika:
 * 1. Hitung kapasitas (DSCR)
 * 2. Hitung batas agunan
 * 3. Nominal = min(kapasitas, agunan, plafon_diajukan)
 * 4. Bulatkan ke Rp 50jt
 * 5. Range ±5%
 *
 * @returns {{ nominal, nominalMin, nominalMax, bindingFactor, dscrAtNominal, detail }}
 */
export function calcNominalRecommendation({
  ebit,
  otherInterest = 0,
  annualRatePct,
  tenorMonths,
  collateralValue,
  plafonDiajukan,
  ltvMax = LTV_MAX,
  dscrTarget = DSCR_TARGET,
}) {
  const capacityNominal   = calcCapacityNominal({ ebit, otherInterest, annualRatePct, tenorMonths, dscrTarget });
  const collateralNominal = calcCollateralNominal(collateralValue, ltvMax);

  const candidates = [capacityNominal, collateralNominal, plafonDiajukan].filter(v => v > 0);
  const rawNominal = Math.min(...candidates);
  const nominal    = roundToNearest(rawNominal);

  // Range ±5%
  const nominalMin = roundToNearest(nominal * 0.95);
  const nominalMax = roundToNearest(nominal * 1.05);

  // Faktor pembatas
  let bindingFactor = 'kapasitas';
  if (rawNominal === plafonDiajukan && plafonDiajukan <= capacityNominal && plafonDiajukan <= collateralNominal) {
    bindingFactor = 'plafon_diajukan';
  } else if (collateralNominal < capacityNominal && collateralNominal < plafonDiajukan) {
    bindingFactor = 'agunan';
  }

  // DSCR @ nominal yang direkomendasikan
  const monthlyPayment = calcMonthlyPayment(nominal, annualRatePct, tenorMonths);
  const annualDS = monthlyPayment * 12;
  const dscrAtNominal = annualDS > 0 ? ebit / annualDS : null;

  return {
    nominal,
    nominalMin,
    nominalMax,
    bindingFactor,
    dscrAtNominal: dscrAtNominal ? Math.round(dscrAtNominal * 100) / 100 : null,
    detail: {
      capacityNominal: Math.round(capacityNominal),
      collateralNominal: Math.round(collateralNominal),
      plafonDiajukan,
      rawNominal: Math.round(rawNominal),
    },
  };
}

/**
 * Format angka ke Rupiah
 */
export function formatRupiah(value, compact = false) {
  if (value === null || value === undefined) return '-';
  if (compact) {
    if (value >= 1e12) return `Rp ${(value / 1e12).toFixed(1)} T`;
    if (value >= 1e9)  return `Rp ${(value / 1e9).toFixed(1)} M`;
    if (value >= 1e6)  return `Rp ${(value / 1e6).toFixed(0)} Jt`;
    return `Rp ${value.toLocaleString('id-ID')}`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
}
