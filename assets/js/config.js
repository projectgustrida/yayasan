// Konstanta & data default aplikasi
export const STORAGE_KEY = 'yayasan_keuangan_app_v2';
export const SUPABASE_CONFIG_KEY = 'yayasan_supabase_config_v1';

export const DEFAULT_SUPABASE_CONFIG = {
    url: 'https://btspaqkvpwcdcpbebbvl.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0c3BhcWt2cHdjZGNwYmViYnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0Mzg2NDgsImV4cCI6MjEwNTAxNDY0OH0.KgN70vxsB0LhpW5wwszI9g-jXexyqzaay-ZbzW5cyVk'
};

export const DEFAULT_STATE = {
    profile: {
        name: "Yayasan Bina Ummat Mandiri",
        subtitle: "Lembaga Sosial, Pendidikan, dan Kesejahteraan Ummat",
        skNumber: "AHU-0012345.AH.01.04.Tahun 2021",
        address: "Jl. Damai Sejahtera No. 12, Kel. Harapan, Kec. Berkah",
        city: "Jakarta Selatan",
        phone: "0812-3456-7890",
        email: "kontak@binaummat.org",
        chairman: "H. Ahmad Fauzi, S.Pd.I",
        treasurer: "Hj. Siti Rahmah, S.E."
    },
    accounts: [
        { id: "acc_1", name: "Kas Tunai Yayasan", type: "cash", icon: "fa-money-bill-wave", color: "emerald" },
        { id: "acc_2", name: "BSI (Bank Syariah Indonesia)", type: "bank", icon: "fa-building-columns", color: "teal" },
        { id: "acc_3", name: "Bank Mandiri", type: "bank", icon: "fa-building-columns", color: "blue" }
    ],
    categories: {
        income: [
            { id: "Donasi Umum", name: "Donasi Umum", icon: "fa-hand-holding-heart", color: "text-blue-500", bg: "bg-blue-50" },
            { id: "Zakat Maal", name: "Zakat Maal", icon: "fa-sack-dollar", color: "text-emerald-500", bg: "bg-emerald-50" },
            { id: "Infaq & Sedekah", name: "Infaq & Sedekah", icon: "fa-coins", color: "text-amber-500", bg: "bg-amber-50" },
            { id: "Wakaf Tunai", name: "Wakaf Tunai", icon: "fa-landmark", color: "text-indigo-500", bg: "bg-indigo-50" },
            { id: "Bantuan & Hibah", name: "Bantuan & Hibah", icon: "fa-gift", color: "text-purple-500", bg: "bg-purple-50" },
            { id: "Lainnya", name: "Lainnya", icon: "fa-box-archive", color: "text-gray-500", bg: "bg-gray-100" }
        ],
        expense: [
            { id: "Program Santunan Yatim & Dhuafa", name: "Program Santunan Yatim & Dhuafa", icon: "fa-people-roof", color: "text-rose-500", bg: "bg-rose-50" },
            { id: "Pendidikan & Beasiswa", name: "Pendidikan & Beasiswa", icon: "fa-graduation-cap", color: "text-orange-500", bg: "bg-orange-50" },
            { id: "Operasional & Utilitas", name: "Operasional & Utilitas", icon: "fa-bolt", color: "text-yellow-600", bg: "bg-yellow-50" },
            { id: "Gaji & Honor Ustadz/Staff", name: "Gaji & Honor Ustadz/Staff", icon: "fa-user-tie", color: "text-indigo-500", bg: "bg-indigo-50" },
            { id: "Pembangunan & Sarana", name: "Pembangunan & Sarana", icon: "fa-trowel-bricks", color: "text-stone-600", bg: "bg-stone-50" },
            { id: "Lainnya", name: "Lainnya", icon: "fa-box-archive", color: "text-gray-500", bg: "bg-gray-100" }
        ]
    },
    transactions: [
        { id: 1726358400001, date: "2026-09-01", type: "income", amount: 15000000, account: "BSI (Bank Syariah Indonesia)", category: "Donasi Umum", desc: "Donasi Awal Bulan dari Hamba Allah", ref: "BKM-001", person: "Hamba Allah" },
        { id: 1726358400002, date: "2026-09-04", type: "expense", amount: 3500000, account: "BSI (Bank Syariah Indonesia)", category: "Program Santunan Yatim & Dhuafa", desc: "Penyaluran Santunan Paket Sembako Yatim", ref: "BKK-001", person: "Koordinator Sosial" },
        { id: 1726358400003, date: "2026-09-07", type: "income", amount: 8500000, account: "Kas Tunai Yayasan", category: "Zakat Maal", desc: "Penerimaan Zakat Maal Perniagaan", ref: "BKM-002", person: "H. Ridwan Santoso" },
        { id: 1726358400004, date: "2026-09-10", type: "expense", amount: 1200000, account: "Kas Tunai Yayasan", category: "Operasional & Utilitas", desc: "Pembayaran Listrik & Air Panti Asuhan", ref: "BKK-002", person: "PLN & PAM" },
        { id: 1726358400005, date: "2026-09-12", type: "expense", amount: 4500000, account: "Bank Mandiri", category: "Pendidikan & Beasiswa", desc: "Beasiswa Sekolah Santri Berprestasi", ref: "BKK-003", person: "Bendahara Sekolah" },
        { id: 1726358400006, date: "2026-09-14", type: "income", amount: 5000000, account: "Bank Mandiri", category: "Infaq & Sedekah", desc: "Infaq Kotak Amal Jum'at & Donasi Online", ref: "BKM-003", person: "Jamaah" }
    ]
};