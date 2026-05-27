$(document).ready(function () {
    const animations = {
        // TODO: fadeInエフェクト
        fadeIn: ($el) => {
            // $el.css({ transform: 'translateY(30px)', opacity: 0, visibility: 'visible' })
            //     .animate({ opacity: 1 }, {
            //         duration: 1000,
            //         step: function (now) {
            //             const y = 30 * (1 - now);
            //             $(this).css('transform', `translateY(${y}px)`);
            //         }
            //     });
        },
        // TODO: slideInエフェクト
        slideIn: ($el) => {
            // $el.css({ width: '0%', opacity: 0, visibility: 'visible' })
            //     .animate({ width: '100%', opacity: 1 }, 1200);
        },
        typewriter: ($el) => {
            // 現在のテキストを取得
            const text = $el.text().trim();
            // テキストを空にしてから表示
            $el.text('').css({ opacity: 1, visibility: 'visible' });
            let i = 0;
            let current = '';
            // TODO: タイプライターエフェクトの実装
            const interval = setInterval(() => {
                // current += text[i];
                // $el.text(current);
                // i++;
                // if (i >= text.length) clearInterval(interval);
            }, 80);
        },
        // TODO: fadeLeftエフェクト
        slideLeft: ($el) => {
            // const startX = 80;
            // $el.css({ transform: `translateX(${startX}px)`, opacity: 0, visibility: 'visible' })
            //     .animate({ opacity: 1 }, {
            //         duration: 1000,
            //         step: function (now) {
            //             const x = startX * (1 - now);
            //             $(this).css('transform', `translateX(${x}px)`);
            //         }
            //     });
        }
    };

    // IntersectionObserverの設定
    const observer = new IntersectionObserver((entries) => {
        // entries: 監視対象の配列
        entries.forEach(entry => {
            // 要素が表示領域に入ったか確認
            if (entry.isIntersecting) {
                const $target = $(entry.target);
                // TODO: data-animate 取得
                const type = "";
                if (animations[type]) {
                    // クラスを削除してからアニメーション開始
                    $target.removeClass('animate-init');
                    // TODO: アニメーションの実行: animations[type]($target);
                }
                // TODO: 監視を解除 （１度きりのエフェクトにしたい場合）: unobserve(entry.target)
            }
        });
        // 領域境界調整
    }, { rootMargin: "-10% 0px" });

    // data-animate属性を持つ要素を監視
    $('[data-animate]').each(function () {
        // TODO: 監視開始: observe(this)
    });
});