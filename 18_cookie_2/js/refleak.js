(() => {
    const $ = (sel) => document.querySelector(sel);
    const out = (v) => { $("#out").textContent = JSON.stringify(v, null, 2); };

    window.addEventListener("DOMContentLoaded", () => {
        // ① セッションを開始し、セッションIDが乗ったURLへ移動する
        $("#start-session").addEventListener("click", async () => {
            const res = await fetch("./api/refleak_session.php");
            const data = await res.json();
            out(data);
            const absoluteUrl = new URL(data.url, location.href).href;
            $("#issued-url").textContent = absoluteUrl;

            // アドレスバーにセッションIDを反映させる（履歴に残さず置き換え）
            history.replaceState(null, "", data.url);
        });

        // ② 外部サイト（広告）へのリンクを開く
        // href はそのまま。target="_blank" でもリンク元URL（セッションID付き）は
        // 既定の Referrer-Policy では Referer ヘッダーとして相手サイトに送られる
    });
})();
