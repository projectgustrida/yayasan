import { appState } from '../services/state.js';
import { formatRupiah, formatDateIndo, getTodayString } from '../ui/format.js';
import { showToast } from '../ui/toast.js';

let activeReportSubTab = 'bku';

export function switchReportSubTab(tab) {
    activeReportSubTab = tab;
    ['bku', 'activity', 'position'].forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        const content = document.getElementById(`subreport-${t}`);
        if (t === tab) {
            btn.className = "py-2.5 px-4 text-xs font-bold border-b-2 border-primary text-primary transition";
            content.classList.remove('hidden-view');
        } else {
            btn.className = "py-2.5 px-4 text-xs font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-800 transition";
            content.classList.add('hidden-view');
        }
    });
    generateReports();
}

export function handlePeriodPresetChange() {
    const preset = document.getElementById('report-period-preset').value;
    const customRange = document.getElementById('custom-date-range');
    if (preset === 'custom') {
        customRange.classList.remove('hidden');
        if (!document.getElementById('report-start-date').value) {
            document.getElementById('report-start-date').value = "2026-01-01";
            document.getElementById('report-end-date').value = getTodayString();
        }
    } else {
        customRange.classList.add('hidden');
    }
    generateReports();
}

export function getFilteredReportTransactions() {
  const preset = document.getElementById('report-period-preset').value;
  const accountFilter = document.getElementById('report-account-filter').value;
  
  let startDateStr = null;
  let endDateStr = null;
  
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0 = Januari, 11 = Desember

  // ✅ Helper: Buat string tanggal lokal YYYY-MM-DD tanpa efek pergeseran timezone
  const toLocalDateString = (y, m, d) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  if (preset === 'this_month') {
    // Tanggal 1 bulan ini s/d tanggal terakhir bulan ini
    const lastDay = new Date(curYear, curMonth + 1, 0).getDate();
    startDateStr = toLocalDateString(curYear, curMonth, 1);
    endDateStr = toLocalDateString(curYear, curMonth, lastDay);
    
  } else if (preset === 'last_month') {
    // Tanggal 1 bulan lalu s/d tanggal terakhir bulan lalu
    const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
    const prevYear = curMonth === 0 ? curYear - 1 : curYear;
    const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
    startDateStr = toLocalDateString(prevYear, prevMonth, 1);
    endDateStr = toLocalDateString(prevYear, prevMonth, lastDay);
    
  } else if (preset === 'this_year') {
    // ✅ 1 Januari s/d 31 Desember tahun ini
    startDateStr = toLocalDateString(curYear, 0, 1);
    endDateStr = toLocalDateString(curYear, 11, 31);
    
  } else if (preset === 'custom') {
    startDateStr = document.getElementById('report-start-date').value;
    endDateStr = document.getElementById('report-end-date').value;
  }

  const transactions = appState.transactions.filter(t => {
    if (accountFilter && t.account !== accountFilter) return false;
    
    // ✅ Filter menggunakan perbandingan string (Aman dari masalah timezone!)
    // Format "YYYY-MM-DD" bisa dibandingkan langsung dengan < atau >
    if (startDateStr && t.date < startDateStr) return false;
    if (endDateStr && t.date > endDateStr) return false;
    
    return true;
  });

  // Sortir kronologis (ascending) untuk BKU
  transactions.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.id - b.id;
  });

  return { transactions, startDateStr, endDateStr };
}

