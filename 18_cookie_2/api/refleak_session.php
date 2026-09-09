<?php
// use_only_cookies / use_trans_sid は「URLにセッションIDを乗せる」という
// 危険な使い方そのものが原因で、PHP 8.1以降は設定自体が非推奨になっている。
// このAPIはその危険な使い方をあえて再現するデモなので、非推奨警告だけ抑制する。
error_reporting(E_ALL & ~E_DEPRECATED);

// 【あえて脆弱にしてある実装】セッションIDをCookieではなくURLに乗せる設定
// login.html/api/session_init.php の sid Cookie セッションとは名前を分けている
session_name('leaksid');
ini_set('session.use_cookies', '0');      // Cookieを使わない
ini_set('session.use_only_cookies', '0'); // Cookie以外（URL）も許可する
ini_set('session.use_trans_sid', '1');    // 出力にセッションIDを自動的に付与する

session_start();
$_SESSION['user'] = 'demo-user';

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'sid' => session_id(),
    // セッションIDをクエリ文字列に埋め込んだURL
    'url' => 'refleak.html?' . session_name() . '=' . urlencode(session_id()),
]);
