<?php
// ============================================================
// spots.php - サンプルスポットを JSON で返すモック API
// ============================================================

header('Content-Type: application/json; charset=utf-8');

$spots = [
    [
        'name' => '東京タワー',
        'position' => [
            'lat' => 35.658581,
            'lng' => 139.745433,
        ],
        'address' => '東京都港区芝公園4丁目2-8',
    ],
    [
        'name' => '浅草寺',
        'position' => [
            'lat' => 35.714765,
            'lng' => 139.796655,
        ],
        'address' => '東京都台東区浅草2丁目3-1',
    ],
    [
        'name' => '新宿御苑',
        'position' => [
            'lat' => 35.685176,
            'lng' => 139.710052,
        ],
        'address' => '東京都新宿区内藤町11',
    ],
];

echo json_encode($spots, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
