<?php
include 'koneksi.php';
$data = json_decode(file_get_contents("php://input"));

if(isset($data->id_menu) && isset($data->nama_menu)) {
    $id = $conn->real_escape_string($data->id_menu);
    $nama = $conn->real_escape_string($data->nama_menu);
    $kategori = $conn->real_escape_string($data->kategori);
    $harga = (int)$data->harga;
    $stok = (int)$data->stok_porsi;
    
    $sql = "INSERT INTO tb_menu (id_menu, nama_menu, kategori, harga, stok_porsi, gambar) 
            VALUES ('$id', '$nama', '$kategori', $harga, $stok, '')";
            
    if ($conn->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => "Gagal menambah menu: " . $conn->error]);
    }
}
$conn->close();
?>