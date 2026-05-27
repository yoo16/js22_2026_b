$(document).ready(function () {
    const $parallax = $('#parallax');
    const $parallaxContent = $('#parallaxContent');

    // TODO: スクロールイベントの監視
    $(window).on('', function () {
        // TODO: スクロール位置を取得: $(window).scrollTop()
        const scrollY = 0;
        // TODO: 速度を調整: scrollY * 0.5
        const speed = 0;

        // TODO: パララックス対象の高さを取得: $parallax.outerHeight()
        const parallaxHeight = 0;

        // TODO: 背景画像を移動: $parallax.css()
        // background-position-y: -speed + 'px'

        // 文字コンテンツの移動（スクロールに合わせてゆっくり追従）
        const translateY = Math.min(parallaxHeight / 2, scrollY * 0.2) - 200;
        // TODO: $parallaxContent.css()
        // transform: translateY
    });
});