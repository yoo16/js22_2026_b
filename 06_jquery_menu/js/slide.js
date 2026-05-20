$(function () {
    // メニューボタン
    const menuButton = $('#menu-button');
    // スライドメニュー
    const slideMenu = $('#slide-menu');

    // クリックイベント
    menuButton.on('click', function () {
        // メニューのスライド処理を実行
        toggleMenu();
    });
    // TODO: メニュー内のリンククリック: id=slide-menu の a
    $("").on('click', function () {
        // メニューを閉じる
        toggleMenu();
    });

    // 初期化処理
    function initMenu() {
        // TODO: メニューの幅を取得: outerWidth()
        const width = 0

        // TODO: メニューを隠す（左に隠す）
        // CSSでnoneにしていたのを解除
        // 幅の分だけ左に隠す: marginLeft を -width px
        slideMenu.css({
            display: 'block',
        });
    }

    // スライド処理 
    function toggleMenu() {
        // X座標位置用変数
        let x = '0px';
        // メニューの幅を取得
        const width = slideMenu.outerWidth();
        // TODO: class=on をトグル判定: hasClass('on')
        if (true) {
            // 閉じる処理：幅の分だけマイナス位置へ
            x = -width + 'px';
            // TODO: class=on を削除: removeClass('on')
        } else {
            // 開く処理：0pxの位置へ
            x = '0px';
            // TODO: class=on を追加: addClass('on')
        }

        // TODO: marginLeft を x にしてアニメーション
        slideMenu.stop().animate({ }, 300); 
    }

    initMenu();
});