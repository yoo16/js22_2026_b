<?php
session_start();
header('Content-Type: application/json');

echo json_encode([
    'status' => 'success',
    'cart' => $_SESSION['cart'] ?? [],
    'cartCount' => count($_SESSION['cart'] ?? [])
]);
