<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

include 'koneksi.php';
$raw_input = file_get_contents("php://input");
$data = json_decode($raw_input, true);

if (!$data || !isset($data['id_transaksi'])) {
    die(json_encode(["error" => "ID Transaksi tidak diterima."]));
}

$id_transaksi = $conn->real_escape_string($data['id_transaksi']);

// 1. CEK STATUS SAAT INI DI DATABASE
$cek = $conn->query("SELECT status FROM tb_transaksi WHERE id_transaksi = '$id_transaksi'");

if ($cek->num_rows == 0) {
    // JIKA TRANSAKSI TIDAK ADA SAMA SEKALI
    die(json_encode(["error" => "Pesanan $id_transaksi tidak tercatat di database!"]));
}

$row = $cek->fetch_assoc();

// 2. JIKA SUDAH PAID (Terkena panggilan ganda dari sistem frontend)
// Kita biarkan lolos sebagai sukses agar alert berhasil muncul, tapi JANGAN potong stok lagi!
if ($row['status'] == 'Paid') {
    echo json_encode(["success" => true, "message" => "Sudah diproses sebelumnya."]);
    exit();
}

// 3. JIKA MASIH PENDING, UBAH JADI PAID DAN EKSEKUSI NORMAL
$sql = "UPDATE tb_transaksi SET status = 'Paid' WHERE id_transaksi = '$id_transaksi'";

if ($conn->query($sql)) {
    // Potong Stok
    $sql_items = "SELECT id_menu, qty FROM tb_detail_transaksi WHERE id_transaksi = '$id_transaksi'";
    $res = $conn->query($sql_items);

    if ($res && $res->num_rows > 0) {
        while($item = $res->fetch_assoc()){
            $id_menu = $item['id_menu'];
            $qty = (int)$item['qty'];
            
            $conn->query"UPDATE tb_transaksi SET status = 'Paid' WHERE id_transaksi = '$id_transaksi'";
        }
    }
    
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Gagal update status transaksi: " . $conn->error]);
}

$conn->close();
?>