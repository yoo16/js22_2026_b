// UI
const grid = document.getElementById('product-grid');
const loader = document.getElementById('loading-modal');
const detailModal = document.getElementById('detail-modal');
const detailContent = document.getElementById('detail-content');
const closeButton = document.getElementById('close-detail');
const badge = document.getElementById('cart-count');
const cartOpenBtn = document.getElementById('cart-open-btn');
const cartCloseBtn = document.getElementById('cart-close-btn');
const cartModal = document.getElementById('cart-modal');

// 商品データ
let allProducts = [];

// APIから商品データを取得
async function fetchProducts() {
    // ローディング表示
    loader.classList.remove('hidden');
    try {
        // 商品データAPIのURL
        // const productsApiURL = 'https://fakestoreapi.com/products';
        // ローカルPHP APIのURLを指定: api/products/get.php
        const productsApiURL = 'api/products/get.php';

        // TODO: APIから商品データを取得: fetchAPI
        const response = {};
        // APIレスポンスをチェック
        if (!response.ok) showFlash('商品データの取得に失敗しました');
        // TODO: JSON形式でレスポンスを取得: json()
        allProducts = [];
        // 商品一覧を描画
        renderProducts(allProducts);
    } catch (error) {
        grid.innerHTML = `<p class="text-red-500 text-center col-span-full">${error.message}</p>`;
    } finally {
        // ローディング非表示
        loader.classList.add('hidden');
    }
}

// 商品一覧を描画
function renderProducts(products) {
    // TODO: 商品一覧をレンダリング
    grid.innerHTML = products.map(p => `
        <div class="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer product-card" data-id="${p.id}">
            <div class="h-48 p-4 flex items-center justify-center">
                <img src="" alt="${p.title}" class="max-h-full object-contain">
            </div>
            <div class="p-4 border-t">
                <span class="text-xs text-sky-500 font-semibold uppercase">カテゴリ</span>
                <h2 class="text-sm font-bold text-gray-800 mt-1 line-clamp-2">タイトル</h2>
                
                <div class="flex items-center mt-2">
                    <span class="text-yellow-400 text-xs">★</span>
                    <span class="text-xs font-bold ml-1">評価</span>
                    <span class="text-xs text-gray-400 ml-2">(レビュー数)</span>
                </div>

                <p class="text-lg font-bold text-gray-900 mt-2">$価格</p>
            </div>
        </div>
    `).join('');
}

