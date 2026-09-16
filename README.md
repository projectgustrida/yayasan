# Aplikasi Laporan Keuangan Yayasan

Aplikasi pencatatan kas dan pelaporan keuangan lengkap untuk Yayasan / Lembaga Nirlaba / Organisasi Sosial & Syariah.

## ✨ Fitur Utama

1. **Dashboard & Kas Real-time**:
   - Total Saldo Kas Yayasan, Total Penerimaan, dan Total Pengeluaran.
   - Saldo terpisah per Akun Kas & Rekening Bank (Kas Tunai, BSI, Mandiri, dll.).
   - Diagram donat alokasi beban/program sosial tahun berjalan (menggunakan Chart.js).
   - Daftar mutasi transaksi kas terkini.

2. **Pencatatan & Manajemen Transaksi**:
   - Catat Pemasukan (Donasi Umum, Zakat Maal, Infaq & Sedekah, Wakaf Tunai, Bantuan/Hibah) dan Pengeluaran (Program Santunan, Beasiswa, Operasional/Listrik/Air, Gaji Pengurus/Staff, Pembangunan, dll.).
   - Pilihan tanggal fleksibel (bisa mencatat transaksi tanggal lampau/kemarin).
   - Nomor Bukti Kas / Kuitansi (BKM/BKK) dan nama penyetor/penerima.
   - Fitur **Edit Transaksi** dan **Hapus Transaksi** (disertai modal konfirmasi keamanan).

3. **Laporan Keuangan Resmi Yayasan**:
   - **Buku Kas Umum (BKU)**: Format kronologis lengkap dengan kolom Nomor, Tanggal, No. Bukti, Uraian, Penerimaan, Pengeluaran, dan Saldo Berjalan (Running Balance).
   - **Laporan Aktivitas**: Rekap Penerimaan ZISWAF/Donasi vs Realisasi Beban Program & Operasional beserta surplus / defisit bersih periode berjalan.
   - **Laporan Posisi Kas & Bank**: Ringkasan saldo seluruh rekening bank dan brankas kas fisik.
   - **Filter Fleksibel**: Filter berdasarkan Bulan Ini, Bulan Lalu, Tahun Berjalan, atau Rentang Tanggal Kustom, serta filter per Akun Bank.
   - **Cetak Laporan Resmi / Simpan PDF**: Dilengkapi Kop Surat Resmi Yayasan (SK Kemenkumham, Alamat, Kontak) serta kolom tanda tangan Ketua Yayasan dan Bendahara.
   - **Ekspor ke Excel (.xlsx)**: Unduh pembukuan langsung ke format Microsoft Excel dalam sekali klik (menggunakan SheetJS).

4. **Penyimpanan Cloud & Cadangan Data (Hybrid)**:
   - **Database Cloud (Supabase)**: Terhubung ke cloud database gratis untuk multi-perangkat (laptop & HP pengurus yayasan sinkron secara realtime).
   - **Penyimpanan Lokal Otomatis (`localStorage`)**: Tetap berjalan cepat dan dapat dibuka saat internet padam (*offline-ready*).
   - **Tombol Sinkronisasi Cepat (Sync)**: Tarik dan unggah transaksi kas kapan saja.
   - **Unduh Cadangan (Backup JSON)**: Mengamankan data ke komputer/flashdisk.
   - **Pulihkan Data (Restore JSON)**: Memuat kembali data jika berganti komputer.

5. **Tampilan Responsif & Mode Fleksibel**:
   - Dilengkapi tombol pengalih **Mode Ponsel** (compact 480px) dan **Mode Desktop** (dashboard lebar 1200px) di bar navigasi atas.

---

## ☁️ Cara Menghubungkan ke Supabase (Database Cloud Gratis)

Jika ingin data kas tersinkronisasi otomatis antar-perangkat pengurus yayasan:

1. Buat akun dan proyek gratis di **[supabase.com](https://supabase.com)**.
2. Buka menu **SQL Editor** di Supabase, lalu salin dan jalankan script SQL berikut:
   ```sql
   create table if not exists transactions (
       id bigint primary key,
       date text not null,
       type text not null check (type in ('income', 'expense')),
       amount numeric not null,
       account text not null,
       category text not null,
       "desc" text not null,
       ref text default '',
       person text default '',
       created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   alter table transactions enable row level security;

   create policy "Akses Penuh Anonim Transaksi Yayasan"
   on transactions for all
   using (true)
   with check (true);
   ```
3. Buka **Project Settings > API** di Supabase, salin **Project URL** dan **Project API Anon Key**.
4. Buka aplikasi, masuk ke tab **Profil & Pengaturan** (ikon gerigi/slider di kanan atas).
5. Masukkan URL dan Anon Key di panel **Database Cloud (Supabase)**, lalu klik **Simpan & Hubungkan**.
6. Selesai! Data transaksi Anda kini otomatis tersimpan di cloud dan tersinkronisasi ke seluruh pengurus yayasan.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini bersifat *client-side standalone* (tanpa perlu install database atau server lokal):
1. Buka folder `YAYASAN`.
2. Klik ganda (double-click) file `index.html`.
3. Aplikasi akan langsung terbuka di browser Anda (Google Chrome, Microsoft Edge, Mozilla Firefox, dsb.).
4. Siap digunakan kapan saja, baik online maupun offline!
