<?php
session_name('sid');
session_set_cookie_params([
    'lifetime' => 3600,
    'path'     => '/',
    'secure'   => false, // 本番は true
    // TODO: false のままだと JavaScript の document.cookie から sid が読み書きできてしまう。
    //       XSSで盗まれないよう、JSからアクセスできないようにする値へ修正する
    'httponly' => false,
    'samesite' => 'Lax',
]);
session_start();