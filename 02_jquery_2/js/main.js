$(() => {
    // =============================================
    // 1 基本的なセレクタ
    // =============================================
    // TODO: id=shop-title を選択
    const titleElement = $('#shop-title');
    // document.getElementById("shop-title") と同じ意味
    console.log(titleElement);

    // TODO: class=cart-item をすべて選択
    const cartItems = $('.cart-item')
    console.log(cartItems);

    // TODO: .cart-item の数を取得
    const count = 0;
    console.log("Cart item count:", count);

    // =============================================
    // ️2 基本的なメソッド
    // =============================================
    let title = $('#shop-title').text()
    // document.getElementById("shop-title").textContent と同じ意味
    // TODO: id=shop-title のテキストコンテンツ取得
    console.log("Original title:", title);

    title = '👕 Spring Apparel';
    // TODO:  id=shop-title のタイトルの設定: text()
    // document.getElementById("shop-title").textContent = title と同じ意味
    $('#shop-title').text(title)

    title = `👕 Spring Apparel <span class='text-sm text-gray-400'>Men & Women Edition</span>`;
    // TODO: id=shop-title のタイトルの設定: html()
    // document.getElementById("shop-title").innerHTML = title と同じ意味
    $('#shop-title').html(title);

    // TODO: #cart-count に count を表示
    let itemCount = $(".cart-item").length;
    $('#cart-count').text(itemCount);

    // =============================================
    //  4 メソッド2
    // =============================================
    // 男女別スタイル
    const menClass = "bg-sky-100 text-sky-600"
    const womenClass = "bg-pink-100 text-pink-600"
    // TODO: class=men にクラス設定
    $('.men').addClass(menClass)

    // TODO: class=women にクラス設定

    // =============================================
    //  4 親子・子孫関係
    // =============================================
    // TODO: id=product-list の子要素 class=productをすべて選択
    const products = {}
    console.log(products);

    // 商品カードのクラス
    // TODO: 親子：商品情報 .product > .info にクラス追加
    const infoClass = "p-2";

    // TODO: 子孫：商品名 class=product .name にクラス追加
    const productNameClass = "font-semibold text-lg";

    // TODO: 子孫：商品価格 .product .note にクラス追加
    const noteClass = "text-sm text-gray-500";

    // TODO: 子孫：商品価格 .product .price にクラス追加
    const priceClass = "font-bold text-lg";

    // バニラJSの場合
    // document.querySelectorAll('.men').forEach(el => {
    //     el.classList.add(menClass);
    // });
    // document.querySelectorAll('.women').forEach(el => {
    //     el.classList.add(womenClass);
    // });

    // =============================================
    // 5. その他メソッド
    // =============================================
    // バニラJSのDOM要素化
    const saleTag = "<span class='text-xs bg-green-400 text-white px-2 py-1 rounded'>SALE</span>";
    const saleDOM = $(saleTag).get(0);
    console.log(saleDOM);

    // TODO: get(): index=1 の商品に saleTag タグを追加

    // TODO: eq(): index=2 の商品（３番目の商品）に newTag タグを追加
    const newTag = "<span class='text-xs bg-pink-200 text-pink-800 px-2 py-1 rounded'>NEW</span>";

    // TODO: first(): 最初の商品に newTag を追加

    // TODO: last(): 最後の商品に hotTag を追加
    const hotTag = "<span class='text-xs bg-sky-200 text-sky-800 px-2 py-1 rounded'>HOT</span>";

    // TODO: 奇数番目の class=cart-item に class=oddClass を追加
    const oddClass = "bg-gray-100";

    document.getElementById("all-filter-btn").addEventListener("click", () => {
        // TODO: 全商品を一旦表示
    });

    document.getElementById("men-filter-btn").addEventListener("click", () => {
        // 全商品を一旦表示
        $(".product").removeClass("hidden");

        // TODO: not(): 男性商品ではない要素を非表示
    });
    document.getElementById("women-filter-btn").addEventListener("click", () => {
        // 全商品を一旦表示
        $(".product").removeClass("hidden");

        // TODO: not(): 女性商品ではない要素を非表示
    });

});