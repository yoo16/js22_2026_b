$(function () {
    const $imageList = $("#image-list");

    function loadImages() {
        // TODO: HTMLテンプレートを map() で生成し、append() を使って表示
        // const $elements = $(items.map(data => `
        //     <li class="gallery-card">
        //         <div class="loading absolute inset-0 flex items-center justify-center bg-gray-200">
        //             <div class="loader border-4 border-gray-300 border-t-blue-500 rounded-full w-8 h-8 animate-spin"></div>
        //         </div>

        //         <img src="${data.image}" alt="${data.name}" class="item gallery-image hidden">

        //         <div class="gallery-meta">
        //             <div class="meta-top">
        //                 <h2>${data.name}</h2>
        //             </div>

        //             <div class="meta-sub">
        //                 <span class="price">¥${data.price.toLocaleString()}</span>
        //                 <span class="rating">★ ${data.rating}</span>
        //             </div>
        //         </div>

        //         <div class="gallery-overlay">
        //             <div class="gallery-overlay-inner">
        //                 <h3 class="overlay-title">${data.name}</h3>
        //                 <p class="overlay-caption">${data.caption}</p>

        //                 <div class="overlay-info">
        //                     <div><span>価格</span><strong>¥${data.price.toLocaleString()}</strong></div>
        //                     <div><span>カロリー</span><strong>${data.calories} kcal</strong></div>
        //                     <div><span>評価</span><strong>★ ${data.rating}</strong></div>
        //                 </div>

        //                 <div class="overlay-tags">
        //                     ${data.tags.map(tag => `<span>${tag}</span>`).join("")}
        //                 </div>
        //             </div>
        //         </div>
        //     </li>
        // `).join(""));
        // $imageList.append($elements);

        // 画像が読み込み終了したら、ローディングアイコンをフェードアウト、画像をフェードイン
        $('.item').on('load', function () {
            // TODO: siblings() で .loading を探してフェードアウト

            // TODO: 画像をフェードイン

        });

        // 既に読み込まれている画像がある場合
        $('.item').each(function () {
            if (this.complete) {
                $(this).trigger('load');
            }
        });
    }

    // マウスがカードに乗ったら、overlay をフェードイン、離れたらフェードアウト
    $imageList.on({
        mouseenter: function () {
            // TODO: 自分の中の .gallery-overlay を探して、マウスが乗ったらフェードイン

        },
        mouseleave: function () {
            // TODO: 自分の中の .gallery-overlay を探して、マウスが離れたらフェードアウト

        }
    }, 'li');

    // 画像の読み込みを開始
    loadImages();
});