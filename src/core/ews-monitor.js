// src/core/ews-monitor.js
// EWS Pasca-Pencairan — 20 parameter monitoring → judgement actionable

/**
 * 20 parameter EWS dengan kategori, label, dan cara pengukuran
 */
export const EWS_PARAMS = {
  // === KEUANGAN (P1–P10) ===
  P1:  { category: 'keuangan', label: 'DSCR Monitoring',           unit: 'x',   direction: 'high', critical: true,  threshold: { red: 1.0, yellow: 1.2 } },
  P2:  { category: 'keuangan', label: 'ICR Monitoring',            unit: 'x',   direction: 'high', critical: true,  threshold: { red: 1.0, yellow: 1.5 } },
  P3:  { category: 'keuangan', label: 'Current Ratio',             unit: 'x',   direction: 'high', critical: false, threshold: { red: 0.8, yellow: 1.0 } },
  P4:  { category: 'keuangan', label: 'Arus Kas Operasional',      unit: 'Jt',  direction: 'high', critical: true,  threshold: { red: 0,   yellow: null } },
  P5:  { category: 'keuangan', label: 'Cash Runway',               unit: 'bln', direction: 'high', critical: false, threshold: { red: 3,   yellow: 6 } },
  P6:  { category: 'keuangan', label: 'Penurunan Omzet YoY (%)',   unit: '%',   direction: 'low',  critical: false, threshold: { red: -30,  yellow: -15 } },
  P7:  { category: 'keuangan', label: 'Days to Wallet (DtW)',      unit: 'hari',direction: 'low',  critical: false, threshold: { red: 90,   yellow: 60 } },
  P8:  { category: 'keuangan', label: 'Altman Z-Score',            unit: '',    direction: 'high', critical: false, threshold: { red: 1.81, yellow: 2.67 } },
  P9:  { category: 'keuangan', label: 'ROA vs Benchmark (%)',      unit: '%',   direction: 'high', critical: false, threshold: { red: -30,  yellow: -15 } },
  P10: { category: 'keuangan', label: 'Saldo Kas Minimum',         unit: 'Jt',  direction: 'high', critical: false, threshold: { red: null, yellow: null } },

  // === PERILAKU (P11–P15) ===
  P11: { category: 'perilaku', label: 'Keterlambatan Bayar',       unit: 'hari',direction: 'low',  critical: true,  threshold: { red: 30,   yellow: 7 } },
  P12: { category: 'perilaku', label: 'Respons ke Lender',         unit: 'skor',direction: 'high', critical: false, threshold: { red: 30,   yellow: 60 } },
  P13: { category: 'perilaku', label: 'Turnover Eksekutif (12bl)', unit: 'org', direction: 'low',  critical: false, threshold: { red: 3,    yellow: 2 } },
  P14: { category: 'perilaku', label: 'Perubahan Strategi Besar',  unit: 'bool',direction: 'low',  critical: false, threshold: { red: 1,    yellow: null } },
  P15: { category: 'perilaku', label: 'Transaksi Tidak Wajar',     unit: 'bool',direction: 'low',  critical: true,  threshold: { red: 1,    yellow: null } },

  // === OPERASIONAL (P16–P20) ===
  P16: { category: 'operasional', label: 'Volume Produksi vs Target (%)', unit: '%', direction: 'high', critical: false, threshold: { red: -30, yellow: -15 } },
  P17: { category: 'operasional', label: 'Inventory Buildup (%YoY)',      unit: '%', direction: 'low',  critical: false, threshold: { red: 50,  yellow: 25 } },
  P18: { category: 'operasional', label: 'Piutang Macet (% total)',       unit: '%', direction: 'low',  critical: false, threshold: { red: 10,  yellow: 5 } },
  P19: { category: 'operasional', label: 'Utang Supplier (DPO)',          unit: 'hari',direction: 'low',critical: false, threshold: { red: 90,  yellow: 60 } },
  P20: { category: 'operasional', label: 'Kepatuhan Covenant',            unit: 'bool',direction: 'high',critical: true, threshold: { red: 0,   yellow: null } },
};

/**
 * Evaluasi satu parameter EWS
 * @returns { status: 'green'|'yellow'|'red', label }
 */
