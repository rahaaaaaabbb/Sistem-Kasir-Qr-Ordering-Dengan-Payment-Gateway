"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HalamanLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Penambahan tipe data React.FormEvent untuk mencegah error TypeScript
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(''); 
    
    try {
      const response = await fetch('http://localhost/api-salero-minang/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Simpan sesi login ke LocalStorage
        localStorage.setItem('user_session', JSON.stringify(result.user));
        
        // Arahkan ke halaman sesuai Hak Akses (Role)
        if (result.user.role === 'Pemilik') router.push('/pemilik');
        else if (result.user.role === 'Kasir') router.push('/kasir');
        else if (result.user.role === 'Dapur') router.push('/dapur');
      } else {
        // Tampilkan pesan error dari PHP
        setErrorMsg(result.error || "Username atau password salah.");
      }
    } catch (error) {
      console.error("Error Login:", error);
      setErrorMsg("Gagal terhubung ke server. Pastikan Apache & MySQL di XAMPP sudah menyala.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      
      {/* Sisi Kiri - Branding & Ilustrasi */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-orange-500 to-red-600 flex-col justify-center items-center text-white p-12 relative overflow-hidden">
        {/* Ornamen Latar Belakang */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-black opacity-10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-md text-center">
          <div className="bg-white/20 p-4 rounded-3xl inline-block mb-6 backdrop-blur-sm border border-white/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black mb-4 tracking-tight">RM Salero Minang</h1>
          <p className="text-lg text-orange-100 font-medium leading-relaxed">
            Sistem Informasi Manajemen Transaksi dan Ketersediaan Stok Terintegrasi.
          </p>
        </div>
      </div>

      {/* Sisi Kanan - Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">Selamat Datang</h2>
            <p className="text-gray-500 mt-2 font-medium">Silakan masuk menggunakan kredensial Anda.</p>
          </div>

          {/* Alert Peringatan Error */}
          {errorMsg && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start">
              <svg className="h-5 w-5 text-red-500 mr-3 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-semibold text-red-700">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
              <input 
                required 
                type="text" 
                placeholder="Masukkan username Anda..."
                value={username} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input 
                required 
                type="password" 
                placeholder="••••••••"
                value={password} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className={`w-full text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] flex justify-center items-center gap-2 mt-4
                ${isLoading ? 'bg-orange-400 cursor-wait' : 'bg-orange-600 hover:bg-orange-700 hover:shadow-orange-500/30'}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memeriksa...
                </>
              ) : 'Masuk'}
            </button>
          </form>
          
          <p className="text-center text-xs text-gray-400 mt-8 font-medium">
            &copy; 2026 RM Salero Minang. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
}