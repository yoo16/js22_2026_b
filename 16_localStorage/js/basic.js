const output = document.getElementById('output');
const inspector = document.getElementById('inspector');
const noteInput = document.getElementById('note-input');
const nameInput = document.getElementById('member-name');
const ageInput = document.getElementById('member-age');
const memberDraft = document.getElementById('member-draft');

// 保存前の作業用データ（画面上でだけ持っている状態）
// 1件が { id, name, age } という「複数プロパティを持つオブジェクト」になっている点がポイント
let members = [];

// 監視対象のキー一覧（ここに追加すればインスペクタにも表示される）
const WATCHED_KEYS = ['note', 'list'];

/**
 * 結果パネルにメッセージを表示する
 * @param {string} message
 * @param {'success'|'error'} type
 */
function showMessage(message, type = 'success') {
    output.textContent = message;
    output.classList.remove('text-slate-700', 'text-rose-600', 'bg-rose-50', 'border-rose-200');
    if (type === 'error') {
        output.classList.add('text-rose-600', 'bg-rose-50', 'border-rose-200');
    } else {
        output.classList.add('text-slate-700');
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * localStorage の現在の中身を「ストレージインスペクタ」に描画する
 * data-action の操作を行うたびに呼び出して、実データと画面を同期させる
 */
function renderInspector() {
    const rows = WATCHED_KEYS.map((key) => {
        // TODO: LocalStorage にキーを設定して値取得
        const raw = localStorage.getItem(key)
        // 値チェック
        const hasValue = raw !== null;
        // 値がある場合は緑色、ない場合はグレーで表示する
        const valueHtml = hasValue
            ? `<span class="text-emerald-400">${escapeHtml(raw)}</span>`
            : `<span class="text-slate-500">(未設定)</span>`;
        return `
            <div class="flex gap-3 py-1.5 border-b border-white/5 last:border-0">
                <span class="text-slate-400 shrink-0">"${key}"</span>
                <span class="text-slate-500">:</span>
                <span class="break-all">${valueHtml}</span>
            </div>`;
    }).join('');
    inspector.innerHTML = rows;
}

/**
 * 作業用の members 配列を、保存ボタンを押す前の「下書きリスト」として画面に描画する
 * 1項目が {id, name, age} という複数プロパティのオブジェクトであることが分かるように表示する
 */
function renderMemberDraft() {
    memberDraft.innerHTML = members.map((member) => `
        <li class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-sm">
            <span class="flex-1 text-slate-700">
                ${escapeHtml(member.name)}
                <span class="text-slate-400 font-mono text-xs">（${member.age}歳）</span>
            </span>
            <button data-member-id="${member.id}" data-role="remove"
                class="text-slate-400 hover:text-rose-500 text-xs">✕</button>
        </li>
    `).join('');
}

function addMember() {
    const name = nameInput.value.trim();
    const age = ageInput.value.trim();

    if (!name) {
        showMessage('名前を入力してください。', 'error');
        return;
    }
    if (age === '' || Number.isNaN(Number(age))) {
        showMessage('年齢を数値で入力してください。', 'error');
        return;
    }

    members.push({ id: Date.now(), name, age: Number(age) });
    nameInput.value = '';
    ageInput.value = '';
    nameInput.focus();
    renderMemberDraft();
}

// --- テキスト ---
// テキストの保存ボタンをクリックした時の処理
document.querySelector('[data-action="save-text"]').addEventListener('click', () => {
    // 入力欄の値を取得して、前後の空白を削除
    const value = noteInput.value.trim();
    if (!value) {
        // 空文字の場合は保存せずにエラー表示
        showMessage('保存するテキストを入力してください。', 'error');
        return;
    }
    // TODO: LocalStorage にキーを設定して値保存: key = note
    localStorage.setItem('note', value)

    showMessage('保存しました');
    renderInspector();
});
// 読み込みボタンがクリックされた時の処理
document.querySelector('[data-action="load-text"]').addEventListener('click', () => {
    // TODO: LocalStorage からキーを指定して値取得: key = note
    const value = localStorage.getItem('note');
    if (value === null) {
        showMessage('データがありません。先に「保存」を押してください。', 'error');
        return;
    }
    noteInput.value = value;
    showMessage(`読み込みました:\n${value}`);
});
// 削除ボタンがクリックされた時の処理
document.querySelector('[data-action="remove-text"]').addEventListener('click', () => {
    // TODO: LocalStorage からキーを指定して値削除: key = note
    localStorage.removeItem('note');
    noteInput.value = '';
    showMessage('削除しました。');
    renderInspector();
});

// --- オブジェクト（メンバーリスト） ---

document.querySelector('[data-action="add-member"]').addEventListener('click', addMember);

// Enter キーでも追加できるようにする（名前・年齢どちらの欄でも）
[nameInput, ageInput].forEach((el) => {
    el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addMember();
        }
    });
});

memberDraft.addEventListener('click', (event) => {
    const target = event.target.closest('[data-member-id]');
    if (!target || target.dataset.role !== 'remove') return;
    const id = Number(target.dataset.memberId);
    members = members.filter(member => member.id !== id);
    renderMemberDraft();
});

document.querySelector('[data-action="save-list"]').addEventListener('click', () => {
    if (members.length === 0) {
        showMessage('リストが空です。先に名前と年齢を追加してください。', 'error');
        return;
    }
    // TODO: LocalStorage にキーを設定して、JSONを保存: key = list
    localStorage.setItem('list', JSON.stringify(members));

    const text = members.map(member => `${member.name} (${member.age}歳)`).join('\n');
    showMessage(`保存しました:\n${text}`);
    renderInspector();
});

document.querySelector('[data-action="load-list"]').addEventListener('click', () => {
    // TODO: LocalStorage からキーを指定して JSON 取得: key = list
    const json = localStorage.getItem('list');
    if (json === null) {
        showMessage('データがありません。先に「保存」を押してください。', 'error');
        return;
    }
    members = JSON.parse(json);
    renderMemberDraft();
    const text = members.map(member => `${member.name} (${member.age}歳)`).join('\n');
    showMessage(`読み込みました:\n${text}`);
});

document.querySelector('[data-action="remove-list"]').addEventListener('click', () => {
    // TODO: LocalStorage からキーを指定して値削除: key = list
    localStorage.removeItem('list');
    members = [];
    renderMemberDraft();
    showMessage('削除しました。');
    renderInspector();
});

// --- 全削除 ---

document.querySelector('[data-action="clear-all"]').addEventListener('click', () => {
    // TODO: LocalStorage から監視対象のキーをすべて削除
    // WATCHED_KEYS.forEach(key => localStorage.removeItem(key));
    localStorage.clear();
    noteInput.value = '';
    members = [];
    renderMemberDraft();
    showMessage('すべてのキーを削除しました。');
    renderInspector();
});

// 初期表示
renderInspector();