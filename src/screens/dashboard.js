// src/screens/dashboard.js — Layar 1: Portfolio Dashboard (Home)

import { getAllBorrowers, getTrendData } from '../data/store.js';
import { formatRupiah, formatPct, decisionLabel, decisionBadgeClass, ewsBadgeClass, ewsLabel, navigate } from '../utils/helpers.js';
import { SECTORS } from '../data/benchmark.js';

let charts = {};

export function renderDashboard(container) {
  const borrowers = getAllBorrowers();
  const stats     = computeStats(borrowers);
  const trendData = getTrendData();

  container.innerHTML = `
    <div class="kpi-grid mb-lg" style="margin-bottom:var(--gap-xl)">
      ${kpiCard('👥', 'Total Borrower', stats.total, `${stats.active} aktif`, '#3b82f6', 'borrowers')}
      ${kpiCard('💰', 'Total Plafon', formatRupiah(stats.totalPlafon, true), '', '#10b981', 'borrowers')}
      ${kpiCard('✅', 'Approval Rate', formatPct(stats.approvalRate), `${stats.approved} disetujui`, '#10b981', 'borrowers?filter=LAYAK')}
      ${kpiCard('📊', 'Rata-rata Skor', stats.avgScore.toFixed(1), 'dari 100', '#6366f1', 'borrowers')}
      ${kpiCard('🚨', 'EWS Aktif', stats.ewsActive, 'butuh perhatian', '#ef4444', 'borrowers?filter=ews')}
    </div>

    <div class="dashboard-grid">
      <!-- Distribusi Keputusan -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🍩 Distribusi Keputusan</span>
        </div>
        <div class="card-body-sm" style="display:flex;flex-direction:column;align-items:center;gap:var(--gap-md)">
          <div class="chart-container" style="width:200px;height:200px">
            <canvas id="chart-donut" width="200" height="200"></canvas>
          </div>
          <div class="chart-legend" id="donut-legend"></div>
        </div>
      </div>

      <!-- Distribusi Sektor -->
      <div class="card col-span-2">
        <div class="card-header">
          <span class="card-title">📊 Distribusi Sektor</span>
        </div>
        <div class="card-body-sm" style="height:240px">
          <canvas id="chart-sector" style="width:100%;height:220px"></canvas>
        </div>
      </div>

      <!-- Tren 6 Bulan -->
      <div class="card col-span-3">
        <div class="card-header">
          <span class="card-title">📈 Tren Analisis 6 Bulan</span>
          <div style="display:flex;gap:var(--gap-sm)">
            ${legendPill('#10b981','Layak')}
            ${legendPill('#f59e0b','Bersyarat')}
            ${legendPill('#ef4444','Ditolak')}
          </div>
        </div>
        <div class="card-body-sm" style="height:220px">
          <canvas id="chart-trend" style="width:100%;height:200px"></canvas>
        </div>
      </div>

      <!-- EWS Aktif -->
      <div class="card col-span-2">
        <div class="card-header">
          <span class="card-title">🚨 EWS Aktif — Perlu Perhatian</span>
          <button class="btn btn-ghost btn-sm" onclick="navigate('borrowers')">Lihat Semua →</button>
        </div>
        <div class="card-body-sm">
          <div class="ews-list" id="ews-panel">
            ${renderEWSPanel(borrowers)}
          </div>
        </div>
      </div>

      <!-- Borrower Terbaru -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🆕 Analisis Terbaru</span>
        </div>
        <div class="card-body-sm">
          <div style="display:flex;flex-direction:column;gap:var(--gap-sm)">
            ${recentBorrowers(borrowers).map(b => `
              <div class="ews-item card-clickable" onclick="navigate('detail','${b.id}')">
                <div style="flex:1">
                  <div class="ews-item-name">${b.name}</div>
                  <div class="ews-item-sector">${sectorLabel(b.sector)}</div>
                </div>
                <span class="badge ${decisionBadgeClass(b.decision)}">${decisionLabel(b.decision)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Render charts setelah DOM ready
  requestAnimationFrame(() => {
    renderDonutChart(stats.decisionDist);
    renderSectorChart(borrowers);
    renderTrendChart(trendData);
  });
}

// ── KPI Card helper ──
function kpiCard(icon, label, value, sub, accent, navTarget) {
  const colors = {
    '#3b82f6': 'kpi-blue', '#10b981': 'kpi-green',
    '#6366f1': 'kpi-indigo', '#ef4444': 'kpi-red',
  };
  return `
    <div class="kpi-card card-clickable" style="--kpi-accent:${accent}"
         onclick="navigate('${navTarget}')">
      <div class="kpi-icon">${icon}</div>
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
    </div>
  `;
}

function legendPill(color, label) {
  return `<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary)">
    <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block"></span>${label}
  </span>`;
}

// ── Stats computation ──
function computeStats(borrowers) {
  const total  = borrowers.length;
  const active = borrowers.filter(b => b.status === 'active').length;
  const approved   = borrowers.filter(b => b.decision === 'LAYAK').length;
  const conditional= borrowers.filter(b => b.decision === 'LAYAK_BERSYARAT').length;
  const review = borrowers.filter(b => b.decision === 'REVIEW').length;
  const rejected   = borrowers.filter(b => b.decision === 'TIDAK_LAYAK').length;
  const ewsActive  = borrowers.filter(b => b.ewsStatus === 'red' || b.ewsStatus === 'yellow').length;
  const totalPlafon= borrowers.reduce((s, b) => s + (b.plafon || 0), 0);
  const approvalRate = total > 0 ? ((approved + conditional) / total) * 100 : 0;
  const avgScore = total > 0
    ? borrowers.reduce((s, b) => s + (b.finalScore || 0), 0) / total
    : 0;

  return {
    total, active, approved, conditional, review, rejected,
    ewsActive, totalPlafon, approvalRate, avgScore,
    decisionDist: { approved, conditional, review, rejected },
  };
}

// ── EWS Panel ──
function renderEWSPanel(borrowers) {
  const ewsBorrowers = borrowers
    .filter(b => b.ewsStatus === 'red' || b.ewsStatus === 'yellow')
    .sort((a, b) => (a.ewsStatus === 'red' ? -1 : 1))
    .slice(0, 5);

  if (ewsBorrowers.length === 0) {
    return `<div class="empty-state" style="padding:20px">
      <div>🟢</div>
      <div class="empty-title">Semua aman</div>
    </div>`;
  }

  return ewsBorrowers.map(b => `
    <div class="ews-item" onclick="navigate('detail','${b.id}')">
      <div class="ews-status-dot ${b.ewsStatus}"></div>
      <div style="flex:1">
        <div class="ews-item-name">${b.name}</div>
        <div class="ews-item-sector">${sectorLabel(b.sector)}</div>
      </div>
      <span class="${ewsBadgeClass(b.ewsStatus)}">${ewsLabel(b.ewsStatus)}</span>
      <span style="font-size:12px;color:var(--text-muted)">${b.decision ? decisionLabel(b.decision) : ''}</span>
    </div>
  `).join('');
}

function recentBorrowers(borrowers) {
  return [...borrowers]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 4);
}

