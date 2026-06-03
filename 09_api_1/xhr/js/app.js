const API_URL = './data/users.json';
const resultDiv = document.getElementById('result');

// XHRリクエスト（非同期）:XMLHttpRequestオブジェクトの作成
const xhr = new XMLHttpRequest();
// TODO: XHRリクエスト（非同期）:open() : GETリクエストを設定

//  XHRリクエスト（非同期）:onload()
xhr.onload = function () {
    // TODO: レスポンスの処理:ステータスコード: xhr.status === 200 なら成功、そうでなければ失敗
    if (false) {
        try {
            // TODO: レスポンスの処理:JSON.parse() で responseText をオブジェクトに変換
            const users = {};
            renderUsers(users);
        } catch (e) {
            showError('データの解析に失敗しました。');
        }
    } else {
        showError('リクエストが失敗しました。');
    }
};

xhr.onerror = function () {
    showError('ネットワークエラーが発生しました。');
};

// TODO: XHRリクエスト（非同期）:send()

function renderUsers(users) {
    resultDiv.innerHTML = ''; // クリア
    users.forEach(user => {
        const userCard = document.createElement('div');
        // カード全体のスタイル
        userCard.className = "bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1";

        userCard.innerHTML = `
            <div class="flex flex-col h-full">
                <div class="mb-4">
                    <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl mb-3">
                        ${user.name.charAt(0)}
                    </div>
                    <h3 class="text-lg font-bold text-slate-800">${user.name}</h3>
                </div>
                
                <div class="space-y-3 mt-auto">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-500 font-medium">年齢</span>
                        <span class="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">${user.age} 歳</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-500 font-medium">居住地</span>
                        <span class="flex items-center text-slate-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            ${user.city}
                        </span>
                    </div>
                </div>
            </div>
        `;
        resultDiv.appendChild(userCard);
    });
}

function showError(message) {
    resultDiv.innerHTML = `
        <div class="col-span-full text-center py-10">
            <div class="bg-red-50 text-red-600 p-4 rounded-lg inline-block border border-red-100 font-medium">
                ${message}
            </div>
        </div>
    `;
}