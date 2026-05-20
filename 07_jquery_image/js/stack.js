// jQuery animate()
$(document).ready(function () {
    // 次へボタンのクリックイベント2
    $('#next-button').on('click', function () {
        stackAnimation();
    });
});


function stackAnimation() {
    // id=image-container の子 class=stacked-item のスタックリスト取得（画像リスト）
    const images = $('#image-container').children('.stacked-item');
    // TODO: 最上位のスタック取得: last()
    const topImage = {};

    // TODO: フェードアウト: class=swipe-out

    // 移動終了後の処理
    // CSSアニメーションが終わったら実行（1度だけ）
    topImage.one('transitionend', function () {
        // TODO: topImage を先頭に移動: prependTo()

        // スライドインアニメーション
        swipeIn();
    });

    // スライドインアニメーション
    function swipeIn() {
        setTimeout(() => {
            // スライドアウトアニメーション削除
            topImage.removeClass('swipe-out');
            // スライドインアニメーション追加
            topImage.addClass('swipe-in');
            // スライドインアニメーション終了後の処理
            topImage.one('transitionend', function () {
                // スライドインアニメーション削除
                topImage.removeClass('swipe-in');
            });
        }, 50);
    }
}