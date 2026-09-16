import { showToast } from '../ui/toast.js';
import { switchTab } from '../ui/navigation.js';
import {
  currentUser, loginAdmin, loginJamaah, logout as doLogout,
  restoreSession, isAdmin, isJamaah, isLoggedIn, getCurrentUserName,
  fetchAllUsers
} from '../services/auth.js';

export function handleHeaderSettingsClick() {
  if (isJamaah()) {
    openAdminLoginModal();
  } else {
    switchTab('profile');
  }
}

// ========================================================
// APPLY ROLE UI
// ========================================================
export function applyRoleUI() {
  if (!isLoggedIn()) return;
  const isAdm = isAdmin();
  document.body.className = isAdm ? 'role-admin' : 'role-jamaah';

  const userBadge = document.getElementById('user-badge');
  const roleIcon = document.getElementById('role-icon');
  const userNameText = document.getElementById('user-name-text');
  const headerRoleBadge = document.getElementById('header-role-badge');

  if (isAdm) {
    if (userBadge) userBadge.className = "px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm border bg-emerald-800/90 border-emerald-500 text-emerald-100";
    if (roleIcon) roleIcon.className = "fa-solid fa-user-shield text-[10px]";
    if (headerRoleBadge) {
      headerRoleBadge.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800";
      headerRoleBadge.innerText = "Pengelola";
    }
  } else {
    if (userBadge) userBadge.className = "px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm border bg-blue-900/60 border-blue-400 text-blue-200";
    if (roleIcon) roleIcon.className = "fa-solid fa-eye text-[10px]";
    if (headerRoleBadge) {
      headerRoleBadge.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800";
      headerRoleBadge.innerText = "Jamaah (Hanya Lihat)";
    }
  }
  if (userNameText) userNameText.innerText = getCurrentUserName();
  applyRoleVisibility();
}

export function applyRoleVisibility() {
  const isAdm = isAdmin();
  document.querySelectorAll('.admin-only').forEach(el => { el.style.display = isAdm ? '' : 'none'; });
  document.querySelectorAll('.jamaah-only').forEach(el => { el.style.display = isAdm ? 'none' : ''; });
  document.querySelectorAll('.action-edit, .action-delete').forEach(btn => { btn.style.display = isAdm ? '' : 'none'; });
  
  const adminForms = document.querySelectorAll('#profile-form input, #profile-form button[type=submit], #supabase-config-form input, #supabase-config-form button');
  adminForms.forEach(el => {
    if (isAdm) { el.disabled = false; el.classList.remove('opacity-50', 'cursor-not-allowed'); } 
    else { el.disabled = true; el.classList.add('opacity-50', 'cursor-not-allowed'); }
  });
  document.querySelectorAll('.btn-add-master').forEach(btn => { btn.style.display = isAdm ? '' : 'none'; });
}

// ========================================================
// LOGIN SCREEN HANDLERS
// ========================================================
export function showLoginScreen() {
  const screen = document.getElementById('login-screen');
  if (screen) screen.classList.remove('hidden-view');
  loadJamaahList();
}

export function hideLoginScreen() {
  const screen = document.getElementById('login-screen');
  if (screen) screen.classList.add('hidden-view');
}

export function switchLoginTab(tab) {
  const adminTab = document.getElementById('login-tab-admin');
  const jamaahTab = document.getElementById('login-tab-jamaah');
  const adminForm = document.getElementById('login-form-admin');
  const jamaahForm = document.getElementById('login-form-jamaah');

  if (tab === 'admin') {
    adminTab.classList.add('active');
    jamaahTab.classList.remove('active');
    adminForm.classList.remove('hidden-view');
    jamaahForm.classList.add('hidden-view');
  } else {
    adminTab.classList.remove('active');
    jamaahTab.classList.add('active');
    adminForm.classList.add('hidden-view');
    jamaahForm.classList.remove('hidden-view');
    loadJamaahList();
  }
  hideLoginError();
  hideJamaahLoginError();
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  const text = document.getElementById('login-error-text');
  if (el && text) { text.innerText = msg; el.classList.remove('hidden'); }
}
function hideLoginError() {
  const el = document.getElementById('login-error');
  if (el) el.classList.add('hidden');
}
function showJamaahLoginError(msg) {
  const el = document.getElementById('jamaah-login-error');
  const text = document.getElementById('jamaah-login-error-text');
  if (el && text) { text.innerText = msg; el.classList.remove('hidden'); }
}
function hideJamaahLoginError() {
  const el = document.getElementById('jamaah-login-error');
  if (el) el.classList.add('hidden');
}

