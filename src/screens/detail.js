// src/screens/detail.js — Layar 4: Detail Borrower (5 Tab)

import { getBorrowerById, saveBorrower } from '../data/store.js';
import { EWS_PARAMS, generateEWSJudgement, evaluateEWSParam } from '../core/ews-monitor.js';
import { RATIO_META, getBenchmark, SECTORS } from '../data/benchmark.js';
import { formatRupiah, formatDate, decisionBadgeClass, decisionLabel, ewsBadgeClass, ewsLabel, navigate, scoreColor, scoreColorHex } from '../utils/helpers.js';
import { PILLARS } from '../core/weights.js';

let activeTab = 'ringkasan';
let ewsValues = {};

export function renderDetail(container, borrowerId) {
  const borrower = getBorrowerById(borrowerId);

  if (!borrower) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <div class="empty-title">Borrower tidak ditemukan</div>
        <button class="btn btn-primary" onclick="navigate('borrowers')">← Kembali ke Daftar</button>
      </div>
    `;
    return;
  }

  // Load existing EWS values if any
  ewsValues = borrower.ewsValues ?? {};

  container.innerHTML = `
    <!-- Header -->
    <div style="display:flex;align-items:flex-start;gap:var(--gap-md);margin-bottom:var(--gap-xl)">
      <button class="btn btn-ghost btn-sm" onclick="navigate('borrowers')">← Kembali</button>
      <div style="flex:1">
        <h2 style="font-size:22px;font-weight:800;letter-spacing:-0.5px">${borrower.name}</h2>
        <div style="display:flex;gap:var(--gap-sm);align-items:center;margin-top:4px;flex-wrap:wrap">
          <span style="font-size:13px;color:var(--text-muted)">${borrower.id}</span>
          <span style="color:var(--text-muted)">·</span>
          <span style="font-size:13px;color:var(--text-muted)">${sectorLabel(borrower.sector)}</span>
          <span class="badge ${decisionBadgeClass(borrower.decision)}">${decisionLabel(borrower.decision)}</span>
          <span class="${ewsBadgeClass(borrower.ewsStatus)}">${ewsLabel(borrower.ewsStatus)}</span>
        </div>
      </div>
      <div style="display:flex;gap:var(--gap-sm)">
        <button class="btn btn-secondary btn-sm" onclick="navigate('analysis','${borrower.id}')">✏️ Edit Analisis</button>
        <button class="btn btn-primary btn-sm" onclick="window.print()">🖨️ Print</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      ${tab('ringkasan',   '📊 Ringkasan')}
      ${tab('rasio',       '📐 Rasio & Benchmark')}
      ${tab('ews',         '🚨 EWS Monitor')}
      ${tab('riwayat',     '📅 Riwayat')}
      ${tab('dokumen',     '📁 Dokumen')}
    </div>

    <!-- Tab Contents -->
    <div id="tab-ringkasan" class="tab-content ${activeTab === 'ringkasan' ? 'active' : ''}">
      ${renderTabRingkasan(borrower)}
    </div>
    <div id="tab-rasio" class="tab-content ${activeTab === 'rasio' ? 'active' : ''}">
      ${renderTabRasio(borrower)}
    </div>
    <div id="tab-ews" class="tab-content ${activeTab === 'ews' ? 'active' : ''}">
      ${renderTabEWS(borrower)}
    </div>
    <div id="tab-riwayat" class="tab-content ${activeTab === 'riwayat' ? 'active' : ''}">
      ${renderTabRiwayat(borrower)}
    </div>
    <div id="tab-dokumen" class="tab-content ${activeTab === 'dokumen' ? 'active' : ''}">
      ${renderTabDokumen(borrower)}
    </div>
  `;

  bindDetailEvents(container, borrower);

  // Draw score ring
  requestAnimationFrame(() => {
    drawMiniScoreRing('score-ring-detail', borrower.finalScore ?? 0);
  });
}

function tab(key, label) {
  return `<div class="tab ${activeTab === key ? 'active' : ''}" data-tab="${key}">${label}</div>`;
}

// ── Tab: Ringkasan ──
function renderTabRingkasan(b) {
  const color = scoreColorHex(b.finalScore);

  return `
    <div class="dashboard-grid">
      <!-- Score + Decision -->
      <div class="card">
        <div class="card-body" style="display:flex;flex-direction:column;align-items:center;gap:var(--gap-md);text-align:center">
          <div style="position:relative;width:120px;height:120px;display:flex;align-items:center;justify-content:center">
            <canvas id="score-ring-detail" width="120" height="120"></canvas>
            <div style="position:absolute;text-align:center">
              <div style="font-size:30px;font-weight:800;color:${color}">${b.finalScore?.toFixed(1) ?? '—'}</div>
              <div style="font-size:10px;color:var(--text-muted)">/100</div>
            </div>
          </div>
          <span class="badge ${decisionBadgeClass(b.decision)}" style="font-size:13px;padding:5px 14px">${decisionLabel(b.decision)}</span>
          <div style="font-size:13px;color:var(--text-muted)">Confidence: <strong>${b.confidence ?? '—'}%</strong></div>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="card col-span-2">
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--gap-md)">
            ${infoRow('Plafon Diajukan',    formatRupiah(b.plafon))}
            ${infoRow('Nominal Rekomendasi', b.nominal ? formatRupiah(b.nominal) : '—')}
            ${infoRow('Tenor',              b.tenor + ' bulan')}
            ${infoRow('Suku Bunga',         b.rate + '%/tahun')}
            ${infoRow('Sektor',             sectorLabel(b.sector))}
            ${infoRow('Profil Perusahaan',  b.profile)}
            ${infoRow('Status EWS',         ewsLabel(b.ewsStatus))}
            ${infoRow('Terakhir Diperbarui', formatDate(b.updatedAt))}
          </div>
        </div>
      </div>

      <!-- Key Ratios -->
      <div class="card col-span-3">
        <div class="card-header"><span class="card-title">📊 Rasio Kunci</span></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:var(--gap-md)">
            ${ratioMini('DSCR',         b.ratios?.dscr,         'x', 1.2,  true)}
            ${ratioMini('ICR',          b.ratios?.icr,          'x', 1.5,  true)}
            ${ratioMini('DER',          b.ratios?.der,          'x', 1.5,  false)}
            ${ratioMini('ROA',          b.ratios?.roa,          '%', 2.0,  true)}
            ${ratioMini('Current Ratio',b.ratios?.currentRatio, 'x', 1.0,  true)}
          </div>
        </div>
      </div>

      <!-- Pillar Bars (if available) -->
      ${b.formData?.result ? `
      <div class="card col-span-3">
        <div class="card-header"><span class="card-title">🏛️ Skor 6 Pilar</span></div>
        <div class="card-body">
          <div class="pillar-bars">
            ${Object.entries(PILLARS).map(([key, p]) => {
              const score  = b.formData.result.pillarScores?.[key]?.score ?? 0;
              const weight = b.formData.result.pillarWeights?.[key] ?? p.baseWeight;
              return `
                <div class="pillar-row">
                  <span class="pillar-label">${p.label}</span>
                  <div class="pillar-track">
                    <div class="pillar-fill" style="width:${score}%;background:${scoreColorHex(score)}"></div>
                  </div>
                  <span class="pillar-score-val" style="color:${scoreColorHex(score)}">${score.toFixed(1)}</span>
                  <span class="pillar-weight text-muted">${(weight * 100).toFixed(0)}%</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

function infoRow(label, value) {
  return `
    <div style="padding:10px;background:var(--bg-elevated);border-radius:var(--radius-sm)">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">${label}</div>
      <div style="font-weight:600;font-size:13px">${value ?? '—'}</div>
    </div>
  `;
}

function ratioMini(label, value, unit, threshold, highGood) {
  if (value === null || value === undefined) {
    return `<div style="text-align:center;padding:var(--gap-md);background:var(--bg-elevated);border-radius:var(--radius-md)">
      <div style="font-size:11px;color:var(--text-muted)">${label}</div>
      <div style="font-size:22px;font-weight:800;color:var(--text-muted)">—</div>
    </div>`;
  }

  const good = highGood ? value >= threshold : value <= threshold;
  const color = good ? '#10b981' : value >= threshold * 0.8 ? '#f59e0b' : '#ef4444';

  return `
    <div style="text-align:center;padding:var(--gap-md);background:var(--bg-elevated);border-radius:var(--radius-md);border:1px solid ${color}30">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${label}</div>
      <div style="font-size:22px;font-weight:800;color:${color}">${value.toFixed(2)}${unit}</div>
      <div style="font-size:10px;color:${color};margin-top:2px">${good ? '✓ OK' : '⚠️ Perhatian'}</div>
    </div>
  `;
}

// ── Tab: Rasio & Benchmark ──
function renderTabRasio(b) {
  const gapResults = b.formData?.result?.gapResults ?? {};

  if (Object.keys(gapResults).length === 0) {
    return `<div class="empty-state">
      <div class="empty-icon">📐</div>
      <div class="empty-title">Data rasio belum tersedia</div>
      <div class="empty-sub">Jalankan analisis lengkap untuk melihat perbandingan benchmark</div>
      <button class="btn btn-primary" onclick="navigate('analysis','${b.id}')">➕ Jalankan Analisis</button>
    </div>`;
  }

  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">📐 Rasio vs Benchmark Industri (${sectorLabel(b.sector)})</span>
      </div>
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
                <th>Gap Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(gapResults).map(([key, g]) => {
                const meta = RATIO_META[key];
                const statusColorClass = {
                  excellent:'gap-positive', good:'gap-positive',
                  neutral:'gap-neutral', warning:'gap-negative', danger:'gap-danger',
                }[g.status] ?? '';
                const statusLabel = {
                  excellent:'⬆ Unggul', good:'↑ Baik', neutral:'→ Setara', warning:'↓ Di bawah', danger:'⬇ Kritis',
                }[g.status] ?? g.status;
                return `
                  <tr>
                    <td><strong>${meta?.label ?? key}</strong></td>
                    <td class="${statusColorClass}">${g.value?.toFixed(2) ?? '—'}${meta?.unit === 'x' ? 'x' : meta?.unit === '%' ? '%' : ''}</td>
                    <td style="color:var(--text-muted)">${g.bm?.p25?.toFixed(2) ?? '—'}</td>
                    <td>${g.bm?.median?.toFixed(2) ?? '—'}</td>
                    <td style="color:var(--text-muted)">${g.bm?.p75?.toFixed(2) ?? '—'}</td>
                    <td class="${statusColorClass}">${g.percentGap > 0 ? '+' : ''}${g.percentGap?.toFixed(1) ?? '—'}%</td>
                    <td class="${statusColorClass}">${g.gapScore?.toFixed(0) ?? '—'}</td>
                    <td style="color:${{ excellent:'#10b981', good:'#60a5fa', neutral:'#8b9cc8', warning:'#f59e0b', danger:'#ef4444' }[g.status] ?? '#8b9cc8'}">${statusLabel}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ── Tab: EWS Monitor ──
function renderTabEWS(b) {
  const categories = { keuangan: '💰 Keuangan (P1–P10)', perilaku: '👁️ Perilaku (P11–P15)', operasional: '⚙️ Operasional (P16–P20)' };

  return `
    <div style="display:flex;flex-direction:column;gap:var(--gap-xl)">
      <!-- Judgement Card -->
      <div id="ews-judgement-container">
        ${renderEWSJudgement(b)}
      </div>

      <!-- Input Params -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📊 Input 20 Parameter EWS</span>
          <button class="btn btn-primary btn-sm" id="btn-ews-calc">🔄 Hitung Ulang EWS</button>
        </div>
        <div class="card-body-sm">
          ${Object.entries(categories).map(([cat, catLabel]) => `
            <div style="margin-bottom:var(--gap-xl)">
              <div class="section-title" style="font-size:13px">${catLabel}</div>
              <div class="ews-params-grid">
                ${Object.entries(EWS_PARAMS)
                  .filter(([, p]) => p.category === cat)
                  .map(([key, param]) => {
                    const val = ewsValues[key] ?? '';
                    const ev  = val !== '' ? evaluateEWSParam(key, val) : { status: 'green', label: 'Belum diisi' };
                    return `
                      <div class="ews-param-card">
                        <div class="ews-param-label">
                          ${param.critical ? '⚠️ ' : ''}${key}: ${param.label}
                        </div>
                        <div class="ews-param-input-row">
                          ${param.unit === 'bool'
                            ? `<div class="radio-option ${val === 1 || val === true ? 'selected' : ''}" data-ews-bool="${key}" style="font-size:12px">
                                 ${val === 1 || val === true ? 'Ya (Terdeteksi)' : 'Tidak'}
                               </div>`
                            : `<input class="form-control" style="flex:1" type="number"
                                     step="any" placeholder="${param.unit}"
                                     id="ews-${key}" value="${val}"
                                     data-ews-key="${key}">`
                          }
                          <div class="ews-status-dot ${ev.status}" title="${ev.label}"></div>
                        </div>
                        <div style="font-size:10px;color:${{ green:'var(--success)', yellow:'var(--warning)', red:'var(--danger)' }[ev.status]}">${ev.label}</div>
                      </div>
                    `;
                  }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderEWSJudgement(b) {
  const judgement = generateEWSJudgement(ewsValues);
  const { level, ewsScore, judgement: title, action, escalate, kolektibilitas, summary } = judgement;

  return `
    <div class="ews-judgement-card ${level}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--gap-md);flex-wrap:wrap">
        <div>
          <div class="ews-judgement-title">${title}</div>
          <div class="ews-judgement-action">${action}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:32px;font-weight:800;font-family:'JetBrains Mono',monospace">${ewsScore}</div>
          <div style="font-size:11px;color:var(--text-muted)">EWS Score</div>
        </div>
      </div>
      <div style="display:flex;gap:var(--gap-md);margin-top:var(--gap-md);flex-wrap:wrap;font-size:12px">
        <span>🔴 ${summary.redCount} kritis</span>
        <span>🟡 ${summary.yellowCount} waspada</span>
        <span>📊 ${kolektibilitas}</span>
        ${escalate ? '<span style="font-weight:700">🚨 ESKALASI ke Manajer Risiko</span>' : ''}
      </div>
    </div>
  `;
}

// ── Tab: Riwayat ──
function renderTabRiwayat(b) {
  const history = b.history ?? [];

  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">📅 Riwayat Analisis</span>
        <span style="font-size:12px;color:var(--text-muted)">${history.length} catatan</span>
      </div>
      <div class="card-body">
        ${history.length > 0
          ? `<div style="display:flex;flex-direction:column;gap:var(--gap-md)">
               ${history.map(h => `
                 <div style="display:flex;gap:var(--gap-md);padding:var(--gap-md);background:var(--bg-elevated);border-radius:var(--radius-md)">
                   <div style="width:40px;height:40px;border-radius:50%;background:var(--brand-glow);display:flex;align-items:center;justify-content:center;flex-shrink:0">📊</div>
                   <div>
                     <div style="font-weight:600;font-size:13px">${h.label}</div>
                     <div style="font-size:12px;color:var(--text-muted)">${formatDate(h.date)} · Skor: ${h.score}</div>
                     <span class="badge ${decisionBadgeClass(h.decision)}" style="margin-top:4px">${decisionLabel(h.decision)}</span>
                   </div>
                 </div>
               `).join('')}
             </div>`
          : `<div class="empty-state" style="padding:40px">
               <div class="empty-icon">📅</div>
               <div class="empty-title">Belum ada riwayat</div>
               <div class="empty-sub">Riwayat analisis akan muncul setelah lebih dari satu analisis dilakukan</div>
             </div>`
        }
      </div>
    </div>
  `;
}

// ── Tab: Dokumen ──
function renderTabDokumen(b) {
  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">📁 Dokumen Borrower</span>
        <button class="btn btn-secondary btn-sm">📎 Upload Dokumen</button>
      </div>
      <div class="card-body">
        <div class="empty-state" style="padding:60px">
          <div class="empty-icon">📁</div>
          <div class="empty-title">Manajemen Dokumen</div>
          <div class="empty-sub">Fitur upload & manajemen dokumen akan tersedia di Fase 2 (full-stack)</div>
          <div style="display:flex;gap:var(--gap-sm);flex-wrap:wrap;justify-content:center;margin-top:var(--gap-md)">
            ${['Laporan Keuangan', 'SIUP/NIB', 'Akta Pendirian', 'NPWP', 'Dokumen Agunan', 'Rekening Koran'].map(d => `
              <div style="padding:6px 12px;border:1px dashed var(--border);border-radius:var(--radius-md);font-size:12px;color:var(--text-muted)">${d}</div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Events ──
function bindDetailEvents(container, borrower) {
  // Tab switching
  container.addEventListener('click', e => {
    const tabEl = e.target.closest('.tab');
    if (tabEl && tabEl.dataset.tab) {
      activeTab = tabEl.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === activeTab));
      document.querySelectorAll('.tab-content').forEach(tc => {
        tc.classList.toggle('active', tc.id === `tab-${activeTab}`);
      });
      if (activeTab === 'ringkasan') {
        requestAnimationFrame(() => drawMiniScoreRing('score-ring-detail', borrower.finalScore ?? 0));
      }
    }

    // EWS Calc
    if (e.target.id === 'btn-ews-calc') {
      recalcEWS(borrower, container);
    }

    // EWS Bool toggle
    const boolEl = e.target.closest('[data-ews-bool]');
    if (boolEl) {
      const key = boolEl.dataset.ewsBool;
      ewsValues[key] = ewsValues[key] === 1 ? 0 : 1;
      boolEl.classList.toggle('selected', ewsValues[key] === 1);
      boolEl.textContent = ewsValues[key] === 1 ? 'Ya (Terdeteksi)' : 'Tidak';
    }
  });

  // EWS input change
  container.addEventListener('input', e => {
    const ewsKey = e.target.dataset.ewsKey;
    if (ewsKey) {
      const val = parseFloat(e.target.value);
      ewsValues[ewsKey] = isNaN(val) ? null : val;

      // Update dot
      const ev = evaluateEWSParam(ewsKey, ewsValues[ewsKey]);
      const dot = e.target.closest('.ews-param-card')?.querySelector('.ews-status-dot');
      if (dot) {
        dot.className = `ews-status-dot ${ev.status}`;
        dot.title = ev.label;
      }
    }
  });
}

function recalcEWS(borrower, container) {
  const judgement = generateEWSJudgement(ewsValues);

  // Update judgement display
  const jContainer = document.getElementById('ews-judgement-container');
  if (jContainer) {
    jContainer.innerHTML = renderEWSJudgement(borrower);
    // Actually re-render with fresh judgement
    const { level, ewsScore, judgement: title, action, escalate, kolektibilitas, summary } = judgement;
    jContainer.innerHTML = `
      <div class="ews-judgement-card ${level}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--gap-md);flex-wrap:wrap">
          <div>
            <div class="ews-judgement-title">${title}</div>
            <div class="ews-judgement-action">${action}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:32px;font-weight:800;font-family:'JetBrains Mono',monospace">${ewsScore}</div>
            <div style="font-size:11px;color:var(--text-muted)">EWS Score</div>
          </div>
        </div>
        <div style="display:flex;gap:var(--gap-md);margin-top:var(--gap-md);flex-wrap:wrap;font-size:12px">
          <span>🔴 ${summary.redCount} kritis</span>
          <span>🟡 ${summary.yellowCount} waspada</span>
          <span>📊 ${kolektibilitas}</span>
          ${escalate ? '<span style="font-weight:700">🚨 ESKALASI ke Manajer Risiko</span>' : ''}
        </div>
      </div>
    `;
  }

  // Map EWS level to status
  const ewsStatusMap = { red: 'red', yellow: 'yellow', yellow_light: 'yellow', green: 'green' };
  const newStatus = ewsStatusMap[judgement.level] ?? 'green';

  // Save updated EWS to store
  saveBorrower({ ...borrower, ewsStatus: newStatus, ewsValues });
  showToast(`EWS diperbarui — Skor: ${judgement.ewsScore}`, newStatus === 'red' ? 'error' : newStatus === 'yellow' ? 'warning' : 'success');
}

function drawMiniScoreRing(canvasId, score) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const cx = size / 2, cy = size / 2, r = size / 2 - 8;
  const color = scoreColorHex(score);

  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(99,130,190,0.15)';
  ctx.lineWidth = 10;
  ctx.stroke();

  const angle = (score / 100) * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();
}


function sectorLabel(id) {
  return SECTORS.find(s => s.id === id)?.label ?? id;
}
