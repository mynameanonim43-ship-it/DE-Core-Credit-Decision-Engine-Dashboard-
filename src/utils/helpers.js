// src/utils/helpers.js

export function formatRupiah(value, compact = false) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  if (compact) {
    if (Math.abs(value) >= 1e12) return `Rp ${(value/1e12).toFixed(1)}T`;
    if (Math.abs(value) >= 1e9)  return `Rp ${(value/1e9).toFixed(1)}M`;
    if (Math.abs(value) >= 1e6)  return `Rp ${(value/1e6).toFixed(0)}Jt`;
  }
  return 'Rp ' + Math.round(value).toLocaleString('id-ID');
}

export function formatPct(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function formatX(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${Number(value).toFixed(decimals)}x`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function decisionBadgeClass(decision) {
  const map = {
    LAYAK:           'badge-approve',
    LAYAK_BERSYARAT: 'badge-conditional',
    REVIEW:          'badge-review',
    TIDAK_LAYAK:     'badge-reject',
  };
  return map[decision] ?? 'badge-review';
}

export function decisionLabel(decision) {
  const map = {
    LAYAK:           '✅ Layak',
    LAYAK_BERSYARAT: '⚖️ Bersyarat',
    REVIEW:          '🔍 Review',
    TIDAK_LAYAK:     '❌ Tidak Layak',
  };
  return map[decision] ?? decision;
}

export function ewsBadgeClass(status) {
  const map = { green: 'ews-green', yellow: 'ews-yellow', red: 'ews-red' };
  return map[status] ?? 'ews-green';
}

export function ewsLabel(status) {
  const map = { green: '🟢 Normal', yellow: '🟡 Waspada', red: '🔴 Kritis' };
  return map[status] ?? '—';
}

/**
 * Returns CSS variable color string based on score
 */
export function scoreColor(score) {
  if (score === null || score === undefined || isNaN(score)) return 'var(--text-muted)';
  if (score >= 75) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  if (score >= 45) return 'var(--info)';
  return 'var(--danger)';
}

/**
 * Returns hex color based on score (for canvas drawing)
 */
export function scoreColorHex(score) {
  if (score === null || score === undefined || isNaN(score)) return '#4a5577';
  if (score >= 75) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 45) return '#6366f1';
  return '#ef4444';
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function navigate(page, params = {}) {
  const event = new CustomEvent('navigate', { detail: { page, params } });
  window.dispatchEvent(event);
}
