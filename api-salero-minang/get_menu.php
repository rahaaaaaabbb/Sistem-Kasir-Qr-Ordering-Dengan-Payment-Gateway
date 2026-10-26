<?php
include 'koneksi.php';

// Menangkap parameter kategori dari frontend Next.js
$kategori = isset($_GET['kategori']) ? $_GET['kategori'] : 'Semua';

// Menyusun query SQL
$sql = "SELECT * FROM tb_menu";
if ($kategori !== 'Semua') {
    // Mencegah SQL Injection sederhana
    $kategori = $conn->real_escape_string($kategori);
    $sql .= " WHERE kategori = '$kategori'";
}

$result = $conn->query($sql);
$data = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        // Menyesuaikan nama key dengan yang dibutuhkan oleh MenuCard.jsx di Next.js
        $data[] = [
            'id' => $row['id_menu'],
            'name' => $row['nama_menu'],
            'category' => $row['kategori'],
            'price' => (int)$row['harga'],
            'stock' => (int)$row['stok_porsi'],
            'image' => $row['gambar']
        ];
    }
}

// Mengembalikan data dalam bentuk JSON
echo json_encode($data);
$conn->close();
?>