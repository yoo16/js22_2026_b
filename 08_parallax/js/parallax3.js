document.addEventListener('DOMContentLoaded', () => {

    // ====================================
    // 要素の取得
    // ====================================
    const hero = document.querySelector('.hero');
    const heroTitle = document.querySelector('[data-hero-title]');
    const layers = document.querySelectorAll('.layer');
    const bgText = document.querySelector('.bg-text');
    const cards = document.querySelectorAll('[data-card-speed]');
    const progressBar = document.querySelector('.scroll-progress');
    const fadeUpElements = document.querySelectorAll('[data-fade-up]');

    // フェードイン要素の初期スタイル
    fadeUpElements.forEach(el => {
        // TODO: スタイルで opacity: 0, transition: all 0.8s ease-out 
        // el.style.opacity   = '0';
        // el.style.transform = 'translateY(40px)';
        // el.style.transition= 'opacity 0.8s ease-out, transform 0.8s ease-out';
    });

    // ====================================
    // 1. 多層レイヤーパララックス
    // ====================================
    function updateLayers() {
        const scrollY = window.scrollY;

        layers.forEach(layer => {
            const speed = parseFloat(layer.dataset.speed);

            // TODO: data-speed を取得して、transform を設定
            // layer.style.transform = `translate3d(0, ${-(scrollY * speed)}px, 0)`;
        });

        // ヒーロータイトルのフェードアウト + 上方向スライド
        const progress = Math.min(scrollY / hero.offsetHeight, 1);
        // TODO: スクロールの割合（progress）に応じて、transform と opacity を設定
        // heroTitle.style.transform = `translate(-50%, calc(-50% - ${scrollY * 0.5}px))`;
        // heroTitle.style.opacity = 1 - progress * 1.5;
    }

    // ====================================
    // 2. 背景テキストの横方向パララックス
    // ====================================
    function updateBgText() {
        const speed = parseFloat(bgText.dataset.speedX || 0.3);
        const offset = window.scrollY * speed;
        // TODO: 背景テキストの Y軸方向（Y-axis）に移動距離を計算して、transform を設定
        // bgText.style.transform = `translateY(-50%) translateX(${-offset}px)`;
    }

    // ====================================
    // 3. カードの個別速度パララックス
    // ====================================
    function updateCards() {
        const scrollY = window.scrollY;
        const winHeight = window.innerHeight;

        cards.forEach(card => {
            const speed = parseFloat(card.dataset.cardSpeed);
            // カード上端の絶対Y座標
            const cardTop = card.getBoundingClientRect().top + scrollY;
            const relative = scrollY + winHeight - cardTop;

            // スクロール領域に入ったときの処理
            if (relative > 0 && relative < winHeight * 2) {
                // TODO: カードの上方向への移動距離を計算して、transform を設定
                // card.style.transform = `translate3d(0, ${-(relative - winHeight) * speed}px, 0)`;
            }
        });
    }

    // ====================================
    // 4. スクロールプログレスバー
    // ====================================
    function updateProgress() {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        // TODO: スクロール位置に基づいてプログレスバーの幅を設定
        // progressBar.style.width = `${(window.scrollY / docHeight) * 100}%`;
    }

    // ====================================
    // 5. フェードイン要素
    // ====================================
    function updateFadeUp() {
        const scrollBottom = window.scrollY + window.innerHeight;

        fadeUpElements.forEach(el => {
            const elTop = el.getBoundingClientRect().top + window.scrollY;
            // TODO: ウィンドウ下端から100px以内に入ったら表示
            if (scrollBottom > elTop + 100) {
                // el.style.opacity = '1';
                // el.style.transform = 'translateY(0)';
            }
        });
    }

    // ====================================
    // requestAnimationFrame でスクロール最適化
    // ====================================
    let ticking = false;

    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateLayers();
                updateBgText();
                updateCards();
                updateProgress();
                updateFadeUp();
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // 初期表示時にも実行
    onScroll();
});
