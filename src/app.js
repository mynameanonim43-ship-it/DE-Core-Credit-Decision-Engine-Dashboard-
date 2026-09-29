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
    // Refresh EWS badge on every navigation
    updateEWSBadge();
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

// ── Router (SPA Hidden Div Implementation) ──
function renderPage(page, params = {}) {
  const content = document.getElementById('page-content');
  if (!content) return;

  // Clear initial HTML skeleton blocks so they don't get stuck on screen
  Array.from(content.children).forEach(child => {
    if (!child.classList.contains('view-section')) {
      child.remove();
    }
  });

  // Update active sidebar nav item
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page || (page === 'ews' && el.dataset.page === 'borrowers'));
  });

  // Update topbar title
  const titles = {
    dashboard: '📊 Dashboard Portofolio',
    borrowers: '👥 Daftar Borrower',
    analysis:  '➕ Analisis Baru',
    detail:    '🔎 Detail Borrower',
    settings:  '⚙️ Pengaturan',
    ews:       '🚨 EWS Aktif'
  };
  const topbarTitle = document.getElementById('topbar-title');
  if (topbarTitle) topbarTitle.textContent = titles[page] ?? page;

  // 1. Hide all view <div>s and remove active class
  const views = content.querySelectorAll('.view-section');
  views.forEach(v => {
    v.classList.remove('active-view');
    v.style.display = 'none';
  });

  // 2. Find or create the corresponding view <div>
  let activeView = document.getElementById(`${page}-view`);
  if (!activeView) {
    activeView = document.createElement('div');
    activeView.id = `${page}-view`;
    activeView.className = 'view-section';
    content.appendChild(activeView);
  }

  // 3. Render content into the view (re-render to update dynamic data)
  switch (page) {
    case 'dashboard': renderDashboard(activeView);                       break;
    case 'borrowers': renderBorrowers(activeView, params);               break;
    case 'analysis':  renderAnalysis(activeView, params);                break;
    case 'detail':    renderDetail(activeView, params);                  break;
    case 'settings':  renderSettings(activeView);                        break;
    case 'ews':       renderBorrowers(activeView, { filter: 'ews' });    break;
    default:          renderDashboard(activeView);
  }

  // 4. Display the view with a smooth CSS fade-in effect
  activeView.style.display = 'block';
  
  // Trigger a DOM reflow so the browser registers the display change before animating opacity
  void activeView.offsetWidth; 
  
  activeView.classList.add('active-view');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Navigation helper ──
function navigate(page, params = {}) {
  window.dispatchEvent(new CustomEvent('navigate', {
    detail: { page, params }
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
