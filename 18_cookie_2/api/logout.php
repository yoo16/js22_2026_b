<?php
// セッションCookie設定
require 'session_init.php';
// ヘッダー設定：JSON形式で返却することを明示
header('Content-Type: application/json; charset=utf-8');

// TODO: ログアウトも状態を変更する処理なので、CSRFトークンを検証する
//       ヒント: login.php の CSRFチェック部分を参考に、
//       $_SERVER['HTTP_X_CSRF_TOKEN'] とセッションの csrf_token を hash_equals() で比較し、
//       一致しなければ 403 を返して exit する

// セッション変数を空に
unset($_SESSION['user']);

// セッションCookieの削除（有効期限を過去に設定）
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    // Cookieを削除
    setcookie(
        session_name(), // name
        '',             // value: データを空にする
        time() - 42000, // expire: 過去の時間に設定して削除
        $params['path'],     // path
        $params['domain'],   // domain
        $params['secure'],   // secure
        $params['httponly']  // httponly
    );
}

// レスポンス返却
echo json_encode([
    'ok' => true,
    'message' => 'Logged out successfully'
]);
