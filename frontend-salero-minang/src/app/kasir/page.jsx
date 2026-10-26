"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";

export default function JendelaTransaksiKasir() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [newMenu, setNewMenu] = useState({
    id_menu: '', nama_menu: '', kategori: '', harga: '', stok_porsi: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api-salero-minang';

  // --- KODE KEAMANAN (ROUTE GUARD) ---
  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) {
      alert("Akses ditolak! Anda harus login terlebih dahulu.");
      router.push('/');
    } else {
      const user = JSON.parse(session);
      if (user.role !== 'Kasir' && user.role !== 'Pemilik') {
        alert("Akses ditolak! Halaman ini khusus Kasir.");
        router.push('/');
      }
    }
  }, [router]);

  // Mengambil daftar pesanan berstatus 'Pending'
  const fetchPendingOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/get_pending_orders.php`, { cache: 'no-store' });
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal mengambil data antrean:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  // --- FUNGSI CETAK STRUK THERMAL ---
  const printReceipt = (order) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert("Pop-up diblokir oleh browser! Mohon izinkan pop-up untuk mencetak struk.");
      return;
    }
    const waktuCetak = new Date().toLocaleString('id-ID');
    
    let itemsHtml = '';
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        itemsHtml += `
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #000;">
            <span>${item.qty}x ${item.nama_menu}</span>
          </div>
        `;
      });
    }

    const html = `
      <html>
        <head>
          <title>Struk - ${order.id_transaksi}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; color: #000; width: 100%; max-width: 300px; margin: 0 auto; padding: 15px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 10px 0; }
            @media print {
              @page { margin: 0; }
              body { margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="center">
            <h3 style="margin:0; font-size: 16px;">RM SALERO MINANG</h3>
            <p style="font-size:11px; margin:2px 0;">Jl. Tentara Pelajar, Sumanding Wetan, Kota BANJAR</p>
          </div>
          <div class="line"></div>
          <div style="font-size:12px;">
            <p style="margin:2px 0;">No Transaksi: <span class="bold">${order.id_transaksi}</span></p>
            <p style="margin:2px 0;">Meja        : <span class="bold">${order.meja_id ? order.meja_id.toUpperCase() : '-'}</span></p>
            <p style="margin:2px 0;">Waktu       : ${waktuCetak}</p>
          </div>
          <div class="line"></div>
          ${itemsHtml}
          <div class="line"></div>
          <div style="display: flex; justify-content: space-between; font-size: 14px;" class="bold">
            <span>TOTAL</span>
            <span>${formatRupiah(order.total_bayar)}</span>
          </div>
          <div class="line"></div>
          <div class="center" style="font-size:11px; margin-top:20px;">
            <p style="margin:2px 0;">Terima Kasih</p>
            <p style="margin:2px 0;">Atas Kunjungan Anda</p>
          </div>
          <script>
            window.onload = function() { 
              window.print(); 
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // --- FUNGSI VALIDASI PEMBAYARAN ---
  const handleValidate = async (order) => {
    if (!confirm(`Konfirmasi pembayaran untuk transaksi ${order.id_transaksi}?`)) return;
    setIsValidating(true);
    try {
      const response = await fetch(`${API_URL}/validate_order.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_transaksi: order.id_transaksi })
      });
      const result = await response.json();
      
      if (result.success) {
        setOrders(prev => prev.filter(o => o.id_transaksi !== order.id_transaksi));
        if (confirm("Pembayaran Berhasil! Ingin mencetak struk transaksi ini?")) {
          printReceipt(order);
        }
      } else {
        alert("Gagal: " + result.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem saat validasi.");
    } finally {
      setIsValidating(false);
    }
  };

  // --- FUNGSI BATALKAN PESANAN & KEMBALIKAN STOK ---
  const handleCancel = async (order) => {
    if (!confirm(`Batalkan pesanan transaksi ${order.id_transaksi}? Stok porsi akan otomatis dikembalikan.`)) return;
    setIsValidating(true);
    try {
      const response = await fetch(`${API_URL}/cancel_order.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_transaksi: order.id_transaksi })
      });
      const result = await response.json();
      
      if (result.success) {
        alert("Pesanan berhasil dibatalkan dan stok dikembalikan.");
        setOrders(prev => prev.filter(o => o.id_transaksi !== order.id_transaksi));
      } else {
        alert("Gagal membatalkan: " + (result.error || "Kesalahan server"));
      }
    } catch (error) {
      alert("Terjadi kesalahan koneksi ke server saat membatalkan pesanan.");
    } finally {
      setIsValidating(false);
    }
  };

  // --- FUNGSI TAMBAH MENU BARU ---
  const handleAddMenu = async (e) => {
    e.preventDefault();
    setIsAddingMenu(true);
    
    if (!newMenu.id_menu || !newMenu.nama_menu || !newMenu.harga || !newMenu.kategori) {
      alert("Mohon lengkapi ID, Nama, Kategori, dan Harga Menu!");
      setIsAddingMenu(false);
      return;
    }
    
    const formData = new FormData();
    formData.append('id_menu', newMenu.id_menu);
    formData.append('nama_menu', newMenu.nama_menu);
    formData.append('kategori', newMenu.kategori);
    formData.append('harga', newMenu.harga);
    formData.append('stok_porsi', newMenu.stok_porsi);
    if (imageFile) formData.append('gambar', imageFile);

    try {
      const response = await fetch(`${API_URL}/add_menu_with_image.php`, { method: 'POST', body: formData });
      const textResult = await response.text();
      let result;
      try {
        result = JSON.parse(textResult);
      } catch (parseError) {
        alert("Terjadi masalah pada file PHP Anda. Cek console log.");
        return;
      }
      
      if (result.success) {
        alert("Berhasil! Menu baru sudah masuk ke dalam Katalog.");
        setNewMenu({ id_menu: '', nama_menu: '', kategori: '', harga: '', stok_porsi: '' });
        setImageFile(null);
        const fileInput = document.getElementById('fileGambar');
        if (fileInput) fileInput.value = '';
      } else {
        alert("Gagal: " + result.error);
      }
    } catch (error) {
      alert("Gagal menghubungi server. Pastikan XAMPP menyala.");
    } finally {
      setIsAddingMenu(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Keluar dari area Kasir?")) {
      localStorage.removeItem('user_session');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      {/* Navigasi Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 mb-8 flex justify-between items-center rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="bg-orange-600 text-white p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-black text-gray-800 tracking-tight">Salero Minang</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/kasir" className="text-orange-600 font-bold px-3 py-2 rounded-lg transition-colors">
            Transaksi
          </Link>
          <Link href="/kasir/kelola-menu" className="bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white border border-orange-200 font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            <span>Kelola Menu</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </nav>

      {/* Header Utama */}
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Jendela Transaksi Aktif</h1>
          <p className="text-gray-500 font-medium mt-1">RM Salero Minang - Area Kasir</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
            Logout
          </button>
          <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold shadow-sm">
            {orders.length} Antrean Pesanan
          </div>
        </div>
      </header>

      {/* Grid Konten */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Kolom Kiri: Antrean Pesanan */}
        <div className="xl:col-span-2">
          {isLoading ? (
            <div className="text-gray-500 font-medium">Sinkronisasi data...</div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-200">
              <p className="text-gray-500 text-lg">Belum ada pesanan aktif saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((order) => (
                <div key={order.id_transaksi} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
                    <span className="font-bold text-lg uppercase">{order.meja_id ? order.meja_id.replace('-', ' ') : '-'}</span>
                    <span className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded font-mono">
                      {order.tanggal ? order.tanggal.split(' ') : ''}
                    </span>
                  </div>
                  
                  <div className="p-5 flex-grow">
                    <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">{order.id_transaksi}</p>
                    <ul className="space-y-2 mb-4 border-b border-gray-100 pb-4">
                      {order.items && order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between text-sm text-black">
                          <span><span className="font-bold mr-2 text-orange-600">{item.qty}x</span> {item.nama_menu}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="text-gray-500 text-sm font-bold">Total:</span>
                      <span className="text-xl font-black text-black">{formatRupiah(order.total_bayar)}</span>
                    </div>
                  </div>
                  
                  {/* Tombol Aksi Kasir: Batalkan & Validasi */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                    <button 
                      onClick={() => handleCancel(order)}
                      disabled={isValidating}
                      className="w-1/3 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-50"
                    >
                      Batalkan
                    </button>
                    <button 
                      onClick={() => handleValidate(order)}
                      disabled={isValidating}
                      className="w-2/3 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-50"
                    >
                      Validasi Bayar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Form Tambah Menu Baru */}
        <div className="xl:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-300 sticky top-8">
            <div className="mb-6 border-b border-gray-200 pb-4">
              <h2 className="text-xl font-black text-black">Tambah Menu Baru</h2>
              <p className="text-sm text-gray-600 font-medium mt-1">Perbarui katalog hidangan dari area Kasir.</p>
            </div>
            
            <form onSubmit={handleAddMenu} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-1">ID Menu (Misal: M05)</label>
                <input required type="text" value={newMenu.id_menu} onChange={e => setNewMenu({...newMenu, id_menu: e.target.value})} className="w-full border-2 border-gray-300 bg-gray-50 text-black font-semibold rounded-lg p-3 outline-none focus:border-orange-500 focus:bg-white transition-colors" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-black mb-1">Nama Menu</label>
                <input required type="text" value={newMenu.nama_menu} onChange={e => setNewMenu({...newMenu, id_menu: newMenu.id_menu, nama_menu: e.target.value})} className="w-full border-2 border-gray-300 bg-gray-50 text-black font-semibold rounded-lg p-3 outline-none focus:border-orange-500 focus:bg-white transition-colors" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-black mb-1">Kategori</label>
                <select required value={newMenu.kategori} onChange={e => setNewMenu({...newMenu, kategori: e.target.value})} className="w-full border-2 border-gray-300 bg-gray-50 text-black font-semibold rounded-lg p-3 outline-none focus:border-orange-500 focus:bg-white transition-colors cursor-pointer">
                  <option value="" disabled>Pilih Kategori...</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Lauk Tambahan">Lauk Tambahan</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Harga (Rp)</label>
                  <input required type="number" value={newMenu.harga} onChange={e => setNewMenu({...newMenu, harga: e.target.value})} className="w-full border-2 border-gray-300 bg-gray-50 text-black font-semibold rounded-lg p-3 outline-none focus:border-orange-500 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Stok Awal</label>
                  <input required type="number" value={newMenu.stok_porsi} onChange={e => setNewMenu({...newMenu, stok_porsi: e.target.value})} className="w-full border-2 border-gray-300 bg-gray-50 text-black font-semibold rounded-lg p-3 outline-none focus:border-orange-500 focus:bg-white transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">Foto Hidangan (Opsional)</label>
                <input id="fileGambar" type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full border-2 border-gray-300 bg-gray-50 rounded-lg p-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gray-800 file:text-white hover:file:bg-gray-700 text-black cursor-pointer" />
              </div>

              <button type="submit" disabled={isAddingMenu} className={`w-full text-white font-black py-4 rounded-xl mt-6 transition-colors shadow-lg ${isAddingMenu ? 'bg-orange-400' : 'bg-orange-600 hover:bg-orange-700'}`}>
                {isAddingMenu ? 'Menyimpan...' : 'Simpan ke Katalog'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}