// src/screens/dashboard.js — Layar 1: Portfolio Dashboard (Home)

import { navigate } from '../utils/helpers.js';
import { getAllBorrowers } from '../data/store.js';

// Track chart instances so we can destroy them before re-rendering
let riskChart = null;
let approvalChart = null;

export function renderDashboard(container) {
  const borrowers = getAllBorrowers();
  const ewsBorrowers = borrowers.filter(b => b.ewsStatus === 'red' || b.ewsStatus === 'yellow');

  // We will build the new layout here with Chart.js
  container.innerHTML = `
    <div class="kpi-grid mb-lg" style="margin-bottom:var(--gap-xl); display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
      ${renderKpiCard('Total Exposure', 'Rp 1.2 T', '+12%', 'up')}
      ${renderKpiCard('Average Credit Score', '82.5', '+2.1', 'up')}
      ${renderKpiCard('NPL Ratio %', '1.8%', '-0.2%', 'down', true)}
      ${renderKpiCard('Active EWS Alerts', ewsBorrowers.length.toString(), '-2', 'down', true)}
    </div>

    <div class="dashboard-grid" style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px; margin-bottom: 16px;">
      <!-- Doughnut Chart: Portfolio by Risk Category -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Portfolio by Risk Category</span>
        </div>
        <div class="card-body-sm" style="display:flex; justify-content:center; align-items:center; height:300px; position:relative;">
          <canvas id="risk-category-chart"></canvas>
        </div>
      </div>

      <!-- Bar Chart: Monthly Approval Volume -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Monthly Approval Volume</span>
        </div>
        <div class="card-body-sm" style="height:300px; position:relative;">
          <canvas id="monthly-approval-chart"></canvas>
        </div>
      </div>
    </div>

    <!-- Early Warning System (EWS) Alerts -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px 0; color: var(--text-primary); font-size: 16px; font-weight: 600;">Active Early Warning Alerts</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;" id="ews-cards-container">
        <!-- Injected via JS -->
      </div>
    </div>

    <!-- Borrower List Table Component -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <span class="card-title" style="font-size: 16px;">Borrower List</span>
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="position: relative;">
            <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 12px;">🔍</span>
            <input type="text" id="borrower-search" class="form-control" placeholder="Search by name..." style="width: 220px; padding: 8px 12px 8px 32px; font-size: 13px; border-radius: 8px; background: var(--bg-base); border: 1px solid var(--border); color: var(--text-primary);">
          </div>
          <select id="borrower-status-filter" class="form-control" style="width: 160px; padding: 8px 12px; font-size: 13px; border-radius: 8px; background: var(--bg-base); border: 1px solid var(--border); color: var(--text-primary);">
            <option value="All">All Statuses</option>
            <option value="Performing">Performing</option>
            <option value="Watchlist">Watchlist</option>
            <option value="NPL">NPL</option>
          </select>
        </div>
      </div>
      <div class="card-body-sm table-wrapper" style="padding:0; border:none; margin: 16px;">
        <table style="width: 100%; text-align: left; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 12px 16px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 600; font-size: 12px; text-transform: uppercase;">Borrower ID</th>
              <th style="padding: 12px 16px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 600; font-size: 12px; text-transform: uppercase;">Name</th>
              <th style="padding: 12px 16px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 600; font-size: 12px; text-transform: uppercase;">Loan Amount</th>
              <th style="padding: 12px 16px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 600; font-size: 12px; text-transform: uppercase;">Credit Score</th>
              <th style="padding: 12px 16px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 600; font-size: 12px; text-transform: uppercase;">DSR</th>
              <th style="padding: 12px 16px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 600; font-size: 12px; text-transform: uppercase;">Status</th>
            </tr>
          </thead>
          <tbody id="borrower-table-body">
            <!-- Rows injected by JS -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Wait a moment for DOM to be ready before rendering charts
  requestAnimationFrame(() => {
    if (typeof Chart !== 'undefined') {
      Chart.defaults.color = '#8b9cc8';
      Chart.defaults.font.family = "'Inter', sans-serif";
      initRiskCategoryChart();
      initMonthlyApprovalChart();
    } else {
      console.error('Chart.js is not loaded.');
    }
    
    renderEwsCards(container, ewsBorrowers);
    initBorrowerTable();
  });
}

function renderEwsCards(container, ewsBorrowers) {
  const ewsContainer = container.querySelector('#ews-cards-container');
  if (!ewsContainer) return;

  if (ewsBorrowers.length === 0) {
    ewsContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">No active alerts. Portfolio is healthy! 🎉</div>';
    return;
  }

  ewsContainer.innerHTML = ewsBorrowers.map(b => {
    const isRed = b.ewsStatus === 'red';
    const colorHex = isRed ? '#ef4444' : '#f59e0b';
    const bgGradient = isRed ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)';
    const bgBadge = isRed ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)';
    const label = isRed ? 'Critical' : 'High Risk';
    const icon = isRed ? '⚠️' : '📉';
    
    let reason = "Multi-factor EWS trigger";
    if (b.ewsValues) {
       const triggered = Object.entries(b.ewsValues).filter(([_, val]) => val === 'red' || val === 'yellow');
       if (triggered.length > 0) {
         reason = triggered[0][0].replace(/_/g, ' ') + " flag triggered";
       }
    }

    return `
      <div class="card" style="border-left: 4px solid ${colorHex}; background: linear-gradient(to right, ${bgGradient}, transparent);">
        <div class="card-body" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <div>
              <div style="color: var(--text-muted); font-size: 12px; font-family: 'JetBrains Mono', monospace;">${b.id}</div>
              <div style="font-weight: 600; font-size: 15px; color: var(--text-primary); margin-top: 4px;">${b.name}</div>
            </div>
            <span style="background: ${bgBadge}; color: ${colorHex}; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${label}</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 20px;">
            <span style="font-size: 16px;">${icon}</span>
            <span style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">${reason}</span>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="window.navigate('detail', {id:'${b.id}'})" style="flex: 1; padding: 8px; font-size: 12px; font-weight: 600; background: ${colorHex}; border-color: ${colorHex}; color: #fff;">Review Account</button>
            <button class="btn btn-secondary" onclick="window.showToast('Menghubungi ${b.name}...')" style="flex: 1; padding: 8px; font-size: 12px; font-weight: 600;">Contact</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderKpiCard(title, value, change, trend, isAlert = false) {
  let color = trend === 'up' ? 'var(--success)' : 'var(--danger)';
  if (isAlert) {
      color = trend === 'up' ? 'var(--danger)' : 'var(--success)';
  }
  
  const displayChange = isAlert ? (trend === 'up' ? '↑ ' + change : '↓ ' + change) : (trend === 'up' ? '↑ ' + change : '↓ ' + change);
  const actualColor = color === 'var(--success)' ? '#10b981' : '#ef4444';

  return `
    <div class="kpi-card card-clickable" style="--kpi-accent:${actualColor}; display: flex; flex-direction: column; padding: var(--gap-lg); border-radius: 16px; background: var(--bg-surface); border: 1px solid var(--border); transition: transform 0.2s ease, box-shadow 0.2s ease;">
      <div class="kpi-label" style="color: var(--text-muted); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${title}</div>
      <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-top: 12px;">
        <div class="kpi-value" style="font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px;">${value}</div>
        <div class="kpi-trend ${trend}" style="color: ${actualColor}; font-weight: 600; font-size: 12px; background: ${actualColor}20; padding: 4px 10px; border-radius: 20px;">${displayChange}</div>
      </div>
    </div>
  `;
}

function initRiskCategoryChart() {
  const canvas = document.getElementById('risk-category-chart');
  if (!canvas) return;
  // Destroy previous chart instance to prevent 'Canvas already in use' error
  if (riskChart) { riskChart.destroy(); riskChart = null; }
  const ctx = canvas.getContext('2d');
  
  const data = {
    labels: ['Low Risk', 'Moderate Risk', 'High Risk'],
    datasets: [{
      data: [65, 25, 10],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };
  
  riskChart = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#8b9cc8',
            font: { size: 12, weight: '500' },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: '#1a2235',
          titleColor: '#f0f4ff',
          bodyColor: '#8b9cc8',
          borderColor: 'rgba(99,130,190,0.15)',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6
        }
      },
      cutout: '75%',
      layout: {
        padding: { top: 10, bottom: 10 }
      }
    }
  });
}

