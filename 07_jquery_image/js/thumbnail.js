$(function () {
    const $thumbList = $("#thumb-list");
    const $mainImage = $("#main-image");
    const $mainTitle = $("#main-title");
    const $mainCopy = $("#main-copy");
    const $mainPrice = $("#main-price");
    const $mainCalories = $("#main-calories");
    const $mainRating = $("#main-rating");
    const $mainTags = $("#main-tags");
    const $mainRecommended = $("#main-recommended");

    function renderThumbnails() {
        // TODO: サムネイル生成: HTMLテンプレート
        // const thumbnailHtml = items.map((item, index) => `
        //     <li>
        //         <button class="thumbnail thumb-button${index === 0 ? " is-active" : ""}" data-index="${index}" type="button">
        //             <img class="thumb-image" src="${item.image}" alt="${item.name}">
        //             <span class="thumb-body">
        //                 <span class="thumb-title">${item.name}</span>
        //                 <span class="thumb-meta">¥${item.price.toLocaleString()} / ★ ${item.rating}</span>
        //             </span>
        //         </button>
        //     </li>
        // `).join("");

        // $thumbList.append($(thumbnailHtml));
    }

    function renderTags(tags) {
        return tags.map(tag => `<span>${tag}</span>`).join("");
    }

    function updateMainView(index) {
        const item = items[index];

        // アクティブ状態更新
        $(".thumbnail").removeClass("is-active");

        // アクティブ状態追加
        $(`.thumbnail[data-index="${index}"]`).addClass("is-active");

        // TODO: メイン画像切り替え（フェードアウト/フェードイン）
        // $mainImage.fadeOut(220, function () {
        //     $mainImage.attr({
        //         src: item.image,
        //         alt: item.name,
        //     }).fadeIn(220);
        // });

        // メタデータ更新
        // $mainTitle.text(item.name);
        // $mainCopy.text(item.caption);
        // $mainPrice.text(`¥${item.price.toLocaleString()}`);
        // $mainCalories.text(`${item.calories} kcal`);
        // $mainRating.text(`★ ${item.rating}`);
        // $mainTags.html(renderTags(item.tags));
        // $mainRecommended.toggle(item.isRecommended);
    }

    // クリックしたらメイン画像切り替え
    $thumbList.on("click", ".thumbnail", function () {
        const index = Number($(this).data("index"));
        updateMainView(index);
    });

    renderThumbnails();
    updateMainView(0);
});
