import { appState } from './state.js';
import { getSupabaseClient } from './supabase.js';
import { showToast } from '../ui/toast.js';

const SESSION_KEY = 'yayasan_session_v1';

// Current logged-in user (null jika belum login)
export let currentUser = null;

// ========================================================
// PASSWORD HASHING (SHA-256 via Web Crypto API)
// ========================================================
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ========================================================
// LOGIN
// ========================================================
export async function loginAdmin(username, password) {
  const client = getSupabaseClient();
  if (!client) {
    showToast("Supabase belum terhubung. Tidak bisa login.", true);
    return { success: false, error: "Supabase belum terhubung" };
  }

  try {
    const passwordHash = await hashPassword(password);
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('username', username.trim().toLowerCase())
      .eq('password_hash', passwordHash)
      .eq('role', 'admin')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return { success: false, error: "Username atau password salah" };
    }

    // Update last_login
    await client.from('users').update({ last_login: new Date().toISOString() }).eq('id', data.id);

    currentUser = {
      id: data.id,
      username: data.username,
      name: data.name,
      role: data.role
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    return { success: true, user: currentUser };
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, error: err.message || "Gagal login" };
  }
}

export async function loginJamaah(userId) {
  const client = getSupabaseClient();
  if (!client) {
    showToast("Supabase belum terhubung.", true);
    return { success: false, error: "Supabase belum terhubung" };
  }

  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('role', 'jamaah')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return { success: false, error: "Akun jamaah tidak ditemukan" };
    }

    await client.from('users').update({ last_login: new Date().toISOString() }).eq('id', data.id);

    currentUser = {
      id: data.id,
      username: data.username,
      name: data.name,
      role: data.role
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    return { success: true, user: currentUser };
  } catch (err) {
    console.error("Login jamaah error:", err);
    return { success: false, error: err.message };
  }
}

// ========================================================
// SESSION RESTORE (Auto-login)
// ========================================================
export async function restoreSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    const client = getSupabaseClient();
    if (!client) return null;

    // Verifikasi user masih aktif di database
    const { data, error } = await client
      .from('users')
      .select('id, username, name, role, is_active')
      .eq('id', session.id)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    currentUser = data;
    return currentUser;
  } catch (err) {
    console.warn("Session restore gagal:", err);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

// ========================================================
// LOGOUT
// ========================================================
export function logout() {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
}

// ========================================================
// ROLE CHECK HELPERS
// ========================================================
export function isAdmin() {
  return currentUser && currentUser.role === 'admin';
}

export function isJamaah() {
  return currentUser && currentUser.role === 'jamaah';
}

export function isLoggedIn() {
  return currentUser !== null;
}

export function getCurrentUserName() {
  return currentUser?.name || 'Tamu';
}

// ========================================================
// USER MANAGEMENT (Admin only) - untuk kelola user jamaah
// ========================================================
export async function fetchAllUsers() {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Gagal fetch users:", err);
    return [];
  }
}

export async function createUser(userData) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase belum terhubung");

  const passwordHash = await hashPassword(userData.password);
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    username: userData.username.trim().toLowerCase(),
    password_hash: passwordHash,
    name: userData.name.trim(),
    role: userData.role,
    is_active: true
  };

  const { data, error } = await client.from('users').insert(newUser).select().single();
  if (error) {
    if (error.code === '23505') throw new Error("Username sudah digunakan");
    throw error;
  }
  return data;
}

export async function updateUser(userId, updates) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase belum terhubung");

  const payload = { ...updates };
  if (updates.password && updates.password.trim() !== '') {
    payload.password_hash = await hashPassword(updates.password);
  }
  delete payload.password;

  const { data, error } = await client.from('users').update(payload).eq('id', userId).select().single();
  if (error) {
    if (error.code === '23505') throw new Error("Username sudah digunakan");
    throw error;
  }
  return data;
}

export async function deleteUser(userId) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase belum terhubung");

  // Jangan izinkan hapus diri sendiri
  if (userId === currentUser?.id) {
    throw new Error("Tidak bisa menghapus akun yang sedang aktif");
  }

  const { error } = await client.from('users').delete().eq('id', userId);
  if (error) throw error;
}

// ========================================================
// SEED DEFAULT ADMIN (dipanggil sekali saat setup awal)
// ========================================================
export async function seedDefaultAdminIfNeeded() {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Cek apakah sudah ada admin
    const { data: existingAdmins, error } = await client
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (error) return false;
    if (existingAdmins && existingAdmins.length > 0) return true; // sudah ada

    // Buat admin default
    const defaultPasswordHash = await hashPassword('admin123');
    const { error: insertErr } = await client.from('users').insert({
      id: 'usr_default_admin',
      username: 'admin',
      password_hash: defaultPasswordHash,
      name: 'Administrator Yayasan',
      role: 'admin',
      is_active: true
    });

    if (insertErr) {
      // Kalau error karena sudah ada (race condition), abaikan
      if (insertErr.code !== '23505') {
        console.warn("Gagal seed admin default:", insertErr);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.warn("Seed admin error:", err);
    return false;
  }
}