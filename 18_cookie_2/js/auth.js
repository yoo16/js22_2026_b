(() => {
    let csrfToken = null;
    const $ = (sel) => document.querySelector(sel);
    const out = (v) => { $("#out").textContent = JSON.stringify(v, null, 2); };
    const csrfTokenElement = $("#csrf-token");
    const formMessage = $("#form-message");

    // 右側フォームにエラー/成功メッセージを表示する
    function showMessage(type, text) {
        if (!formMessage) return;
        formMessage.textContent = text;
        formMessage.classList.remove("hidden");
        formMessage.className = type === "success"
            ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
            : "rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700";
    }

    // CSRFトークンを初期化
    initCsrf();

    // CSRFトークンを取得する
    async function initCsrf() {
        // api/csrf.php からCSRFトークンを取得
        // TODO: セッションCookie(sid)を一緒に送るよう credentials を設定する
        //       ヒント: "same-origin" または "include"
        const res = await fetch("./api/csrf.php", {
            credentials: "same-origin"
        });
        const data = await res.json();
        csrfToken = data.csrf_token;
        csrfTokenElement.textContent = csrfToken;
    }

    // POSTでJSONを送信する
    async function postJSON(url, body) {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // TODO: CSRFトークンをヘッダーにセットする（キー名: X-CSRF-Token）
                //       ヒント: csrfToken が入っていればスプレッド構文で追加する
                ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
            },
            // TODO: セッションCookie(sid)を送れるよう credentials を設定する
            credentials: "omit",
            body: JSON.stringify(body),
        });
        let data = await res.json();
        if (!res.ok) throw { status: res.status, data };
        return data;
    }

    window.addEventListener("DOMContentLoaded", () => {
        // POST: api/login.php
        $("#login").addEventListener("click", async () => {
            const email = $("#email").value;
            const password = $("#password").value;
            try {
                // api/login.php へPOST
                const data = await postJSON("./api/login.php", { email, password });
                // データの中から、CSRFトークンを更新
                csrfToken = data.csrf_token || null;

                csrfTokenElement.textContent = csrfToken;
                out(data);
                showMessage("success", `ログインに成功しました（${email}）`);
            } catch (err) {
                // 403 Invalid CSRF Token などのエラーもレスポンスとして画面に表示する
                out({ status: err.status, ...err.data });
                showMessage("error", err.data?.error || "ログインに失敗しました");
            }
        });

        // GET: api/me.php
        $("#me").addEventListener("click", async () => {
            // GETリクエストはCookie(sid)を送るだけでよく、CSRFトークンは不要
            const res = await fetch("./api/me.php", { credentials: "same-origin" });
            const data = await res.json();
            out(data);
            if (res.ok && data.user) {
                showMessage("success", `/me 取得成功: ${data.user.email}`);
            } else {
                showMessage("error", data.error || "未ログインです（401）");
            }
        });

        // POST: api/logout.php
        $("#logout").addEventListener("click", async () => {
            try {
                const data = await postJSON("./api/logout.php", {});
                out(data);
                showMessage("success", "ログアウトしました");
            } catch (err) {
                out({ status: err.status, ...err.data });
                showMessage("error", err.data?.error || "ログアウトに失敗しました");
            }
        });

        // document.cookie をそのまま画面に表示する
        // HttpOnly なCookie（sid）はここに出てこない
        $("#show-cookie").addEventListener("click", () => {
            $("#cookie-view").textContent = document.cookie || "（空 — HttpOnlyなCookieはJSから読めません）";
        });
    });
})();