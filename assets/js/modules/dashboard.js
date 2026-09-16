import { appState } from '../services/state.js';
import { formatRupiah, formatDateIndo, getTodayString, getCategoryStyle } from '../ui/format.js';
import { openEditModal, promptDelete } from './transactions.js';

let miniExpenseChartInstance = null;

export function updateDashboard() {
    const p = appState.profile;
    document.getElementById('header-org-name').innerText = p.name;
    document.getElementById('print-kop-name').innerText = p.name.toUpperCase();
    document.getElementById('print-kop-subtitle').innerText = p.subtitle;
    document.getElementById('print-kop-sk').innerText = `SK Kemenkumham RI: ${p.skNumber}`;
    document.getElementById('print-kop-address').innerText = `${p.address}, ${p.city}`;
    document.getElementById('print-sign-chairman').innerText = p.chairman;
    document.getElementById('print-sign-treasurer').innerText = p.treasurer;
    document.getElementById('print-sign-place-date').innerText = `${p.city}, ${formatDateIndo(getTodayString())}`;

    let totalIncome = 0, totalExpense = 0;
    appState.transactions.forEach(t => {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') totalIncome += amt;
        else totalExpense += amt;
    });
    document.getElementById('display-balance').innerText = formatRupiah(totalIncome - totalExpense);
    document.getElementById('display-income').innerText = formatRupiah(totalIncome);
    document.getElementById('display-expense').innerText = formatRupiah(totalExpense);

    renderAccountCards();
    renderRecentTransactions();
    renderMiniExpenseChart();
}

export function renderAccountCards() {
    const container = document.getElementById('accounts-cards-container');
    container.innerHTML = '';
    appState.accounts.forEach(acc => {
        let accBalance = 0;
        appState.transactions.forEach(t => {
            if (t.account === acc.name) {
                const amt = Number(t.amount) || 0;
                if (t.type === 'income') accBalance += amt;
                else accBalance -= amt;
            }
        });
        const card = document.createElement('div');
        card.className = "bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between";
        card.innerHTML = `
      <div class="flex items-center gap-2 mb-2">
        <div class="w-7 h-7 rounded-lg bg-emerald-50 text-primary flex items-center justify-center text-xs">
          <i class="fa-solid ${acc.icon || 'fa-building-columns'}"></i>
        </div>
        <span class="text-[11px] font-semibold text-gray-700 line-clamp-1">${acc.name}</span>
      </div>
      <div>
        <p class="text-[10px] text-gray-400">Saldo</p>
        <p class="text-xs font-bold text-gray-900">${formatRupiah(accBalance)}</p>
      </div>`;
        container.appendChild(card);
    });
}

export function createTransactionElement(t) {
    const isIncome = t.type === 'income';
    const sign = isIncome ? '+' : '-';
    const textColor = isIncome ? 'text-primary' : 'text-red-600';
    const catStyle = getCategoryStyle(t.category, t.type);
    const div = document.createElement('div');
    div.className = "bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm hover:shadow transition flex items-center justify-between gap-3";
    div.innerHTML = `
    <div class="flex items-center gap-3 min-w-0">
      <div class="w-10 h-10 rounded-xl ${catStyle.bg} ${catStyle.color} flex items-center justify-center text-base shrink-0">
        <i class="fa-solid ${catStyle.icon}"></i>
      </div>
      <div class="min-w-0">
        <h5 class="text-xs font-bold text-gray-800 truncate mb-0.5">${t.desc}</h5>
        <div class="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400">
          <span class="font-medium text-gray-600">${t.category}</span>
          <span>•</span>
          <span class="text-emerald-700 font-medium">${t.account || 'Kas'}</span>
          <span>•</span>
          <span>${formatDateIndo(t.date)}</span>
          ${t.ref ? `<span class="bg-gray-100 px-1.5 py-0.5 rounded text-[9px] font-mono text-gray-600">${t.ref}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="text-right shrink-0 flex items-center gap-2">
      <div>
        <p class="text-xs font-bold ${textColor}">${sign} ${formatRupiah(t.amount).replace('Rp', '').trim()}</p>
      </div>
      <div class="flex items-center no-print">
        <button onclick="window.App.openEditModal(${t.id})" title="Edit" class="admin-only w-7 h-7 rounded-lg text-gray-400 hover:text-primary hover:bg-emerald-50 transition flex items-center justify-center">
          <i class="fa-solid fa-pen text-[10px]"></i>
        </button>
        <button onclick="window.App.promptDelete(${t.id})" title="Hapus" class="admin-only w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center">
          <i class="fa-solid fa-trash-can text-[10px]"></i>
        </button>
      </div>
    </div>`;
    return div;
}

export function renderRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    container.innerHTML = '';
    const sorted = [...appState.transactions].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
    const slice = sorted.slice(0, 4);
    if (slice.length === 0) {
        container.innerHTML = `<div class="text-center py-6 bg-white rounded-2xl border border-gray-100"><p class="text-xs text-gray-400">Belum ada transaksi</p></div>`;
        return;
    }
    slice.forEach(t => container.appendChild(createTransactionElement(t)));
}

export function renderMiniExpenseChart() {
    const ctx = document.getElementById('miniExpenseChart');
    if (!ctx) return;
    const expenseMap = {};
    appState.transactions.filter(t => t.type === 'expense').forEach(t => {
        expenseMap[t.category] = (expenseMap[t.category] || 0) + (Number(t.amount) || 0);
    });
    const labels = Object.keys(expenseMap);
    const data = Object.values(expenseMap);
    if (miniExpenseChartInstance) miniExpenseChartInstance.destroy();
    if (labels.length === 0) { labels.push('Belum ada beban'); data.push(1); }
    const colors = ['#059669', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#8b5cf6', '#64748b'];
    miniExpenseChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 2, borderColor: '#ffffff' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 9, family: 'Poppins' } } } },
            cutout: '65%'
        }
    });
}