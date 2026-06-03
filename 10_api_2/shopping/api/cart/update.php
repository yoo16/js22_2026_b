<?php
session_start();
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? null;
$qty = intval($input['qty'] ?? 0);

if (!$id) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Product ID is required'
    ]);
    exit;
}

if ($id && isset($_SESSION['cart'])) {
    if ($qty > 0) {
        $_SESSION['cart'][$id] = $qty;
    } else {
        unset($_SESSION['cart'][$id]); // 0以下なら削除
    }
}

echo json_encode([
    'status' => 'success',
    'cart' => $_SESSION['cart'],
    'cartCount' => array_sum($_SESSION['cart'])
]);