<?php
error_reporting(0);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

include 'koneksi.php';
$data = json_decode(file_get_contents("php://input"), true);
$id_transaksi = $conn->real_escape_string($data['id_transaksi']);

// Ubah status menjadi Completed (Selesai Dihidangkan)
$sql = "UPDATE tb_transaksi SET status = 'Completed' WHERE id_transaksi = '$id_transaksi'";

if ($conn->query($sql)) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Gagal menyelesaikan pesanan."]);
}
$conn->close();
?>