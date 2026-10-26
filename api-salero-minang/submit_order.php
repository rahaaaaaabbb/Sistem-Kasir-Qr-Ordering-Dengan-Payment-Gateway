<?php
include 'koneksi.php';

// Mengambil data mentah JSON yang dikirim dari Next.js
$data = json_decode(file_get_contents("php://input"));

// Memastikan data keranjang (items) tidak kosong
if(isset($data->items) && !empty($data->items)) {
    $meja_id = $conn->real_escape_string($data->meja_id);
    $total_bayar = (int)$data->total_bayar;
    
    // Menetapkan waktu saat ini
    date_default_timezone_set('Asia/Jakarta');
    $tanggal = date('Y-m-d H:i:s');
    
    // Menghasilkan ID Transaksi unik (Contoh: TR-20260806161625)
    $id_transaksi = "TR-" . date('YmdHis');
    
    // 1. Menyimpan data utama ke tb_transaksi dengan status 'Pending'
    $sql_transaksi = "INSERT INTO tb_transaksi (id_transaksi, meja_id, tanggal, total_bayar, status) 
                      VALUES ('$id_transaksi', '$meja_id', '$tanggal', $total_bayar, 'Pending')";
                      
    if ($conn->query($sql_transaksi) === TRUE) {
        $success = true;
        
        // 2. Menyimpan setiap hidangan ke tb_detail_transaksi
        foreach($data->items as $item) {
            $id_menu = $conn->real_escape_string($item->id);
            $qty = (int)$item->qty;
            $subtotal = $qty * (int)$item->price;
            
            $sql_detail = "INSERT INTO tb_detail_transaksi (id_transaksi, id_menu, qty, subtotal) 
                           VALUES ('$id_transaksi', '$id_menu', $qty, $subtotal)";
            
            if(!$conn->query($sql_detail)) {
                $success = false;
            }
        }
        
        if($success) {
            // Memberikan respon sukses kembali ke Next.js
            echo json_encode([
                "success" => true, 
                "transaction_id" => $id_transaksi, 
                "status" => "Pending"
            ]);
        } else {
            echo json_encode(["error" => "Gagal menyimpan rincian pesanan."]);
        }
    } else {
        echo json_encode(["error" => "Gagal membuat transaksi: " . $conn->error]);
    }
} else {
    echo json_encode(["error" => "Keranjang pesanan kosong."]);
}

$conn->close();
?>