Framework & Teknologi yang Digunakan

Frontend: Menggunakan Next.js (berbasis React). Didukung oleh pustaka tambahan seperti Tailwind CSS untuk styling, Recharts untuk visualisasi data grafik, serta jsPDF dan xlsx untuk fitur ekspor laporan. 
Konfigurasi gambar jarak jauh juga diatur melalui next.config.ts untuk menghubungkan aset dari server lokal.   
Backend: Dibangun menggunakan Native PHP yang menyediakan endpoint API berbasis JSON untuk komunikasi data dengan frontend.  
Database: Menggunakan MySQL untuk penyimpanan data relasional (menu, transaksi, detail transaksi, dan pengguna) melalui ekstensi mysqli.

Fitur Utama Aplikasi

Manajemen Menu (Katalog & Stok)Menambah menu baru beserta unggah gambar (dengan validasi ukuran file dan direktori otomatis uploads/).   
Memperbarui informasi menu, kategori, harga, dan mengubah jumlah stok porsi secara real-time (update_stok.php, update_menu.php).  
Menampilkan daftar menu berdasarkan kategori yang dipilih oleh pelanggan.   
Sistem Pemesanan (Ordering & Checkout)Pelanggan dapat mengirim pesanan berdasarkan ID Meja (meja_id) dengan status awal Pending (submit_order.php, checkout.php).   
Sistem Atomik & Transaksi Database: Proses checkout dilengkapi dengan transaksi database (begin_transaction, commit, rollback) untuk memastikan stok otomatis terpotong dengan aman dan mencegah stok minus jika dipesan pelanggan lain secara bersamaan.  
Integrasi Pembayaran (Midtrans): Mendukung pembayaran online melalui Midtrans Snap Token (checkout_midtrans.php dan update_status_midtrans.php).  
Manajemen Status & Validasi Pesanan (Kasir / Dapur)Memeriksa daftar pesanan yang masih Pending atau sudah dibayar (Paid).  
Memvalidasi pembayaran atau menyelesaikan pesanan menjadi Completed (selesai dihidangkan) (validate_order.php, complete_order.php).   
Pembatalan pesanan (cancel_order.php) yang secara otomatis mengembalikan stok menu ke database apabila transaksi dibatalkan.   
Dashboard, Analitik, & PelaporanRingkasan Pendapatan: Menghitung total pendapatan harian dan jumlah pesanan secara real-time (get_dashboard.php).   
Analitik Penjualan: Menyediakan data 5 menu terlaris (Top Menu), grafik pendapatan dalam 7 hari terakhir, serta tabel rincian seluruh transaksi untuk kebutuhan laporan dan ekspor data (get_analitik.php).
