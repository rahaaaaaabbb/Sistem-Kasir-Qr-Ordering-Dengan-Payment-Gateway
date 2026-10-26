"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';

export default function HalamanKeranjang() {
  const params = useParams();
  const router = useRouter();
  const mejaId = params?.meja_id || 'Tidak Diketahui';
  
  const [cart, setCart] = useState([]);
  const [metodeBayar, setMetodeBayar] = useState('kasir'); 
  const [isProcessing, setIsProcessing] = useState(false);

  const API_URL = 'http://localhost/api-salero-minang';

  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${mejaId}`);
    if (savedCart) setCart(JSON.parse(savedCart));
  }, [mejaId]);

  // --- FITUR BARU: MANAJEMEN ITEM KERANJANG ---
  const simpanKeLocal = (keranjangBaru) => {
    setCart(keranjangBaru);
    if (keranjangBaru.length > 0) {
      localStorage.setItem(`cart_${mejaId}`, JSON.stringify(keranjangBaru));
    } else {
      localStorage.removeItem(`cart_${mejaId}`); // Hapus memori jika kosong
    }
  };

 const tambahQty = (idx) => {
  const keranjangBaru = [...cart];
  const item = keranjangBaru[idx];

  // Validasi batas stok saat menekan tombol '+' di halaman keranjang
  if (item.stock !== undefined && item.qty >= item.stock) {
    alert(`Jumlah pesanan untuk "${item.name}" tidak boleh melebihi stok yang tersedia (${item.stock} porsi).`);
    return;
  }

  keranjangBaru[idx].qty += 1;
  simpanKeLocal(keranjangBaru);
};

  const hapusItem = (idx) => {
    if(confirm(`Hapus ${cart[idx].name} dari pesanan Anda?`)) {
      const keranjangBaru = cart.filter((_, i) => i !== idx);
      simpanKeLocal(keranjangBaru);
      
      // Jika keranjang jadi kosong setelah dihapus, otomatis kembali ke halaman menu
      if (keranjangBaru.length === 0) {
        window.location.href = `/${mejaId}`;
      }
    }
  };
  // --------------------------------------------

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const handleProsesPesanan = async () => {
    setIsProcessing(true);
    
    // Skenario A: Bayar di Kasir
    if (metodeBayar === 'kasir') {
      try {
        const response = await fetch(`${API_URL}/checkout.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meja_id: mejaId, items: cart, total_bayar: totalPrice })
        });
        const result = await response.json();
        
        if (result.success) {
          // RESET KERANJANG TOTAL
          setCart([]); 
          localStorage.removeItem(`cart_${mejaId}`); 
          alert("Pesanan berhasil dikirim ke Kasir! Silakan menuju meja kasir untuk membayar.");
          // Memaksa refresh halaman utama agar state keranjang di sana ikut ter-reset
          window.location.href = `/${mejaId}`;
        } else {
          alert("Gagal: " + result.error);
        }
      } catch (error) {
        alert("Gagal mengirim pesanan.");
      } finally {
        setIsProcessing(false);
      }
    } 
    // Skenario B: Bayar Online via Midtrans
    else {
      try {
        const response = await fetch(`${API_URL}/checkout_midtrans.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meja_id: mejaId, items: cart, total_bayar: totalPrice })
        });
        const result = await response.json();
        
        if (result.success && result.token) {
          window.snap.pay(result.token, {
            onSuccess: async function(snapResult){
              try {
                const resUpdate = await fetch(`${API_URL}/update_status_midtrans.php`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id_transaksi: result.id_transaksi }) 
                });
                
                const dataUpdate = await resUpdate.json();
                
                if (dataUpdate.success || dataUpdate.message) {
                  // RESET KERANJANG TOTAL
                  setCart([]); 
                  localStorage.removeItem(`cart_${mejaId}`); 
                  alert("Pembayaran Berhasil! Pesanan Anda langsung diproses ke dapur.");
                  // Memaksa refresh halaman utama agar memori benar-benar bersih
                  window.location.href = `/${mejaId}`;
                } else {
                  alert("Pembayaran sukses, tapi gagal masuk dapur: " + dataUpdate.error);
                }
              } catch (err) {
                alert("Koneksi terputus saat mengubah status.");
              }
            },
            onPending: function(snapResult){
              alert("Menunggu pembayaran Anda diselesaikan.");
              setIsProcessing(false);
            },
            onError: function(snapResult){
              alert("Pembayaran Gagal.");
              setIsProcessing(false);
            },
            onClose: function(){
              alert("Anda menutup jendela sebelum menyelesaikan pembayaran.");
              setIsProcessing(false);
            }
          });
        } else {
          alert("Gagal mendapatkan token: " + (result.error || "Kesalahan API"));
          setIsProcessing(false);
        }
      } catch (error) {
        alert("Terjadi kesalahan server saat menghubungi Midtrans.");
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      
      {/* SUNTIKAN SCRIPT MIDTRANS */}
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key="" 
        strategy="lazyOnload"
      />

      <header className="bg-white shadow-sm px-4 py-4 sticky top-0 z-20 border-b border-gray-100 flex items-center gap-3">
        {/* Tombol kembali (kembali ke beranda meja dengan mulus) */}
        <button onClick={() => window.location.href = `/${mejaId}`} className="text-orange-600 font-bold p-2 bg-orange-50 rounded-xl">←</button>
        <div>
          <h1 className="text-xl font-black text-gray-800">Keranjang Anda</h1>
          <p className="text-xs text-gray-500 font-medium">Meja {mejaId.toUpperCase()}</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {cart.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-gray-500 mb-4">Keranjang masih kosong.</p>
            <button onClick={() => window.location.href = `/${mejaId}`} className="text-orange-600 font-bold bg-orange-50 px-6 py-2 rounded-lg">Pilih Menu</button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              {cart.map((item, index) => (
                <div key={index} className="p-4 border-b border-gray-100 flex flex-col gap-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-xs text-gray-500">{formatRupiah(item.price)} <span className="font-bold text-gray-400">/ porsi</span></p>
                    </div>
                    <div className="font-black text-orange-600">
                      {formatRupiah(item.price * item.qty)}
                    </div>
                  </div>
                  
                  {/* KONTROL TAMBAH, KURANG, HAPUS */}
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <button 
                      onClick={() => hapusItem(index)} 
                      className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-100/50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      🗑 Hapus
                    </button>
                    
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                      <button onClick={() => kurangQty(index)} className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-orange-100 rounded text-gray-700 font-bold transition-colors">
                        -
                      </button>
                      <span className="font-black text-sm w-6 text-center text-gray-800">{item.qty}</span>
                      <button onClick={() => tambahQty(index)} className="w-8 h-8 flex items-center justify-center bg-orange-50 hover:bg-orange-100 rounded text-orange-600 font-bold transition-colors">
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* OPSI METODE PEMBAYARAN */}
            <h2 className="font-black text-gray-800 mb-3 text-lg">Metode Pembayaran</h2>
            <div className="space-y-3 mb-8">
              <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-colors ${metodeBayar === 'kasir' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'}`}>
                <input type="radio" name="payment" value="kasir" checked={metodeBayar === 'kasir'} onChange={() => setMetodeBayar('kasir')} className="hidden" />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${metodeBayar === 'kasir' ? 'border-orange-500' : 'border-gray-300'}`}>
                  {metodeBayar === 'kasir' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Bayar di Kasir</h3>
                  <p className="text-xs text-gray-500">Uang tunai atau debit fisik.</p>
                </div>
              </label>

              <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-colors ${metodeBayar === 'midtrans' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                <input type="radio" name="payment" value="midtrans" checked={metodeBayar === 'midtrans'} onChange={() => setMetodeBayar('midtrans')} className="hidden" />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${metodeBayar === 'midtrans' ? 'border-blue-500' : 'border-gray-300'}`}>
                  {metodeBayar === 'midtrans' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Bayar Online Terintegrasi</h3>
                  <p className="text-xs text-gray-500">QRIS, GoPay, ShopeePay, M-Banking.</p>
                </div>
              </label>
            </div>
          </>
        )}
      </main>

      {/* Footer Total & Tombol Proses */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 font-bold mb-1">Total Tagihan</p>
              <p className="text-xl font-black text-gray-900">{formatRupiah(totalPrice)}</p>
            </div>
            <button 
              onClick={handleProsesPesanan}
              disabled={isProcessing}
              className={`font-bold px-6 py-3 rounded-xl shadow-lg transition-colors ${isProcessing ? 'bg-gray-400 text-white' : metodeBayar === 'kasir' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {isProcessing ? 'Memproses...' : 'Kirim Pesanan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}