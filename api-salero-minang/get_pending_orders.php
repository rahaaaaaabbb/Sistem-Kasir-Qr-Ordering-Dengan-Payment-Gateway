<?php
error_reporting(0);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include 'koneksi.php';

$sql = "SELECT * FROM tb_transaksi WHERE status = 'Pending' ORDER BY tanggal ASC";
$result = $conn->query($sql);
$orders = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $id_transaksi = $row['id_transaksi'];
        $items = [];
        
        // Ambil detail hidangan yang dipesan
        $sql_items = "SELECT d.*, m.nama_menu FROM tb_detail_transaksi d 
                      JOIN tb_menu m ON d.id_menu = m.id_menu 
                      WHERE d.id_transaksi = '$id_transaksi'";
        $res_items = $conn->query($sql_items);
        
        if($res_items && $res_items->num_rows > 0) {
            while($item = $res_items->fetch_assoc()) {
                $items[] = [
                    "id_menu" => $item['id_menu'],
                    "nama_menu" => $item['nama_menu'],
                    "qty" => (int)$item['qty'],
                    "price" => (int)$item['harga']
                ];
            }
        }
        $row['items'] = $items;
        $orders[] = $row;
    }
}
echo json_encode($orders);
$conn->close();
?>