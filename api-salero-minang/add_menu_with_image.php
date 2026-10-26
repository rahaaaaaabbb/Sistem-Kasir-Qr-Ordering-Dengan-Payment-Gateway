<?php
// 1. Sembunyikan pesan error bawaan PHP agar tidak merusak format balasan JSON
error_reporting(0);

// 2. Izinkan lalu lintas data lintas port (CORS) untuk pengiriman FormData (Gambar)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Tangani metode "Preflight" OPTIONS dari browser
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'koneksi.php';

if(isset($_POST['id_menu'])) {
    $id = $conn->real_escape_string($_POST['id_menu']);
    $nama = $conn->real_escape_string($_POST['nama_menu']);
    $kategori = $conn->real_escape_string($_POST['kategori']);
    $harga = (int)$_POST['harga'];
    $stok = (int)$_POST['stok_porsi'];
    $gambar_path = "";

    // 3. Buat folder 'uploads' secara otomatis jika Anda belum sempat membuatnya
    if (!is_dir('uploads')) {
        mkdir('uploads', 0777, true);
    }

    // Proses Unggah Gambar jika kasir melampirkan foto
    if(isset($_FILES['gambar']) && $_FILES['gambar']['error'] === UPLOAD_ERR_OK) {
        // Bersihkan nama file dari spasi atau karakter aneh
        $nama_file = time() . '_' . preg_replace("/[^a-zA-Z0-9.]/", "", basename($_FILES['gambar']['name']));
        $target_file = "uploads/" . $nama_file;
        
        if(move_uploaded_file($_FILES['gambar']['tmp_name'], $target_file)) {
            $gambar_path = "http://localhost/api-salero-minang/" . $target_file;
        }
    }
    
    // 4. Cek apakah ID Menu sudah dipakai (mencegah error database "Duplicate Entry")
    $cek_id = $conn->query("SELECT id_menu FROM tb_menu WHERE id_menu = '$id'");
    if($cek_id->num_rows > 0) {
        echo json_encode(["error" => "ID Menu '$id' sudah dipakai! Silakan gunakan ID lain."]);
        exit();
    }
    
    // Eksekusi penyimpanan ke MySQL
    $sql = "INSERT INTO tb_menu (id_menu, nama_menu, kategori, harga, stok_porsi, gambar) 
            VALUES ('$id', '$nama', '$kategori', $harga, $stok, '$gambar_path')";
            
    if ($conn->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => "Gagal menyimpan ke database: " . $conn->error]);
    }
} else {
    // 5. Beri tahu jika data gagal masuk (biasanya karena foto terlalu besar)
    echo json_encode(["error" => "Data formulir kosong. Jika Anda mengunggah foto, pastikan ukurannya di bawah 2MB."]);
}

$conn->close();
?>