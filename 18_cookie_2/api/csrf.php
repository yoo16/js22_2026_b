<?php
require 'session_init.php';
// ヘッダー設定：JSON形式で返却することを明示
header('Content-Type: application/json; charset=utf-8');

// TODO: 下の行は、どのオリジン(サイト)からのfetch/XHRでもこのレスポンスを読み取れるようにする設定です。
//       同一オリジンのlogin.htmlしか使わないこのAPIには不要かつ危険な設定です。
//       Same-Origin Policy がなぜCSRFトークンの漏えいを防いでくれているのかを確認したうえで、
//       この行を削除してください。
header('Access-Control-Allow-Origin: *');

// まだトークンが無ければ生成
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// JSONで返す
echo json_encode([
    'csrf_token' => $_SESSION['csrf_token']
]);