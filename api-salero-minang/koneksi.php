<?php
// Mengizinkan Next.js (port 3000) untuk mengakses API PHP ini (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$host = "localhost";
$user = "root"; // Username default XAMPP
$pass = "";     // Password default XAMPP (biasanya kosong)
$db   = "db_salero_minang";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(["error" => "Koneksi database gagal: " . $conn->connect_error]));
}
?>