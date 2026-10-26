"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function StatusPesanan() {
  const params = useParams();
  const router = useRouter();
  const mejaId = params?.meja_id || 'Tidak Diketahui';

  const [status, setStatus] = useState('Pending');
  const [transaksiId, setTransaksiId] = useState('Memuat...');

  const API_URL = 'http://localhost/api-salero-minang';

  // Fungsi untuk mengecek status pesanan terbaru dari meja ini
  const checkStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/check_status.php?meja_id=${mejaId}`, {
        cache: 'no-store'
      });
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
        setTransaksiId(data.id_transaksi);
      }
    } catch (error) {
      console.error("Gagal mengecek status:", error);
    }
  };

  useEffect(() => {
    checkStatus(); 
    const interval = setInterval(checkStatus, 3000); 
    return () => clearInterval(interval);
  }, [mejaId]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans max-w-md mx-auto relative px-6 py-12">
      
      {/* Tombol Buat Pesanan Baru  */}
      {status === 'Completed' && (
        <button 
          onClick={() => router.push(`/${mejaId}`)}
          className="absolute top-6 left-6 text-orange-600 font-bold text-sm bg-orange-50 px-4 py-2 rounded-lg"
        >
          + Pesan Lagi
        </button>
      )}

      <div className="flex-grow flex flex-col items-center justify-center text-center mt-10">
        
        {/* Render UI berdasarkan Status Database */}
        
        {/* 1. Status PENDING (Menunggu Kasir) */}
        {status === 'Pending' && (
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="absolute inset-0 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* 2. Status PAID (Sedang Dimasak Dapur) */}
        {status === 'Paid' && (
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        )}

        {/* 3. Status COMPLETED (Siap Disajikan) */}
        {status === 'Completed' && (
          <div className="mb-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}

        {/* Teks Status */}
        <h2 className="text-2xl font-black text-gray-800 mb-2">
          {status === 'Pending' && 'Menunggu Validasi Kasir'}
          {status === 'Paid' && 'Pesanan Sedang Dimasak'}
          {status === 'Completed' && 'Makanan Siap Disajikan!'}
        </h2>
        
        <div className="bg-gray-50 px-6 py-3 rounded-xl mb-6 border border-gray-100">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1">Meja</p>
          <p className="text-xl font-bold text-gray-800">{mejaId.replace('-', ' ')}</p>
        </div>

        <p className="text-gray-500 mb-8 leading-relaxed max-w-xs">
          {status === 'Pending' && 'Pesanan Anda sudah masuk. Silakan lakukan pembayaran di meja kasir agar dapur segera memproses hidangan Anda.'}
          {status === 'Paid' && 'Pembayaran berhasil dikonfirmasi. Koki kami sedang menyiapkan hidangan lezat untuk Anda.'}
          {status === 'Completed' && 'Pramusaji kami sedang mengantarkan hidangan ke meja Anda. Selamat menikmati sajian khas Minang kami.'}
        </p>
      </div>

      {/* Bagian Bawah */}
      <div className="mt-auto pt-6 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400 font-medium">
          ID Transaksi: {transaksiId}
        </p>
        <p className="text-[10px] text-gray-300 mt-1">RM Salero Minang • QR-Ordering System</p>
      </div>
      
    </div>
  );
}