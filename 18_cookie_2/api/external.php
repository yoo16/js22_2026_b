<?php
// 「外部サイト（攻撃者が用意したサイト）」を模したページ
// このサイトへのリンクをクリックすると、リンク元ページのURLがRefererとして送られてくる
$referer = $_SERVER['HTTP_REFERER'] ?? '（Refererが送信されませんでした）';
?>
<!doctype html>
<html lang="ja">

<head>
    <meta charset="utf-8" />
    <title>外部サイト（攻撃者想定）</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>

<body class="bg-slate-100 p-8 text-slate-800">
    <div class="mx-auto max-w-2xl rounded-lg border border-rose-200 bg-white p-6 shadow-sm">
        <p class="text-sm font-semibold uppercase tracking-wider text-rose-600">External Site（攻撃者想定）</p>
        <h1 class="mt-2 text-xl font-bold text-slate-950">受け取った Referer ヘッダー</h1>
        <p class="mt-4 break-all rounded-md bg-slate-950 p-4 font-mono text-xs text-rose-300">
            <?= htmlspecialchars($referer) ?>
        </p>
        <p class="mt-4 text-sm leading-6 text-slate-600">
            リンク元ページのURLに含まれていたセッションID（leaksid）が、そのままこの「外部サイト」に届いています。
            サーバーのアクセスログにも同じ値が残るため、そのログを見られるだけでもセッションIDが漏れます。
        </p>
    </div>
</body>

</html>
