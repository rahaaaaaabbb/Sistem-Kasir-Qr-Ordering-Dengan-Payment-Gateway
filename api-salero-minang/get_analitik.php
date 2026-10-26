<?php
// Pastikan header merespons sebagai JSON (opsional tapi sangat disarankan untuk React/Next.js)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include 'koneksi.php';
date_default_timezone_set('Asia/Jakarta');

// 1. AMBIL DATA MENU TERLARIS (TOP 5)
$topMenuData = [];
$queryTopMenu = "SELECT m.nama_menu, m.kategori, SUM(dt.qty) as total_terjual 
                 FROM tb_detail_transaksi dt 
                 JOIN tb_menu m ON dt.id_menu = m.id_menu 
                 JOIN tb_transaksi t ON dt.id_transaksi = t.id_transaksi
                 WHERE t.status IN ('Paid', 'Completed') 
                 GROUP BY dt.id_menu 
                 ORDER BY total_terjual DESC 
                 LIMIT 5";

// Eksekusi query Top Menu
$res_top = $conn->query($queryTopMenu);
if ($res_top && $res_top->num_rows > 0) {
    while($row = $res_top->fetch_assoc()) {
        $topMenuData[] = [
            "nama_menu" => $row['nama_menu'],
            "kategori" => $row['kategori'],
            "total_terjual" => (int)$row['total_terjual']
        ];
    }
}

// 2. AMBIL DATA PENDAPATAN 7 HARI TERAKHIR UNTUK GRAFIK (CHART)
$chartData = [];
for($i = 6; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $displayDate = date('d M', strtotime($date));
    
    $sql_chart = "SELECT SUM(total_bayar) as total FROM tb_transaksi 
                  WHERE DATE(tanggal) = '$date' AND status IN ('Paid', 'Completed')";
    $res_chart = $conn->query($sql_chart);
    $total = $res_chart->fetch_assoc()['total'] ?? 0;
    
    $chartData[] = [
        "tanggal" => $displayDate,
        "pendapatan" => (int)$total
    ];
}

// 3. AMBIL RINCIAN SELURUH TRANSAKSI UNTUK TABEL LAPORAN EKSPOR
$tableData = [];
$sql_table = "SELECT id_transaksi, meja_id, tanggal, total_bayar, status 
              FROM tb_transaksi 
              ORDER BY tanggal DESC";
$res_table = $conn->query($sql_table);

if ($res_table && $res_table->num_rows > 0) {
    while($row = $res_table->fetch_assoc()) {
        $tableData[] = [
            "ID" => $row['id_transaksi'],
            "Meja" => $row['meja_id'],
            "Waktu" => $row['tanggal'],
            "Total" => (int)$row['total_bayar'],
            "Status" => $row['status']
        ];
    }
}

// 4. GABUNGKAN SEMUA DATA DAN KIRIM SEBAGAI JSON
echo json_encode([
    "chart" => $chartData,
    "laporan" => $tableData,
    "top_menu" => $topMenuData // Data ini sekarang akan terbaca oleh frontend Next.js Anda
]);

$conn->close();
?>