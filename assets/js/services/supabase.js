import { appState } from './state.js';
import { saveState } from './storage.js';
import { SUPABASE_CONFIG_KEY, DEFAULT_SUPABASE_CONFIG } from '../config.js';
import { showToast } from '../ui/toast.js';

let supabaseClient = null;
let isSyncing = false;
let supabaseRealtimeChannels = [];

export function getSupabaseClient() { return supabaseClient; }

export function updateCloudUI(status, label) {
  const dot = document.getElementById('cloud-dot');
  const text = document.getElementById('cloud-status-text');
  const badge = document.getElementById('supabase-status-badge');
  const badgeDot = document.getElementById('sb-badge-dot');
  const badgeText = document.getElementById('sb-badge-text');
  const actionsPanel = document.getElementById('supabase-actions-panel');
  const disconnectBtn = document.getElementById('btn-disconnect-sb');
  const syncIcon = document.getElementById('cloud-sync-icon');

  if (status === 'connected') {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400";
    if (text) text.innerText = label || "Cloud Aktif";
    if (badge) badge.className = "px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5";
    if (badgeDot) badgeDot.className = "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse";
    if (badgeText) badgeText.innerText = "Terhubung";
    if (actionsPanel) actionsPanel.classList.remove('hidden');
    if (disconnectBtn) disconnectBtn.classList.remove('hidden');
  } else if (status === 'syncing') {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-blue-400 animate-ping";
    if (text) text.innerText = "Sinkronisasi...";
    if (syncIcon) syncIcon.classList.add('fa-spin');
  } else if (status === 'error') {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-rose-400";
    if (text) text.innerText = label || "Gagal Cloud";
    if (badge) badge.className = "px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1.5";
    if (badgeDot) badgeDot.className = "w-1.5 h-1.5 rounded-full bg-rose-500";
    if (badgeText) badgeText.innerText = "Gangguan";
    if (actionsPanel) actionsPanel.classList.remove('hidden');
    if (disconnectBtn) disconnectBtn.classList.remove('hidden');
  } else {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-gray-400";
    if (text) text.innerText = "Lokal";
    if (badge) badge.className = "px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 flex items-center gap-1.5";
    if (badgeDot) badgeDot.className = "w-1.5 h-1.5 rounded-full bg-gray-400";
    if (badgeText) badgeText.innerText = "Belum Terhubung";
    if (actionsPanel) actionsPanel.classList.add('hidden');
    if (disconnectBtn) disconnectBtn.classList.add('hidden');
  }
  if (status !== 'syncing' && syncIcon) syncIcon.classList.remove('fa-spin');
}

export function initSupabase(autoSync = true) {
  try {
    let conf = { ...DEFAULT_SUPABASE_CONFIG };
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      try {
        const stored = JSON.parse(raw);
        if (stored && stored.url && stored.key) conf = stored;
      } catch (e) { console.warn('Konfigurasi Supabase lokal tidak valid.'); }
    }
    const urlInput = document.getElementById('sb-url');
    const keyInput = document.getElementById('sb-key');
    if (urlInput) urlInput.value = conf.url;
    if (keyInput) keyInput.value = conf.key;

    if (window.supabase && window.supabase.createClient) {
      supabaseClient = window.supabase.createClient(conf.url, conf.key);
      localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(conf));
      updateCloudUI('connected', 'Tersambung');
      setupSupabaseRealtime();
      if (autoSync) {
        // Seed admin default jika belum ada (hanya sekali)
        import('./auth.js').then(auth => {
          auth.seedDefaultAdminIfNeeded();
        });
        syncFromSupabase(false);
      }
      return true;
    } else {
      console.warn("Library Supabase SDK belum siap");
      updateCloudUI('unconfigured');
      return false;
    }
  } catch (err) {
    console.error("Gagal inisialisasi Supabase:", err);
    updateCloudUI('error', 'Error Config');
    return false;
  }
}

function setupSupabaseRealtime() {
  if (!supabaseClient) return;
  // Cleanup channel lama
  supabaseRealtimeChannels.forEach(ch => supabaseClient.removeChannel(ch));
  supabaseRealtimeChannels = [];

  const tables = ['transactions', 'profile', 'accounts', 'categories'];
  tables.forEach(table => {
    try {
      const channel = supabaseClient
        .channel(`yayasan-${table}-realtime`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          if (!isSyncing) syncFromSupabase(false);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED' && table === 'transactions') {
            updateCloudUI('connected', 'Realtime Aktif');
          }
        });
      supabaseRealtimeChannels.push(channel);
    } catch (err) {
      console.warn(`Realtime untuk ${table} tidak aktif:`, err);
    }
  });
}