function initMonthlyApprovalChart() {
  const canvas = document.getElementById('monthly-approval-chart');
  if (!canvas) return;
  // Destroy previous chart instance to prevent 'Canvas already in use' error
  if (approvalChart) { approvalChart.destroy(); approvalChart = null; }
  const ctx = canvas.getContext('2d');
  
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Approval Volume (in Billions Rp)',
      data: [120, 150, 180, 140, 210, 190, 240, 260, 220, 280, 310, 350],
      backgroundColor: 'rgba(59, 130, 246, 0.2)', // brand with opacity
      borderColor: '#3b82f6', // brand
      borderWidth: 2,
      borderRadius: 4,
      hoverBackgroundColor: 'rgba(59, 130, 246, 0.4)'
    }]
  };
  
  approvalChart = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a2235',
          titleColor: '#f0f4ff',
          bodyColor: '#8b9cc8',
          borderColor: 'rgba(99,130,190,0.15)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              return ' Rp ' + context.parsed.y + ' Billion';
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#4a5577', font: { size: 11, weight: '500' } }
        },
        y: {
          grid: { color: 'rgba(99,130,190,0.08)', drawBorder: false },
          ticks: { 
            color: '#4a5577', 
            font: { size: 11, weight: '500' },
            callback: function(value) { return value + 'B'; },
            padding: 10
          },
          border: { display: false }
        }
      },
      layout: {
        padding: { top: 10, right: 10 }
      }
    }
  });
}