// 商品詳細を表示
function showDetail(productId) {
    // 商品データを取得
    const p = allProducts.find(item => item.id == productId);
    if (!p) return;

    // 商品詳細を表示
    detailContent.innerHTML = `
        <div class="md:flex gap-8">
            <div class="md:w-1/2 flex items-center justify-center bg-white rounded-lg p-4">
                <img src="${p.image}" class="max-h-64 object-contain">
            </div>
            <div class="md:w-1/2 mt-6 md:mt-0">
                <span class="text-xs bg-sky-100 text-sky-600 px-2 py-1 rounded font-bold">${p.category}</span>
                <h2 class="text-2xl font-bold text-gray-800 mt-2">${p.title}</h2>
                <div class="flex items-center mt-2">
                    <span class="text-yellow-400">★</span>
                    <span class="font-bold ml-1">${p.rating.rate}</span>
                    <span class="text-gray-400 text-sm ml-2">(${p.rating.count} reviews)</span>
                </div>
                <p class="text-3xl font-bold text-gray-900 mt-4">$${p.price}</p>
                <p class="text-gray-600 mt-4 text-sm leading-relaxed">${p.description}</p>
                
                <button 
                    data-id="${p.id}" 
                    class="add-to-cart-btn w-full mt-8 bg-sky-600 text-white py-3 rounded-lg font-bold hover:bg-sky-700 transition"
                >
                    カートに追加する
                </button>
            </div>
        </div>
    `;
    // モーダル表示
    detailModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 初期カート情報の取得
async function fetchInitialCart() {
    try {
        // TODO: カート情報APIのURLを指定: api/cart/get.php
        const uri = "";
        // GETリクエストで現在のカート情報を取得: fetchAPI
        const response = await fetch(uri);
        // JSON形式でレスポンスを取得: json()
        const result = await response.json();
        console.log('Initial Cart Fetch Result:', result);

        // カートの中身があれば反映
        if (result.cart) {
            updateCartBadge(result.cartCount);
            updateCartList(result.cart);
        }
    } catch (error) {
        console.error('Initial Cart Fetch Error:', error);
    }
}

// PHP APIへ送信
async function addToCart(productId) {
    try {
        // TODO: カート追加APIのURLを指定: api/cart/add.php
        const uri = "";
        // TODO: POSTリクエストで商品ID(productId)を JSONで送信
        const response = await fetch(uri, {
            method: '',
            headers: { 'Content-Type': 'application/json' },
            body: "",
        });
        // JSON形式でレスポンスを取得
        const result = await response.json();

        // カート更新結果をチェック
        if (result.status === 'success') {
            // カートバッジを更新
            updateCartBadge(result.cartCount);
            // カート一覧を更新
            updateCartList(result.cart);
            // 一時メッセージを表示
            showFlash('カートに追加しました！');
        }
    } catch (error) {
        showFlash('カートの更新に失敗しました');
    }
}

// カートバッジ更新
function updateCartBadge(count) {
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
}

// カート一覧の表示更新
function updateCartList(cartObj) {
    const cartContainer = document.getElementById('cart-items');
    let total = 0;

    // カート一覧を表示
    const cartHtml = Object.keys(cartObj).map(id => {
        const p = allProducts.find(item => item.id == id);
        if (!p) return '';

        // カート内の商品を表示
        const qty = cartObj[id];
        const subtotal = p.price * qty;
        total += subtotal;

        return `
            <div class="flex gap-4 border-b pb-4 items-center">
                <img src="${p.image}" class="w-16 h-16 object-contain">
                <div class="flex-1">
                    <h3 class="text-sm font-bold line-clamp-1">${p.title}</h3>
                    <p class="text-sky-600 font-bold">$${p.price}</p>
                    
                    <div class="flex items-center justify-between gap-2 mt-2">
                        <input type="number" 
                            value="${qty}" 
                            min="1" 
                            onchange="updateQuantity(${p.id}, this.value)"
                            class="px-2 py-1 w-16 border border-gray-300 rounded text-center text-sm">
                        <button onclick="removeItem(${p.id})" class="text-xs bg-red-500 text-white px-2 py-1 rounded">削除</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    cartContainer.innerHTML = cartHtml || '<p class="text-center text-gray-500">カートは空です</p>';
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

// 個数変更関数
async function updateQuantity(productId, qty) {
    const uri = "api/cart/update.php";
    const nextQty = Math.max(1, parseInt(qty, 10) || 1);
    // POSTリクエストで商品ID(productId)と個数(qty)をJSONで送信
    const response = await fetch(uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, qty: nextQty }),
    });
    // JSON形式でレスポンスを取得
    const result = await response.json();
    // カート更新結果をチェック
    if (result.status === 'success') {
        updateCartBadge(result.cartCount);
        updateCartList(result.cart);
    } else {
        showFlash('数量の更新に失敗しました');
    }
}

// カートから商品を削除
async function removeItem(productId) {
    const uri = "api/cart/remove.php";
    if (!confirm('商品ID ' + productId + ' を削除しますか？')) {
        return;
    }

    // TODO: POSTリクエストで商品ID(id = productId)を送信
    const result = await fetch(uri, {
        method: '',
        headers: { 'Content-Type': 'application/json' },
        body: "",
    });
    // JSON形式でレスポンスを取得
    const data = await result.json();
    updateCartBadge(data.cartCount);
    updateCartList(data.cart);

    // カート更新結果をチェック
    if (data.status === 'success') {
        showFlash('カートから削除しました');
    } else {
        showFlash('削除に失敗しました');
    }
}

// 一時メッセージ表示
function showFlash(message) {
    const el = document.createElement('div');
    el.className = 'flash-message';
    el.textContent = message;
    document.body.appendChild(el);

    // 3秒後にDOMから削除
    setTimeout(() => {
        el.remove();
    }, 3000);
}

const closeDetail = () => {
    detailModal.classList.add('hidden');
    document.body.style.overflow = '';
}

// イベントリスナー
grid.addEventListener('click', (e) => {
    const card = e.target.closest('.product-card');
    if (card) showDetail(card.dataset.id);
});

// 詳細モーダルの閉じるボタン
closeButton.addEventListener('click', () => {
    closeDetail();
});

// 詳細モーダルの外側をクリックして閉じる
detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeButton.click();
});

// 詳細モーダル内のカート追加ボタンのクリックイベント
detailContent.addEventListener('click', async (e) => {
    if (e.target.classList.contains('add-to-cart-btn')) {
        const productId = e.target.dataset.id;
        await addToCart(productId);
        closeDetail();
    }
});
// カートモーダルの開閉
cartOpenBtn.addEventListener('click', () => cartModal.classList.remove('hidden'));

// カートモーダルの閉じるボタン
cartCloseBtn.addEventListener('click', () => cartModal.classList.add('hidden'));

// DOMContentLoaded
(async () => {
    // 商品データ
    await fetchProducts();
    // カート照合
    await fetchInitialCart();
})();
