// src/screens/settings.js — Layar 5: Pengaturan

import { getSettings, saveSettings } from '../data/store.js';
import { SECTORS } from '../data/benchmark.js';
import { COMPANY_PROFILES, PILLARS } from '../core/weights.js';
import { navigate } from '../utils/helpers.js';

let activeTab = 'threshold';

export function renderSettings(container) {
  const settings = getSettings();

  container.innerHTML = `
    <div style="max-width:800px;margin:0 auto">
      <h2 style="font-size:22px;font-weight:800;margin-bottom:var(--gap-xl)">⚙️ Pengaturan</h2>

      <div class="tabs" style="margin-bottom:var(--gap-xl)">
        ${stab('threshold', '🎯 Threshold & Hard Rules')}
        ${stab('scoring',   '⚖️ Profil Scoring')}
        ${stab('company',   '🏢 Profil Company')}
        ${stab('benchmark', '📊 Benchmark')}
        ${stab('users',     '👥 Pengguna')}
      </div>

      <div id="settings-tab-threshold" class="tab-content ${activeTab === 'threshold' ? 'active' : ''}">
        ${renderThresholdTab(settings)}
      </div>
      <div id="settings-tab-scoring" class="tab-content ${activeTab === 'scoring' ? 'active' : ''}">
        ${renderScoringTab(settings)}
      </div>
      <div id="settings-tab-company" class="tab-content ${activeTab === 'company' ? 'active' : ''}">
        ${renderCompanyTab()}
      </div>
      <div id="settings-tab-benchmark" class="tab-content ${activeTab === 'benchmark' ? 'active' : ''}">
        ${renderBenchmarkTab()}
      </div>
      <div id="settings-tab-users" class="tab-content ${activeTab === 'users' ? 'active' : ''}">
        ${renderUsersTab()}
      </div>
    </div>
  `;

  bindSettingsEvents(container, settings);
}

function stab(key, label) {
  return `<div class="tab ${activeTab === key ? 'active' : ''}" data-stab="${key}">${label}</div>`;
}

// ── Threshold & Hard Rules ──
function renderThresholdTab(s) {
  const { thresholds, hardRules, dscrTarget, ltvMax, gapKFactor, gapCriticalAvg, gapCriticalRatioCount } = s;

  return `
    <div style="display:flex;flex-direction:column;gap:var(--gap-xl)">
      <div class="card">
        <div class="card-header"><span class="card-title">🎯 Threshold Skor Keputusan</span></div>
        <div class="card-body">
          <div class="form-grid form-grid-2" style="gap:var(--gap-lg)">
            <div class="form-group">
              <label class="form-label">✅ LAYAK — Skor Minimum</label>
              <input class="form-control" type="number" id="t-approve" min="50" max="100" value="${thresholds.approve}">
            </div>
            <div class="form-group">
              <label class="form-label">⚖️ LAYAK BERSYARAT — Skor Minimum</label>
              <input class="form-control" type="number" id="t-conditional" min="30" max="90" value="${thresholds.conditional}">
            </div>
            <div class="form-group">
              <label class="form-label">🔍 PERLU REVIEW — Skor Minimum</label>
              <input class="form-control" type="number" id="t-review" min="20" max="80" value="${thresholds.review}">
            </div>
          </div>
          <div class="alert alert-info" style="margin-top:var(--gap-md)">
            <span>ℹ️</span>
            <div>Skor di bawah REVIEW → otomatis ❌ TIDAK LAYAK</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">🚫 Hard Rules</span></div>
        <div class="card-body">
          <div class="form-grid form-grid-2" style="gap:var(--gap-lg)">
            <div class="form-group">
              <label class="form-label">DSCR Minimum (Hard Stop)</label>
              <input class="form-control" type="number" id="hr-dscr" min="0.5" max="2" step="0.05" value="${hardRules.dscrMin}">
            </div>
            <div class="form-group">
              <label class="form-label">ICR Minimum (Hard Stop)</label>
              <input class="form-control" type="number" id="hr-icr" min="0.5" max="3" step="0.05" value="${hardRules.icrMin}">
            </div>
            <div class="form-group">
              <label class="form-label">OCF Negatif Berturut (periode)</label>
              <input class="form-control" type="number" id="hr-ocf" min="1" max="5" value="${hardRules.ocfNegPeriods}">
            </div>
            <div class="form-group">
              <label class="form-label">DAR Maksimum</label>
              <input class="form-control" type="number" id="hr-dar" min="0.5" max="1" step="0.05" value="${hardRules.darMax}">
            </div>
            <div class="form-group">
              <label class="form-label">Altman Z-Score Minimum</label>
              <input class="form-control" type="number" id="hr-z" min="0" max="3" step="0.01" value="${hardRules.altmanZMin}">
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">📐 Gap Analysis Settings</span></div>
        <div class="card-body">
          <div class="form-grid form-grid-2" style="gap:var(--gap-lg)">
            <div class="form-group">
              <label class="form-label">Sensitivitas Gap (k-factor)</label>
              <input class="form-control" type="number" id="gap-k" min="0" max="1" step="0.05" value="${gapKFactor}">
              <div class="form-hint">0 = tidak sensitif, 1 = sangat sensitif terhadap gap</div>
            </div>
            <div class="form-group">
              <label class="form-label">Rata-rata Gap Kritis (%)</label>
              <input class="form-control" type="number" id="gap-avg" min="-100" max="0" value="${gapCriticalAvg}">
              <div class="form-hint">Jika avg gap di bawah ini → TIDAK LAYAK</div>
            </div>
            <div class="form-group">
              <label class="form-label">Jumlah Rasio Utama Kritis</label>
              <input class="form-control" type="number" id="gap-count" min="1" max="10" value="${gapCriticalRatioCount}">
              <div class="form-hint">Jika ≥ N rasio utama gap < -30% → TIDAK LAYAK</div>
            </div>
            <div class="form-group">
              <label class="form-label">DSCR Target (Nominal)</label>
              <input class="form-control" type="number" id="dscr-target" min="1" max="3" step="0.05" value="${dscrTarget}">
              <div class="form-hint">Digunakan untuk hitung kapasitas nominal</div>
            </div>
            <div class="form-group">
              <label class="form-label">LTV Maksimum (%)</label>
              <input class="form-control" type="number" id="ltv-max" min="50" max="100" value="${ltvMax * 100}">
            </div>
          </div>
        </div>
      </div>

      <button class="btn btn-primary" id="btn-save-settings">💾 Simpan Pengaturan</button>
    </div>
  `;
}