function sectorLabel(id) {
  return SECTORS.find(s => s.id === id)?.label ?? id;
}

// ── Charts ──
function renderDonutChart(dist) {
  const canvas = document.getElementById('chart-donut');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const data   = [dist.approved, dist.conditional, dist.review, dist.rejected];
  const colors = ['#10b981', '#f59e0b', '#6366f1', '#ef4444'];
  const labels = ['Layak', 'Bersyarat', 'Review', 'Tidak Layak'];
  const total  = data.reduce((a, b) => a + b, 0);

  if (total === 0) return;

  // Draw donut manually
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const outerR = 85, innerR = 52;
  let startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  data.forEach((val, i) => {
    if (!val) return;
    const angle = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + angle);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    startAngle += angle;
  });

  // Inner hole
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-surface').trim() || '#111827';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#f0f4ff';
  ctx.font = 'bold 22px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy - 6);
  ctx.fillStyle = '#4a5577';
  ctx.font = '10px Inter';
  ctx.fillText('Total', cx, cy + 14);

  // Legend
  const legend = document.getElementById('donut-legend');
  if (legend) {
    legend.innerHTML = labels.map((l, i) => `
      <span class="legend-item">
        <span class="legend-dot" style="background:${colors[i]}"></span>
        ${l} (${data[i]})
      </span>
    `).join('');
  }
}

