import { appState } from '../services/state.js';
import { formatRupiah } from '../ui/format.js';
import { createTransactionElement } from './dashboard.js';

let currentHistoryType = 'all';

export function setHistoryTypeFilter(type, btn) {
    currentHistoryType = type;
    const btns = btn.parentElement.querySelectorAll('button');
    btns.forEach(b => b.className = "flex-1 py-1.5 text-xs font-semibold rounded-lg text-gray-500");
    btn.className = "flex-1 py-1.5 text-xs font-semibold rounded-lg bg-white shadow-sm text-gray-800";
    applyHistoryFilters();
}

export function populateHistoryDropdowns() {
    const accSelect = document.getElementById('filter-account');
    const catSelect = document.getElementById('filter-category');
    accSelect.innerHTML = '<option value="">Semua Akun Kas/Bank</option>';
    appState.accounts.forEach(acc => accSelect.innerHTML += `<option value="${acc.name}">${acc.name}</option>`);
    catSelect.innerHTML = '<option value="">Semua Kategori</option>';
    const allCats = new Set();
    appState.categories.income.forEach(c => allCats.add(c.name));
    appState.categories.expense.forEach(c => allCats.add(c.name));
    allCats.forEach(c => catSelect.innerHTML += `<option value="${c}">${c}</option>`);
}

export function applyHistoryFilters() {
    const searchVal = (document.getElementById('filter-search').value || '').toLowerCase();
    const accountVal = document.getElementById('filter-account').value;
    const categoryVal = document.getElementById('filter-category').value;

    const filtered = appState.transactions.filter(t => {
        if (currentHistoryType !== 'all' && t.type !== currentHistoryType) return false;
        if (accountVal && t.account !== accountVal) return false;
        if (categoryVal && t.category !== categoryVal) return false;
        if (searchVal) {
            const matchDesc = (t.desc || '').toLowerCase().includes(searchVal);
            const matchPerson = (t.person || '').toLowerCase().includes(searchVal);
            const matchRef = (t.ref || '').toLowerCase().includes(searchVal);
            const matchCat = (t.category || '').toLowerCase().includes(searchVal);
            if (!matchDesc && !matchPerson && !matchRef && !matchCat) return false;
        }
        return true;
    });

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
    const container = document.getElementById('all-transactions');
    container.innerHTML = '';

    let sum = 0;
    filtered.forEach(t => {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') sum += amt; else sum -= amt;
    });

    document.getElementById('history-count-label').innerText = `${filtered.length} Transaksi ditemukan`;
    document.getElementById('history-total-label').innerText = `Net: ${formatRupiah(sum)}`;

    if (filtered.length === 0) {
        container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400">
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>
        <p class="text-xs text-gray-500 font-medium">Tidak ada transaksi yang cocok</p>
      </div>`;
        return;
    }
    filtered.forEach(t => container.appendChild(createTransactionElement(t)));
}