$(function () {
    // メニュー取得: class=menu
    const navMenus = $(".menu");

    // TODO:ホバーでサブメニュー表示・非表示
    navMenus.hover(
        function () {
            // TODO: 自分自身: $(this) の子要素 ul を表示
            // stop() で誤動作防止
            // slideDown() アニメーション
        },
        function () {
            // TODO: 自分自身: $(this) の子要素 ul を非表示
            // stop() で誤動作防止
            // slideUp() アニメーション
        }
    );

    // メニュークリック時にもドロップダウンを閉じる
    navMenus.on('click', function () {
        // TODO: 自分自身: $(this) の子要素 ul を非表示
    });

});