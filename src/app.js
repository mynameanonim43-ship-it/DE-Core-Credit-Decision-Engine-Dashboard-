// src/app.js — Main Application Entry Point

import { seedDemoData, getAllBorrowers } from './data/store.js';
import { renderDashboard }  from './screens/dashboard.js';
import { renderBorrowers }  from './screens/borrowers.js';
import { renderAnalysis }   from './screens/analysis.js';
import { renderDetail }     from './screens/detail.js';
import { renderSettings }   from './screens/settings.js';

// ── Initialize App ──
(function init() {
  // Seed demo data on first load
  seedDemoData();

  // Setup navigation handler
  window.navigate = navigate;
  window.showToast = showToast;
  window.addEventListener('navigate', e => {
    const { page, params } = e.detail;
    renderPage(page, params);
  });

  // Initial page
  renderPage('dashboard');

  // Update nav badge
  updateEWSBadge();

  // Dismiss splash screen after 2.5 seconds
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('hidden');
      setTimeout(() => splash.remove(), 800); // Remove from DOM after fade out
    }
  }, 2500);
})();

// ── Router ──
function renderPage(page, params = {}) {
  let content = document.getElementById('page-content');
  if (!content) return;

  // Clear event listeners by replacing the node
  const newContent = content.cloneNode(false);
  content.parentNode.replaceChild(newContent, content);
  content = newContent;

  // Update active nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Update topbar title
  const titles = {
    dashboard: '📊 Dashboard Portofolio',
    borrowers: '👥 Daftar Borrower',
    analysis:  '➕ Analisis Baru',
    detail:    '🔎 Detail Borrower',
    settings:  '⚙️ Pengaturan',
  };
  const topbarTitle = document.getElementById('topbar-title');
  if (topbarTitle) topbarTitle.textContent = titles[page] ?? page;

  // Render
  switch (page) {
    case 'dashboard': renderDashboard(content);          break;
    case 'borrowers': renderBorrowers(content, params);  break;
    case 'analysis':  renderAnalysis(content, params);   break;
    case 'detail':    renderDetail(content, params);     break;
    case 'settings':  renderSettings(content);           break;
    default:          renderDashboard(content);
  }

  // Scroll to top
  content.scrollTo?.({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Navigation helper ──
function navigate(page, params = {}) {
  window.dispatchEvent(new CustomEvent('navigate', {
    detail: { page, params: typeof params === 'string' ? params : params }
  }));
}

// ── Toast Notifications ──
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', warning: '⚠️', error: '❌' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] ?? '💬'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 200ms ease';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

// ── Update EWS Badge ──
function updateEWSBadge() {
  const badge = document.getElementById('ews-badge');
  if (!badge) return;
  const borrowers = getAllBorrowers();
  const ewsCount  = borrowers.filter(b => b.ewsStatus === 'red' || b.ewsStatus === 'yellow').length;
  badge.textContent = ewsCount;
  badge.style.display = ewsCount > 0 ? '' : 'none';
}

// ── Global search from topbar ──
document.addEventListener('DOMContentLoaded', () => {
  const globalSearch = document.getElementById('global-search');
  if (globalSearch) {
    globalSearch.addEventListener('keydown', e => {
      if (e.key === 'Enter' && globalSearch.value.trim()) {
        navigate('borrowers', { search: globalSearch.value.trim() });
      }
    });
  }
});
