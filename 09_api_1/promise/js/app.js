document.addEventListener("DOMContentLoaded", function () {
    const fetchQuoteButton = document.getElementById("fetch-quote-button");
    const loadingDiv = document.getElementById("loading");
    const errorDiv = document.getElementById("error");
    const quoteDiv = document.getElementById("quote");
    const authorDiv = document.getElementById("author");
    const metaCard = document.getElementById("meta-card");
    const themeBadge = document.getElementById("theme-badge");
    const authorName = document.getElementById("author-name");
    const authorRole = document.getElementById("author-role");

    let quoteEntries = [];

    async function fetchJson(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("network");
        }
        return response.json();
    }

    async function loadQuoteEntries() {
        // 直列処理
        const quotes = await fetchJson("./data/quotes.json");   // 1秒待つ
        const authors = await fetchJson("./data/authors.json"); // さらに1秒待つ
        // TODO: 並列処理 Promise.all() で fetchJson() でデータ取得
        // const [quotes, authors] = [];

        // quotes を繰り返し
        quoteEntries = quotes.map(function (quote) {
            // quote.author をキーに authors から著者情報を取得
            const authorInfo = authors[quote.author];

            return {
                text: quote.text,
                author: quote.author,
                role: authorInfo ? authorInfo.role : "著者情報なし",
                theme: authorInfo ? authorInfo.theme : "No Theme",
                accent: authorInfo ? authorInfo.accent : "slate"
            };
        });
    }

    function resetUi() {
        loadingDiv.classList.remove("hidden");
        errorDiv.classList.add("hidden");
        quoteDiv.classList.add("hidden");
        authorDiv.classList.add("hidden");
        metaCard.classList.add("hidden");
    }

    function pickRandomQuote() {
        const index = Math.floor(Math.random() * quoteEntries.length);
        return quoteEntries[index];
    }

    async function handlerRandomQuote() {
        fetchQuoteButton.disabled = true;
        fetchQuoteButton.classList.add("opacity-50", "cursor-not-allowed");
        resetUi();

        try {
            if (quoteEntries.length === 0) {
                await loadQuoteEntries();
            }
            // ランダムに quoteEntries から名言を1件取得
            const quote = pickRandomQuote();
            displayQuote(quote);
        } catch (error) {
            displayError(error.message || error);
        } finally {
            loadingDiv.classList.add("hidden");
            fetchQuoteButton.disabled = false;
            fetchQuoteButton.classList.remove("opacity-50", "cursor-not-allowed");
        }
    }

    function displayQuote(quote) {
        quoteDiv.textContent = quote.text;
        authorDiv.textContent = "— " + quote.author;
        authorName.textContent = quote.author;
        authorRole.textContent = quote.role;
        themeBadge.textContent = quote.theme;
        applyAccent(quote.accent);

        quoteDiv.classList.remove("hidden");
        authorDiv.classList.remove("hidden");
        metaCard.classList.remove("hidden");
    }

    function applyAccent(accent) {
        const accentClasses = {
            sky: "bg-sky-600 text-white",
            amber: "bg-amber-600 text-white",
            emerald: "bg-emerald-600 text-white",
            slate: "bg-slate-600 text-white"
        };

        themeBadge.className = "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]";
        themeBadge.classList.add(...(accentClasses[accent] || accentClasses.slate).split(" "));
    }

    function displayError(type) {
        const messages = {
            network: "JSON の取得に失敗しました。ファイル配置かパスを確認してください。"
        };

        errorDiv.innerHTML = `
        <div class="space-y-2">
            <div class="text-2xl font-black tracking-tight text-red-200">Promise.all 読み込み失敗</div>
            <p class="text-red-100 font-bold">${messages[type] || "エラーが発生しました。"}</p>
        </div>`;
        errorDiv.classList.remove("hidden");
    }

    fetchQuoteButton.addEventListener("click", handlerRandomQuote);
});