export async function handleSaveSupabaseConfig(e) {
  e.preventDefault();
  const url = document.getElementById('sb-url').value.trim();
  const key = document.getElementById('sb-key').value.trim();
  if (!url || !key) { showToast("URL dan Anon Key Supabase harus diisi", true); return; }
  const saveBtn = document.getElementById('btn-save-sb');
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs"></i> Menghubungkan...`;
  try {
    if (!window.supabase || !window.supabase.createClient) throw new Error("Library Supabase belum dimuat.");
    const testClient = window.supabase.createClient(url, key);
    // Test semua tabel
    const tables = ['transactions', 'profile', 'accounts', 'categories'];
    for (const tbl of tables) {
      const { error } = await testClient.from(tbl).select('id').limit(1);
      if (error) {
        if (error.code === '42P01' || (error.message && error.message.includes('relation')))
          throw new Error(`Tabel '${tbl}' belum dibuat. Jalankan SQL schema terbaru di Supabase.`);
        throw error;
      }
    }
    supabaseClient = testClient;
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, key }));
    setupSupabaseRealtime();
    updateCloudUI('connected', 'Tersambung');
    showToast("Berhasil terhubung ke Supabase Cloud!");
    await syncFromSupabase(false);
  } catch (err) {
    console.error("Gagal koneksi Supabase:", err);
    showToast("Koneksi gagal: " + (err.message || err), true);
    updateCloudUI('error', 'Gagal Terhubung');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
}

export async function testCurrentSupabase() {
  const url = document.getElementById('sb-url').value.trim();
  const key = document.getElementById('sb-key').value.trim();
  if (!url || !key) { showToast("Isi URL dan Anon Key terlebih dahulu", true); return; }
  const testBtn = document.getElementById('btn-test-sb');
  const orig = testBtn.innerHTML;
  testBtn.disabled = true;
  testBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs"></i>`;
  try {
    if (!window.supabase || !window.supabase.createClient) throw new Error("Library Supabase belum siap.");
    const client = window.supabase.createClient(url, key);
    const tables = ['transactions', 'profile', 'accounts', 'categories'];
    for (const tbl of tables) {
      const { error } = await client.from(tbl).select('id').limit(1);
      if (error) {
        if (error.code === '42P01' || (error.message && error.message.includes('relation')))
          throw new Error(`Tabel '${tbl}' belum dibuat.`);
        throw error;
      }
    }
    showToast("Koneksi Supabase valid! Semua tabel siap.");
  } catch (err) {
    showToast("Tes gagal: " + (err.message || err), true);
  } finally {
    testBtn.disabled = false;
    testBtn.innerHTML = orig;
  }
}

export function disconnectSupabase() {
  if (confirm("Putuskan koneksi Supabase? Aplikasi akan kembali menggunakan data lokal.")) {
    localStorage.removeItem(SUPABASE_CONFIG_KEY);
    supabaseRealtimeChannels.forEach(ch => supabaseClient?.removeChannel(ch));
    supabaseRealtimeChannels = [];
    supabaseClient = null;
    document.getElementById('sb-url').value = '';
    document.getElementById('sb-key').value = '';
    updateCloudUI('unconfigured');
    showToast("Koneksi Supabase telah diputuskan");
  }
}

