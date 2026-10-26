"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MenuCard from '../components/MenuCard';
import { fetchKatalogMenu } from '../../utils/api'; 

export default function KatalogMenu() {
  const params = useParams();
  const router = useRouter();
  
  // Mengambil parameter nomor meja secara dinamis dari URL
  const mejaId = params?.meja_id || 'Tidak Diketahui';

  // State Management
  const [menuData, setMenuData] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Memuat keranjang dari LocalStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${mejaId}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [mejaId]);

  // 2. Mengambil data sungguhan dari backend PHP saat halaman dimuat
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchKatalogMenu('Semua');
        setMenuData(data);
      } catch (error) {
        console.error("Gagal mengambil data dari server:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 3. Fungsi menambah pesanan ke keranjang dan menyimpannya ke LocalStorage
  const handleAddToCart = (id, name, price, stock) => {
  setCart((prevCart) => {
    const existingItem = prevCart.find(item => item.id === id);
    const currentQty = existingItem ? existingItem.qty : 0;

    if (currentQty >= stock) {
      alert(`Maaf, pesanan untuk "${name}" sudah mencapai batas stok yang tersedia (${stock} porsi).`);
      return prevCart;
    }

    let newCart;
    if (existingItem) {
      newCart = prevCart.map(item => 
        item.id === id ? { ...item, qty: item.qty + 1, stock: stock } : item
      );
    } else {
      newCart = [...prevCart, { id, name, price, qty: 1, stock: stock }];
    }
    
    // Simpan pembaruan ke LocalStorage
    localStorage.setItem(`cart_${mejaId}`, JSON.stringify(newCart));
    return newCart;
  });
};
  // Filter menu berdasarkan kategori
  const filteredMenu = activeCategory === 'Semua' 
    ? menuData 
    : menuData.filter(item => item.category === activeCategory);

  // Kalkulasi total item dan harga di keranjang
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Format angka Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* Header Aplikasi */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">RM Salero Minang</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Pemesanan Mandiri (QR-Ordering)</p>
          </div>
          <div className="bg-orange-100 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-lg flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 leading-none mb-1">Nomor</span>
            <span className="text-sm font-black leading-none">{mejaId.replace('-', ' ').toUpperCase()}</span>
          </div>
        </div>
        
        {/* Kategori Tab */}
        <div className="flex px-4 py-3 gap-2 overflow-x-auto max-w-md mx-auto hide-scrollbar border-t border-gray-100">
          {['Semua', 'Makanan', 'Minuman', 'Lauk Tambahan'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors
                ${activeCategory === cat 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Grid Katalog Menu */}
      <main className="max-w-md mx-auto px-4 pt-6 pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-orange-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-sm font-medium">Memuat menu dari dapur...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredMenu.map((item) => (
              <MenuCard 
                key={item.id}
                id={item.id}
                name={item.name}
                category={item.category}
                price={item.price}
                stock={item.stock}
                image={item.image}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
        
        {!isLoading && filteredMenu.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            Menu tidak ditemukan.
          </div>
        )}
      </main>

      {/* Floating Cart (Muncul jika ada item di keranjang) */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-transparent z-30 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <div className="bg-orange-600 rounded-2xl p-4 flex justify-between items-center shadow-lg shadow-orange-500/30">
              <div className="text-white">
                <p className="text-xs font-medium text-orange-200 mb-0.5">{totalItems} hidangan dipilih</p>
                <p className="font-bold text-lg leading-none">{formatRupiah(totalPrice)}</p>
              </div>
              
              <button 
                onClick={() => router.push(`/${mejaId}/keranjang`)}
                className="bg-white text-orange-600 font-bold px-5 py-2.5 rounded-xl text-sm active:scale-95 transition-transform"
              >
                Checkout ➔
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}