function renderSectorChart(borrowers) {
  const canvas = document.getElementById('chart-sector');
  if (!canvas) return;

  const sectorCounts = {};
  borrowers.forEach(b => {
    sectorCounts[b.sector] = (sectorCounts[b.sector] || 0) + 1;
  });

  const sorted = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement?.clientWidth || 400;
  const H = 220;
  canvas.width  = W;
  canvas.height = H;

  const labels = sorted.map(([k]) => sectorLabel(k));
  const values = sorted.map(([, v]) => v);
  const maxVal = Math.max(...values);

  const barColors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6','#a78bfa'];

  const padL = 10, padR = 10, padT = 20, padB = 50;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW   = Math.max(20, (chartW / labels.length) - 10);

  ctx.clearRect(0, 0, W, H);

  sorted.forEach(([, val], i) => {
    const x   = padL + i * (chartW / labels.length) + (chartW / labels.length - barW) / 2;
    const bH  = maxVal > 0 ? (val / maxVal) * chartH : 0;
    const y   = padT + chartH - bH;

    // Bar
    ctx.fillStyle = barColors[i % barColors.length];
    roundRect(ctx, x, y, barW, bH, 4);
    ctx.fill();

    // Value
    ctx.fillStyle = '#f0f4ff';
    ctx.font = 'bold 13px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(val, x + barW / 2, y - 6);

    // Label
    ctx.fillStyle = '#8b9cc8';
    ctx.font = '11px Inter';
    const labelX = x + barW / 2;
    const labelY = padT + chartH + 14;

    ctx.save();
    ctx.translate(labelX, labelY);
    ctx.rotate(-Math.PI / 5);
    ctx.textAlign = 'right';
    ctx.fillText(labels[i], 0, 0);
    ctx.restore();
  });
}

function renderTrendChart(trendData) {
  const canvas = document.getElementById('chart-trend');
  if (!canvas) return;

  const W = canvas.parentElement?.clientWidth || 600;
  const H = 200;
  canvas.width  = W;
  canvas.height = H;

  const ctx     = canvas.getContext('2d');
  const labels  = trendData.map(d => d.month);
  const datasets = [
    { key: 'approved',    color: '#10b981' },
    { key: 'conditional', color: '#f59e0b' },
    { key: 'rejected',    color: '#ef4444' },
  ];

  const padL = 30, padR = 20, padT = 20, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const allVals = trendData.flatMap(d => [d.approved, d.conditional, d.rejected]);
  const maxVal  = Math.max(...allVals, 1);

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padT + (i / 4) * chartH;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(99,130,190,0.1)';
    ctx.lineWidth = 1;
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
  }

  // Lines
  datasets.forEach(({ key, color }) => {
    const vals = trendData.map(d => d[key]);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';

    vals.forEach((v, i) => {
      const x = padL + (i / (labels.length - 1)) * chartW;
      const y = padT + chartH - (v / maxVal) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    vals.forEach((v, i) => {
      const x = padL + (i / (labels.length - 1)) * chartW;
      const y = padT + chartH - (v / maxVal) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  });

  // X labels
  ctx.fillStyle = '#8b9cc8';
  ctx.font = '11px Inter';
  ctx.textAlign = 'center';
  labels.forEach((l, i) => {
    const x = padL + (i / (labels.length - 1)) * chartW;
    ctx.fillText(l, x, H - 6);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
