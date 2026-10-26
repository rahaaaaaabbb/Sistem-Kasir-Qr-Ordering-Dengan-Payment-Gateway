<?php
error_reporting(0);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'koneksi.php';

$data = json_decode(file_get_contents("php://input"), true);
$id_transaksi = $conn->real_escape_string($data['id_transaksi'] ?? '');

// 1. Cek apakah transaksi ada dan statusnya Pending
$cek = $conn->query("SELECT status FROM tb_transaksi WHERE id_transaksi = '$id_transaksi' AND status = 'Pending'");
if (!$cek || $cek->num_rows === 0) {
    echo json_encode(["error" => "Transaksi tidak ditemukan atau sudah diproses."]);
    $conn->close();
    exit();
}

// 2. Kembalikan stok yang sebelumnya dipotong
$sql_items = "SELECT id_menu, qty FROM tb_detail_transaksi WHERE id_transaksi = '$id_transaksi'";
$res_items = $conn->query($sql_items);
while ($row = $res_items->fetch_assoc()) {
    $id_menu = $row['id_menu'];
    $qty = (int)$row['qty'];
    $conn->query("UPDATE tb_menu SET stok_porsi = stok_porsi + $qty WHERE id_menu = '$id_menu'");
}

// 3. Ubah status transaksi menjadi Cancelled
$conn->query("UPDATE tb_transaksi SET status = 'Cancelled' WHERE id_transaksi = '$id_transaksi'");

echo json_encode(["success" => true]);
$conn->close();
?>