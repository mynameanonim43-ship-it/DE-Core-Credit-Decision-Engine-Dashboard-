// src/data/store.js
// Persistensi localStorage — semua data borrower, settings, dll.

const KEYS = {
  BORROWERS: 'vantage_borrowers',
  SETTINGS:  'vantage_settings',
  BENCHMARKS_CUSTOM: 'vantage_benchmarks_custom',
  USERS:     'vantage_users',
};

// ==============================
//  BORROWERS
// ==============================

export function getAllBorrowers() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.BORROWERS) ?? '[]');
  } catch { return []; }
}

export function saveBorrower(borrower) {
  const list = getAllBorrowers();
  const idx  = list.findIndex(b => b.id === borrower.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...borrower, updatedAt: new Date().toISOString() };
  else          list.push({ ...borrower, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  localStorage.setItem(KEYS.BORROWERS, JSON.stringify(list));
  return borrower;
}

export function getBorrowerById(id) {
  return getAllBorrowers().find(b => b.id === id) ?? null;
}

export function deleteBorrower(id) {
  const list = getAllBorrowers().filter(b => b.id !== id);
  localStorage.setItem(KEYS.BORROWERS, JSON.stringify(list));
}

export function generateId() {
  return `B${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

// ==============================
//  SETTINGS
// ==============================

const DEFAULT_SETTINGS = {
  thresholds: { approve: 75, conditional: 60, review: 45 },
  hardRules: {
    dscrMin:    1.0,
    icrMin:     1.0,
    ocfNegPeriods: 2,
    arrears90:  true,
    darMax:     0.90,
    altmanZMin: 1.81,
  },
  dscrTarget:    1.25,
  ltvMax:        0.80,
  roundTo:       50_000_000,
  gapKFactor:    0.5,
  gapCriticalAvg: -30,
  gapCriticalRatioCount: 3,
};

export function getSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.SETTINGS) ?? 'null');
    return stored ? { ...DEFAULT_SETTINGS, ...stored } : { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// ==============================
//  SEED DATA (demo)
// ==============================

const SEED_BORROWERS = [
  {
    id: 'B001',
    name: 'PT Maju Bersama',
    sector: 'manufacturing',
    profile: 'manufacturing',
    plafon: 2_500_000_000,
    tenor: 36,
    rate: 12,
    status: 'active',
    decision: 'LAYAK',
    finalScore: 78.4,
    confidence: 87,
    ewsStatus: 'green',
    nominal: 2_500_000_000,
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
    ratios: { dscr: 1.52, icr: 3.1, der: 0.75, roa: 5.2, currentRatio: 1.8 },
  },
  {
    id: 'B002',
    name: 'CV Sukses Mandiri',
    sector: 'trade',
    profile: 'ukm',
    plafon: 800_000_000,
    tenor: 24,
    rate: 14,
    status: 'active',
    decision: 'LAYAK_BERSYARAT',
    finalScore: 64.2,
    confidence: 72,
    ewsStatus: 'yellow',
    nominal: 700_000_000,
    createdAt: '2026-02-20T08:00:00.000Z',
    updatedAt: '2026-09-15T08:00:00.000Z',
    ratios: { dscr: 1.18, icr: 2.1, der: 1.02, roa: 2.8, currentRatio: 1.4 },
  },
  {
    id: 'B003',
    name: 'PT Teknologi Masa Depan',
    sector: 'technology',
    profile: 'startup',
    plafon: 1_500_000_000,
    tenor: 48,
    rate: 15,
    status: 'review',
    decision: 'REVIEW',
    finalScore: 55.1,
    confidence: 58,
    ewsStatus: 'green',
    nominal: null,
    createdAt: '2026-03-10T08:00:00.000Z',
    updatedAt: '2026-09-10T08:00:00.000Z',
    ratios: { dscr: 1.05, icr: 1.8, der: 0.42, roa: 1.2, currentRatio: 2.8 },
  },
  {
    id: 'B004',
    name: 'UD Sumber Rezeki',
    sector: 'agriculture',
    profile: 'ukm',
    plafon: 500_000_000,
    tenor: 18,
    rate: 13,
    status: 'active',
    decision: 'LAYAK',
    finalScore: 81.0,
    confidence: 92,
    ewsStatus: 'green',
    nominal: 500_000_000,
    createdAt: '2026-04-05T08:00:00.000Z',
    updatedAt: '2026-08-20T08:00:00.000Z',
    ratios: { dscr: 1.78, icr: 4.2, der: 0.55, roa: 4.8, currentRatio: 2.1 },
  },
  {
    id: 'B005',
    name: 'PT Properti Nusantara',
    sector: 'property',
    profile: 'manufacturing',
    plafon: 5_000_000_000,
    tenor: 60,
    rate: 11,
    status: 'rejected',
    decision: 'TIDAK_LAYAK',
    finalScore: 38.5,
    confidence: 95,
    ewsStatus: 'red',
    nominal: null,
    createdAt: '2026-05-12T08:00:00.000Z',
    updatedAt: '2026-09-20T08:00:00.000Z',
    ratios: { dscr: 0.88, icr: 0.95, der: 2.1, roa: 0.5, currentRatio: 0.9 },
  },
  {
    id: 'B006',
    name: 'CV Transportasi Andalan',
    sector: 'transport',
    profile: 'ukm',
    plafon: 1_200_000_000,
    tenor: 36,
    rate: 13.5,
    status: 'active',
    decision: 'LAYAK_BERSYARAT',
    finalScore: 67.8,
    confidence: 74,
    ewsStatus: 'yellow',
    nominal: 1_000_000_000,
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-09-18T08:00:00.000Z',
    ratios: { dscr: 1.22, icr: 2.4, der: 0.88, roa: 3.2, currentRatio: 1.3 },
  },
  {
    id: 'B007',
    name: 'PT Konstruksi Prima',
    sector: 'construction',
    profile: 'manufacturing',
    plafon: 3_000_000_000,
    tenor: 48,
    rate: 12.5,
    status: 'active',
    decision: 'LAYAK',
    finalScore: 76.3,
    confidence: 82,
    ewsStatus: 'green',
    nominal: 3_000_000_000,
    createdAt: '2026-07-08T08:00:00.000Z',
    updatedAt: '2026-09-05T08:00:00.000Z',
    ratios: { dscr: 1.41, icr: 2.9, der: 0.92, roa: 3.8, currentRatio: 1.6 },
  },
  {
    id: 'B008',
    name: 'PT Jasa Konsultan Digital',
    sector: 'services',
    profile: 'startup',
    plafon: 600_000_000,
    tenor: 24,
    rate: 16,
    status: 'review',
    decision: 'REVIEW',
    finalScore: 51.2,
    confidence: 55,
    ewsStatus: 'yellow',
    nominal: null,
    createdAt: '2026-08-15T08:00:00.000Z',
    updatedAt: '2026-09-22T08:00:00.000Z',
    ratios: { dscr: 1.08, icr: 1.5, der: 0.35, roa: 2.1, currentRatio: 2.2 },
  },
];

export function seedDemoData() {
  const existing = getAllBorrowers();
  if (existing.length === 0) {
    localStorage.setItem(KEYS.BORROWERS, JSON.stringify(SEED_BORROWERS));
  }
}

// ==============================
//  TREND DATA (dummy 6 bulan)
// ==============================

export function getTrendData() {
  return [
    { month: 'Apr',  analyses: 12, approved: 8,  conditional: 2, rejected: 2 },
    { month: 'Mei',  analyses: 18, approved: 11, conditional: 4, rejected: 3 },
    { month: 'Jun',  analyses: 15, approved: 9,  conditional: 4, rejected: 2 },
    { month: 'Jul',  analyses: 22, approved: 14, conditional: 5, rejected: 3 },
    { month: 'Ags',  analyses: 19, approved: 12, conditional: 4, rejected: 3 },
    { month: 'Sep',  analyses: 24, approved: 15, conditional: 6, rejected: 3 },
  ];
}
