<?php
include 'koneksi.php';
$data = json_decode(file_get_contents("php://input"));

if(isset($data->username) && isset($data->password)) {
    $username = $conn->real_escape_string($data->username);
    $password = $conn->real_escape_string($data->password);
    
    $sql = "SELECT id_user, nama_lengkap, role FROM tb_user WHERE username = '$username' AND password = '$password'";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        echo json_encode(["success" => true, "user" => $user]);
    } else {
        echo json_encode(["error" => "Username atau password salah"]);
    }
} else {
    echo json_encode(["error" => "Data tidak lengkap"]);
}
$conn->close();
?>