function initBorrowerTable() {
  const mockData = [
    { id: 'BRW-1001', name: 'PT Sejahtera Abadi', amount: 'Rp 2.5 B', score: 85, dsr: '28%', status: 'Performing' },
    { id: 'BRW-1002', name: 'CV Mitra Gemilang', amount: 'Rp 800 M', score: 62, dsr: '42%', status: 'Watchlist' },
    { id: 'BRW-1003', name: 'Toko Sentosa Indah', amount: 'Rp 1.2 B', score: 45, dsr: '55%', status: 'NPL' },
    { id: 'BRW-1004', name: 'PT Maju Bersama', amount: 'Rp 4.0 B', score: 78, dsr: '31%', status: 'Performing' },
    { id: 'BRW-1005', name: 'Firma Karyawan Cipta', amount: 'Rp 1.5 B', score: 58, dsr: '47%', status: 'Watchlist' },
    { id: 'BRW-1006', name: 'Budi Hartono', amount: 'Rp 350 M', score: 92, dsr: '22%', status: 'Performing' },
    { id: 'BRW-1007', name: 'PT Konstruksi Hebat', amount: 'Rp 5.5 B', score: 38, dsr: '60%', status: 'NPL' }
  ];

  const tbody = document.getElementById('borrower-table-body');
  const searchInput = document.getElementById('borrower-search');
  const statusFilter = document.getElementById('borrower-status-filter');

  function renderRows(data) {
    if (!tbody) return;
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted); font-size:13px;">No borrowers found matching your criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(row => {
      let statusPill = '';
      if (row.status === 'Performing') {
        statusPill = '<span style="background:var(--success); color:#fff; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; box-shadow: 0 2px 4px rgba(16,185,129,0.2);">Performing</span>';
      } else if (row.status === 'Watchlist') {
        statusPill = '<span style="background:var(--warning); color:#fff; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; box-shadow: 0 2px 4px rgba(245,158,11,0.2);">Watchlist</span>';
      } else {
        statusPill = '<span style="background:var(--danger); color:#fff; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; box-shadow: 0 2px 4px rgba(239,68,68,0.2);">NPL</span>';
      }

      return `
        <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s; cursor: default;" onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='transparent'">
          <td class="td-mono" style="padding: 16px; font-size: 13px;">${row.id}</td>
          <td class="td-primary" style="padding: 16px; font-weight:600; font-size: 13px; color:var(--text-primary);">${row.name}</td>
          <td style="padding: 16px; font-size: 13px; color:var(--text-secondary);">${row.amount}</td>
          <td style="padding: 16px; font-size: 13px; color:var(--text-secondary);">${row.score}</td>
          <td style="padding: 16px; font-size: 13px; color:var(--text-secondary);">${row.dsr}</td>
          <td style="padding: 16px;">${statusPill}</td>
        </tr>
      `;
    }).join('');
  }

  function handleFilter() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusTerm = statusFilter.value;
    
    const filtered = mockData.filter(row => {
      const matchName = row.name.toLowerCase().includes(searchTerm);
      const matchStatus = statusTerm === 'All' || row.status === statusTerm;
      return matchName && matchStatus;
    });
    
    renderRows(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', handleFilter);
  if (statusFilter) statusFilter.addEventListener('change', handleFilter);

  // Initial render
  renderRows(mockData);
}
