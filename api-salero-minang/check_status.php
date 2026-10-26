<?php
include 'koneksi.php';

// Menangkap parameter meja_id dari URL
$meja_id = isset($_GET['meja_id']) ? $conn->real_escape_string($_GET['meja_id']) : '';

if ($meja_id !== '') {
    // Mencari 1 pesanan paling baru dari meja tersebut berdasarkan waktu (tanggal)
    $sql = "SELECT id_transaksi, status FROM tb_transaksi 
            WHERE meja_id = '$meja_id' 
            ORDER BY tanggal DESC LIMIT 1";
            
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        echo json_encode([
            "success" => true, 
            "id_transaksi" => $row['id_transaksi'], 
            "status" => $row['status']
        ]);
    } else {
        echo json_encode(["error" => "Tidak ada pesanan ditemukan"]);
    }
} else {
    echo json_encode(["error" => "Parameter meja_id tidak valid"]);
}

$conn->close();
?>