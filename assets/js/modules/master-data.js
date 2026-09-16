import { appState } from '../services/state.js';
import { saveState } from '../services/storage.js';
import { showToast } from '../ui/toast.js';
import { populateAccountSelect } from './transactions.js';
import { populateHistoryDropdowns } from './history.js';
import { renderAccountCards } from './dashboard.js';
import { generateReports } from './reports.js';
import { pushAccountToCloud, deleteAccountFromCloud, pushCategoryToCloud, deleteCategoryFromCloud } from '../services/supabase.js';

let activeMasterTab = 'accounts';

export function switchMasterTab(tab) {
    activeMasterTab = tab;
    ['accounts', 'income', 'expense'].forEach(t => {
        const btn = document.getElementById(`btn-master-tab-${t}`);
        const panel = document.getElementById(`panel-master-${t}`);
        if (t === tab) {
            btn.className = "flex-1 py-1.5 rounded-lg bg-white text-gray-800 shadow-sm transition";
            panel.classList.remove('hidden-view');
        } else {
            btn.className = "flex-1 py-1.5 rounded-lg transition text-gray-500 hover:text-gray-800";
            panel.classList.add('hidden-view');
        }
    });
    renderMasterData();
}

export function renderMasterData() {
    renderMasterAccountsList();
    renderMasterCategoriesList('income');
    renderMasterCategoriesList('expense');
    const cntAcc = document.getElementById('master-count-accounts');
    const cntInc = document.getElementById('master-count-income');
    const cntExp = document.getElementById('master-count-expense');
    if (cntAcc) cntAcc.innerText = appState.accounts.length;
    if (cntInc) cntInc.innerText = (appState.categories.income || []).length;
    if (cntExp) cntExp.innerText = (appState.categories.expense || []).length;
}

