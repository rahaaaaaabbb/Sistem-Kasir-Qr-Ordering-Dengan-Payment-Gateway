"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchKatalogMenu } from '../../utils/api';

export default function AntarmukaDapur() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [menuList, setMenuList] = useState([]);
  
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingStock, setIsLoadingStock] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const API_URL = 'http://localhost/api-salero-minang';

  const fetchPaidOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/get_paid_orders.php`, { cache: 'no-store' });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Gagal sinkronisasi data dapur:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchStockMenu = async () => {
    try {
      const data = await fetchKatalogMenu('Semua');
      setMenuList(data);
    } catch (error) {
      console.error("Gagal mengambil data stok:", error);
    } finally {
      setIsLoadingStock(false);
    }
  };
  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) {
      alert("Akses ditolak! Anda harus login terlebih dahulu.");
      router.push('/');
    } else {
      const user = JSON.parse(session);
      if (user.role !== 'Dapur' && user.role !== 'Pemilik') {
        alert("Akses ditolak! Halaman ini khusus Dapur.");
        router.push('/');
      }
    }
  }, [router]);
  
  useEffect(() => {
    fetchPaidOrders();
    fetchStockMenu();
    
    const interval = setInterval(() => {
      fetchPaidOrders();
      fetchStockMenu();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleComplete = async (idTransaksi) => {
    setIsCompleting(true);
    try {
      const response = await fetch(`${API_URL}/complete_order.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_transaksi: idTransaksi })
      });
      const result = await response.json();
      
      if (result.success) {
        setOrders(prev => prev.filter(order => order.id_transaksi !== idTransaksi));
      } else {
        alert("Gagal memperbarui status: " + result.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Tinggalkan papan Kanban dapur?")) {
      localStorage.removeItem('user_session');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8 font-sans text-gray-100 pb-20">
      
      <header className="mb-8 flex justify-between items-start border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Papan Dapur (Kanban)</h1>
          <p className="text-gray-400 font-medium mt-1">RM Salero Minang - Proses Produksi</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button 
            onClick={handleLogout} 
            className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
          >
            Logout ⎋
          </button>
          <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-bold border border-red-500/30 shadow-sm">
            {orders.length} Antrean Masak
          </div>
        </div>
      </header>

      {/* --- BAGIAN 1: PAPAN KANBAN PESANAN --- */}
      <div className="mb-12">
        {isLoadingOrders ? (
          <div className="text-gray-400 font-medium flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sinkronisasi pesanan...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-gray-800 p-12 text-center rounded-xl border border-gray-700 shadow-inner">
            <p className="text-gray-400 text-lg">Semua pesanan telah selesai dikerjakan.</p>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x hide-scrollbar">
            {orders.map((order) => (
              <div key={order.id_transaksi} className="snap-start min-w-[320px] max-w-[320px] bg-gray-800 rounded-xl border border-gray-700 flex flex-col shadow-xl">
                
                <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-start rounded-t-xl">
                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-1">{order.id_transaksi}</div>
                    <div className="text-xl font-black text-white uppercase">{order.meja_id.replace('-', ' ')}</div>
                  </div>
                  <div className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded font-mono">
                    {order.tanggal.split(' ')[1]}
                  </div>
                </div>
                
                <div className="p-4 flex-grow space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                      <div>
                        <div className="font-bold text-white text-lg"><span className="text-orange-400 mr-2">{item.qty}x</span> {item.nama_menu}</div>
                        <div className="text-xs text-gray-400 font-mono mt-1">Kode: {item.id_menu}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-gray-900/50 border-t border-gray-700 rounded-b-xl">
                  <button 
                    onClick={() => handleComplete(order.id_transaksi)}
                    disabled={isCompleting}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  Siap Disajikan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- BAGIAN 2: TABEL MANAJEMEN STOK (READ-ONLY) --- */}
      <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/80">
          <h2 className="text-xl font-bold text-white">Pantau Sisa Stok Aktual</h2>
          <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full border border-orange-400/20">
            Mode Hanya Baca
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-bold">ID</th>
                <th className="p-4 font-bold">Menu</th>
                <th className="p-4 font-bold">Kategori</th>
                <th className="p-4 font-bold">Sisa Stok</th>
                <th className="p-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoadingStock ? (
                <tr><td colSpan="5" className="p-4 text-center text-gray-500">Memuat data stok dari dapur...</td></tr>
              ) : (
                menuList.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="p-4 text-sm font-mono text-gray-500">{menu.id}</td>
                    <td className="p-4 font-bold text-gray-200 flex items-center gap-3">
                      {menu.image ? (
                        <img src={menu.image} alt={menu.name} className="w-10 h-10 rounded-md object-cover border border-gray-600" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-700 rounded-md flex items-center justify-center text-gray-400 text-xs border border-gray-600">No Img</div>
                      )}
                      {menu.name}
                    </td>
                    <td className="p-4 text-sm text-gray-400">{menu.category}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${menu.stock <= 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                        {menu.stock} Porsi
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        disabled
                        className="bg-gray-700/50 text-gray-500 text-xs font-bold px-4 py-2 rounded-lg cursor-not-allowed flex items-center justify-end gap-2 ml-auto"
                        title="Hanya Pemilik yang dapat mengubah stok"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Terkunci
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}