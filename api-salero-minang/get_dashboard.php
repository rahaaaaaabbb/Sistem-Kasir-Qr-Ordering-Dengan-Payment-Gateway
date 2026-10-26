<?php
include 'koneksi.php';

date_default_timezone_set('Asia/Jakarta');
$today = date('Y-m-d');

// Mengkalkulasi total pendapatan hari ini (Hanya pesanan Lunas/Selesai)
$sql_rev = "SELECT SUM(total_bayar) as total FROM tb_transaksi 
            WHERE DATE(tanggal) = '$today' AND status IN ('Paid', 'Completed')";
$result_rev = $conn->query($sql_rev);
$pendapatan = $result_rev->fetch_assoc()['total'] ?? 0;

// Menghitung jumlah transaksi hari ini
$sql_count = "SELECT COUNT(id_transaksi) as pesanan FROM tb_transaksi WHERE DATE(tanggal) = '$today'";
$result_count = $conn->query($sql_count);
$total_pesanan = $result_count->fetch_assoc()['pesanan'] ?? 0;

echo json_encode([
    "pendapatan_hari_ini" => (int)$pendapatan,
    "total_pesanan" => (int)$total_pesanan
]);
$conn->close();
?>