// ========================================================
// SINKRONISASI PENUH: MASTER DATA + TRANSAKSI
// ========================================================
export async function syncFromSupabase(showNotification = true) {
  if (!supabaseClient) {
    if (showNotification) showToast("Supabase belum terhubung.", true);
    return;
  }
  if (isSyncing) return;
  isSyncing = true;
  updateCloudUI('syncing');

  // ✅ Flag untuk tracking apakah ada error
  let hasError = false;
  let errorMessage = '';

  try {
    // ============================================
    // 1. Fetch PROFILE (tahan error jika tabel belum ada)
    // ============================================
    try {
      const { data: profileData, error: profileErr } = await supabaseClient
        .from('profile').select('*').eq('id', 'main').maybeSingle();
      if (profileErr) {
        console.warn('Tabel profile belum ada atau error:', profileErr.message);
      } else if (profileData) {
        appState.profile = {
          name: profileData.name || '',
          subtitle: profileData.subtitle || '',
          skNumber: profileData.sk_number || '',
          address: profileData.address || '',
          city: profileData.city || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
          chairman: profileData.chairman || '',
          treasurer: profileData.treasurer || '',
          adminPin: profileData.admin_pin || '123456'
        };
      } else {
        // Tabel ada tapi kosong → reset ke default
        appState.profile = { ...appState.profile, adminPin: appState.profile.adminPin || '123456' };
      }
    } catch (err) {
      console.warn('Gagal fetch profile:', err);
    }

    // ============================================
    // 2. Fetch ACCOUNTS — SELALU OVERRIDE (meskipun kosong)
    // ============================================
    try {
      const { data: accData, error: accErr } = await supabaseClient
        .from('accounts').select('*').order('created_at', { ascending: true });
      if (accErr) {
        console.warn('Tabel accounts belum ada atau error:', accErr.message);
        // ✅ JANGAN override — biarkan data localStorage tetap ada
      } else {
        // ✅ KUNCI: selalu override, meskipun array kosong
        appState.accounts = (accData || []).map(a => ({
          id: a.id, name: a.name, type: a.type,
          icon: a.icon || 'fa-building-columns',
          color: a.color || 'blue'
        }));
      }
    } catch (err) {
      console.warn('Gagal fetch accounts:', err);
    }

    // ============================================
    // 3. Fetch CATEGORIES — SELALU OVERRIDE (meskipun kosong)
    // ============================================
    try {
      const { data: catData, error: catErr } = await supabaseClient
        .from('categories').select('*').order('created_at', { ascending: true });
      if (catErr) {
        console.warn('Tabel categories belum ada atau error:', catErr.message);
        // ✅ JANGAN override — biarkan data localStorage tetap ada
      } else {
        // ✅ KUNCI: selalu override, meskipun array kosong
        appState.categories = { income: [], expense: [] };
        (catData || []).forEach(c => {
          const cat = {
            id: c.id, name: c.name, icon: c.icon || 'fa-tag',
            color: c.color || 'text-emerald-500',
            bg: c.bg || 'bg-emerald-50'
          };
          if (c.type === 'income') appState.categories.income.push(cat);
          else if (c.type === 'expense') appState.categories.expense.push(cat);
        });
      }
    } catch (err) {
      console.warn('Gagal fetch categories:', err);
    }

    // ============================================
    // 4. Fetch TRANSACTIONS
    // ============================================
    try {
      const { data: txData, error: txErr } = await supabaseClient
        .from('transactions').select('*').order('date', { ascending: false });
      if (txErr) {
        console.warn('Tabel transactions belum ada atau error:', txErr.message);
        hasError = true;
        errorMessage = txErr.message;
      } else if (txData) {
        appState.transactions = txData.map(item => ({
          id: Number(item.id), date: item.date, type: item.type,
          amount: Number(item.amount), account: item.account, category: item.category,
          desc: item.desc, ref: item.ref || '', person: item.person || ''
        }));
      }
    } catch (err) {
      console.warn('Gagal fetch transactions:', err);
      hasError = true;
      errorMessage = err.message;
    }

    // ✅ Simpan state ke localStorage
    saveState();

    // ✅ Trigger UI refresh — PASTIKAN DIPANGGIL
    if (window.App) {
      if (window.App.updateDashboard) window.App.updateDashboard();
      if (window.App.applyHistoryFilters) window.App.applyHistoryFilters();
      if (window.App.generateReports) window.App.generateReports();
      if (window.App.populateProfileForm) window.App.populateProfileForm();
      if (window.App.populateAccountSelect) window.App.populateAccountSelect();
      if (window.App.populateHistoryDropdowns) window.App.populateHistoryDropdowns();
      if (window.App.renderMasterData) window.App.renderMasterData();
    }

    if (hasError) {
      updateCloudUI('error', 'Sebagian Gagal');
      if (showNotification) showToast("Sync sebagian berhasil. Cek console untuk detail.", true);
    } else {
      updateCloudUI('connected', 'Tersinkron');
      if (showNotification) {
        const total = appState.transactions.length + appState.accounts.length
          + appState.categories.income.length + appState.categories.expense.length;
        showToast(`Data cloud tersinkron (${total} item)`);
      }
    }
  } catch (err) {
    console.error("Gagal sinkron:", err);
    updateCloudUI('error', 'Gagal Sync');
    if (showNotification) showToast("Gagal mengambil data cloud: " + (err.message || err), true);
  } finally {
    isSyncing = false;
  }
}

