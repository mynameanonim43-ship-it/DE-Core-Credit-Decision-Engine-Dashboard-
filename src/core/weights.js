// src/core/weights.js
// Bobot dinamis quanti/quali per profil company + penyesuaian gap

/**
 * Profil company yang didukung
 */
export const COMPANY_PROFILES = {
  startup: {
    label: 'Startup',
    quantiWeight: 0.40,
    qualiWeight:  0.60,
    description: 'Belum ada track record finansial. Fokus pada potensi bisnis & tim.',
  },
  ukm: {
    label: 'UKM Mapan',
    quantiWeight: 0.65,
    qualiWeight:  0.35,
    description: 'Sudah ada historis keuangan. Fokus cash flow & financial health.',
  },
  manufacturing: {
    label: 'Manufaktur',
    quantiWeight: 0.60,
    qualiWeight:  0.40,
    description: 'Intensif aset. Fokus collateral & financial health.',
  },
  trade: {
    label: 'Perdagangan',
    quantiWeight: 0.70,
    qualiWeight:  0.30,
    description: 'Siklus kas cepat. Fokus cash flow & likuiditas.',
  },
};

/**
 * Bobot 6 pilar (sifat: quanti / quali)
 * Masing-masing pilar: { weight, type: 'quanti'|'quali'|'mixed' }
 */
export const PILLARS = {
  businessViability: { label: 'Business Viability',     baseWeight: 0.20, type: 'quali'  },
  financialHealth:   { label: 'Financial Health',        baseWeight: 0.25, type: 'quanti' },
  cashFlow:          { label: 'Cash Flow & Repayment',   baseWeight: 0.25, type: 'quanti' },
  management:        { label: 'Management & Track Record',baseWeight: 0.15, type: 'quali' },
  collateral:        { label: 'Collateral & Guarantee',  baseWeight: 0.10, type: 'mixed'  },
  industryRisk:      { label: 'Industry & Macro Risk',   baseWeight: 0.05, type: 'quali'  },
};

/**
 * Sub-komponen setiap pilar dengan bobot internal
 */
export const PILLAR_SUBCOMPONENTS = {
  businessViability: [
    { key: 'bizModel',      label: 'Model Bisnis',         weight: 0.30 },
    { key: 'marketPosition',label: 'Posisi Pasar',         weight: 0.25 },
    { key: 'scalability',   label: 'Skalabilitas',         weight: 0.20 },
    { key: 'competitive',   label: 'Keunggulan Kompetitif',weight: 0.15 },
    { key: 'operatingRisk', label: 'Risiko Operasional',   weight: 0.10 },
  ],
  financialHealth: [
    { key: 'roa',    label: 'ROA',            weight: 0.20 },
    { key: 'roe',    label: 'ROE',            weight: 0.15 },
    { key: 'npm',    label: 'Net Profit Margin', weight: 0.15 },
    { key: 'der',    label: 'DER',            weight: 0.20 },
    { key: 'dar',    label: 'DAR',            weight: 0.10 },
    { key: 'altmanZ',label: 'Altman Z-Score', weight: 0.20 },
  ],
  cashFlow: [
    { key: 'dscr',         label: 'DSCR',                 weight: 0.35 },
    { key: 'icr',          label: 'ICR',                  weight: 0.25 },
    { key: 'dti',          label: 'DTI',                  weight: 0.20 },
    { key: 'ocfPositive',  label: 'Arus Kas Operasional', weight: 0.10 },
    { key: 'cashRunway',   label: 'Cash Runway',          weight: 0.10 },
  ],
  management: [
    { key: 'teamExp',       label: 'Pengalaman Tim',       weight: 0.30 },
    { key: 'trackRecord',   label: 'Track Record Kredit',  weight: 0.30 },
    { key: 'governance',    label: 'Tata Kelola',          weight: 0.20 },
    { key: 'succession',    label: 'Rencana Suksesi',      weight: 0.20 },
  ],
  collateral: [
    { key: 'ltv',              label: 'LTV',                   weight: 0.40 },
    { key: 'collateralType',   label: 'Jenis Agunan',          weight: 0.30 },
    { key: 'personalGuarantee',label: 'Personal Guarantee',    weight: 0.30 },
  ],
  industryRisk: [
    { key: 'sectorRisk',   label: 'Risiko Sektor',            weight: 0.35 },
    { key: 'macroSens',    label: 'Sensitivitas Makro',        weight: 0.30 },
    { key: 'outlook',      label: 'Prospek Industri',          weight: 0.35 },
  ],
};

