
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api-salero-minang';

/**
 * Mengambil daftar menu dari database MySQL melalui PHP.
 * @param {string} kategori - Kategori menu (Semua, Makanan, Minuman)
 * @returns {Promise<Array>} Data array katalog menu
 */
export const fetchKatalogMenu = async (kategori = 'Semua') => {
  try {
    // Menambahkan parameter query untuk filter kategori jika diperlukan
    const response = await fetch(`${API_BASE_URL}/get_menu.php?kategori=${kategori}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Hapus cache agar pelanggan selalu melihat ketersediaan stok porsi secara real-time
      cache: 'no-store', 
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil data menu dari server');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetchKatalogMenu:', error);
    return []; // Mengembalikan array kosong jika terjadi error
  }
};

/**
 * Mengirimkan data pesanan pelanggan ke sistem backend.
 * @param {string} mejaId - Nomor meja pemesan (dari QR Code)
 * @param {Array} cart - Daftar item yang dipesan
 * @param {number} totalBayar - Total tagihan keseluruhan
 * @returns {Promise<Object>} Respon dari server (misal: ID Transaksi & Status)
 */
export const submitPesanan = async (mejaId, cart, totalBayar) => {
  try {
    const response = await fetch(`${API_BASE_URL}/submit_order.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Mengubah objek JavaScript menjadi JSON string untuk diproses PHP
      body: JSON.stringify({
        meja_id: mejaId,
        items: cart,
        total_bayar: totalBayar,
        tanggal: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Gagal mengirim pesanan');
    }

    const data = await response.json();
    return data; // Contoh ekspektasi return: { success: true, transaction_id: 'TR-123456', status: 'Pending' }
  } catch (error) {
    console.error('Error submitPesanan:', error);
    throw error;
  }
};

/**
 * Mengecek status pesanan secara berkala (Polling).
 * @param {string} transactionId - ID Transaksi unik
 * @returns {Promise<Object>} Detail status terbaru dari pesanan
 */
export const checkStatusPesanan = async (transactionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/check_status.php?id=${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Gagal mengecek status pesanan');
    }

    const data = await response.json();
    return data; // Contoh ekspektasi return: { status: 'Paid' }
  } catch (error) {
    console.error('Error checkStatusPesanan:', error);
    throw error;
  }
};