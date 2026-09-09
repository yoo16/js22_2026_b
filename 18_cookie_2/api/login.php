<?php
// テスト用ユーザ
require 'test_user.php';
if (!isset($user)) {
    http_response_code(500);
    echo json_encode(['error' => 'Test user not found']);
    exit;
}

// セッションCookie設定
require 'session_init.php';

// POST 以外は拒否
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}
// ヘッダー設定：JSON形式で返却することを明示
header('Content-Type: application/json; charset=utf-8');

// CSRFチェック
$client_token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $client_token)) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid CSRF token']);
    exit;
}

// 入力取得
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if ($email === $user['email'] && password_verify($password, $user['hash_password'])) {
    // TODO: セッション固定化攻撃対策として、ログイン成功のタイミングでセッションIDを再発行する
    //       ヒント: session_regenerate_id(true);

    unset($user['hash_password']);
    // セッション変数にユーザ情報を保存
    $_SESSION['user'] = $user;

    // 認証成功時に CSRFトークンを発行・保存
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

    // レスポンスにCSRFトークンを含めてもOK（JSに返す）
    echo json_encode([
        'ok' => true,
        'message' => 'logged in',
        'csrf_token' => $_SESSION['csrf_token'],
    ]);
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
}
