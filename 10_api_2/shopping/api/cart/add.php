<?php
session_start();
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? null;

if (!$id) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Product ID is required'
    ]);
    exit;
}

if (!isset($_SESSION['cart'])) $_SESSION['cart'] = [];

// すでに存在すれば+1、なければ1を代入
if (isset($_SESSION['cart'][$id])) {
    $_SESSION['cart'][$id]++;
} else {
    $_SESSION['cart'][$id] = 1;
}

echo json_encode([
    'status' => 'success',
    'cart' => $_SESSION['cart'], // 連想配列を返す
    'cartCount' => array_sum($_SESSION['cart']) // 合計個数
]);