export function generateReports() {
  const { transactions, startDateStr, endDateStr } = getFilteredReportTransactions();
  
  // ✅ Format teks periode langsung dari string lokal
  let periodText = "Semua Waktu";
  if (startDateStr && endDateStr) {
    periodText = `${formatDateIndo(startDateStr)} s/d ${formatDateIndo(endDateStr)}`;
  }
  
  document.getElementById('bku-period-text').innerText = `Periode: ${periodText}`;
  document.getElementById('activity-period-text').innerText = `Periode: ${periodText}`;

  // ============================================
  // 1. GENERATE BUKU KAS UMUM (BKU)
  // ============================================
  let runningBalance = 0;
  let totalIn = 0;
  let totalOut = 0;
  const bkuTbody = document.getElementById('bku-table-body');
  bkuTbody.innerHTML = '';
  
  if (transactions.length === 0) {
    bkuTbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-gray-400">Tidak ada data transaksi pada periode ini</td></tr>`;
  } else {
    transactions.forEach((t, idx) => {
      const amt = Number(t.amount) || 0;
      let inAmt = 0;
      let outAmt = 0;
      if (t.type === 'income') {
        inAmt = amt;
        totalIn += amt;
        runningBalance += amt;
      } else {
        outAmt = amt;
        totalOut += amt;
        runningBalance -= amt;
      }
      const tr = document.createElement('tr');
      tr.className = "hover:bg-gray-50 transition";
      tr.innerHTML = `
        <td class="py-2.5 px-3 text-center text-gray-500 font-mono text-[11px]">${idx + 1}</td>
        <td class="py-2.5 px-3 text-[11px] whitespace-nowrap">${formatDateIndo(t.date)}</td>
        <td class="py-2.5 px-3 font-mono text-[10px] text-gray-600">${t.ref || '-'}</td>
        <td class="py-2.5 px-3 font-medium">
          ${t.desc}
          <div class="text-[10px] text-gray-400">${t.category} • <span class="text-emerald-700">${t.account || ''}</span></div>
        </td>
        <td class="py-2.5 px-3 text-right font-semibold text-primary">${inAmt > 0 ? formatRupiah(inAmt) : '-'}</td>
        <td class="py-2.5 px-3 text-right font-semibold text-red-600">${outAmt > 0 ? formatRupiah(outAmt) : '-'}</td>
        <td class="py-2.5 px-3 text-right font-bold text-gray-800">${formatRupiah(runningBalance)}</td>
      `;
      bkuTbody.appendChild(tr);
    });
  }
  document.getElementById('bku-sum-income').innerText = formatRupiah(totalIn);
  document.getElementById('bku-sum-expense').innerText = formatRupiah(totalOut);
  document.getElementById('bku-sum-balance').innerText = formatRupiah(runningBalance);

  // ============================================
  // 2. GENERATE LAPORAN AKTIVITAS
  // ============================================
  const incomeCats = {};
  const expenseCats = {};
  transactions.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      incomeCats[t.category] = (incomeCats[t.category] || 0) + amt;
    } else {
      expenseCats[t.category] = (expenseCats[t.category] || 0) + amt;
    }
  });

  const incContainer = document.getElementById('act-income-breakdown');
  incContainer.innerHTML = '';
  let totalActIncome = 0;
  Object.entries(incomeCats).forEach(([cat, val]) => {
    totalActIncome += val;
    incContainer.innerHTML += `
      <div class="flex justify-between items-center py-1 border-b border-gray-50">
        <span class="text-gray-600">${cat}</span>
        <span class="font-semibold text-gray-800">${formatRupiah(val)}</span>
      </div>
    `;
  });
  if (Object.keys(incomeCats).length === 0) {
    incContainer.innerHTML = `<p class="text-gray-400 py-1 italic">Tidak ada penerimaan pada periode ini</p>`;
  }

  const expContainer = document.getElementById('act-expense-breakdown');
  expContainer.innerHTML = '';
  let totalActExpense = 0;
  Object.entries(expenseCats).forEach(([cat, val]) => {
    totalActExpense += val;
    expContainer.innerHTML += `
      <div class="flex justify-between items-center py-1 border-b border-gray-50">
        <span class="text-gray-600">${cat}</span>
        <span class="font-semibold text-gray-800">${formatRupiah(val)}</span>
      </div>
    `;
  });
  if (Object.keys(expenseCats).length === 0) {
    expContainer.innerHTML = `<p class="text-gray-400 py-1 italic">Tidak ada pengeluaran pada periode ini</p>`;
  }

  document.getElementById('act-total-income-top').innerText = formatRupiah(totalActIncome);
  document.getElementById('act-total-expense-top').innerText = formatRupiah(totalActExpense);
  const surplus = totalActIncome - totalActExpense;
  const surplusEl = document.getElementById('act-net-surplus');
  surplusEl.innerText = formatRupiah(surplus);
  surplusEl.className = surplus >= 0 
    ? "text-base font-extrabold text-primary" 
    : "text-base font-extrabold text-red-600";

  // ============================================
  // 3. GENERATE POSISI KAS & BANK
  // ============================================
  const posTbody = document.getElementById('position-table-body');
  posTbody.innerHTML = '';
  let grandTotalKas = 0;
  appState.accounts.forEach((acc, i) => {
    let accTotal = 0;
    appState.transactions.forEach(t => {
      if (t.account === acc.name) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') accTotal += amt;
        else accTotal -= amt;
      }
    });
    grandTotalKas += accTotal;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="py-2 px-3 text-center text-gray-500 font-mono text-[11px]">${i + 1}</td>
      <td class="py-2 px-3 font-semibold text-gray-800 flex items-center gap-2">
        <i class="fa-solid ${acc.icon || 'fa-wallet'} text-primary text-xs"></i>
        ${acc.name}
      </td>
      <td class="py-2 px-3 text-right font-bold text-gray-900">${formatRupiah(accTotal)}</td>
    `;
    posTbody.appendChild(tr);
  });
  document.getElementById('position-total-balance').innerText = formatRupiah(grandTotalKas);
}

export function printReport() { window.print(); }

export function exportToExcel() {
    const { transactions } = getFilteredReportTransactions();
    if (transactions.length === 0) { showToast("Tidak ada data untuk diekspor", true); return; }
    const excelRows = [
        ["BUKU KAS UMUM (BKU) - " + appState.profile.name.toUpperCase()],
        ["SK Kemenkumham: " + appState.profile.skNumber],
        ["Tanggal Ekspor: " + formatDateIndo(getTodayString())],
        [],
        ["No", "Tanggal", "No. Bukti", "Uraian / Keterangan", "Kategori", "Akun Kas/Bank", "Pemasukan (Rp)", "Pengeluaran (Rp)", "Saldo (Rp)"]
    ];
    let balance = 0;
    transactions.forEach((t, index) => {
        const amt = Number(t.amount) || 0;
        let inAmt = 0, outAmt = 0;
        if (t.type === 'income') { inAmt = amt; balance += amt; }
        else { outAmt = amt; balance -= amt; }
        excelRows.push([index + 1, t.date, t.ref || "", t.desc, t.category, t.account || "", inAmt, outAmt, balance]);
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelRows);
    ws['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 35 }, { wch: 25 }, { wch: 25 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, "Buku Kas Umum");
    XLSX.writeFile(wb, `Laporan_Keuangan_Yayasan_${getTodayString()}.xlsx`);
    showToast("Laporan Excel berhasil diunduh!");
}