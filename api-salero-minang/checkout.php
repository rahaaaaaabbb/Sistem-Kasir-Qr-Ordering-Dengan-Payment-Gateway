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
$meja_id = $conn->real_escape_string($data['meja_id'] ?? '');
$items = $data['items'] ?? [];
$total_bayar = (int)($data['total_bayar'] ?? 0);

if (empty($items) || !is_array($items)) {
    echo json_encode(["error" => "Keranjang pesanan kosong."]);
    $conn->close();
    exit();
}

// Mulai Database Transaction untuk menjamin konsistensi
$conn->begin_transaction();

try {
    // 1. Potong stok secara langsung dan atomik
    foreach ($items as $item) {
        $id_menu = $conn->real_escape_string($item['id']);
        $qty = (int)$item['qty'];

        // Kurangi stok HANYA jika stok masih mencukupi
        $update_stok = $conn->query("UPDATE tb_menu SET stok_porsi = stok_porsi - $qty WHERE id_menu = '$id_menu' AND stok_porsi >= $qty");

        // Jika tidak ada baris yang terpengaruh, berarti stok sudah habis/kurang
        if ($conn->affected_rows === 0) {
            $cek_nama = $conn->query("SELECT nama_menu, stok_porsi FROM tb_menu WHERE id_menu = '$id_menu'");
            $row_nama = $cek_nama ? $cek_nama->fetch_assoc() : null;
            $nama_menu = $row_nama['nama_menu'] ?? 'Menu';
            $sisa_stok = $row_nama['stok_porsi'] ?? 0;

            throw new Exception("Pesanan gagal: Stok '$nama_menu' tidak mencukupi atau baru saja dipesan pelanggan lain (Tersisa: $sisa_stok porsi).");
        }
    }

    // 2. Jika semua stok aman dan terpotong, simpan data transaksi
    $id_transaksi = "TRX-" . date("YmdHis") . "-" . rand(100, 999);
    $tanggal = date("Y-m-d H:i:s");

    $sql_trx = "INSERT INTO tb_transaksi (id_transaksi, meja_id, tanggal, total_bayar, status) 
                VALUES ('$id_transaksi', '$meja_id', '$tanggal', $total_bayar, 'Pending')";

    if (!$conn->query($sql_trx)) {
        throw new Exception("Gagal menyimpan data transaksi: " . $conn->error);
    }

    // 3. Simpan detail item pesanan
    foreach ($items as $item) {
        $id_menu = $conn->real_escape_string($item['id']);
        $qty = (int)$item['qty'];
        $harga = (int)$item['price'];
        $conn->query("INSERT INTO tb_detail_transaksi (id_transaksi, id_menu, qty, harga) VALUES ('$id_transaksi', '$id_menu', $qty, $harga)");
    }

    // Komit transaksi
    $conn->commit();
    echo json_encode(["success" => true, "id_transaksi" => $id_transaksi]);

} catch (Exception $e) {
    // Batalkan seluruh pemotongan jika ada salah satu menu yang gagal
    $conn->rollback();
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();
?>