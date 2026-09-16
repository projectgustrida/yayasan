import { applyHistoryFilters } from '../modules/history.js';
import { generateReports } from '../modules/reports.js';
import { populateProfileForm } from '../modules/profile.js';
import { openAdminLoginModal } from '../modules/auth.js'; // ✅ Pastikan ini dari modules/auth.js
import { currentUser } from '../services/auth.js';
import { renderMiniExpenseChart } from '../modules/dashboard.js';

export function switchTab(tabId) {
  const role = currentUser?.role || 'guest';
  
  // ✅ BLOKIR AKSES PROFIL UNTUK JAMAAH
  if (tabId === 'profile' && role === 'jamaah') {
    showToast("Halaman Profil khusus untuk Pengelola.", true);
    tabId = 'home'; // Redirect otomatis ke beranda
  }
  
  const views = ['home', 'history', 'reports', 'profile'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (!el) return;
    if (v === tabId) el.classList.remove('hidden-view');
    else el.classList.add('hidden-view');
  });

  const navBtns = document.querySelectorAll('.nav-btn');
  const tabMap = { 'home': 0, 'history': 1, 'reports': 2, 'profile': 3 };
  const activeIdx = tabMap[tabId];
  
  navBtns.forEach((btn, idx) => {
    const span = btn.querySelector('span');
    if (idx === activeIdx) {
      btn.className = btn.className.replace('text-gray-400', 'text-primary');
      span.className = span.className.replace('font-medium', 'font-semibold');
    } else {
      btn.className = btn.className.replace('text-primary', 'text-gray-400');
      span.className = span.className.replace('font-semibold', 'font-medium');
    }
  });

  document.getElementById('main-content').scrollTop = 0;
  if (tabId === 'history') applyHistoryFilters();
  else if (tabId === 'reports') generateReports();
  else if (tabId === 'profile') populateProfileForm();
}