// ── Scoring Weights ──
function renderScoringTab(s) {
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">⚖️ Bobot 6 Pilar (Referensi)</span>
        <span style="font-size:12px;color:var(--text-muted)">Total harus = 100%</span>
      </div>
      <div class="card-body">
        <div class="alert alert-info" style="margin-bottom:var(--gap-lg)">
          <span>ℹ️</span>
          <div>Bobot pilar disesuaikan secara dinamis berdasarkan profil company dan gap rasio. Nilai di sini adalah bobot dasar.</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--gap-md)">
          ${Object.entries(PILLARS).map(([key, p]) => `
            <div style="display:flex;align-items:center;gap:var(--gap-lg);padding:var(--gap-md);background:var(--bg-elevated);border-radius:var(--radius-md)">
              <div style="flex:1">
                <div style="font-weight:600;font-size:13px">${p.label}</div>
                <div style="font-size:11px;color:var(--text-muted)">${p.type === 'quanti' ? '📊 Quantitative' : p.type === 'quali' ? '💬 Qualitative' : '🔀 Mixed'}</div>
              </div>
              <div style="display:flex;align-items:center;gap:var(--gap-sm)">
                <div class="progress-bar" style="width:100px">
                  <div class="progress-fill" style="width:${p.baseWeight * 100}%;background:var(--brand)"></div>
                </div>
                <span style="font-weight:700;font-family:'JetBrains Mono',monospace;min-width:36px;text-align:right">${(p.baseWeight * 100).toFixed(0)}%</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="divider"></div>

        <h4 style="margin-bottom:var(--gap-md)">Split Quanti/Quali per Profil Company</h4>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Profil</th>
                <th>Quantitative (%)</th>
                <th>Qualitative (%)</th>
                <th>Rasio Dominan</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(COMPANY_PROFILES).map(([k, p]) => `
                <tr>
                  <td class="td-primary">${p.label}</td>
                  <td>${(p.quantiWeight * 100).toFixed(0)}%</td>
                  <td>${(p.qualiWeight * 100).toFixed(0)}%</td>
                  <td style="font-size:12px;color:var(--text-muted)">${p.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ── Company Profiles ──
function renderCompanyTab() {
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">🏢 Profil Company</span>
        <span style="font-size:12px;color:var(--text-muted)">Konfigurasi split quanti/quali per profil</span>
      </div>
      <div class="card-body">
        ${Object.entries(COMPANY_PROFILES).map(([key, p]) => `
          <div style="margin-bottom:var(--gap-xl);padding:var(--gap-lg);border:1px solid var(--border);border-radius:var(--radius-md)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--gap-md)">
              <h4>${p.label}</h4>
            </div>
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:var(--gap-md)">${p.description}</p>
            <div class="form-grid form-grid-2" style="gap:var(--gap-md)">
              <div class="form-group">
                <label class="form-label">Quanti Weight (%)</label>
                <input class="form-control" type="number" value="${(p.quantiWeight * 100).toFixed(0)}" readonly
                       style="opacity:0.7;cursor:not-allowed">
              </div>
              <div class="form-group">
                <label class="form-label">Quali Weight (%)</label>
                <input class="form-control" type="number" value="${(p.qualiWeight * 100).toFixed(0)}" readonly
                       style="opacity:0.7;cursor:not-allowed">
              </div>
            </div>
          </div>
        `).join('')}

        <div class="alert alert-warning">
          <span>⚠️</span>
          <div>Edit profil company akan tersedia di versi berikutnya. Saat ini menggunakan konfigurasi default sesuai ARCHITECTURE.md.</div>
        </div>
      </div>
    </div>
  `;
}

// ── Benchmark ──
function renderBenchmarkTab() {
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">📊 Benchmark Industri IDX</span>
        <span style="font-size:12px;color:var(--text-muted)">11 sektor × 20 rasio</span>
      </div>
      <div class="card-body">
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:var(--gap-lg)">
          Benchmark saat ini menggunakan data IDX yang di-embed dalam kode. 
          CRUD benchmark custom akan tersedia di Fase 2 (full-stack dengan database).
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:var(--gap-sm)">
          ${SECTORS.map(s => `
            <div style="padding:8px 14px;border:1px solid var(--border);border-radius:var(--radius-md);font-size:13px">
              ${s.label}
            </div>
          `).join('')}
        </div>

        <div class="alert alert-info" style="margin-top:var(--gap-lg)">
          <span>ℹ️</span>
          <div>20 rasio yang dibenchmark: ROA, ROE, NPM, GPM, Current Ratio, Quick Ratio, Cash Ratio, DER, DAR, DSCR, ICR, DTI, Asset Turnover, Days Receivable, Days Inventory, Days Payable, LTV, Altman Z-Score, EBIT Margin, OCF/Debt Ratio</div>
        </div>
      </div>
    </div>
  `;
}

// ── Users ──
function renderUsersTab() {
  const users = [
    { name: 'Admin Utama', role: 'Super Admin', email: 'admin@vantage.id', status: 'active' },
    { name: 'Analis Senior', role: 'Senior Analyst', email: 'analis@vantage.id', status: 'active' },
    { name: 'Analis Junior', role: 'Analyst', email: 'junior@vantage.id', status: 'active' },
    { name: 'Manajer Risiko', role: 'Risk Manager', email: 'risiko@vantage.id', status: 'active' },
  ];

  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">👥 Manajemen Pengguna</span>
        <button class="btn btn-primary btn-sm">+ Tambah Pengguna</button>
      </div>
      <div class="card-body-sm">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Role</th>
                <th>Email</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td class="td-primary">
                    <div style="display:flex;align-items:center;gap:var(--gap-sm)">
                      <div class="user-avatar" style="width:28px;height:28px;font-size:11px">${u.name[0]}</div>
                      ${u.name}
                    </div>
                  </td>
                  <td>${u.role}</td>
                  <td style="font-size:12px">${u.email}</td>
                  <td><span class="ews-green">🟢 Aktif</span></td>
                  <td>
                    <div style="display:flex;gap:4px">
                      <button class="btn btn-ghost btn-icon btn-sm">✏️</button>
                      <button class="btn btn-ghost btn-icon btn-sm">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="alert alert-info" style="margin-top:var(--gap-md)">
          <span>ℹ️</span>
          <div>Auth/RBAC penuh akan tersedia di Fase 2 (full-stack). Saat ini mode single-user.</div>
        </div>
      </div>
    </div>
  `;
}

// ── Events ──
function bindSettingsEvents(container, settings) {
  container.addEventListener('click', e => {
    // Tab switching
    const stab = e.target.closest('[data-stab]');
    if (stab) {
      activeTab = stab.dataset.stab;
      document.querySelectorAll('[data-stab]').forEach(t => t.classList.toggle('active', t.dataset.stab === activeTab));
      document.querySelectorAll('.tab-content').forEach(tc => {
        tc.classList.toggle('active', tc.id === `settings-tab-${activeTab}`);
      });
    }

    // Save settings
    if (e.target.id === 'btn-save-settings') {
      const newSettings = {
        thresholds: {
          approve:     parseFloat(document.getElementById('t-approve')?.value ?? 75),
          conditional: parseFloat(document.getElementById('t-conditional')?.value ?? 60),
          review:      parseFloat(document.getElementById('t-review')?.value ?? 45),
        },
        hardRules: {
          dscrMin:        parseFloat(document.getElementById('hr-dscr')?.value ?? 1.0),
          icrMin:         parseFloat(document.getElementById('hr-icr')?.value ?? 1.0),
          ocfNegPeriods:  parseInt(document.getElementById('hr-ocf')?.value ?? 2),
          darMax:         parseFloat(document.getElementById('hr-dar')?.value ?? 0.90),
          altmanZMin:     parseFloat(document.getElementById('hr-z')?.value ?? 1.81),
          arrears90:      true,
        },
        dscrTarget:    parseFloat(document.getElementById('dscr-target')?.value ?? 1.25),
        ltvMax:        parseFloat(document.getElementById('ltv-max')?.value ?? 80) / 100,
        gapKFactor:    parseFloat(document.getElementById('gap-k')?.value ?? 0.5),
        gapCriticalAvg: parseFloat(document.getElementById('gap-avg')?.value ?? -30),
        gapCriticalRatioCount: parseInt(document.getElementById('gap-count')?.value ?? 3),
      };

      saveSettings(newSettings);
      showToast('Pengaturan berhasil disimpan', 'success');
    }
  });
}