function renderMasterAccountsList() {
    const container = document.getElementById('master-accounts-list');
    if (!container) return;
    container.innerHTML = '';
    if (appState.accounts.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 py-3 text-center">Belum ada akun kas/bank terdaftar</p>`;
        return;
    }
    appState.accounts.forEach(acc => {
        const isCash = acc.type === 'cash';
        const typeLabel = isCash ? 'Kas Fisik / Tunai' : 'Rekening Bank';
        const badgeColor = isCash ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700';
        const txCount = appState.transactions.filter(t => t.account === acc.name).length;
        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-3 bg-gray-50 hover:bg-white border border-gray-200/70 rounded-xl transition";
        div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary text-sm border border-gray-100">
          <i class="fa-solid ${acc.icon || (isCash ? 'fa-money-bill-wave' : 'fa-building-columns')}"></i>
        </div>
        <div>
          <h5 class="text-xs font-bold text-gray-800">${acc.name}</h5>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-[9px] px-1.5 py-0.5 rounded font-semibold ${badgeColor}">${typeLabel}</span>
            <span class="text-[10px] text-gray-400">• ${txCount} transaksi</span>
          </div>
        </div>
      </div>
      // Contoh di renderMasterAccountsList:
      <div class="flex items-center gap-1.5">
        <button type="button" onclick="window.App.openEditAccountModal('${acc.id}')" title="Edit"
          class="admin-only w-7 h-7 rounded-lg text-gray-400 hover:text-primary hover:bg-emerald-50 transition flex items-center justify-center">
          <i class="fa-solid fa-pen text-[10px]"></i>
        </button>
        <button type="button" onclick="window.App.promptDeleteAccount('${acc.id}')" title="Hapus"
          class="admin-only w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center">
          <i class="fa-solid fa-trash-can text-[10px]"></i>
        </button>
      </div>`;
        container.appendChild(div);
    });
}

function renderMasterCategoriesList(type) {
    const container = document.getElementById(`master-${type}-list`);
    if (!container) return;
    container.innerHTML = '';
    const list = appState.categories[type] || [];
    if (list.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 py-3 text-center">Belum ada kategori ${type === 'income' ? 'pemasukan' : 'pengeluaran'}</p>`;
        return;
    }
    list.forEach(cat => {
        const txCount = appState.transactions.filter(t => t.type === type && t.category === cat.name).length;
        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-3 bg-gray-50 hover:bg-white border border-gray-200/70 rounded-xl transition";
        div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center ${cat.color || 'text-primary'} text-sm border border-gray-100">
          <i class="fa-solid ${cat.icon || 'fa-tag'}"></i>
        </div>
        <div>
          <h5 class="text-xs font-bold text-gray-800">${cat.name}</h5>
          <span class="text-[10px] text-gray-400">${txCount} transaksi digunakan</span>
        </div>
      </div>
      // Contoh di renderMasterAccountsList:
      <div class="flex items-center gap-1.5">
        <button type="button" onclick="window.App.openEditCategoryModal('${type}', '${cat.name.replace(/'/g, "\\'")}')" title="Edit"
          class="admin-only w-7 h-7 rounded-lg text-gray-400 hover:text-primary hover:bg-emerald-50 transition flex items-center justify-center">
          <i class="fa-solid fa-pen text-[10px]"></i>
        </button>
        <button type="button" onclick="window.App.promptDeleteCategory('${type}', '${cat.name.replace(/'/g, "\\'")}')" title="Hapus"
          class="admin-only w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center">
          <i class="fa-solid fa-trash-can text-[10px]"></i>
        </button>
      </div>`;
        container.appendChild(div);
    });
}

// === CRUD AKUN ===
export function openAccountModal() { document.getElementById('account-modal').classList.remove('hidden-view'); }
export function closeAccountModal() {
    document.getElementById('account-modal').classList.add('hidden-view');
    document.getElementById('account-form').reset();
}
export function openAddAccountModal() {
    document.getElementById('acc-modal-title').innerText = "Tambah Akun Kas / Bank";
    document.getElementById('edit-acc-id').value = "";
    document.getElementById('account-form').reset();
    document.getElementById('btn-save-account').innerText = "Tambah Akun";
    document.getElementById('account-modal').classList.remove('hidden-view');
}
export function openEditAccountModal(accId) {
    const acc = appState.accounts.find(a => a.id === accId);
    if (!acc) return;
    document.getElementById('acc-modal-title').innerText = "Edit Akun Kas / Bank";
    document.getElementById('edit-acc-id').value = acc.id;
    document.getElementById('input-acc-name').value = acc.name;
    document.getElementById('input-acc-type').value = acc.type || 'bank';
    document.getElementById('input-acc-color').value = acc.color || 'blue';
    document.getElementById('btn-save-account').innerText = "Simpan Perubahan";
    document.getElementById('account-modal').classList.remove('hidden-view');
}
export function saveAccount(e) {
  e.preventDefault();
  const editId = document.getElementById('edit-acc-id').value;
  const name = document.getElementById('input-acc-name').value.trim();
  const type = document.getElementById('input-acc-type').value;
  const color = document.getElementById('input-acc-color').value;
  if (!name) return;
  const duplicate = appState.accounts.find(a => a.name.toLowerCase() === name.toLowerCase() && a.id !== editId);
  if (duplicate) { showToast("Nama akun sudah ada!", true); return; }

  let savedAccount = null;
  if (editId) {
    const idx = appState.accounts.findIndex(a => a.id === editId);
    if (idx !== -1) {
      const oldName = appState.accounts[idx].name;
      appState.accounts[idx] = { ...appState.accounts[idx], name, type, color, icon: type === 'cash' ? 'fa-money-bill-wave' : 'fa-building-columns' };
      savedAccount = appState.accounts[idx];
      if (oldName !== name) appState.transactions.forEach(t => { if (t.account === oldName) t.account = name; });
      showToast("Akun berhasil diperbarui!");
    }
  } else {
    const newAcc = { id: `acc_${Date.now()}`, name, type, color, icon: type === 'cash' ? 'fa-money-bill-wave' : 'fa-building-columns' };
    appState.accounts.push(newAcc);
    savedAccount = newAcc;
    showToast("Akun baru berhasil ditambahkan!");
  }
  saveState();
  pushAccountToCloud(savedAccount); // ← SYNC KE CLOUD
  // ... refresh UI (populateAccountSelect, dll)
  if (window.App.populateAccountSelect) window.App.populateAccountSelect();
  if (window.App.populateHistoryDropdowns) window.App.populateHistoryDropdowns();
  if (window.App.renderAccountCards) window.App.renderAccountCards();
  if (window.App.renderMasterData) window.App.renderMasterData();
  if (window.App.generateReports) window.App.generateReports();
  closeAccountModal();
}

let pendingDeleteMasterCallback = null;
export function promptDeleteAccount(accId) {
  const acc = appState.accounts.find(a => a.id === accId);
  if (!acc) return;
  if (appState.accounts.length <= 1) { showToast("Minimal harus ada 1 akun!", true); return; }
  const count = appState.transactions.filter(t => t.account === acc.name).length;
  document.getElementById('del-master-title').innerText = `Hapus Akun "${acc.name}"?`;
  document.getElementById('del-master-desc').innerText = count > 0
    ? `Perhatian: Ada ${count} transaksi terhubung dengan akun ini.`
    : "Akun ini belum memiliki riwayat transaksi.";
  pendingDeleteMasterCallback = () => {
    appState.accounts = appState.accounts.filter(a => a.id !== accId);
    saveState();
    deleteAccountFromCloud(accId); // ← SYNC DELETE KE CLOUD
    if (window.App.populateAccountSelect) window.App.populateAccountSelect();
    if (window.App.populateHistoryDropdowns) window.App.populateHistoryDropdowns();
    if (window.App.renderAccountCards) window.App.renderAccountCards();
    if (window.App.renderMasterData) window.App.renderMasterData();
    if (window.App.generateReports) window.App.generateReports();
    showToast("Akun berhasil dihapus!");
  };
  document.getElementById('delete-master-modal').classList.remove('hidden-view');
}

// === CRUD KATEGORI ===
export function openAddCategoryModal(type = 'income') {
    document.getElementById('cat-modal-title').innerText = type === 'income' ? "Tambah Kategori Pemasukan" : "Tambah Kategori Pengeluaran";
    document.getElementById('label-cat-type-name').innerText = `Nama Kategori ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} *`;
    document.getElementById('edit-cat-id').value = "";
    document.getElementById('edit-cat-type').value = type;
    document.getElementById('category-form').reset();
    document.getElementById('btn-save-category').innerText = "Tambah Kategori";
    document.getElementById('category-modal').classList.remove('hidden-view');
}
export function openEditCategoryModal(type, catName) {
    const list = appState.categories[type] || [];
    const found = list.find(c => c.name === catName);
    if (!found) return;
    document.getElementById('cat-modal-title').innerText = `Edit Kategori ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;
    document.getElementById('label-cat-type-name').innerText = `Nama Kategori ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} *`;
    document.getElementById('edit-cat-id').value = found.id || found.name;
    document.getElementById('edit-cat-type').value = type;
    document.getElementById('input-cat-name').value = found.name;
    document.getElementById('input-cat-icon').value = found.icon || 'fa-hand-holding-heart';
    document.getElementById('btn-save-category').innerText = "Simpan Perubahan";
    document.getElementById('category-modal').classList.remove('hidden-view');
}
export function closeCategoryModal() {
    document.getElementById('category-modal').classList.add('hidden-view');
    document.getElementById('category-form').reset();
}
export function saveCategory(e) {
  e.preventDefault();
  const editId = document.getElementById('edit-cat-id').value;
  const type = document.getElementById('edit-cat-type').value;
  const name = document.getElementById('input-cat-name').value.trim();
  const icon = document.getElementById('input-cat-icon').value;
  if (!name) return;
  const list = appState.categories[type] || [];
  const duplicate = list.find(c => c.name.toLowerCase() === name.toLowerCase() && (c.id || c.name) !== editId);
  if (duplicate) { showToast("Nama kategori sudah ada!", true); return; }
  const colorTheme = type === 'income' ? { color: 'text-emerald-500', bg: 'bg-emerald-50' } : { color: 'text-rose-500', bg: 'bg-rose-50' };

  let savedCat = null;
  if (editId) {
    const idx = list.findIndex(c => (c.id || c.name) === editId);
    if (idx !== -1) {
      const oldName = list[idx].name;
      list[idx] = { ...list[idx], name, icon, ...colorTheme };
      savedCat = list[idx];
      if (oldName !== name) appState.transactions.forEach(t => { if (t.type === type && t.category === oldName) t.category = name; });
      showToast("Kategori berhasil diperbarui!");
    }
  } else {
    const newCat = { id: `cat_${Date.now()}`, name, icon, ...colorTheme };
    list.push(newCat);
    savedCat = newCat;
    showToast("Kategori baru berhasil ditambahkan!");
  }
  saveState();
  pushCategoryToCloud(savedCat, type); // ← SYNC KE CLOUD
  if (window.App.updateFormCategories) window.App.updateFormCategories();
  if (window.App.populateHistoryDropdowns) window.App.populateHistoryDropdowns();
  if (window.App.renderMasterData) window.App.renderMasterData();
  if (window.App.generateReports) window.App.generateReports();
  closeCategoryModal();
}