// ========================================================
// UPLOAD SEMUA DATA LOKAL KE CLOUD (MIGRASI AWAL)
// ========================================================
export async function migrateLocalDataToSupabase() {
  if (!supabaseClient) { showToast("Hubungkan ke Supabase terlebih dahulu", true); return; }
  if (!confirm("Unggah SEMUA data lokal (profil, akun, kategori, transaksi) ke Supabase Cloud?\n\nData cloud lama akan DITIMPA dengan data lokal Anda.")) return;
  updateCloudUI('syncing');
  try {
    // 1. Upload PROFILE
    const p = appState.profile || {};
    const { error: pErr } = await supabaseClient.from('profile').upsert({
      id: 'main',
      name: p.name || '', subtitle: p.subtitle || '', sk_number: p.skNumber || '',
      address: p.address || '', city: p.city || '', phone: p.phone || '',
      email: p.email || '', chairman: p.chairman || '', treasurer: p.treasurer || '',
      admin_pin: p.adminPin || '123456'
    }, { onConflict: 'id' });
    if (pErr) throw pErr;

    // 2. Upload ACCOUNTS — hapus dulu yang lama, insert baru
    await supabaseClient.from('accounts').delete().neq('id', '__dummy__');
    if (appState.accounts && appState.accounts.length > 0) {
      const accPayload = appState.accounts.map(a => ({
        id: a.id, name: a.name, type: a.type,
        icon: a.icon || 'fa-building-columns', color: a.color || 'blue'
      }));
      const { error: aErr } = await supabaseClient.from('accounts').insert(accPayload);
      if (aErr) throw aErr;
    }

    // 3. Upload CATEGORIES — hapus dulu yang lama, insert baru
    await supabaseClient.from('categories').delete().neq('id', '__dummy__');
    const allCats = [
      ...(appState.categories.income || []).map(c => ({ ...c, type: 'income' })),
      ...(appState.categories.expense || []).map(c => ({ ...c, type: 'expense' }))
    ];
    if (allCats.length > 0) {
      const catPayload = allCats.map(c => ({
        id: c.id || `cat_${c.name.replace(/\s+/g, '_')}`,
        type: c.type, name: c.name,
        icon: c.icon || 'fa-tag',
        color: c.color || 'text-emerald-500',
        bg: c.bg || 'bg-emerald-50'
      }));
      const { error: cErr } = await supabaseClient.from('categories').insert(catPayload);
      if (cErr) throw cErr;
    }

    // 4. Upload TRANSACTIONS
    if (appState.transactions && appState.transactions.length > 0) {
      const txPayload = appState.transactions.map(t => ({
        id: Number(t.id), date: t.date, type: t.type, amount: Number(t.amount),
        account: t.account, category: t.category, desc: t.desc,
        ref: t.ref || '', person: t.person || ''
      }));
      const { error: tErr } = await supabaseClient.from('transactions').upsert(txPayload, { onConflict: 'id' });
      if (tErr) throw tErr;
    }

    updateCloudUI('connected', 'Tersinkron');
    showToast("Semua data lokal berhasil diunggah ke cloud!");
  } catch (err) {
    console.error("Gagal mengunggah:", err);
    updateCloudUI('error', 'Gagal Upload');
    showToast("Gagal mengunggah data: " + (err.message || err), true);
  }
}

