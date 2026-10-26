<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
// Hapus header Content-Type JSON karena kita menggunakan FormData (multipart)

include 'koneksi.php';

// Menangkap data dari FormData
$id_menu = $_POST['id_menu'] ?? '';
$nama_menu = $_POST['nama_menu'] ?? '';
$kategori = $_POST['kategori'] ?? '';
$harga = $_POST['harga'] ?? '';
$stok_porsi = $_POST['stok_porsi'] ?? '';

if (empty($id_menu)) {
    echo json_encode(["status" => "error", "message" => "ID Menu tidak ditemukan"]);
    exit;
}

// Persiapkan query dasar (tanpa update foto)
$query = "UPDATE tb_menu SET nama_menu = '$nama_menu', kategori = '$kategori', harga = '$harga', stok_porsi = '$stok_porsi'";

// Cek apakah ada file gambar baru yang diunggah
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = 'uploads/';
    
    // Buat nama file unik agar tidak bentrok
    $fileName = time() . '_' . basename($_FILES['image']['name']);
    $targetFilePath = $uploadDir . $fileName;

    // Pindahkan file ke folder uploads/
    if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFilePath)) {
        // Buat URL lengkap untuk disimpan ke database
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $domain = $_SERVER['HTTP_HOST'];
        $fileUrl = $protocol . "://" . $domain . "/api-salero-minang/" . $targetFilePath;

        // Tambahkan perintah update kolom gambar ke dalam query
        // CATATAN: Pastikan nama kolom di database Anda adalah 'image'. Jika namanya 'foto', ubah kata 'image' di bawah ini.
        $query .= ", image = '$fileUrl'"; 
    }
}

// Gunakan id_menu sebagai penentu baris yang diupdate
$query .= " WHERE id_menu = '$id_menu'"; // Sesuaikan dengan nama primary key di tabel Anda

if ($conn->query($query) === TRUE) {
    echo json_encode(["status" => "success", "message" => "Data menu berhasil diperbarui"]);
} else {
    echo json_encode(["status" => "error", "message" => "Gagal memperbarui data: " . $conn->error]);
}

$conn->close();
?>