export function promptDeleteCategory(type, catName) {
  const list = appState.categories[type] || [];
  if (list.length <= 1) { showToast("Minimal harus ada 1 kategori!", true); return; }
  const count = appState.transactions.filter(t => t.type === type && t.category === catName).length;
  document.getElementById('del-master-title').innerText = `Hapus Kategori "${catName}"?`;
  document.getElementById('del-master-desc').innerText = count > 0
    ? `Perhatian: Ada ${count} transaksi menggunakan kategori ini.`
    : "Kategori ini belum digunakan.";
  pendingDeleteMasterCallback = () => {
    const catToDelete = list.find(c => c.name === catName);
    appState.categories[type] = list.filter(c => c.name !== catName);
    saveState();
    if (catToDelete && catToDelete.id) deleteCategoryFromCloud(catToDelete.id); // ← SYNC DELETE
    if (window.App.updateFormCategories) window.App.updateFormCategories();
    if (window.App.populateHistoryDropdowns) window.App.populateHistoryDropdowns();
    if (window.App.renderMasterData) window.App.renderMasterData();
    if (window.App.generateReports) window.App.generateReports();
    showToast("Kategori berhasil dihapus!");
  };
  document.getElementById('delete-master-modal').classList.remove('hidden-view');
}

export function closeDeleteMasterModal() {
    pendingDeleteMasterCallback = null;
    document.getElementById('delete-master-modal').classList.add('hidden-view');
}

export function initDeleteMasterConfirmButton() {
    document.getElementById('btn-confirm-del-master').onclick = () => {
        if (pendingDeleteMasterCallback) pendingDeleteMasterCallback();
        closeDeleteMasterModal();
    };
}