// ========================================================
// SEED DATA CONTOH KE CLOUD (untuk user baru)
// ========================================================
export async function seedExampleDataToCloud() {
  if (!supabaseClient) { showToast("Hubungkan ke Supabase terlebih dahulu", true); return; }
  if (!confirm("Unggah DATA CONTOH bawaan (profil, 3 akun, 12 kategori, 6 transaksi contoh) ke Supabase Cloud?\n\n⚠️ Data cloud saat ini akan DITIMPA.")) return;
  updateCloudUI('syncing');
  try {
    const { DEFAULT_STATE } = await import('../config.js');
    const p = DEFAULT_STATE.profile;
    // 1. Profile
    await supabaseClient.from('profile').upsert({
      id: 'main',
      name: p.name, subtitle: p.subtitle, sk_number: p.skNumber,
      address: p.address, city: p.city, phone: p.phone,
      email: p.email, chairman: p.chairman, treasurer: p.treasurer,
      admin_pin: p.adminPin || '123456'
    }, { onConflict: 'id' });

    // 2. Accounts
    await supabaseClient.from('accounts').delete().neq('id', '__dummy__');
    await supabaseClient.from('accounts').insert(DEFAULT_STATE.accounts.map(a => ({
      id: a.id, name: a.name, type: a.type,
      icon: a.icon, color: a.color
    })));

    // 3. Categories
    await supabaseClient.from('categories').delete().neq('id', '__dummy__');
    const allCats = [
      ...DEFAULT_STATE.categories.income.map(c => ({ ...c, type: 'income' })),
      ...DEFAULT_STATE.categories.expense.map(c => ({ ...c, type: 'expense' }))
    ];
    await supabaseClient.from('categories').insert(allCats.map(c => ({
      id: c.id || `cat_${c.name.replace(/\s+/g, '_')}`,
      type: c.type, name: c.name, icon: c.icon,
      color: c.color, bg: c.bg
    })));

    // 4. Transactions
    await supabaseClient.from('transactions').delete().neq('id', 0);
    await supabaseClient.from('transactions').insert(DEFAULT_STATE.transactions.map(t => ({
      id: Number(t.id), date: t.date, type: t.type, amount: Number(t.amount),
      account: t.account, category: t.category, desc: t.desc,
      ref: t.ref || '', person: t.person || ''
    })));

    updateCloudUI('connected', 'Tersinkron');
    showToast("Data contoh berhasil diunggah! Silakan klik Sync untuk memuat.");
    await syncFromSupabase(false);
  } catch (err) {
    console.error("Gagal seed data contoh:", err);
    updateCloudUI('error', 'Gagal Seed');
    showToast("Gagal mengunggah data contoh: " + (err.message || err), true);
  }
}

// ========================================================
// PUSH INDIVIDUAL (dipanggil saat CRUD master data)
// ========================================================
export async function pushProfileToCloud() {
  if (!supabaseClient) return;
  try {
    const p = appState.profile || {};
    const { error } = await supabaseClient.from('profile').upsert({
      id: 'main',
      name: p.name || '', subtitle: p.subtitle || '', sk_number: p.skNumber || '',
      address: p.address || '', city: p.city || '', phone: p.phone || '',
      email: p.email || '', chairman: p.chairman || '', treasurer: p.treasurer || '',
      admin_pin: p.adminPin || '123456'
    }, { onConflict: 'id' });
    if (error) { console.error("Gagal push profil:", error); showToast("Peringatan: Gagal sync profil ke cloud", true); }
  } catch (err) { console.error(err); }
}

export async function pushAccountToCloud(acc) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from('accounts').upsert({
      id: acc.id, name: acc.name, type: acc.type,
      icon: acc.icon || 'fa-building-columns', color: acc.color || 'blue'
    }, { onConflict: 'id' });
    if (error) { console.error("Gagal push akun:", error); showToast("Peringatan: Gagal sync akun ke cloud", true); }
  } catch (err) { console.error(err); }
}

export async function deleteAccountFromCloud(id) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from('accounts').delete().eq('id', id);
    if (error) { console.error("Gagal hapus akun cloud:", error); }
  } catch (err) { console.error(err); }
}

export async function pushCategoryToCloud(cat, type) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from('categories').upsert({
      id: cat.id, type, name: cat.name,
      icon: cat.icon || 'fa-tag',
      color: cat.color || 'text-emerald-500',
      bg: cat.bg || 'bg-emerald-50'
    }, { onConflict: 'id' });
    if (error) { console.error("Gagal push kategori:", error); showToast("Peringatan: Gagal sync kategori ke cloud", true); }
  } catch (err) { console.error(err); }
}

export async function deleteCategoryFromCloud(id) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from('categories').delete().eq('id', id);
    if (error) { console.error("Gagal hapus kategori cloud:", error); }
  } catch (err) { console.error(err); }
}

export function copySupabaseSql() {
  const sql = document.getElementById('supabase-sql-code').innerText;
  navigator.clipboard.writeText(sql)
    .then(() => showToast("Query SQL berhasil disalin!"))
    .catch(() => showToast("Gagal menyalin SQL", true));
}