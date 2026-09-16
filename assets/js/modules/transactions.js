import { appState } from '../services/state.js';
import { saveState } from '../services/storage.js';
import { getSupabaseClient } from '../services/supabase.js';
import { formatRupiah, getTodayString } from '../ui/format.js';
import { showToast } from '../ui/toast.js';
import { updateDashboard } from './dashboard.js';
import { applyHistoryFilters } from './history.js';
import { generateReports } from './reports.js';

export function openAddModal(defaultType = 'income') {
    document.getElementById('tx-modal-title').innerText = "Catat Transaksi Kas";
    document.getElementById('edit-tx-id').value = "";
    document.getElementById('add-form').reset();
    document.getElementById('input-date').value = getTodayString();
    const radio = document.querySelector(`input[name="tx-type"][value="${defaultType}"]`);
    if (radio) radio.checked = true;
    document.getElementById('input-amount').value = "";
    populateAccountSelect();
    updateFormCategories();
    document.getElementById('add-modal').classList.remove('hidden-view');
}

export function handleAmountInput(el) {
    let val = el.value.replace(/\D/g, '');
    if (!val) { el.value = ''; return; }
    el.value = new Intl.NumberFormat('id-ID').format(Number(val));
}

export function openEditModal(txId) {
    const tx = appState.transactions.find(t => t.id === txId);
    if (!tx) return;
    document.getElementById('tx-modal-title').innerText = "Edit Transaksi Kas";
    document.getElementById('edit-tx-id').value = tx.id;
    document.getElementById('input-amount').value = new Intl.NumberFormat('id-ID').format(tx.amount);
    document.getElementById('input-date').value = tx.date;
    document.getElementById('input-ref').value = tx.ref || '';
    document.getElementById('input-desc').value = tx.desc;
    document.getElementById('input-person').value = tx.person || '';
    const radio = document.querySelector(`input[name="tx-type"][value="${tx.type}"]`);
    if (radio) radio.checked = true;
    populateAccountSelect();
    document.getElementById('input-account').value = tx.account || appState.accounts[0]?.name;
    updateFormCategories();
    document.getElementById('input-category').value = tx.category;
    document.getElementById('add-modal').classList.remove('hidden-view');
}

export function closeAddModal() {
    document.getElementById('add-modal').classList.add('hidden-view');
    document.getElementById('add-form').reset();
}

export function populateAccountSelect() {
    const select = document.getElementById('input-account');
    select.innerHTML = '';
    appState.accounts.forEach(acc => select.innerHTML += `<option value="${acc.name}">${acc.name}</option>`);
    const repSelect = document.getElementById('report-account-filter');
    if (repSelect) {
        const curVal = repSelect.value;
        repSelect.innerHTML = '<option value="">Semua Akun Kas/Bank</option>';
        appState.accounts.forEach(acc => repSelect.innerHTML += `<option value="${acc.name}">${acc.name}</option>`);
        repSelect.value = curVal;
    }
}

export function updateFormCategories() {
    const type = document.querySelector('input[name="tx-type"]:checked').value;
    const select = document.getElementById('input-category');
    const list = appState.categories[type] || [];
    select.innerHTML = list.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

export function handleFormSubmit(e) {
    e.preventDefault();
    
    // ✅ 1. VALIDASI FIELD WAJIB
    const amountEl = document.getElementById('input-amount');
    const dateEl = document.getElementById('input-date');
    const accountEl = document.getElementById('input-account');
    const categoryEl = document.getElementById('input-category');
    const descEl = document.getElementById('input-desc');

    let hasError = false;
    const requiredFields = [
        { el: amountEl, msg: "Nominal wajib diisi" },
        { el: dateEl, msg: "Tanggal wajib diisi" },
        { el: accountEl, msg: "Akun Kas/Bank wajib dipilih" },
        { el: categoryEl, msg: "Kategori wajib dipilih" },
        { el: descEl, msg: "Keterangan wajib diisi" }
    ];

    requiredFields.forEach(field => {
        if (!field.el.value || field.el.value.trim() === '') {
        field.el.classList.add('border-red-500', 'shake');
        if (!hasError) showToast(field.msg, true); // Tampilkan pesan error pertama
        hasError = true;
        setTimeout(() => field.el.classList.remove('border-red-500', 'shake'), 2000);
        } else {
        field.el.classList.remove('border-red-500', 'shake');
        }
    });

    if (hasError) return; // ✅ STOP PROSES JIKA ADA ERROR

    const editId = document.getElementById('edit-tx-id').value;
    const type = document.querySelector('input[name="tx-type"]:checked').value;
    const rawAmount = (document.getElementById('input-amount').value || '').replace(/\./g, '');
    const amount = parseFloat(rawAmount);
    const date = document.getElementById('input-date').value;
    const ref = document.getElementById('input-ref').value.trim();
    const account = document.getElementById('input-account').value;
    const category = document.getElementById('input-category').value;
    const desc = document.getElementById('input-desc').value.trim();
    const person = document.getElementById('input-person').value.trim();

    if (!amount || amount <= 0) { showToast("Nominal transaksi harus lebih dari 0", true); return; }

    const supabase = getSupabaseClient();
    if (editId) {
        const txIdNum = Number(editId);
        const idx = appState.transactions.findIndex(t => t.id === txIdNum);
        const updatedTx = { ...(idx !== -1 ? appState.transactions[idx] : {}), id: txIdNum, type, amount, date, ref, account, category, desc, person };
        if (idx !== -1) appState.transactions[idx] = updatedTx;
        showToast("Transaksi berhasil diperbarui!");
        if (supabase) {
            supabase.from('transactions').update({ type, amount, date, ref, account, category, desc, person }).eq('id', txIdNum)
                .then(({ error }) => { if (error) { console.error(error); showToast("Peringatan: Gagal memperbarui data di Cloud", true); } });
        }
    } else {
        const newTx = { id: Date.now(), type, amount, date, ref, account, category, desc, person };
        appState.transactions.push(newTx);
        showToast("Transaksi berhasil dicatat!");
        if (supabase) {
            supabase.from('transactions').insert([newTx])
                .then(({ error }) => { if (error) { console.error(error); showToast("Peringatan: Gagal menyimpan data ke Cloud", true); } });
        }
    }
    saveState();
    closeAddModal();
    updateDashboard();
    applyHistoryFilters();
    generateReports();
}

let pendingDeleteId = null;
export function promptDelete(id) {
    pendingDeleteId = id;
    document.getElementById('confirm-modal').classList.remove('hidden-view');
}
export function closeConfirmModal() {
    pendingDeleteId = null;
    document.getElementById('confirm-modal').classList.add('hidden-view');
}

export function initDeleteConfirmButton() {
    document.getElementById('btn-do-delete').onclick = () => {
        if (pendingDeleteId) {
            const idToDelete = pendingDeleteId;
            appState.transactions = appState.transactions.filter(t => t.id !== idToDelete);
            saveState();
            updateDashboard();
            applyHistoryFilters();
            generateReports();
            showToast("Transaksi telah dihapus!");
            const supabase = getSupabaseClient();
            if (supabase) {
                supabase.from('transactions').delete().eq('id', idToDelete)
                    .then(({ error }) => { if (error) { console.error(error); showToast("Peringatan: Gagal menghapus data di Cloud", true); } });
            }
        }
        closeConfirmModal();
    };
}