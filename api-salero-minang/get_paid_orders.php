<?php
error_reporting(E_ALL); // Ubah dari 0 ke E_ALL untuk melihat jika ada error PHP
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include 'koneksi.php';

// Pastikan status di database sama persis dengan yang di-update (Case Sensitive)
$sql = "SELECT * FROM tb_transaksi WHERE status = 'Paid' ORDER BY tanggal ASC";
$result = $conn->query($sql);

if (!$result) {
    die(json_encode(["error" => "Query Gagal: " . $conn->error]));
}

$orders = [];
while($row = $result->fetch_assoc()) {
    $id_transaksi = $row['id_transaksi'];
    // Ambil detail item
    $sql_items = "SELECT d.*, m.nama_menu FROM tb_detail_transaksi d 
                  JOIN tb_menu m ON d.id_menu = m.id_menu 
                  WHERE d.id_transaksi = '$id_transaksi'";
    $res_items = $conn->query($sql_items);
    $items = [];
    while($item = $res_items->fetch_assoc()) {
        $items[] = [
            "id_menu" => $item['id_menu'],
            "nama_menu" => $item['nama_menu'],
            "qty" => (int)$item['qty']
        ];
    }
    $row['items'] = $items;
    $orders[] = $row;
}
echo json_encode($orders);
$conn->close();
?>