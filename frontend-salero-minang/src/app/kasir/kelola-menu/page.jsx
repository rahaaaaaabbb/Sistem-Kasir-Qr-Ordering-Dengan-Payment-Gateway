"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KelolaMenuKasir() {
  const router = useRouter();
  const [menuData, setMenuData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id_menu: "",
    nama_menu: "",
    kategori: "",
    harga: "",
    stok_porsi: "",
    image_file: null, 
    image_preview: ""
  });

  const API_URL = "http://localhost/api-salero-minang";

  const fetchMenu = async () => {
    try {
      const response = await fetch(`${API_URL}/get_menu.php`, { cache: 'no-store' });
      const text = await response.text(); 
      const data = text ? JSON.parse(text) : [];

      if (Array.isArray(data)) {
        setMenuData(data);
      } else if (data && Array.isArray(data.data)) {
        setMenuData(data.data);
      } else if (data && Array.isArray(data.menu)) {
        setMenuData(data.menu);
      } else {
        setMenuData([]);
      }
    } catch (error) {
      console.error("Gagal memuat menu:", error);
      setMenuData([]); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const formatRupiah = (number) => {
    let cleanNumber = number;
    if (typeof number === 'string') {
      cleanNumber = number.replace(/[^0-9]/g, '');
    }
    const validNumber = Number(cleanNumber) || 0;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(validNumber);
  };

  const handleEditClick = (menu) => {
    setFormData({
      id_menu: menu.id || "",
      nama_menu: menu.name || "",
      kategori: menu.category || "",
      harga: menu.price || "",
      stok_porsi: menu.stock || "",
      image_file: null,
      image_preview: menu.image || "" 
    });
    setIsModalOpen(true);
  };

  // Menangani perubahan file
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        image_file: e.target.files[0]
      });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append("id_menu", formData.id_menu);
    submitData.append("nama_menu", formData.nama_menu);
    submitData.append("kategori", formData.kategori);
    submitData.append("harga", formData.harga);
    submitData.append("stok_porsi", formData.stok_porsi);
    
    if (formData.image_file) {
      submitData.append("image", formData.image_file);
    }

    try {
      const response = await fetch(`${API_URL}/update_menu.php`, {
        method: "POST",
        body: submitData,
      });

      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      
      if (result.status === "success") {
        alert("Data dan foto menu berhasil diperbarui!");
        setIsModalOpen(false);
        fetchMenu(); 
      } else {
        alert("Gagal memperbarui: " + (result.message || "Kesalahan server"));
      }
    } catch (error) {
      console.error("Kesalahan jaringan saat update:", error);
      alert("Terjadi kesalahan koneksi ke server.");
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-8 border-b border-gray-200 pb-4">
        <button onClick={() => router.back()} className="text-sm font-bold text-orange-600 mb-2 flex items-center gap-1 hover:underline">
          ← Kembali
        </button>
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Kelola Data Menu</h1>
        <p className="text-gray-500 font-medium mt-1">Ubah gambar, harga, kategori, dan sisa stok hidangan.</p>
      </header>

      {/* Tampilan Grid Menu */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500 font-semibold">Memuat data menu...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuData && menuData.length > 0 ? (
            menuData.map((menu, index) => (
              <div key={menu.id || index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between overflow-hidden">
                <div>
                  {/* Tampilkan Gambar Menu */}
                  {menu.image ? (
                    <img 
                      src={menu.image} 
                      alt={menu.name} 
                      className="w-full h-40 object-cover rounded-xl mb-4 border border-gray-100"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-gray-400 border border-gray-200">
                      Tidak ada foto
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800 capitalize line-clamp-1">{menu.name}</h3>
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded shrink-0">
                      {menu.category}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 mb-4">{formatRupiah(menu.price)}</p>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-sm text-gray-500">Stok Tersedia:</span>
                    <span className={`font-bold ${menu.stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                      {menu.stock}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleEditClick(menu)}
                  className="w-full bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white font-bold py-2 px-4 rounded-lg transition-colors border border-orange-200"
                >
                  Ubah Data
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 font-medium">Data menu belum tersedia.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Form Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Ubah Rincian Menu</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              
              {/* Bagian Ubah Foto */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Foto Hidangan</label>
                {formData.image_preview && !formData.image_file && (
                   <img src={formData.image_preview} alt="Preview Lama" className="w-full h-32 object-cover rounded-lg mb-3 border border-gray-200" />
                )}
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                />
                <p className="text-xs text-gray-400 mt-1">*Kosongkan jika tidak ingin mengganti foto</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ketik Nama Menu</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={formData.nama_menu}
                  onChange={(e) => setFormData({...formData, nama_menu: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ketik Kategori Menu</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={formData.kategori}
                  onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Harga Satuan (Rp)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    value={formData.harga}
                    onChange={(e) => setFormData({...formData, harga: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah Stok</label>
                  <input 
                    type="number" 
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    value={formData.stok_porsi}
                    onChange={(e) => setFormData({...formData, stok_porsi: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}