import { STORAGE_KEY, DEFAULT_STATE } from '../config.js';
import { appState } from './state.js';
import { showToast } from '../ui/toast.js';

export function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(appState, parsed);
        } else {
            Object.assign(appState, JSON.parse(JSON.stringify(DEFAULT_STATE)));
            saveState();
        }
    } catch (err) {
        console.error("Gagal membaca localStorage:", err);
        Object.assign(appState, JSON.parse(JSON.stringify(DEFAULT_STATE)));
    }
}

export function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (err) {
        console.error("Gagal menyimpan ke localStorage:", err);
        showToast("Peringatan: Gagal menyimpan data!", true);
    }
}