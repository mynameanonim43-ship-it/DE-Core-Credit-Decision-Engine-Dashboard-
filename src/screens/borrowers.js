// src/screens/borrowers.js — Layar 2: Daftar Borrower

import { getAllBorrowers } from '../data/store.js';
import { formatRupiah, formatPct, decisionLabel, decisionBadgeClass, ewsBadgeClass, ewsLabel, formatDate, navigate, debounce } from '../utils/helpers.js';
import { SECTORS } from '../data/benchmark.js';

let state = {
  search: '',
  filterDecision: 'all',
  filterEWS:      'all',
  filterSector:   'all',
  sortKey:        'updatedAt',
  sortDir:        'desc',
};

export function renderBorrowers(container, params = {}) {
  // Handle query params
  if (params.filter === 'ews')  state.filterEWS = 'active';
  if (params.filter === 'LAYAK') state.filterDecision = 'LAYAK';

  container.innerHTML = `
    <!-- Filter bar -->
    <div class="filter-bar">
      <input class="search-input" id="search-input" placeholder="🔍 Cari nama borrower..." value="${state.search}">

      <div style="display:flex;gap:var(--gap-sm);flex-wrap:wrap">
        ${filterChip('all', 'Semua', 'filterDecision')}
        ${filterChip('LAYAK', '✅ Layak', 'filterDecision')}
        ${filterChip('LAYAK_BERSYARAT', '⚖️ Bersyarat', 'filterDecision')}
        ${filterChip('REVIEW', '🔍 Review', 'filterDecision')}
        ${filterChip('TIDAK_LAYAK', '❌ Tolak', 'filterDecision')}
      </div>

      <div style="display:flex;gap:var(--gap-sm)">
        ${filterChip('all', '🟢🟡🔴 EWS', 'filterEWS')}
        ${filterChip('active', '🚨 EWS Aktif', 'filterEWS')}
      </div>

      <select id="sector-filter" class="form-control" style="width:auto;padding:6px 30px 6px 10px">
        <option value="all">Semua Sektor</option>
        ${SECTORS.map(s => `<option value="${s.id}" ${state.filterSector === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
      </select>

      <button class="btn btn-primary btn-sm" onclick="navigate('analysis')">
        ➕ Analisis Baru
      </button>
    </div>

    <!-- Table -->
    <div class="table-wrapper">
      <table id="borrower-table">
        <thead>
          <tr>
            ${th('name',      'Borrower')}
            ${th('sector',    'Sektor')}
            ${th('plafon',    'Plafon')}
            ${th('finalScore','Skor')}
            ${th('decision',  'Keputusan')}
            ${th('nominal',   'Nominal Rek.')}
            ${th('ewsStatus', 'EWS')}
            ${th('updatedAt', 'Diperbarui')}
            <th style="width:60px"></th>
          </tr>
        </thead>
        <tbody id="borrower-tbody">
          <tr><td colspan="9" class="text-muted" style="text-align:center;padding:40px">Memuat...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="table-footer" style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--gap-md);color:var(--text-muted);font-size:12px">
    </div>
  `;

  bindEvents(container);
  renderTable();
}

function th(key, label) {
  const dir = state.sortKey === key ? state.sortDir : '';
  return `<th data-sort="${key}" class="${dir ? 'sort-' + dir : ''}">${label}</th>`;
}

function filterChip(value, label, type) {
  const isActive = state[type] === value;
  return `<span class="filter-chip ${isActive ? 'active' : ''}" data-filter-type="${type}" data-filter-value="${value}">${label}</span>`;
}

function bindEvents(container) {
  // Search
  const searchInput = container.querySelector('#search-input');
  searchInput?.addEventListener('input', debounce(e => {
    state.search = e.target.value;
    renderTable();
  }));

  // Filter chips
  container.addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (chip) {
      state[chip.dataset.filterType] = chip.dataset.filterValue;
      // Re-render filter chips
      document.querySelectorAll(`[data-filter-type="${chip.dataset.filterType}"]`).forEach(c => {
        c.classList.toggle('active', c.dataset.filterValue === chip.dataset.filterValue);
      });
      renderTable();
    }

    // Sort
    const th = e.target.closest('th[data-sort]');
    if (th) {
      const key = th.dataset.sort;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = key;
        state.sortDir = 'asc';
      }
      // Update header classes
      document.querySelectorAll('th[data-sort]').forEach(t => {
        t.className = t.dataset.sort === key ? `sort-${state.sortDir}` : '';
      });
      renderTable();
    }

    // Row click
    const row = e.target.closest('tr[data-id]');
    if (row && !e.target.closest('button')) {
      navigate('detail', row.dataset.id);
    }

    // Action buttons
    const editBtn = e.target.closest('[data-action="edit"]');
    if (editBtn) {
      navigate('analysis', editBtn.dataset.id);
    }
  });

  // Sector filter
  container.querySelector('#sector-filter')?.addEventListener('change', e => {
    state.filterSector = e.target.value;
    renderTable();
  });
}

function renderTable() {
  const borrowers = getFilteredSorted();
  const tbody = document.getElementById('borrower-tbody');
  const footer = document.getElementById('table-footer');

  if (!tbody) return;

  if (borrowers.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="9">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">Tidak ada borrower ditemukan</div>
          <div class="empty-sub">Coba ubah filter atau tambah analisis baru</div>
          <button class="btn btn-primary btn-sm" onclick="navigate('analysis')">➕ Analisis Baru</button>
        </div>
      </td></tr>
    `;
  } else {
    tbody.innerHTML = borrowers.map(b => `
      <tr data-id="${b.id}" style="cursor:pointer">
        <td class="td-primary">
          <div style="font-weight:600">${b.name}</div>
          <div style="font-size:11px;color:var(--text-muted)">${b.id}</div>
        </td>
        <td>${sectorLabel(b.sector)}</td>
        <td class="td-mono">${formatRupiah(b.plafon, true)}</td>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="progress-bar" style="width:60px">
              <div class="progress-fill" style="width:${b.finalScore || 0}%;background:${scoreColor(b.finalScore)}"></div>
            </div>
            <span class="td-mono" style="color:${scoreColor(b.finalScore)};font-weight:700">${b.finalScore?.toFixed(1) ?? '—'}</span>
          </div>
        </td>
        <td><span class="badge ${decisionBadgeClass(b.decision)}">${decisionLabel(b.decision)}</span></td>
        <td class="td-mono">${b.nominal ? formatRupiah(b.nominal, true) : '—'}</td>
        <td><span class="${ewsBadgeClass(b.ewsStatus)}">${ewsLabel(b.ewsStatus)}</span></td>
        <td style="font-size:12px;color:var(--text-muted)">${formatDate(b.updatedAt)}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-icon btn-sm" data-action="edit" data-id="${b.id}" title="Edit">✏️</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  if (footer) {
    footer.textContent = `Menampilkan ${borrowers.length} dari ${getAllBorrowers().length} borrower`;
  }
}

function getFilteredSorted() {
  let list = getAllBorrowers();

  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(b => b.name?.toLowerCase().includes(q) || b.id?.toLowerCase().includes(q));
  }

  if (state.filterDecision !== 'all') {
    list = list.filter(b => b.decision === state.filterDecision);
  }

  if (state.filterEWS === 'active') {
    list = list.filter(b => b.ewsStatus === 'red' || b.ewsStatus === 'yellow');
  }

  if (state.filterSector !== 'all') {
    list = list.filter(b => b.sector === state.filterSector);
  }

  // Sort
  list.sort((a, b) => {
    let va = a[state.sortKey] ?? '';
    let vb = b[state.sortKey] ?? '';
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return state.sortDir === 'asc' ? -1 : 1;
    if (va > vb) return state.sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return list;
}

function sectorLabel(id) {
  return SECTORS.find(s => s.id === id)?.label ?? id;
}

function scoreColor(score) {
  if (!score) return 'var(--text-muted)';
  if (score >= 75) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 45) return '#6366f1';
  return '#ef4444';
}
