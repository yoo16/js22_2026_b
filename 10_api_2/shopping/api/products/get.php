<?php
header('Content-Type: application/json; charset=utf-8');

$filePath = __DIR__ . '/../../data/products.json';

if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'products.json が見つかりません',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$json = file_get_contents($filePath);

if ($json === false) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => '商品データを読み込めませんでした',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo $json;
