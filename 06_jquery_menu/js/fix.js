$(function () {
    // スクロール固定
    const nav = $("#nav");
    // TODO: nav の現在の top を取得: offset().top
    const navPos = 0;

    $(window).scroll(function () {
        // TODO: スクロール位置: $(window).scrollTop()
        const scrollTop = 0;
        // スクロール位置が nav の位置を超えたら
        if (scrollTop > navPos) {
            // TODO: 固定 css設定：position: fixed
            nav.css({"top": "0", "width": "100%"});
        } else {
            // TODO: 固定解除 css設定：position: static
            nav.css({});
        }
    });
});