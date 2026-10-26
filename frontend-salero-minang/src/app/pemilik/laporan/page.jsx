"use client";

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from 'next/navigation';

export default function AnalitikLaporan() {
  const router = useRouter();
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [topMenu, setTopMenu] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Filter Laporan
  const [jenisFilter, setJenisFilter] = useState("semua");
  const [filterHari, setFilterHari] = useState("");
  const [filterBulan, setFilterBulan] = useState("");
  const [filterTahun, setFilterTahun] = useState("");

  const API_URL = 'http://localhost/api-salero-minang';

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        const response = await fetch(`${API_URL}/get_analitik.php`, { cache: 'no-store' });
        const data = await response.json();
        setChartData(data.chart || []);
        setTableData(data.laporan || []);
        setTopMenu(data.top_menu || []);
      } catch (error) {
        console.error("Gagal memuat analitik:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLaporan();
  }, []);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  // --- LOGIKA FILTER TRANSAKSI ---
  const dataTersaring = useMemo(() => {
    return tableData.filter((trx) => {
      if (jenisFilter === "semua") return true;

      const tanggalItem = trx.Waktu ? trx.Waktu.split(" ")[0] : "";

      if (jenisFilter === "harian" && filterHari) {
        return tanggalItem === filterHari;
      }
      if (jenisFilter === "bulanan" && filterBulan) {
        return tanggalItem.startsWith(filterBulan);
      }
      if (jenisFilter === "tahunan" && filterTahun) {
        return tanggalItem.startsWith(filterTahun);
      }

      return true;
    });
  }, [tableData, jenisFilter, filterHari, filterBulan, filterTahun]);

  // --- FUNGSI EKSPOR EXCEL ---
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(dataTersaring);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Transaksi");
    XLSX.writeFile(workbook, `Laporan_Salero_Minang_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Judul PDF Dinamis mengikuti filter
    let judul = "Laporan Transaksi Keseluruhan";
    if (jenisFilter === "harian" && filterHari) judul = `Laporan Harian (${filterHari})`;
    if (jenisFilter === "bulanan" && filterBulan) judul = `Laporan Bulanan (${filterBulan})`;
    if (jenisFilter === "tahunan" && filterTahun) judul = `Laporan Tahunan (${filterTahun})`;

    doc.text(judul, 14, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString()}`, 14, 22);

    const tableColumn = ["ID Transaksi", "Meja", "Waktu", "Total Pembayaran", "Status"];
    const tableRows = dataTersaring.map((trx) => [
      trx.ID,
      trx.Meja ? trx.Meja.toUpperCase() : '-',
      trx.Waktu,
      formatRupiah(trx.Total),
      trx.Status
    ]);

    // --- LOGIKA MENGHITUNG TOTAL KESELURUHAN ---
    const totalPendapatan = dataTersaring.reduce((total, trx) => total + parseInt(trx.Total), 0);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      // --- LOGIKA MENAMPILKAN FOOTER TABEL ---
      foot: [
        [
          { 
            content: "TOTAL PENDAPATAN", 
            colSpan: 3, 
            styles: { halign: 'right', fontStyle: 'bold', fillColor: [243, 244, 246], textColor: [0, 0, 0] } 
          },
          { 
            content: formatRupiah(totalPendapatan), 
            styles: { fontStyle: 'bold', fillColor: [234, 88, 12], textColor: [255, 255, 255] } 
          },
          { 
            content: "", 
            styles: { fillColor: [243, 244, 246] } 
          }
        ]
      ],
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 88, 12] } 
    });

    doc.save(`Laporan_Salero_Minang_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <header className="mb-8 border-b border-gray-200 pb-4 flex justify-between items-end">
        <div>
          <button onClick={() => router.back()} className="text-sm font-bold text-orange-600 mb-2 flex items-center gap-1 hover:underline">
            ← Kembali
          </button>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Analitik & Laporan</h1>
          <p className="text-gray-500 font-medium mt-1">Pantau tren pendapatan, menu terlaris, dan cetak dokumen.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
            Unduh Excel
          </button>
          <button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
            Unduh PDF
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Memuat visualisasi data...</div>
      ) : (
        <>
          {/* BAGIAN ATAS: GRAFIK & MENU LARIS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Visualisasi Grafik Pendapatan */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 h-96">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Tren Pendapatan 7 Hari Terakhir</h2>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6B7280', fontSize: 12}}
                    tickFormatter={(value) => `Rp${value / 1000}k`}
                  />
                  <Tooltip 
                    formatter={(value) => formatRupiah(value)}
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="pendapatan" fill="#EA580C" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Menu Paling Laris */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-96 overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Top 5 Menu Terlaris</h2>
              <ul className="space-y-4">
                {topMenu.length > 0 ? (
                  topMenu.map((menu, idx) => (
                    <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-sm">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-gray-800 capitalize">{menu.nama_menu}</p>
                          <p className="text-xs text-gray-500">{menu.kategori}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900">{menu.total_terjual}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Porsi</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-10">Data menu belum tersedia.</p>
                )}
              </ul>
            </div>
          </div>

          {/* KONTROL FILTER & TABEL RIWAYAT TRANSAKSI */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-wrap gap-4 items-end justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Filter Riwayat Transaksi</h2>
              
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col">
                  <select 
                    className="border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={jenisFilter}
                    onChange={(e) => {
                      setJenisFilter(e.target.value);
                      setFilterHari("");
                      setFilterBulan("");
                      setFilterTahun("");
                    }}
                  >
                    <option value="semua">Semua Waktu</option>
                    <option value="harian">Harian</option>
                    <option value="bulanan">Bulanan</option>
                    <option value="tahunan">Tahunan</option>
                  </select>
                </div>

                {jenisFilter === "harian" && (
                  <input type="date" 
                    className="border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={filterHari} 
                    onChange={(e) => setFilterHari(e.target.value)} 
                  />
                )}
                {jenisFilter === "bulanan" && (
                  <input type="month" 
                    className="border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={filterBulan} 
                    onChange={(e) => setFilterBulan(e.target.value)} 
                  />
                )}
                {jenisFilter === "tahunan" && (
                  <input type="number" 
                    placeholder="Contoh: 2026" 
                    className="border border-gray-300 rounded-lg p-2 text-sm w-32 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={filterTahun} 
                    onChange={(e) => setFilterTahun(e.target.value)} 
                  />
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="p-4 font-bold">Waktu Transaksi</th>
                    <th className="p-4 font-bold">ID Transaksi</th>
                    <th className="p-4 font-bold">No. Meja</th>
                    <th className="p-4 font-bold">Total Pembayaran</th>
                    <th className="p-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dataTersaring.map((trx) => (
                    <tr key={trx.ID} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">{trx.Waktu}</td>
                      <td className="p-4 text-sm font-mono text-gray-500">{trx.ID}</td>
                      <td className="p-4 font-bold text-gray-800 uppercase">{trx.Meja ? trx.Meja.replace('-', ' ') : '-'}</td>
                      <td className="p-4 font-black text-gray-900">{formatRupiah(trx.Total)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${trx.Status === 'Completed' ? 'bg-green-100 text-green-700' : 
                            trx.Status === 'Paid' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {trx.Status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {dataTersaring.length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Belum ada data transaksi pada periode ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}