export async function handleAdminLogin(e) {
  e.preventDefault();
  hideLoginError();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('btn-login-admin');

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memproses...`;

  const result = await loginAdmin(username, password);

  btn.disabled = false;
  btn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Masuk sebagai Admin`;

  if (result.success) {
    showToast(`Selamat datang, ${result.user.name}!`);
    hideLoginScreen();
    applyRoleUI();
    if (window.App.updateDashboard) window.App.updateDashboard();
    if (window.App.populateProfileForm) window.App.populateProfileForm();
  } else {
    showLoginError(result.error);
  }
}

export async function loadJamaahList() {
  const select = document.getElementById('login-jamaah-select');
  if (!select) return;
  select.innerHTML = '<option value="">-- Memuat daftar jamaah... --</option>';

  const users = await fetchAllUsers();
  const jamaahList = users.filter(u => u.role === 'jamaah' && u.is_active);

  select.innerHTML = '<option value="">-- Pilih akun Anda --</option>';
  if (jamaahList.length === 0) {
    select.innerHTML += '<option value="" disabled>Belum ada akun jamaah terdaftar</option>';
  } else {
    jamaahList.forEach(u => {
      select.innerHTML += `<option value="${u.id}">${u.name} (@${u.username})</option>`;
    });
  }
}

export async function handleJamaahLogin(e) {
  e.preventDefault();
  hideJamaahLoginError();
  const userId = document.getElementById('login-jamaah-select').value;
  if (!userId) {
    showJamaahLoginError("Silakan pilih akun jamaah terlebih dahulu");
    return;
  }

  const btn = document.getElementById('btn-login-jamaah');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memproses...`;

  const result = await loginJamaah(userId);

  btn.disabled = false;
  btn.innerHTML = `<i class="fa-solid fa-eye"></i> Masuk sebagai Jamaah`;

  if (result.success) {
    showToast(`Selamat datang, ${result.user.name}!`);
    hideLoginScreen();
    applyRoleUI();
    if (window.App.updateDashboard) window.App.updateDashboard();
  } else {
    showJamaahLoginError(result.error);
  }
}

export function openAdminLoginModal() {
  const input = document.getElementById('input-login-pin');
  if (input) input.value = '';
  document.getElementById('admin-login-modal').classList.remove('hidden-view');
  setTimeout(() => { if (input) input.focus(); }, 100);
}

export function closeAdminLoginModal() {
  document.getElementById('admin-login-modal').classList.add('hidden-view');
}

export function handleAdminLoginSubmit(e) {
  e.preventDefault();
  const entered = document.getElementById('input-login-pin').value.trim();
  const appState = window.App?.appState || {};
  const correctPin = (appState.profile && appState.profile.adminPin) ? appState.profile.adminPin : '123456';
  
  if (entered === correctPin) {
    localStorage.setItem('yayasan_user_role', 'admin');
    applyRoleUI();
    closeAdminLoginModal();
    showToast("Selamat datang kembali, Pengelola Yayasan!");
  } else {
    showToast("PIN yang Anda masukkan salah!", true);
    document.getElementById('input-login-pin').value = '';
    document.getElementById('input-login-pin').focus();
  }
}

export async function bootAuth() {
  const loading = document.getElementById('login-loading');
  const adminForm = document.getElementById('login-form-admin');
  const jamaahForm = document.getElementById('login-form-jamaah');

  if (loading) loading.classList.remove('hidden-view');
  if (adminForm) adminForm.classList.add('hidden-view');
  if (jamaahForm) jamaahForm.classList.add('hidden-view');

  let waited = 0;
  while (waited < 5000) {
    const { getSupabaseClient } = await import('../services/supabase.js');
    if (getSupabaseClient()) break;
    await new Promise(r => setTimeout(r, 200));
    waited += 200;
  }

  const session = await restoreSession();
  if (session) {
    if (loading) loading.classList.add('hidden-view');
    hideLoginScreen();
    applyRoleUI();
    return;
  }

  if (loading) loading.classList.add('hidden-view');
  if (adminForm) adminForm.classList.remove('hidden-view');
  showLoginScreen();
}

// Tambahkan di bagian bawah file auth.js
export function handleLogout() {
  document.getElementById('logout-modal').classList.remove('hidden-view');
}

export function closeLogoutModal() {
  document.getElementById('logout-modal').classList.add('hidden-view');
}

export function confirmLogout() {
  closeLogoutModal();
  doLogout();
  location.reload(); // Reload halaman untuk reset state ke login screen
}