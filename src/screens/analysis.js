// src/screens/analysis.js — Layar 3: Analisis Baru (Wizard 5 langkah) + Hasil

import { saveBorrower, generateId, getBorrowerById, getSettings } from '../data/store.js';
import { computeAllRatios } from '../core/ratios.js';
import { calcAllGaps } from '../core/gap.js';
import { calcFinalScore } from '../core/scoring.js';
import { determineEligibility } from '../core/eligibility.js';
import { calcNominalRecommendation, formatRupiah } from '../core/nominal.js';
import { SECTORS } from '../data/benchmark.js';
import { COMPANY_PROFILES, PILLARS } from '../core/weights.js';
import { RATIO_META, getBenchmark } from '../data/benchmark.js';
import { navigate, formatPct, formatX, decisionBadgeClass, decisionLabel } from '../utils/helpers.js';

let currentStep = 1;
const TOTAL_STEPS = 5;

// Shared form data
let formData = {
  // Step 1
  id: null, name: '', sector: 'manufacturing', profile: 'ukm', description: '',
  plafon: 0, tenor: 36, rate: 12,

  // Step 2
  revenue: 0, cogs: 0, ebit: 0, netIncome: 0, interestExpense: 0,
  operatingCashFlow: 0, totalAssets: 0, totalLiabilities: 0, totalEquity: 0,
  currentAssets: 0, currentLiabilities: 0, cash: 0, inventory: 0,
  accountsReceivable: 0, accountsPayable: 0, workingCapital: 0,
  retainedEarnings: 0, annualDebtService: 0, totalDebt: 0,
  ocfNegativePeriods: 0, arrearsOver90: false,

  // Step 3 — quali scores 0–100
  qualiBusinessViability: { bizModel: 70, marketPosition: 65, scalability: 60, competitive: 65, operatingRisk: 55 },
  qualiManagement:        { teamExp: 70, trackRecord: 60, governance: 65, succession: 50 },
  qualiIndustryRisk:      { sectorRisk: 55, macroSens: 50, outlook: 60 },

  // Step 4 — collateral
  collateralValue: 0, collateralType: 1, personalGuarantee: false,

  // Result
  result: null,
};

export function renderAnalysis(container, borrowerId = null) {
  // Load existing borrower data if editing
  if (borrowerId && typeof borrowerId === 'string') {
    const existing = getBorrowerById(borrowerId);
    if (existing) {
      Object.assign(formData, existing.formData ?? {});
      formData.id = existing.id;
    }
  } else {
    // Reset for new analysis
    formData = {
      id: null, name: '', sector: 'manufacturing', profile: 'ukm', description: '',
      plafon: 0, tenor: 36, rate: 12,
      revenue: 0, cogs: 0, ebit: 0, netIncome: 0, interestExpense: 0,
      operatingCashFlow: 0, totalAssets: 0, totalLiabilities: 0, totalEquity: 0,
      currentAssets: 0, currentLiabilities: 0, cash: 0, inventory: 0,
      accountsReceivable: 0, accountsPayable: 0, workingCapital: 0,
      retainedEarnings: 0, annualDebtService: 0, totalDebt: 0,
      ocfNegativePeriods: 0, arrearsOver90: false,
      qualiBusinessViability: { bizModel: 70, marketPosition: 65, scalability: 60, competitive: 65, operatingRisk: 55 },
      qualiManagement:        { teamExp: 70, trackRecord: 60, governance: 65, succession: 50 },
      qualiIndustryRisk:      { sectorRisk: 55, macroSens: 50, outlook: 60 },
      collateralValue: 0, collateralType: 1, personalGuarantee: false,
      result: null,
    };
    currentStep = 1;
  }

  container.innerHTML = `
    <div style="max-width:900px;margin:0 auto">
      <!-- Wizard Header -->
      <div class="wizard-header" id="wizard-header">
        ${renderWizardSteps()}
      </div>

      <!-- Step Content -->
      <div class="card">
        <div class="card-body" id="wizard-body">
          ${renderStep(currentStep)}
        </div>

        <!-- Navigation -->
        <div class="wizard-nav" id="wizard-nav" style="padding:var(--gap-lg) var(--gap-xl)">
          ${renderWizardNav()}
        </div>
      </div>
    </div>
  `;

  bindAnalysisEvents(container);
}

// ── Wizard Step Rendering ──
const STEP_LABELS = ['Profil', 'Keuangan', 'Bisnis & Mgmt', 'Agunan', 'Review'];

function renderWizardSteps() {
  return STEP_LABELS.map((label, i) => {
    const step = i + 1;
    const cls  = step < currentStep ? 'completed' : step === currentStep ? 'active' : '';
    return `
      <div class="wizard-step ${cls}" data-step="${step}">
        <div class="step-circle">${step < currentStep ? '✓' : step}</div>
        <span class="step-label">${label}</span>
      </div>
    `;
  }).join('');
}

