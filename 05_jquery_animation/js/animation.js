$(function () {
    let character_1 = $("#character_1");
    let character_2 = $("#character_2");
    let character_3 = $("#character_3");
    let character_4 = $("#character_4");
    let box1 = $("#box1");
    let box2 = $("#box2");

    // id=showBtn がクリックされたとき
    $("#showBtn").on("click", function () {
        // TODO: character_1 を show() で表示
    });
    // id=hideBtn がクリックされたとき
    $("#hideBtn").on("click", function () {
        // TODO: character_1 を hide() で非表示
    });
    // id=toggleBtn がクリックされたとき
    $("#toggleBtn").on("click", function () {
        // TODO: character_1 を toggle() でトグル表示
    });
    // id=fadeInBtn がクリックされたとき
    $("#fadeInBtn").on("click", function () {
        // TODO: character_2 を fadeIn() でフェードイン
    });
    // id=fadeOutBtn がクリックされたとき
    $("#fadeOutBtn").on("click", function () {
        // TODO: character_2 を fadeOut() でフェードアウト
    });

    $("#fadeToggleBtn").on("click", function () {
        // TODO: character_2 を fadeToggle() でフェードトグル
    });
    // id=slideDownBtn がクリックされたとき
    $("#slideDownBtn").on("click", function () {
        // TODO: character_3 を slideDown() でスライド表示
    });

    $("#slideUpBtn").on("click", function () {
        // TODO: character_3 を slideUp() でスライド非表示
    });

    $("#slideToggleBtn").on("click", function () {
        // TODO: character_3 を slideToggle() でスライドトグル
    });
    // id=shakeBtn がクリックされたとき
    $("#shakeBtn").on("click", function () {
        const distance = 10; // 揺れ幅
        const delay = 50;   // 揺れの間隔: 0.05秒
        const times = 4;     // 揺れる回数

        function shake(element, count) {
            if (count > 0) {
                // console.log(element);
                // TODO: アニメーションで左に揺らす
                // TODO: アニメーションで右に揺らす
                // TODO: コールバックで再帰的に shake() を呼び出す
            } else {
                // TODO: 最後に元の位置へ戻す
            }
        }
        shake(character_4, times);
    });

    $("#easingBtn").on("click", function () {
        initBox();
        // TODO: box1 を width=300px でアニメーション: easing=linear
        // TODO: box2 を width=300px でアニメーション: easing=swing
    })

    $("#animateBtn").on("click", function () {
        // TODO: box1 を width=300px height=50px opacity: 0.1 でアニメーション
        // TODO: box1 を width=100px height=100px opacity: 1 でアニメーション

        // TODO: box2 を width=0px opacity: 0.1 でアニメーション
        // TODO: box2 を width=200px opacity: 1 でアニメーション
        // TODO: box2 を 1秒待機して width=100px opacity: 1 でアニメーション
    });

    $("#queueBtn").on("click", function () {
        const items = $('.item');
        items.addClass('hidden');

        const delayTime = 300;

        // items 繰り返し(each)
        items.each(function (i) {
            // TODO: queue() の引数の内容を確認
            // i * delayTime だけ遅らせる: delay() : 
            // キューに追加: queue()
            // コールバックで this を表示して class=hidden を削除
            // 次の処理: next()
            // $(this)
            //     .addClass("hidden")
            //     .delay(i * 300)
            //     .queue(function (next) {
            //         $(this).removeClass("hidden");
            //         next();
            //     })
            //     .fadeIn();
        });
    });

    function initBox() {
        box1.removeClass("bg-green-400").addClass("bg-blue-400");
        box1.css({
            width: "100px",
            height: "100px"
        });
        box2.removeClass("bg-blue-400").addClass("bg-green-400");
        box2.css({
            width: "100px",
            height: "100px"
        });
    }

    initBox();
});