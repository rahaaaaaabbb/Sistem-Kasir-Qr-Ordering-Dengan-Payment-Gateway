"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchKatalogMenu } from '../../utils/api'; 

export default function DasborPemilik() {
  const router = useRouter();
  const [stats, setStats] = useState({ pendapatan_hari_ini: 0, total_pesanan: 0 });
  const [menuList, setMenuList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = 'http://localhost/api-salero-minang';

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const resStats = await fetch(`${API_URL}/get_dashboard.php`, { cache: 'no-store' });
      const dataStats = await resStats.json();
      setStats(dataStats);

      const dataMenu = await fetchKatalogMenu('Semua');
      setMenuList(dataMenu);
    } catch (error) {
      console.error("Gagal memuat data dasbor:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) {
      alert("Akses ditolak! Anda harus login terlebih dahulu.");
      router.push('/');
    } else {
      const user = JSON.parse(session);
      if (user.role !== 'Pemilik') {
        alert("Akses ditolak! Halaman ini khusus Pemilik.");
        router.push('/');
      }
    }
  }, [router]);
  
  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleUpdateStok = async (id, currentStok) => {
    const newStok = prompt("Masukkan jumlah stok baru:", currentStok.toString());
    if (newStok === null || newStok === "") return;

    try {
      const response = await fetch(`${API_URL}/update_stok.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_menu: id, stok_baru: newStok })
      });
      const result = await response.json();
      
      if (result.success) {
        loadDashboardData();
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      localStorage.removeItem('user_session');
      router.push('/');
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <header className="mb-8 border-b border-gray-200 pb-4 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Dasbor Manajemen</h1>
          <p className="text-gray-500 font-medium mt-1">RM Salero Minang - Area Pemilik</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/pemilik/laporan')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            Lihat Laporan Analitik 
          </button>
          <button 
            onClick={handleLogout}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-5 rounded-xl transition-colors border border-red-100"
          >
            Logout ⎋
          </button>
        </div>
      </header>

      {/* Ringkasan Pendapatan */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Pendapatan Hari Ini</p>
          <p className="text-4xl font-black text-green-600">
            {isLoading ? "..." : formatRupiah(stats.pendapatan_hari_ini)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Transaksi Harian</p>
          <p className="text-4xl font-black text-blue-600">
            {isLoading ? "..." : `${stats.total_pesanan} Pesanan`}
          </p>
        </div>
      </section>

      {/* Tabel Manajemen Stok Aktual */}
      <section>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Manajemen Stok Aktual</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold">ID</th>
                  <th className="p-4 font-bold">Menu</th>
                  <th className="p-4 font-bold">Kategori</th>
                  <th className="p-4 font-bold">Sisa Stok</th>
                  <th className="p-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan="5" className="p-4 text-center text-gray-500">Memuat data...</td></tr>
                ) : (
                  menuList.map((menu) => (
                    <tr key={menu.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm font-mono text-gray-500">{menu.id}</td>
                      <td className="p-4 font-bold text-gray-800 flex items-center gap-3">
                        {menu.image ? (
                          <img src={menu.image} alt={menu.name} className="w-10 h-10 rounded-md object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs border border-gray-200">No Img</div>
                        )}
                        {menu.name}
                      </td>
                      <td className="p-4 text-sm text-gray-600">{menu.category}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${menu.stock <= 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                          {menu.stock} Porsi
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleUpdateStok(menu.id, menu.stock)}
                          className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                        >
                          Ubah Stok
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}