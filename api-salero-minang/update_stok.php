<?php
include 'koneksi.php';
$data = json_decode(file_get_contents("php://input"));

if(isset($data->id_menu) && isset($data->stok_baru)) {
    $id = $conn->real_escape_string($data->id_menu);
    $stok = (int)$data->stok_baru;
    
    if ($conn->query("UPDATE tb_menu SET stok_porsi = $stok WHERE id_menu = '$id'")) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => "Gagal memperbarui stok: " . $conn->error]);
    }
}
$conn->close();
?>