function renderWizardNav() {
  const isLast = currentStep === TOTAL_STEPS;
  return `
    <button class="btn btn-secondary" id="btn-prev" ${currentStep === 1 ? 'disabled' : ''}>
      ← Sebelumnya
    </button>
    <span style="color:var(--text-muted);font-size:12px">Langkah ${currentStep} dari ${TOTAL_STEPS}</span>
    ${isLast
      ? `<button class="btn btn-success btn-lg" id="btn-calculate">🔍 Hitung Analisis</button>`
      : `<button class="btn btn-primary" id="btn-next">Selanjutnya →</button>`
    }
  `;
}

function renderStep(step) {
  switch (step) {
    case 1: return renderStep1();
    case 2: return renderStep2();
    case 3: return renderStep3();
    case 4: return renderStep4();
    case 5: return renderStep5();
    default: return '';
  }
}

// ── Step 1: Profil ──
function renderStep1() {
  const profileOptions = Object.entries(COMPANY_PROFILES).map(([k, p]) => `
    <div class="radio-option ${formData.profile === k ? 'selected' : ''}" data-profile="${k}">
      <span>${p.label}</span>
    </div>
  `).join('');

  return `
    <h3 class="section-title">👤 Profil Borrower</h3>
    <div class="form-grid form-grid-2">
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">Nama Perusahaan <span>*</span></label>
        <input class="form-control" id="f-name" type="text" placeholder="Contoh: PT Maju Bersama" value="${formData.name}">
      </div>
      <div class="form-group">
        <label class="form-label">Sektor Industri <span>*</span></label>
        <select class="form-control" id="f-sector">
          ${SECTORS.map(s => `<option value="${s.id}" ${formData.sector === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Plafon Diajukan (Rp) <span>*</span></label>
        <input class="form-control" id="f-plafon" type="number" min="0" step="50000000" value="${formData.plafon}" placeholder="1000000000">
      </div>
      <div class="form-group">
        <label class="form-label">Tenor (bulan)</label>
        <input class="form-control" id="f-tenor" type="number" min="6" max="120" value="${formData.tenor}">
      </div>
      <div class="form-group">
        <label class="form-label">Suku Bunga (%/tahun)</label>
        <input class="form-control" id="f-rate" type="number" min="0" max="50" step="0.5" value="${formData.rate}">
      </div>
    </div>

    <div class="form-group" style="margin-top:var(--gap-lg)">
      <label class="form-label">Profil Company</label>
      <div class="radio-group" id="profile-group">
        ${profileOptions}
      </div>
      <div class="form-hint" id="profile-hint">
        ${COMPANY_PROFILES[formData.profile]?.description ?? ''}
      </div>
    </div>

    <div class="form-group" style="margin-top:var(--gap-md)">
      <label class="form-label">Deskripsi Bisnis (opsional)</label>
      <textarea class="form-control" id="f-description" rows="3" placeholder="Jelaskan model bisnis, produk/layanan utama, target pasar...">${formData.description}</textarea>
    </div>
  `;
}

// ── Step 2: Data Keuangan ──
function renderStep2() {
  const fieldGroup = (id, label, hint = '', prefix = 'Rp') => `
    <div class="form-group">
      <label class="form-label">${label}</label>
      <div style="position:relative">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:12px">${prefix}</span>
        <input class="form-control" id="${id}" type="number" style="padding-left:${prefix ? '32px' : '12px'}"
               value="${formData[id] ?? 0}" data-field="${id}">
      </div>
      ${hint ? `<div class="form-hint">${hint}</div>` : ''}
    </div>
  `;

  const ratios = computeAllRatios({ ...formData, grossRevenue: formData.revenue });
  const gapResults = Object.keys(formData).length > 5 ? calcAllGaps(ratios, formData.sector) : {};

  return `
    <h3 class="section-title">💹 Data Keuangan</h3>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:var(--gap-lg)">Masukkan angka dalam Rupiah (tanpa titik/koma). Data laporan keuangan 1 tahun terakhir.</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--gap-xl)">
      <div>
        <div class="section-title" style="font-size:13px;margin-bottom:var(--gap-md)">📊 Laporan Laba Rugi</div>
        <div class="form-grid" style="gap:var(--gap-md)">
          ${fieldGroup('revenue',          'Pendapatan / Revenue')}
          ${fieldGroup('cogs',             'HPP / COGS')}
          ${fieldGroup('ebit',             'EBIT')}
          ${fieldGroup('netIncome',        'Laba Bersih')}
          ${fieldGroup('interestExpense',  'Beban Bunga')}
          ${fieldGroup('operatingCashFlow','Arus Kas Operasional')}
          ${fieldGroup('annualDebtService','Total Debt Service / tahun')}
        </div>
      </div>

      <div>
        <div class="section-title" style="font-size:13px;margin-bottom:var(--gap-md)">🏦 Neraca</div>
        <div class="form-grid" style="gap:var(--gap-md)">
          ${fieldGroup('totalAssets',      'Total Aset')}
          ${fieldGroup('totalLiabilities', 'Total Kewajiban')}
          ${fieldGroup('totalEquity',      'Total Ekuitas')}
          ${fieldGroup('currentAssets',    'Aset Lancar')}
          ${fieldGroup('currentLiabilities','Kewajiban Lancar')}
          ${fieldGroup('cash',             'Kas & Setara Kas')}
          ${fieldGroup('inventory',        'Persediaan')}
          ${fieldGroup('accountsReceivable','Piutang Usaha')}
          ${fieldGroup('accountsPayable',  'Utang Usaha')}
          ${fieldGroup('totalDebt',        'Total Hutang Berbunga')}
        </div>
      </div>
    </div>

    <!-- Live Ratio Preview -->
    <div id="ratio-preview" style="margin-top:var(--gap-xl)">
      ${renderRatioPreview(ratios, gapResults)}
    </div>

    <div class="form-group" style="margin-top:var(--gap-lg)">
      <label class="form-label">Kondisi Tambahan</label>
      <div style="display:flex;gap:var(--gap-lg);flex-wrap:wrap">
        <div class="form-group">
          <label class="form-label">OCF negatif berturut-turut (periode)</label>
          <input class="form-control" id="ocfNegativePeriods" type="number" min="0" max="10" value="${formData.ocfNegativePeriods}" style="width:100px">
        </div>
        <div class="radio-option ${formData.arrearsOver90 ? 'selected' : ''}" id="arrears-toggle" style="align-self:flex-end;margin-bottom:2px">
          ⚠️ Ada arrears > 90 hari
        </div>
      </div>
    </div>
  `;
}

function renderRatioPreview(ratios, gapResults) {
  const keyRatios = ['dscr', 'icr', 'roa', 'roe', 'der', 'currentRatio', 'dti', 'altmanZ'];

  return `
    <div class="section-title" style="font-size:13px">⚡ Preview Rasio (Real-time)</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--gap-sm)">
      ${keyRatios.map(k => {
        const val = ratios[k];
        const gap = gapResults[k];
        const meta = RATIO_META[k];
        if (val === null || val === undefined) return '';

        const status = gap?.status ?? 'neutral';
        const statusColor = { excellent:'#10b981', good:'#60a5fa', neutral:'var(--text-secondary)', warning:'#f59e0b', danger:'#ef4444', 'n/a':'var(--text-muted)' }[status];

        return `
          <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;display:flex;flex-direction:column;gap:4px">
            <span style="font-size:11px;color:var(--text-muted)">${meta?.label ?? k}</span>
            <span style="font-size:18px;font-weight:700;color:${statusColor};font-family:'JetBrains Mono',monospace">
              ${val.toFixed(2)}${meta?.unit === 'x' ? 'x' : meta?.unit === '%' ? '%' : ''}
            </span>
            ${gap ? `<span style="font-size:10px;color:${statusColor}">${gap.percentGap > 0 ? '+' : ''}${gap.percentGap.toFixed(1)}% vs median</span>` : ''}
          </div>
        `;
      }).filter(Boolean).join('')}
    </div>
  `;
}

// ── Step 3: Bisnis & Manajemen ──
function renderStep3() {
  const qualiSection = (title, key, fields, data) => `
    <div style="margin-bottom:var(--gap-xl)">
      <div class="section-title" style="font-size:13px">${title}</div>
      <div class="form-grid form-grid-2" style="gap:var(--gap-md)">
        ${fields.map(f => `
          <div class="form-group">
            <label class="form-label">${f.label}</label>
            <div style="display:flex;align-items:center;gap:var(--gap-sm)">
              <input type="range" min="0" max="100" step="5"
                     class="quali-range" id="q-${key}-${f.key}"
                     value="${data[f.key] ?? 50}"
                     data-quali-key="${key}" data-field="${f.key}"
                     style="flex:1;accent-color:var(--brand)">
              <span id="q-val-${key}-${f.key}" style="width:36px;text-align:right;font-weight:700;font-family:'JetBrains Mono',monospace;color:${scoreColor(data[f.key] ?? 50)}">
                ${data[f.key] ?? 50}
              </span>
            </div>
            <div class="form-hint">0 = Sangat Buruk | 50 = Rata-rata | 100 = Sangat Baik</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  return `
    <h3 class="section-title">🏢 Bisnis, Manajemen & Industri</h3>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:var(--gap-lg)">
      Penilaian kualitatif berdasarkan observasi, wawancara pemilik, dan riset industri.
    </p>

    ${qualiSection('📈 Business Viability (Pilar 1)', 'businessViability', [
      { key: 'bizModel',      label: 'Model Bisnis' },
      { key: 'marketPosition',label: 'Posisi Pasar' },
      { key: 'scalability',   label: 'Skalabilitas' },
      { key: 'competitive',   label: 'Keunggulan Kompetitif' },
      { key: 'operatingRisk', label: 'Risiko Operasional (100 = rendah)' },
    ], formData.qualiBusinessViability)}

    ${qualiSection('👔 Management & Track Record (Pilar 4)', 'management', [
      { key: 'teamExp',    label: 'Pengalaman Tim' },
      { key: 'trackRecord',label: 'Track Record Kredit' },
      { key: 'governance', label: 'Tata Kelola Perusahaan' },
      { key: 'succession', label: 'Rencana Suksesi' },
    ], formData.qualiManagement)}

    ${qualiSection('🌍 Industry & Macro Risk (Pilar 6)', 'industryRisk', [
      { key: 'sectorRisk', label: 'Risiko Sektor (100 = rendah)' },
      { key: 'macroSens',  label: 'Sensitivitas Makro (100 = rendah)' },
      { key: 'outlook',    label: 'Prospek Industri' },
    ], formData.qualiIndustryRisk)}
  `;
}

// ── Step 4: Agunan ──
function renderStep4() {
  const collateralTypes = [
    { val: 1, label: '🏠 Properti / Tanah' },
    { val: 2, label: '🚗 Kendaraan' },
    { val: 3, label: '⚙️ Mesin & Peralatan' },
    { val: 4, label: '📄 Piutang / Tagihan' },
    { val: 5, label: '❌ Tanpa Agunan' },
  ];

  return `
    <h3 class="section-title">🔒 Agunan & Jaminan</h3>
    <div class="form-grid form-grid-2">
      <div class="form-group">
        <label class="form-label">Nilai Agunan (Rp)</label>
        <input class="form-control" id="f-collateral-value" type="number" min="0" value="${formData.collateralValue}"
               placeholder="Nilai pasar agunan">
        <div class="form-hint">LTV maks 80% — Nilai agunan × 80% = batas nominal dari sisi agunan</div>
      </div>
      <div class="form-group">
        <label class="form-label">LTV Proyeksi</label>
        <div id="ltv-preview" style="padding:10px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--brand-light)">
          ${formData.collateralValue > 0 && formData.plafon > 0
            ? ((formData.plafon / formData.collateralValue) * 100).toFixed(1) + '%'
            : '—'}
        </div>
      </div>

      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">Jenis Agunan</label>
        <div class="radio-group" id="collateral-type-group">
          ${collateralTypes.map(c => `
            <div class="radio-option ${formData.collateralType === c.val ? 'selected' : ''}"
                 data-col-type="${c.val}">
              ${c.label}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="form-group" style="grid-column:span 2">
        <div class="radio-option ${formData.personalGuarantee ? 'selected' : ''}"
             id="pg-toggle" style="width:fit-content">
          🤝 Personal Guarantee dari Pemilik
        </div>
        <div class="form-hint">Personal guarantee meningkatkan skor agunan</div>
      </div>
    </div>

    <div class="alert alert-info" style="margin-top:var(--gap-lg)">
      <span>ℹ️</span>
      <div>
        <strong>Formula nominal dari agunan:</strong>
        Rp ${formatRupiah(formData.collateralValue * 0.80, false)} (${formatRupiah(formData.collateralValue, false)} × 80% LTV maks)
      </div>
    </div>
  `;
}

// ── Step 5: Review ──
function renderStep5() {
  const pct = v => v ? formatPct(v) : '—';
  return `
    <h3 class="section-title">📋 Review & Konfirmasi</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--gap-xl)">
      <div>
        <div class="section-title" style="font-size:13px">👤 Profil</div>
        ${reviewRow('Nama', formData.name)}
        ${reviewRow('Sektor', SECTORS.find(s => s.id === formData.sector)?.label)}
        ${reviewRow('Profil', COMPANY_PROFILES[formData.profile]?.label)}
        ${reviewRow('Plafon', formatRupiah(formData.plafon, false))}
        ${reviewRow('Tenor', formData.tenor + ' bulan')}
        ${reviewRow('Bunga', formData.rate + '%/tahun')}
      </div>
      <div>
        <div class="section-title" style="font-size:13px">💹 Keuangan Utama</div>
        ${reviewRow('Revenue', formatRupiah(formData.revenue, true))}
        ${reviewRow('EBIT', formatRupiah(formData.ebit, true))}
        ${reviewRow('Net Income', formatRupiah(formData.netIncome, true))}
        ${reviewRow('Total Aset', formatRupiah(formData.totalAssets, true))}
        ${reviewRow('Total Kewajiban', formatRupiah(formData.totalLiabilities, true))}
        ${reviewRow('Nilai Agunan', formatRupiah(formData.collateralValue, true))}
      </div>
    </div>

    <div class="alert alert-warning" style="margin-top:var(--gap-lg)">
      <span>⚠️</span>
      <div>Pastikan semua data telah diisi dengan benar sebelum menghitung. Hasil analisis akan disimpan ke profil borrower.</div>
    </div>
  `;
}

function reviewRow(label, value) {
  return `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">
      <span style="color:var(--text-muted)">${label}</span>
      <span style="font-weight:600">${value ?? '—'}</span>
    </div>
  `;
}

// ── Events ──
function bindAnalysisEvents(container) {
  container.addEventListener('click', e => {
    // Prev/Next
    if (e.target.id === 'btn-prev') goToStep(currentStep - 1, container);
    if (e.target.id === 'btn-next') goToStep(currentStep + 1, container);
    if (e.target.id === 'btn-calculate') runAnalysis(container);

    // Profile selector
    const profileOpt = e.target.closest('[data-profile]');
    if (profileOpt) {
      formData.profile = profileOpt.dataset.profile;
      document.querySelectorAll('[data-profile]').forEach(el => el.classList.remove('selected'));
      profileOpt.classList.add('selected');
      const hint = document.getElementById('profile-hint');
      if (hint) hint.textContent = COMPANY_PROFILES[formData.profile]?.description ?? '';
    }

    // Collateral type
    const colType = e.target.closest('[data-col-type]');
    if (colType) {
      formData.collateralType = parseInt(colType.dataset.colType);
      document.querySelectorAll('[data-col-type]').forEach(el => el.classList.remove('selected'));
      colType.classList.add('selected');
    }

    // Personal Guarantee toggle
    if (e.target.id === 'pg-toggle') {
      formData.personalGuarantee = !formData.personalGuarantee;
      e.target.classList.toggle('selected', formData.personalGuarantee);
    }

    // Arrears toggle
    if (e.target.id === 'arrears-toggle') {
      formData.arrearsOver90 = !formData.arrearsOver90;
      e.target.classList.toggle('selected', formData.arrearsOver90);
    }
  });

  // Input change — save to formData + update live preview
  container.addEventListener('input', e => {
    const field = e.target.dataset.field;
    if (field) {
      const val = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
      formData[field] = val;

      // Update ratio preview if on step 2
      if (currentStep === 2) {
        const ratios = computeAllRatios({ ...formData, grossRevenue: formData.revenue });
        const gapResults = calcAllGaps(ratios, formData.sector);
        const preview = document.getElementById('ratio-preview');
        if (preview) preview.innerHTML = renderRatioPreview(ratios, gapResults);
      }
    }

    // Quali sliders
    const qualiKey  = e.target.dataset.qualiKey;
    const qualiField= e.target.dataset.field;
    if (qualiKey && qualiField && e.target.type === 'range') {
      const val = parseInt(e.target.value);
      formData[`quali${capitalize(qualiKey)}`][qualiField] = val;
      const valDisplay = document.getElementById(`q-val-${qualiKey}-${qualiField}`);
      if (valDisplay) {
        valDisplay.textContent = val;
        valDisplay.style.color = scoreColor(val);
      }
    }

    // Direct named fields
    const directFields = ['name','sector','plafon','tenor','rate','description',
      'collateralValue','ocfNegativePeriods','revenue','cogs','ebit','netIncome',
      'interestExpense','operatingCashFlow','totalAssets','totalLiabilities','totalEquity',
      'currentAssets','currentLiabilities','cash','inventory','accountsReceivable',
      'accountsPayable','totalDebt','annualDebtService'];

    const id = e.target.id?.replace('f-','');
    if (e.target.id?.startsWith('f-') && directFields.includes(id)) {
      const camelId = id.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      formData[camelId] = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    }
    if (e.target.id === 'f-name')        formData.name = e.target.value;
    if (e.target.id === 'f-sector')      formData.sector = e.target.value;
    if (e.target.id === 'f-plafon')      formData.plafon = parseFloat(e.target.value) || 0;
    if (e.target.id === 'f-tenor')       formData.tenor = parseInt(e.target.value) || 36;
    if (e.target.id === 'f-rate')        formData.rate = parseFloat(e.target.value) || 12;
    if (e.target.id === 'f-description') formData.description = e.target.value;
    if (e.target.id === 'f-collateral-value') {
      formData.collateralValue = parseFloat(e.target.value) || 0;
      updateLTVPreview();
    }
    if (e.target.id === 'ocfNegativePeriods') formData.ocfNegativePeriods = parseInt(e.target.value) || 0;
  });
}

function updateLTVPreview() {
  const el = document.getElementById('ltv-preview');
  if (!el) return;
  if (formData.collateralValue > 0 && formData.plafon > 0) {
    const ltv = (formData.plafon / formData.collateralValue) * 100;
    el.textContent = ltv.toFixed(1) + '%';
    el.style.color = ltv > 80 ? 'var(--danger)' : 'var(--brand-light)';
  } else {
    el.textContent = '—';
  }
}

function goToStep(step, container) {
  if (step < 1 || step > TOTAL_STEPS) return;
  currentStep = step;

  // Update wizard header
  const header = document.getElementById('wizard-header');
  if (header) header.innerHTML = renderWizardSteps();

  // Update body
  const body = document.getElementById('wizard-body');
  if (body) body.innerHTML = renderStep(currentStep);

  // Update nav
  const nav = document.getElementById('wizard-nav');
  if (nav) nav.innerHTML = renderWizardNav();

  // Scroll to top
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Run Analysis ──
function runAnalysis(container) {
  const btn = document.getElementById('btn-calculate');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Menghitung...'; }

  setTimeout(() => {
    try {
      const ratios = computeAllRatios({
        ...formData,
        grossRevenue: formData.revenue,
        loanAmount: formData.plafon,
      });

      const gapResults = calcAllGaps(ratios, formData.sector);

      const { pillarScores, finalScore, pillarWeights } = calcFinalScore({
        ratios,
        gapResults,
        sector: formData.sector,
        profileKey: formData.profile,
        qualiInputs: {
          businessViability: formData.qualiBusinessViability,
          management:        formData.qualiManagement,
          industryRisk:      formData.qualiIndustryRisk,
        },
        collateralInputs: {
          collateralType:    formData.collateralType,
          personalGuarantee: formData.personalGuarantee,
        },
        financialData: formData,
      });

      const eligibility = determineEligibility({
        ratios,
        finalScore,
        gapResults,
        extras: {
          ocfNegativePeriods: formData.ocfNegativePeriods,
          arrearsOver90:      formData.arrearsOver90,
        },
      });

      const nominalResult = calcNominalRecommendation({
        ebit:            formData.ebit,
        annualRatePct:   formData.rate,
        tenorMonths:     formData.tenor,
        collateralValue: formData.collateralValue,
        plafonDiajukan:  formData.plafon,
      });

      const result = {
        ratios, gapResults, pillarScores, finalScore, pillarWeights,
        eligibility, nominalResult,
      };

      formData.result = result;

      // Save to store
      const borrowerRecord = {
        id:          formData.id ?? generateId(),
        name:        formData.name,
        sector:      formData.sector,
        profile:     formData.profile,
        plafon:      formData.plafon,
        tenor:       formData.tenor,
        rate:        formData.rate,
        description: formData.description,
        decision:    eligibility.decision.key,
        finalScore,
        confidence:  eligibility.confidence,
        nominal:     eligibility.decision.key !== 'TIDAK_LAYAK' ? nominalResult.nominal : null,
        ewsStatus:   'green',
        status:      eligibility.decision.key === 'LAYAK' ? 'active' : eligibility.decision.key === 'TIDAK_LAYAK' ? 'rejected' : 'review',
        ratios:      { dscr: ratios.dscr, icr: ratios.icr, der: ratios.der, roa: ratios.roa, currentRatio: ratios.currentRatio },
        formData,
      };

      saveBorrower(borrowerRecord);
      formData.id = borrowerRecord.id;

      // Show result
      renderResult(container, result, borrowerRecord);
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat menghitung. Periksa data keuangan.', 'error');
      if (btn) { btn.disabled = false; btn.textContent = '🔍 Hitung Analisis'; }
    }
  }, 500);
}

// ── Render Result ──
function renderResult(container, result, borrower) {
  const { eligibility, finalScore, pillarScores, pillarWeights, nominalResult, gapResults, ratios } = result;
  const { decision, confidence, reasons, syarat, hardRuleTriggers, layer } = eligibility;

  const decisionColors = {
    LAYAK:           '#10b981',
    LAYAK_BERSYARAT: '#f59e0b',
    REVIEW:          '#6366f1',
    TIDAK_LAYAK:     '#ef4444',
  };
  const color = decisionColors[decision.key] ?? '#6366f1';

  const pillarList = Object.entries(PILLARS).map(([key, p]) => {
    const score  = pillarScores[key]?.score ?? 0;
    const weight = pillarWeights[key] ?? p.baseWeight;
    return { key, label: p.label, score, weight };
  });

  container.innerHTML = `
    <div style="max-width:900px;margin:0 auto">
      <!-- Header: back -->
      <div style="display:flex;align-items:center;gap:var(--gap-md);margin-bottom:var(--gap-xl)">
        <button class="btn btn-ghost btn-sm" onclick="navigate('analysis')">← Analisis Baru</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('detail','${borrower.id}')">Lihat Detail Borrower →</button>
        <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Print</button>
      </div>

      <!-- Decision Card -->
      <div class="result-decision-card" style="background:${color}18;border:2px solid ${color}40;color:${color};margin-bottom:var(--gap-xl)">
        <div class="decision-emoji">${decision.key === 'LAYAK' ? '✅' : decision.key === 'LAYAK_BERSYARAT' ? '⚖️' : decision.key === 'REVIEW' ? '🔍' : '❌'}</div>
        <div class="decision-label" style="color:${color}">${decision.label}</div>
        <div class="decision-confidence" style="color:${color}">
          Confidence: <strong>${confidence}%</strong> | Skor Akhir: <strong>${finalScore}</strong>/100
          | Layer: ${layer === 'hard_rules' ? 'Hard Rules' : layer === 'gap_override' ? 'Gap Override' : 'Score'}
        </div>
      </div>

      <div class="dashboard-grid" style="margin-bottom:var(--gap-xl)">
        <!-- Nominal -->
        ${decision.key !== 'TIDAK_LAYAK' ? `
        <div class="result-nominal-card col-span-2" style="padding:var(--gap-xl)">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:var(--gap-sm)">💰 Rekomendasi Nominal</div>
          <div class="nominal-amount">${formatRupiah(nominalResult.nominal)}</div>
          <div class="nominal-range">Range: ${formatRupiah(nominalResult.nominalMin)} — ${formatRupiah(nominalResult.nominalMax)}</div>
          <span class="nominal-binding">Pembatas: ${nominalResult.bindingFactor === 'kapasitas' ? 'Kapasitas DSCR' : nominalResult.bindingFactor === 'agunan' ? 'Nilai Agunan' : 'Plafon Diajukan'}</span>
          <div style="margin-top:var(--gap-md);font-size:13px;color:var(--text-muted)">
            DSCR @ nominal rekomendasi: <strong style="color:${nominalResult.dscrAtNominal >= 1.2 ? 'var(--success)' : 'var(--warning)'}">${nominalResult.dscrAtNominal?.toFixed(2) ?? '—'}x</strong>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--gap-sm);margin-top:var(--gap-md);font-size:12px">
            <div style="text-align:center;padding:8px;background:var(--bg-elevated);border-radius:var(--radius-sm)">
              <div style="color:var(--text-muted)">Kapasitas</div>
              <div style="font-weight:700">${formatRupiah(nominalResult.detail.capacityNominal, true)}</div>
            </div>
            <div style="text-align:center;padding:8px;background:var(--bg-elevated);border-radius:var(--radius-sm)">
              <div style="color:var(--text-muted)">Agunan (80%)</div>
              <div style="font-weight:700">${formatRupiah(nominalResult.detail.collateralNominal, true)}</div>
            </div>
            <div style="text-align:center;padding:8px;background:var(--bg-elevated);border-radius:var(--radius-sm)">
              <div style="color:var(--text-muted)">Plafon Diajukan</div>
              <div style="font-weight:700">${formatRupiah(nominalResult.detail.plafonDiajukan, true)}</div>
            </div>
          </div>
        </div>
        ` : `
        <div class="card col-span-2" style="display:flex;align-items:center;justify-content:center;padding:var(--gap-xl);color:var(--danger)">
          <div style="text-align:center">
            <div style="font-size:32px">❌</div>
            <div style="font-weight:700;margin-top:8px">Tidak ada rekomendasi nominal</div>
            <div style="color:var(--text-muted);font-size:13px;margin-top:4px">Pinjaman tidak dapat direkomendasikan</div>
          </div>
        </div>
        `}

        <!-- Score Ring -->
        <div class="card">
          <div class="card-body" style="display:flex;flex-direction:column;align-items:center;gap:var(--gap-md)">
            <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted)">Skor Akhir</div>
            <div style="position:relative;width:140px;height:140px;display:flex;align-items:center;justify-content:center">
              <canvas id="score-ring" width="140" height="140"></canvas>
              <div style="position:absolute;text-align:center">
                <div style="font-size:36px;font-weight:800;color:${color};line-height:1">${finalScore}</div>
                <div style="font-size:11px;color:var(--text-muted)">/100</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 6 Pillar Bars -->
        <div class="card col-span-3">
          <div class="card-header"><span class="card-title">🏛️ Skor 6 Pilar</span></div>
          <div class="card-body">
            <div class="pillar-bars">
              ${pillarList.map(p => `
                <div class="pillar-row">
                  <span class="pillar-label">${p.label}</span>
                  <div class="pillar-track">
                    <div class="pillar-fill" style="width:${p.score}%;background:${scoreColor(p.score)}"></div>
                  </div>
                  <span class="pillar-score-val" style="color:${scoreColor(p.score)}">${p.score.toFixed(1)}</span>
                  <span class="pillar-weight text-muted">${(p.weight * 100).toFixed(0)}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Reasons -->
        <div class="card col-span-2">
          <div class="card-header"><span class="card-title">📋 Alasan & Temuan</span></div>
          <div class="card-body">
            ${hardRuleTriggers.length > 0 ? `
              <div class="alert alert-danger" style="margin-bottom:var(--gap-md)">
                <span>🚫</span>
                <div>
                  <strong>Hard Rules Dilanggar:</strong>
                  <ul style="margin-top:6px;padding-left:16px">
                    ${hardRuleTriggers.map(r => `<li>${r}</li>`).join('')}
                  </ul>
                </div>
              </div>
            ` : ''}
            <ul style="padding-left:16px;color:var(--text-secondary);font-size:13px;display:flex;flex-direction:column;gap:6px">
              ${reasons.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- Syarat -->
        <div class="card">
          <div class="card-header"><span class="card-title">📌 Syarat & Kondisi</span></div>
          <div class="card-body">
            ${syarat.length > 0
              ? `<ul style="padding-left:16px;color:var(--text-secondary);font-size:13px;display:flex;flex-direction:column;gap:8px">
                   ${syarat.map(s => `<li>${s}</li>`).join('')}
                 </ul>`
              : `<div class="text-success" style="font-size:13px">✅ Tidak ada syarat tambahan</div>`
            }
          </div>
        </div>

        <!-- Gap Table -->
        <div class="card col-span-3">
          <div class="card-header"><span class="card-title">📐 Rasio vs Benchmark Industri</span></div>
          <div class="card-body-sm">
            <div class="table-wrapper">
              <table class="benchmark-table">
                <thead>
                  <tr>
                    <th>Rasio</th>
                    <th>Nilai Borrower</th>
                    <th>P25</th>
                    <th>Median</th>
                    <th>P75</th>
                    <th>Gap vs Median</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(gapResults).slice(0, 15).map(([key, g]) => {
                    const meta = RATIO_META[key];
                    const statusClass = { excellent:'gap-positive', good:'gap-positive', neutral:'gap-neutral', warning:'gap-negative', danger:'gap-danger' }[g.status] ?? '';
                    return `
                      <tr>
                        <td>${meta?.label ?? key}</td>
                        <td class="gap-${g.status === 'danger' ? 'danger' : g.status === 'warning' ? 'negative' : g.status === 'neutral' ? 'neutral' : 'positive'}">
                          ${g.value?.toFixed(2) ?? '—'}${meta?.unit === 'x' ? 'x' : meta?.unit === '%' ? '%' : ''}
                        </td>
                        <td style="color:var(--text-muted)">${g.bm?.p25?.toFixed(2)}</td>
                        <td>${g.bm?.median?.toFixed(2)}</td>
                        <td style="color:var(--text-muted)">${g.bm?.p75?.toFixed(2)}</td>
                        <td class="${statusClass}">${g.percentGap > 0 ? '+' : ''}${g.percentGap.toFixed(1)}%</td>
                        <td>
                          <span style="color:${{ excellent:'#10b981', good:'#60a5fa', neutral:'#8b9cc8', warning:'#f59e0b', danger:'#ef4444' }[g.status]}">
                            ${{ excellent:'⬆ Unggul', good:'↑ Baik', neutral:'→ Setara', warning:'↓ Di bawah', danger:'⬇ Kritis' }[g.status]}
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Draw score ring
  requestAnimationFrame(() => drawScoreRing(finalScore, color));
}

function drawScoreRing(score, color) {
  const canvas = document.getElementById('score-ring');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 70, cy = 70, r = 58;

  ctx.clearRect(0, 0, 140, 140);

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(99,130,190,0.15)';
  ctx.lineWidth = 12;
  ctx.stroke();

  // Fill
  const angle = (score / 100) * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// scoreColor() imported from '../utils/helpers.js'
function scoreColor(v) {
  if (v === null || v === undefined || isNaN(v)) return 'var(--text-muted)';
  if (v >= 75) return 'var(--success)';
  if (v >= 60) return 'var(--warning)';
  if (v >= 45) return 'var(--info)';
  return 'var(--danger)';
}
