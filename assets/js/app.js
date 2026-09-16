import { loadState } from './services/storage.js';
import { appState } from './services/state.js';
import {
  initSupabase, updateCloudUI, handleSaveSupabaseConfig, testCurrentSupabase,
  disconnectSupabase, syncFromSupabase, migrateLocalDataToSupabase,
  copySupabaseSql, seedExampleDataToCloud
} from './services/supabase.js';
import { formatRupiah, formatDateIndo, getTodayString } from './ui/format.js';
import { showToast } from './ui/toast.js';
import { switchTab } from './ui/navigation.js';
import { updateDashboard, renderAccountCards, renderMiniExpenseChart } from './modules/dashboard.js';
import { applyHistoryFilters, populateHistoryDropdowns, setHistoryTypeFilter } from './modules/history.js';
import { generateReports, switchReportSubTab, handlePeriodPresetChange, printReport, exportToExcel } from './modules/reports.js';
import {
  openAddModal, openEditModal, closeAddModal, handleFormSubmit, handleAmountInput,
  updateFormCategories, populateAccountSelect, promptDelete, closeConfirmModal, initDeleteConfirmButton
} from './modules/transactions.js';
import {
  switchMasterTab, renderMasterData, openAccountModal, closeAccountModal,
  openAddAccountModal, openEditAccountModal, saveAccount,
  promptDeleteAccount, openAddCategoryModal, openEditCategoryModal, saveCategory,
  closeCategoryModal, promptDeleteCategory, closeDeleteMasterModal, initDeleteMasterConfirmButton
} from './modules/master-data.js';
import { populateProfileForm, saveProfile, backupData, restoreData, confirmResetData } from './modules/profile.js';
import {
  applyRoleUI, applyRoleVisibility, showLoginScreen, hideLoginScreen,
  switchLoginTab, handleAdminLogin, loadJamaahList, handleJamaahLogin, 
  handleLogout, closeLogoutModal, confirmLogout, bootAuth, handleHeaderSettingsClick // ✅ TAMBAHKAN DI SINI
} from './modules/auth.js';

// ========================================================
// EXPOSE KE GLOBAL WINDOW.APP
// ========================================================
window.App = {
  appState,
  // Supabase
  initSupabase, syncFromSupabase, migrateLocalDataToSupabase,
  handleSaveSupabaseConfig, testCurrentSupabase, disconnectSupabase,
  copySupabaseSql, seedExampleDataToCloud,
  // UI & Navigation
  showToast, switchTab,
  // Dashboard
  updateDashboard, renderAccountCards, renderMiniExpenseChart,
  // History
  applyHistoryFilters, setHistoryTypeFilter, populateHistoryDropdowns,
  // Reports
  generateReports, switchReportSubTab, handlePeriodPresetChange, printReport, exportToExcel,
  // Transactions
  openAddModal, openEditModal, closeAddModal, handleFormSubmit, handleAmountInput,
  updateFormCategories, populateAccountSelect, promptDelete, closeConfirmModal,
  // Master data
  switchMasterTab, renderMasterData, openAccountModal, closeAccountModal,
  openAddAccountModal, openEditAccountModal, saveAccount, promptDeleteAccount,
  openAddCategoryModal, openEditCategoryModal, saveCategory,
  closeCategoryModal, promptDeleteCategory, closeDeleteMasterModal,
  // Profile
  populateProfileForm, saveProfile, backupData, restoreData, confirmResetData,
  // Auth (Login System)
  applyRoleUI, applyRoleVisibility, showLoginScreen, hideLoginScreen,
  switchLoginTab, handleAdminLogin, loadJamaahList, handleJamaahLogin, 
  handleLogout, closeLogoutModal, confirmLogout, bootAuth, handleHeaderSettingsClick // ✅ TAMBAHKAN DI SINI
};

// ========================================================
// INITIALIZATION
// ========================================================
window.addEventListener('DOMContentLoaded', async () => {
  // 1. Load state lokal
  loadState();
  document.getElementById('current-date-badge').innerText = formatDateIndo(getTodayString());
  document.getElementById('dashboard-period-label').innerText = new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

  // 2. Render awal (sementara pakai data lokal)
  populateAccountSelect();
  populateHistoryDropdowns();
  updateDashboard();
  applyHistoryFilters();
  generateReports();
  initDeleteConfirmButton();
  initDeleteMasterConfirmButton();

  // 3. Init Supabase (ini akan trigger seed admin default jika perlu)
  initSupabase(true);

  // 4. ✅ BOOT AUTH: Cek session atau tampilkan layar login
  // Ini yang akan menyembunyikan app dan menampilkan login screen jika belum login
  await bootAuth();
});