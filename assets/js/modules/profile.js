import { appState } from '../services/state.js';
import { saveState } from '../services/storage.js';
import { showToast } from '../ui/toast.js';
import { pushProfileToCloud } from '../services/supabase.js';
import { DEFAULT_STATE } from '../config.js';

// ✅ Flag: apakah sync pertama dari Supabase sudah selesai?
let isInitialSyncDone = false;

export function markInitialSyncDone() {
  isInitialSyncDone = true;
}

export function populateProfileForm() {
  const p = appState.profile;
  document.getElementById('prof-name').value = p.name || '';
  document.getElementById('prof-subtitle').value = p.subtitle || '';
  document.getElementById('prof-sk').value = p.skNumber || '';
  document.getElementById('prof-city').value = p.city || '';
  document.getElementById('prof-address').value = p.address || '';
  document.getElementById('prof-chairman').value = p.chairman || '';
  document.getElementById('prof-treasurer').value = p.treasurer || '';
  const pinEl = document.getElementById('prof-admin-pin');
  if (pinEl) pinEl.value = p.adminPin || '123456';
  if (window.App && window.App.renderMasterData) window.App.renderMasterData();
  // ✅ Terapkan visibility sesuai role
  if (window.App && window.App.applyRoleVisibility) window.App.applyRoleVisibility();
}

export function saveProfile(e) {
  e.preventDefault();
  const pinVal = (document.getElementById('prof-admin-pin').value || '123456').trim();
  if (pinVal.length !== 6 || isNaN(pinVal)) {
    showToast("PIN Admin harus berupa 6 digit angka!", true);
    return;
  }
  appState.profile = {
    ...appState.profile,
    name: document.getElementById('prof-name').value.trim(),
    subtitle: document.getElementById('prof-subtitle').value.trim(),
    skNumber: document.getElementById('prof-sk').value.trim(),
    city: document.getElementById('prof-city').value.trim(),
    address: document.getElementById('prof-address').value.trim(),
    chairman: document.getElementById('prof-chairman').value.trim(),
    treasurer: document.getElementById('prof-treasurer').value.trim(),
    adminPin: pinVal
  };
  saveState();
  if (window.App && window.App.updateDashboard) window.App.updateDashboard();
  pushProfileToCloud();
  showToast("Profil Yayasan & PIN Admin berhasil diperbarui!");
}

export function backupData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `Backup_Keuangan_Yayasan_${new Date().toISOString().split('T')[0]}.json`);
  dlAnchor.click();
  showToast("File cadangan JSON berhasil diunduh!");
}

export function restoreData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (parsed.transactions && parsed.accounts) {
        Object.assign(appState, parsed);
        saveState();
        if (window.App.updateDashboard) window.App.updateDashboard();
        if (window.App.applyHistoryFilters) window.App.applyHistoryFilters();
        if (window.App.generateReports) window.App.generateReports();
        populateProfileForm();
        showToast("Data berhasil dipulihkan!");
      } else {
        showToast("Format file cadangan tidak valid!", true);
      }
    } catch (err) {
      showToast("Gagal membaca file JSON!", true);
    }
  };
  reader.readAsText(file);
}

export function confirmResetData() {
  if (confirm("Apakah Anda yakin ingin mengembalikan seluruh data ke contoh awal?")) {
    Object.assign(appState, JSON.parse(JSON.stringify(DEFAULT_STATE)));
    saveState();
    if (window.App.updateDashboard) window.App.updateDashboard();
    if (window.App.applyHistoryFilters) window.App.applyHistoryFilters();
    if (window.App.generateReports) window.App.generateReports();
    populateProfileForm();
    showToast("Data berhasil di-reset ke bawaan!");
  }
}