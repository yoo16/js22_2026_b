(() => {
    const $ = (sel) => document.querySelector(sel);

    window.addEventListener("DOMContentLoaded", () => {
        // XSS攻撃の例
        $("#draftBtn").addEventListener("click", async () => {
            const content = $("#content").value;
            $("#out").innerHTML = content;

            // CSRFトークン発行
            const res = await fetch("./api/csrf.php", {
                credentials: "include"
            })
            const data = await res.json();
            // CookieにCSRFトークンを保存
            document.cookie = `csrf_token=${data.csrf_token}; path=/`;
        });

        $("#rewrite").addEventListener("click", () => {
            document.cookie = "sid=sid haking!!!; path=/";
            $("#out").innerHTML = document.cookie;
        });

        $("#remove").addEventListener("click", () => {
            document.cookie = "sid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            $("#out").innerHTML = document.cookie;
        });
    });
})();