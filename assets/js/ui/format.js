import { appState } from '../services/state.js';

export const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR',
        minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(val || 0);
};

export const formatDateIndo = (dateStr) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dateStr;
};

export const getTodayString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export function getCategoryStyle(catName, type = 'income') {
    const list = appState.categories[type] || [];
    const found = list.find(c => c.name === catName);
    if (found) return found;
    const oppositeList = appState.categories[type === 'income' ? 'expense' : 'income'] || [];
    const foundOpposite = oppositeList.find(c => c.name === catName);
    if (foundOpposite) return foundOpposite;
    return {
        name: catName,
        icon: type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up',
        color: type === 'income' ? 'text-primary' : 'text-red-500',
        bg: type === 'income' ? 'bg-emerald-50' : 'bg-red-50'
    };
}