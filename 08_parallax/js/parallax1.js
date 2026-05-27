$(document).ready(function () {
    const $parallax = $('#parallax');
    const $parallaxContent = $('#parallaxContent');

    // TODO: スクロールイベントの監視
    // バニラJS: 
    // window.addEventListener('scroll', function () { ... });
    $(window).on('scroll', function () {
        // TODO: スクロール位置を取得: $(window).scrollTop()
        const scrollY = $(window).scrollTop();
        // TODO: 速度を調整: scrollY * 0.5
        const speed = scrollY * 0.5;

        // TODO: パララックス対象の高さを取得: $parallax.outerHeight()
        const parallaxHeight = $parallax.outerHeight();

        // TODO: 背景画像を移動: $parallax.css()
        // background-position-y: -speed + 'px'
        $parallax.css('background-position-y', -speed + 'px');

        // 文字コンテンツの移動（スクロールに合わせてゆっくり追従）
        const translateY = Math.min(parallaxHeight / 2, scrollY * 0.2) - 200;
        // TODO: $parallaxContent.css()
        // transform: translateY
        $parallaxContent.css('transform', `translateY(${translateY}px)`);

        // 拡大・縮小
        const scale = 1 + Math.min(0.5, scrollY / parallaxHeight);
        $parallaxContent.css('transform', `translateY(${translateY}px) scale(${scale})`);
    });
});