/**
 * Hitung bobot pilar dinamis berdasarkan profil company & gap
 * 
 * Langkah:
 * 1. Split total weight ke quanti / quali berdasarkan profil
 * 2. Redistribusi antar pilar sesuai sifatnya
 * 3. Sesuaikan bobot sub-komponen berdasarkan gap
 *
 * @param {string} profileKey - kunci profil company
 * @param {Object} gapResults - hasil dari calcAllGaps()
 * @returns {Object} pillarWeights — { pillarKey: adjustedWeight }
 */
export function calcDynamicPillarWeights(profileKey, gapResults = {}) {
  const profile = COMPANY_PROFILES[profileKey] ?? COMPANY_PROFILES.ukm;
  const { quantiWeight, qualiWeight } = profile;

  // Pisahkan pilar berdasarkan tipe
  const quantiPillars = Object.entries(PILLARS).filter(([,p]) => p.type === 'quanti');
  const qualiPillars  = Object.entries(PILLARS).filter(([,p]) => p.type === 'quali');
  const mixedPillars  = Object.entries(PILLARS).filter(([,p]) => p.type === 'mixed');

  // Base total untuk setiap grup
  const quantiBase = quantiPillars.reduce((s, [,p]) => s + p.baseWeight, 0);
  const qualiBase  = qualiPillars.reduce((s, [,p])  => s + p.baseWeight, 0);
  const mixedBase  = mixedPillars.reduce((s, [,p])  => s + p.baseWeight, 0);

  // Sisa weight setelah mixed (50/50 antara quanti dan quali)
  const mixedQuanti = mixedBase * 0.5;
  const mixedQuali  = mixedBase * 0.5;

  const adjustedWeights = {};

  // Distribusi bobot ke pilar quanti
  quantiPillars.forEach(([key, p]) => {
    const share = quantiBase > 0 ? p.baseWeight / quantiBase : 0;
    adjustedWeights[key] = (quantiWeight - mixedQuanti) * share;
  });

  // Distribusi bobot ke pilar quali
  qualiPillars.forEach(([key, p]) => {
    const share = qualiBase > 0 ? p.baseWeight / qualiBase : 0;
    adjustedWeights[key] = (qualiWeight - mixedQuali) * share;
  });

  // Mixed pillars: split
  mixedPillars.forEach(([key, p]) => {
    adjustedWeights[key] = p.baseWeight;
  });

  // Normalisasi agar total = 1
  const total = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
  if (total > 0) {
    Object.keys(adjustedWeights).forEach(k => {
      adjustedWeights[k] /= total;
    });
  }

  return adjustedWeights;
}

/**
 * Sesuaikan bobot sub-komponen rasio berdasarkan gap (k=0.5)
 * bobot' = bobot_dasar × (1 + k × gap_score/100)
 *
 * @param {string} pillarKey
 * @param {Object} gapResults - output calcAllGaps()
 * @param {number} k - sensitivitas (default 0.5)
 * @returns {{ subKey: adjustedWeight }}
 */
export function calcAdjustedSubWeights(pillarKey, gapResults = {}, k = 0.5) {
  const subs = PILLAR_SUBCOMPONENTS[pillarKey] ?? [];
  const adjusted = {};

  subs.forEach(sub => {
    const gap = gapResults[sub.key];
    const gapScore = gap?.gapScore ?? 0;
    const raw = sub.weight * (1 + k * gapScore / 100);
    adjusted[sub.key] = Math.max(0, raw);
  });

  // Normalisasi
  const total = Object.values(adjusted).reduce((a, b) => a + b, 0);
  if (total > 0) {
    Object.keys(adjusted).forEach(k => {
      adjusted[k] /= total;
    });
  }

  return adjusted;
}
