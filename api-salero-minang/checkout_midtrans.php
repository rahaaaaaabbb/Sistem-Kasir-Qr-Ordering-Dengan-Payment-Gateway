<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
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
$meja_id = $conn->real_escape_string($data['meja_id'] ?? '');
$items = $data['items'] ?? [];
$total_bayar = (int)($data['total_bayar'] ?? 0);

if (empty($items) || !is_array($items)) {
    die(json_encode(["error" => "Keranjang pesanan kosong."]));
}

$conn->begin_transaction();

try {
    // 1. Potong stok langsung
    foreach ($items as $item) {
        $id_menu = $conn->real_escape_string($item['id']);
        $qty = (int)$item['qty'];

        $update_stok = $conn->query("UPDATE tb_menu SET stok_porsi = stok_porsi - $qty WHERE id_menu = '$id_menu' AND stok_porsi >= $qty");

        if ($conn->affected_rows === 0) {
            $cek_nama = $conn->query("SELECT nama_menu, stok_porsi FROM tb_menu WHERE id_menu = '$id_menu'");
            $row_nama = $cek_nama ? $cek_nama->fetch_assoc() : null;
            $nama_menu = $row_nama['nama_menu'] ?? 'Menu';
            $sisa_stok = $row_nama['stok_porsi'] ?? 0;

            throw new Exception("Pesanan gagal: Stok '$nama_menu' tidak mencukupi (Tersisa: $sisa_stok porsi).");
        }
    }

    // 2. Simpan transaksi
    $id_transaksi = "TRX-" . date("YmdHis") . "-" . rand(100, 999);
    $tanggal = date("Y-m-d H:i:s");

    $sql_trx = "INSERT INTO tb_transaksi (id_transaksi, meja_id, tanggal, total_bayar, status) 
                VALUES ('$id_transaksi', '$meja_id', '$tanggal', $total_bayar, 'Pending')";
    if (!$conn->query($sql_trx)) {
        throw new Exception("Gagal simpan transaksi: " . $conn->error);
    }

    foreach ($items as $item) {
        $id_menu = $conn->real_escape_string($item['id']);
        $qty = (int)$item['qty'];
        $harga = (int)$item['price'];
        $conn->query("INSERT INTO tb_detail_transaksi (id_transaksi, id_menu, qty, harga) VALUES ('$id_transaksi', '$id_menu', $qty, $harga)");
    }

    $conn->commit();

} catch (Exception $e) {
    $conn->rollback();
    die(json_encode(["error" => $e->getMessage()]));
}

// 3. Request Token Snap Midtrans
$serverKey = ''; 

$payload = [
    "transaction_details" => [
        "order_id" => $id_transaksi,
        "gross_amount" => $total_bayar
    ],
    "customer_details" => [
        "first_name" => "Meja",
        "last_name" => $meja_id
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://app.sandbox.midtrans.com/snap/v1/transactions");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Accept: application/json",
    "Authorization: Basic " . base64_encode($serverKey . ":")
]);

$result = curl_exec($ch);
$err = curl_error($ch);
curl_close($ch);

if ($err) {
    die(json_encode(["error" => "Koneksi cURL Midtrans Gagal: " . $err]));
}

$midtrans = json_decode($result, true);
if (isset($midtrans['token'])) {
    echo json_encode(["success" => true, "token" => $midtrans['token'], "id_transaksi" => $id_transaksi]);
} else {
    echo json_encode(["error" => "Gagal mendapat Token Snap Midtrans", "detail" => $midtrans]);
}

$conn->close();
?>