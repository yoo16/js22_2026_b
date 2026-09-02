// Cookieのキー: ユーザー名
const KEY = "account_name";

// Cookieのキー: 広告バナーを閉じたかどうか
const AD_KEY = "ad_closed";
const adBanner = document.getElementById("adBanner");

// 初期表示
showCookies();

// 前回閉じていれば（Cookieが残っていれば）、最初から広告を非表示にする
// ※ cookie.js の関数は使わず、document.cookie の基本文法だけで実装する
// TODO: document.cookie に `${AD_KEY}=` という文字列が含まれているか確認し、
//       含まれていれば adBanner.classList.add("hidden"); を実行する

// 閉じるボタン：7日間（60秒×60分×24時間×7日）表示しないようCookieに記録する
document.getElementById("adCloseBtn").addEventListener("click", () => {
    // TODO: document.cookie に `${AD_KEY}=1; path=/; max-age=${60 * 60 * 24 * 7}` を代入する
    adBanner.classList.add("hidden");
    showCookies();
});

// リセットボタン：有効期限を過去にしてCookieを削除し、次回から再び広告を表示する
document.getElementById("adResetBtn").addEventListener("click", () => {
    // TODO: document.cookie に `${AD_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT` を代入する
    adBanner.classList.remove("hidden");
    showCookies();
});

// Cookie一覧表示
function showCookies() {
    // Cookie全体表示
    document.getElementById("cookies").textContent = document.cookie || "(なし)";
    // account_name表示
    document.getElementById("account_name").value = getCookie(KEY);
}

// UI切り替え
document.getElementById("mode").addEventListener("change", (e) => {
    const mode = e.target.value;
    // 有効期限
    document.getElementById("expiresField").classList.toggle("hidden", mode !== "expires");
    // 最大有効期間
    document.getElementById("maxAgeField").classList.toggle("hidden", mode !== "max-age");
});


// 保存ボタン
document.getElementById("saveBtn").addEventListener("click", () => {
    const mode = document.getElementById("mode").value;
    // 有効期限、最大有効期間 取得
    const expires = document.getElementById("expires").value;
    const maxAge = document.getElementById("maxAge").value;

    // account_name 取得
    const value = document.getElementById("account_name").value;
    // Cookie保存
    setCookie(KEY, value, mode, expires, maxAge);
    // 表示更新
    showCookies();
});

// 削除ボタン
document.getElementById("deleteBtn").addEventListener("click", () => {
    // Cookie削除
    deleteCookie(KEY);
    // document.cookie = "account_name=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";

    // 表示更新
    showCookies();
});

// 全削除
document.getElementById("deleteAllBtn").addEventListener("click", () => {
    if (!confirm("すべてのCookieを削除しますか？")) {
        return;
    }
    // Cookie削除
    deleteAllCookies();
    // 表示更新
    showCookies();
});