// src/screens/dashboard.js — Layar 1: Portfolio Dashboard (Home)

import { navigate } from '../utils/helpers.js';

export function renderDashboard(container) {
  // We will build the new layout here.
  container.innerHTML = `
    <div class="kpi-grid mb-lg" style="margin-bottom:var(--gap-xl); display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
      ${renderKpiCard('Total Outstanding Portfolio', 'Rp 450.2 M', '+5.2%', 'up')}
      ${renderKpiCard('Weighted Average Scoring', '78.4', '+1.2', 'up')}
      ${renderKpiCard('NPL Ratio %', '2.8%', '-0.4%', 'down', true)}
      ${renderKpiCard('Active EWS Alerts', '12', '+3', 'up', true)}
    </div>

    <div class="dashboard-grid" style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px; margin-bottom: 16px;">
      <!-- Donut Chart -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Portfolio by Collectibility</span>
        </div>
        <div class="card-body-sm" style="display:flex;flex-direction:column;align-items:center;">
          <div class="chart-container" style="width:220px;height:220px; position:relative;">
            <canvas id="collectibility-chart" width="220" height="220"></canvas>
            <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center;">
              <div style="font-size:24px; font-weight:bold; color:var(--text-primary)">100%</div>
              <div style="font-size:10px; color:var(--text-muted)">Total</div>
            </div>
          </div>
          <div class="chart-legend" id="collectibility-legend" style="margin-top:16px; justify-content:center;"></div>
        </div>
      </div>

      <!-- Stacked Bar Chart -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Exposure by Product Type</span>
        </div>
        <div class="card-body-sm" style="height:300px;">
          <canvas id="exposure-chart" style="width:100%; height:100%;"></canvas>
        </div>
      </div>
    </div>

    <div class="dashboard-grid" style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px;">
      <!-- EWS Heatmap -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">EWS Heatmap (Risk vs DPD)</span>
        </div>
        <div class="card-body-sm">
          ${renderEWSHeatmap()}
        </div>
      </div>

      <!-- Data Table -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Borrower List</span>
        </div>
        <div class="card-body-sm table-wrapper" style="padding:0; border:none; margin:16px;">
          ${renderDataTable()}
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    drawCollectibilityDonut();
    drawExposureStackedBar();
  });
}

function renderKpiCard(title, value, change, trend, isAlert = false) {
  let pathD = '';
  let color = trend === 'up' ? 'var(--success)' : 'var(--danger)';
  if (isAlert) {
      color = trend === 'up' ? 'var(--danger)' : 'var(--success)';
  }
  
  if (trend === 'up') {
      pathD = 'M0 20 L 10 15 L 20 18 L 30 10 L 40 12 L 50 5 L 60 0';
  } else {
      pathD = 'M0 5 L 10 2 L 20 8 L 30 5 L 40 15 L 50 12 L 60 20';
  }

  const actualColor = color === 'var(--success)' ? '#10b981' : '#ef4444';
  const displayChange = isAlert ? (trend === 'up' ? '↑ ' + change : '↓ ' + change) : (trend === 'up' ? '↑ ' + change : '↓ ' + change);

  return `
    <div class="kpi-card card-clickable" style="--kpi-accent:${actualColor}; display: flex; flex-direction: column; justify-content: space-between; padding: var(--gap-lg);">
      <div>
        <div class="kpi-label">${title}</div>
        <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-top: 8px;">
          <div class="kpi-value" style="font-size: 24px;">${value}</div>
          <div class="kpi-trend ${color === 'var(--success)' ? 'up' : 'down'}" style="margin-bottom: 4px;">${displayChange}</div>
        </div>
      </div>
      <div style="margin-top: 16px; height: 35px; width: 100%;">
        <svg viewBox="0 0 60 25" preserveAspectRatio="none" style="width:100%; height:100%; overflow:visible;">
          <path d="${pathD}" fill="none" stroke="${actualColor}" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="${pathD} L 60 25 L 0 25 Z" fill="${actualColor}" opacity="0.1" />
        </svg>
      </div>
    </div>
  `;
}

function drawCollectibilityDonut() {
  const canvas = document.getElementById('collectibility-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const data = [60, 15, 10, 8, 5, 2];
  const labels = ['PL (Pass)', 'Current', 'Special Mention', 'Substandard', 'Doubtful', 'Loss'];
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444', '#7f1d1d'];
  const total = data.reduce((a, b) => a + b, 0);

  const cx = canvas.width / 2, cy = canvas.height / 2;
  const outerR = 90, innerR = 65;
  let startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  data.forEach((val, i) => {
    const angle = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + angle);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-surface').trim() || '#111827';
    ctx.lineWidth = 3;
    ctx.stroke();

    startAngle += angle;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-surface').trim() || '#111827';
  ctx.fill();

  const legend = document.getElementById('collectibility-legend');
  if (legend) {
    legend.innerHTML = labels.map((l, i) => `
      <span class="legend-item" style="font-size:11px; margin-bottom:4px;">
        <span class="legend-dot" style="background:${colors[i]}"></span>
        ${l} (${data[i]}%)
      </span>
    `).join('');
  }
}

function drawExposureStackedBar() {
  const canvas = document.getElementById('exposure-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement?.clientWidth || 600;
  const H = 300;
  canvas.width = W;
  canvas.height = H;

  const data = [
    { label: 'SME', current: 300, late: 50, npl: 20, accounts: 120 },
    { label: 'Mortgage', current: 400, late: 30, npl: 10, accounts: 250 },
    { label: 'Personal Loan', current: 150, late: 40, npl: 15, accounts: 800 },
    { label: 'Automotive', current: 200, late: 60, npl: 25, accounts: 450 }
  ];

  const padL = 50, padR = 20, padT = 40, padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW = Math.min(60, (chartW / data.length) * 0.4);
  
  const maxVal = 500; 

  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i <= 5; i++) {
    const y = padT + (i/5) * chartH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    
    ctx.fillStyle = '#8b9cc8';
    ctx.font = '11px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(((5-i) * 100) + 'M', padL - 10, y + 4);
  }

  data.forEach((d, i) => {
    const x = padL + i * (chartW / data.length) + (chartW / data.length - barW) / 2;
    
    const hCurrent = (d.current / maxVal) * chartH;
    const hLate = (d.late / maxVal) * chartH;
    const hNpl = (d.npl / maxVal) * chartH;

    let currentY = padT + chartH;

    ctx.fillStyle = '#10b981';
    currentY -= hCurrent;
    ctx.fillRect(x, currentY, barW, hCurrent);

    ctx.fillStyle = '#f59e0b';
    currentY -= hLate;
    ctx.fillRect(x, currentY, barW, hLate);

    ctx.fillStyle = '#ef4444';
    currentY -= hNpl;
    ctx.fillRect(x, currentY, barW, hNpl);
    
    ctx.fillStyle = '#8b9cc8';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barW/2, H - 15);

    ctx.fillStyle = '#f0f4ff';
    ctx.font = 'bold 11px Inter';
    ctx.fillText(d.accounts + ' acc', x + barW/2, currentY - 10);
  });
  
  const legX = W - padR - 220;
  ctx.font = '11px Inter';
  ctx.textAlign = 'left';
  
  ctx.fillStyle = '#10b981';
  ctx.fillRect(legX, 10, 12, 12);
  ctx.fillStyle = '#8b9cc8';
  ctx.fillText('Current', legX + 18, 20);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(legX + 75, 10, 12, 12);
  ctx.fillStyle = '#8b9cc8';
  ctx.fillText('Late', legX + 93, 20);

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(legX + 135, 10, 12, 12);
  ctx.fillStyle = '#8b9cc8';
  ctx.fillText('NPL', legX + 153, 20);
}

function renderEWSHeatmap() {
  const ratings = [1,2,3,4,5,6,7,8,9,10];
  const dpdBuckets = ['Current', '1-30 DPD', '31-60 DPD', '61-90 DPD'];

  let tableHtml = '<table style="width:100%; border-collapse: separate; border-spacing: 3px; margin-top: 8px;">';
  
  tableHtml += '<tr><td style="font-size:11px; color:var(--text-muted); font-weight:600;">Risk \\ DPD</td>';
  dpdBuckets.forEach(b => {
    tableHtml += `<td style="font-size:11px; text-align:center; color:var(--text-muted); padding:6px; font-weight:600;">${b}</td>`;
  });
  tableHtml += '</tr>';

  ratings.forEach(r => {
    tableHtml += `<tr><td style="font-size:12px; color:var(--text-secondary); width: 50px; text-align:center; font-weight:600;">${r}</td>`;
    dpdBuckets.forEach((b, bIdx) => {
      const riskScore = ((r-1) / 9) * 0.5 + (bIdx / 3) * 0.5;
      
      let bg = `rgba(239, 68, 68, ${riskScore * 0.8})`;
      let border = '1px solid transparent';
      let textColor = 'rgba(255,255,255,0.7)';
      let shadow = 'none';
      let zIndex = 1;
      
      if (r === 10 && bIdx === 3) {
        bg = '#ef4444';
        border = '2px solid #fca5a5';
        textColor = '#ffffff';
        shadow = '0 0 15px rgba(239, 68, 68, 0.8)';
        zIndex = 2;
      } else if (riskScore < 0.2) {
        bg = 'rgba(16, 185, 129, 0.15)';
      }

      // Pre-determined counts for visual fidelity
      const count = r === 10 && bIdx === 3 ? 5 : (riskScore < 0.3 ? Math.floor(Math.random() * 20 + 5) : Math.floor(Math.random() * 5));

      tableHtml += `<td style="background:${bg}; border:${border}; box-shadow:${shadow}; height:32px; border-radius:6px; text-align:center; font-size:12px; font-weight:bold; color:${textColor}; cursor:pointer; position:relative; z-index:${zIndex}; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" title="Risk ${r}, ${b}: ${count} borrowers">
        ${count > 0 ? count : ''}
      </td>`;
    });
    tableHtml += '</tr>';
  });
  tableHtml += '</table>';
  
  return `<div style="overflow-x:auto; padding-bottom: 8px;">${tableHtml}</div>`;
}

function renderDataTable() {
  const rows = [
    { name: 'PT Sejahtera Abadi', id: 'BRW-1001', status: 'Active', progress: 100 },
    { name: 'CV Makmur Bersama', id: 'BRW-1002', status: 'Under Review/Special Mention', progress: 65 },
    { name: 'Toko Sentosa', id: 'BRW-1003', status: 'NPL/Written Off', progress: 20 },
    { name: 'PT Maju Terus', id: 'BRW-1004', status: 'Active', progress: 100 },
    { name: 'Firma Karyawan', id: 'BRW-1005', status: 'Under Review/Special Mention', progress: 80 }
  ];

  let tbody = rows.map(r => {
    let statusPill = '';
    if (r.status === 'Active') {
      statusPill = '<span style="background:var(--success); color:#fff; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; box-shadow: 0 2px 4px rgba(16,185,129,0.3);">Active</span>';
    } else if (r.status === 'Under Review/Special Mention') {
      statusPill = '<span style="background:var(--warning); color:#fff; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; box-shadow: 0 2px 4px rgba(245,158,11,0.3);">Under Review / SM</span>';
    } else {
      statusPill = '<span style="background:#0f172a; color:#fff; border: 1px solid #334155; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">NPL / Written Off</span>';
    }

    const progColor = r.progress === 100 ? 'var(--success)' : (r.progress < 50 ? 'var(--danger)' : 'var(--brand)');

    return `
      <tr>
        <td class="td-primary" style="font-weight:600;">${r.name}</td>
        <td class="td-mono">${r.id}</td>
        <td>${statusPill}</td>
        <td style="min-width: 140px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="flex:1; height:8px; background:var(--bg-hover); border-radius:4px; overflow:hidden;">
              <div style="width:${r.progress}%; height:100%; background:${progColor}; border-radius:4px; transition: width 1s ease-out;"></div>
            </div>
            <span style="font-size:12px; color:var(--text-primary); font-weight:600; width:32px; text-align:right;">${r.progress}%</span>
          </div>
        </td>
        <td>
          <button class="btn btn-ghost btn-sm" style="font-weight:600;">Detail →</button>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <table style="width: 100%;">
      <thead>
        <tr>
          <th>Borrower Name</th>
          <th>ID</th>
          <th>Status</th>
          <th>Application Progress</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${tbody}
      </tbody>
    </table>
  `;
}