export function evaluateEWSParam(paramKey, value) {
  const param = EWS_PARAMS[paramKey];
  if (!param) return { status: 'green', label: 'N/A' };

  const { direction, threshold } = param;
  const { red, yellow } = threshold;

  if (value === null || value === undefined) {
    return { status: 'green', label: 'Belum diisi' };
  }

  // Boolean params
  if (param.unit === 'bool') {
    if (value === 1 || value === true) return { status: 'red', label: 'Terdeteksi' };
    return { status: 'green', label: 'Normal' };
  }

  if (direction === 'high') {
    // Semakin tinggi semakin baik
    if (red !== null && value <= red) return { status: 'red', label: `${value} ≤ ${red} (kritis)` };
    if (yellow !== null && value <= yellow) return { status: 'yellow', label: `${value} ≤ ${yellow} (waspada)` };
    return { status: 'green', label: `${value} (normal)` };
  } else {
    // Semakin rendah semakin baik
    if (red !== null && value >= red) return { status: 'red', label: `${value} ≥ ${red} (kritis)` };
    if (yellow !== null && value >= yellow) return { status: 'yellow', label: `${value} ≥ ${yellow} (waspada)` };
    return { status: 'green', label: `${value} (normal)` };
  }
}

/**
 * Hitung EWS Score (0–100) dari semua parameter
 * Critical params lebih berbobot
 */
export function calcEWSScore(paramValues) {
  let weightedSum = 0;
  let totalWeight = 0;

  Object.entries(EWS_PARAMS).forEach(([key, param]) => {
    const value = paramValues[key];
    const evaluation = evaluateEWSParam(key, value);
    const weight = param.critical ? 3 : 1;

    let paramScore;
    if (evaluation.status === 'green')  paramScore = 100;
    else if (evaluation.status === 'yellow') paramScore = 50;
    else                                paramScore = 0;

    weightedSum += paramScore * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;
}

/**
 * Generate EWS Judgement Actionable
 * Output: { level, judgement, action, escalate, kolektibilitas }
 */
export function generateEWSJudgement(paramValues) {
  const evaluations = {};
  let redCount    = 0;
  let yellowCount = 0;
  let criticalRed = false;

  Object.entries(EWS_PARAMS).forEach(([key, param]) => {
    const value = paramValues[key];
    const ev = evaluateEWSParam(key, value);
    evaluations[key] = ev;

    if (ev.status === 'red') {
      redCount++;
      if (param.critical) criticalRed = true;
    } else if (ev.status === 'yellow') {
      yellowCount++;
    }
  });

  const ewsScore = calcEWSScore(paramValues);

  // Tentukan level
  let level, judgement, action, escalate, kolektibilitas;

  if (criticalRed || redCount >= 3) {
    level = 'red';
    if (paramValues.P1 !== undefined && paramValues.P1 < 1.0) {
      judgement = '🔴 JANGAN LANJUT — Borrower tidak mampu bayar cicilan';
      action    = `DSCR ${paramValues.P1}x < 1.0x. Hentikan pencairan bertahap. Ajukan restrukturisasi ke Manajer Risiko.`;
    } else if (paramValues.P11 !== undefined && paramValues.P11 > 30) {
      judgement = '🔴 JANGAN LANJUT — Keterlambatan bayar kritis';
      action    = `Keterlambatan ${paramValues.P11} hari. Kirim surat peringatan. Eskalasi ke Komite Kredit.`;
    } else if (paramValues.P15 === 1) {
      judgement = '🔴 HENTIKAN SEGERA — Terdeteksi transaksi tidak wajar';
      action    = 'Bekukan fasilitas. Laporkan ke tim kepatuhan & Manajer Risiko. Minta klarifikasi tertulis.';
    } else {
      judgement = '🔴 RISIKO TINGGI — Multiple red flags terdeteksi';
      action    = `${redCount} indikator merah terdeteksi. Lakukan site visit segera. Ajukan restrukturisasi.`;
    }
    escalate       = true;
    kolektibilitas = 'Kolektibilitas 3–5 (Kurang Lancar s/d Macet)';

  } else if (redCount >= 1 || yellowCount >= 4) {
    level = 'yellow';
    judgement = '🟡 WASPADA — Terdapat indikator peringatan';
    action    = `${redCount} merah, ${yellowCount} kuning. Monitor lebih ketat. Minta laporan keuangan bulanan.`;
    escalate  = redCount >= 1;
    kolektibilitas = 'Kolektibilitas 2 (Dalam Perhatian Khusus)';

  } else if (yellowCount >= 2) {
    level = 'yellow_light';
    judgement = '🟡 PERHATIAN — Beberapa parameter membutuhkan monitoring';
    action    = 'Perhatikan tren. Jadwalkan review triwulan. Tidak perlu eskalasi.';
    escalate  = false;
    kolektibilitas = 'Kolektibilitas 1–2 (Lancar / DPK)';

  } else {
    level = 'green';
    judgement = '🟢 AMAN — Semua parameter dalam kondisi normal';
    action    = 'Lanjutkan monitoring rutin bulanan. Tidak ada tindakan khusus diperlukan.';
    escalate  = false;
    kolektibilitas = 'Kolektibilitas 1 (Lancar)';
  }

  return {
    level,
    ewsScore,
    judgement,
    action,
    escalate,
    kolektibilitas,
    evaluations,
    summary: { redCount, yellowCount, criticalRed },
  };
}
