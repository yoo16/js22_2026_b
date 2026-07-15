// LocalStorage のキー
const KEY = "tasks";
// フィルタリング状態
let filter = "all";
// タスクデータ
let tasks = [];
// -------- DOM要素 --------
const $ = (id) => document.getElementById(id);
const $new = $("newTask");
const $add = $("addBtn");
const $list = $("list");
const $count = $("count");
const $clearDone = $("clearDone");
const $clearAll = $("clearAll");
const $filterButtons = $("filterButtons");
const filterButtons = () => Array.from(document.querySelectorAll(".filter-btn"));
const store = {
    /**
     * 保存
     */
    set(key, value) {
        // TODO: JSON文字列に変換して保存
        // const json = JSON.stringify(value);
        // localStorage.setItem(key, json);
    },
    /**
     * 取得
     */
    get(key) {
        // TODO: LocalStorage からキーを指定して値取得して、JSONをパースして返す
        // const values = localStorage.getItem(key);
        // return values ? JSON.parse(values) : [];
    },
    /**
     * 削除
     */
    remove(key) {
        // TODO: LocalStorage からキーを指定して値削除
    },
    /**
     * すべて削除
     */
    clear() {
        // TODO: LocalStorage からすべて削除
    }
};
/**
 * タスクを追加
 * @param {*} e 
 */
const add = (e) => {
    // イベントのデフォルト動作をキャンセル
    e.preventDefault();
    // 入力値を取得
    let text = $new.value;
    // 空白を除去して、空文字なら何もしない
    text = (text || "").trim();
    if (!text) return;
    // 新しいタスクを追加
    // TODO: UUIDを生成: crypto.randomUUID() 
    const id = 0;
    // 作成日
    const createdAt = Date.now();
    // 完了状態
    const done = false;
    // TODO: タスクを配列に追加: tasks.push(): id, text, createdAt, done
    
    // 入力フィールドをクリア
    $new.value = "";
    // レンダリング
    render();
    // LocalStorageに保存
    save();
    console.log("add:", tasks);
};
/**
 * タスクを削除
 * @param {*} id 
 */
function remove(id) {
    console.log("remove:", id);
    tasks = tasks.filter(task => task.id !== id);
    // LocalStorageに保存
    save();
    // レンダリング
    render();
}
/**
 * タスクの完了状態を切り替え
 * @param {*} id 
 * @param {*} done 
 * @returns 
 */
function toggleDone(id, done) {
    const task = tasks.find(x => x.id === id);
    if (!task) return;
    // 完了状態を切り替え
    task.done = !!done;
    // LocalStorageに保存
    save();
    // レンダリング
    render();
}
/**
 * 完了済みタスクをすべて削除
 * @returns 
 */
function clearDone() {
    tasks = tasks.filter(x => !x.done);
    // LocalStorageに保存
    save();
    // レンダリング
    render();
}
/**
 * すべてのタスクを削除
 * @returns 
 */
function clearAll() {
    if (!confirm("すべてのタスクを削除します。よろしいですか？")) return;
    // タスク配列を空にする
    tasks = [];
    // LocalStorageに保存
    save();
    // レンダリング
    render();
}
/**
 * タスク保存
 * @returns {void}
 */
function save() {
    // LocalStorageに tasks を保存
    store.set(KEY, tasks);
}

/**
 * フィルタリング処理
 * @param {*} list 
 * @returns 
 */
function filtered() {
    if (filter === "active") return tasks.filter(task => !task.done);
    if (filter === "done") return tasks.filter(task => task.done);
    return tasks;
}

/**
 * フィルタを設定
 * @param {string} next - "all", "active", "done"
 * @returns {void}
 */
function setFilter(selected) {
    filter = selected;
    filterButtons().forEach(btn => {
        const active = btn.dataset.filter === filter;
        btn.classList.toggle("bg-indigo-600", active);
        btn.classList.toggle("text-white", active);
        btn.classList.toggle("shadow-sm", active);
        btn.classList.toggle("text-slate-600", !active);
        btn.classList.toggle("hover:bg-slate-50", !active);
    });
}
/**
 * フィルタボタンのクリックハンドラ
 * @param {*} e 
 */
const filterHandler = (e) => {
    // イベントのデフォルト動作をキャンセル
    e.preventDefault();
    // クリックされたボタンのフィルタを取得
    const filter = e.target.dataset.filter;
    if (filter) {
        setFilter(filter);
        render();
    }
};
/**
 * リストアイテムをレンダリング
 * @param {*} task 
 * @returns 
 */
function renderItem(task) {
    // リストアイテムの要素を作成
    const li = document.createElement("li");
    li.className = "flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors";

    // チェック
    const checkBox = document.createElement("input");
    checkBox.type = "checkbox";
    checkBox.checked = !!task.done;
    checkBox.className = "h-5 w-5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500";
    checkBox.addEventListener("change", () => toggleDone(task.id, checkBox.checked));

    // タスクテキスト
    const span = document.createElement("span");
    span.textContent = task.text;
    span.className = "flex-1 text-[15px] cursor-default " + (task.done ? "line-through text-slate-400" : "text-slate-700");
    span.title = "ダブルクリックで編集";
    span.addEventListener("dblclick", () => edit(task, span));

    // 個別削除
    const del = document.createElement("button");
    del.className = "shrink-0 px-2.5 py-1 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 transition-colors";
    del.textContent = "削除";
    del.addEventListener("click", () => remove(task.id));

    // アイテムに要素を追加
    li.append(checkBox, span, del);
    return li;
}
/**
 * 空状態の行をレンダリング
 * @returns {HTMLLIElement}
 */
function renderEmpty() {
    const li = document.createElement("li");
    li.className = "px-4 py-8 text-center text-sm text-slate-400";
    li.textContent = filter === "all" ? "タスクがありません。上の欄から追加しましょう。" : "該当するタスクがありません。";
    return li;
}
/**
 * レンダリング処理
 * @returns {void}
 */
function render() {
    // リストをクリア
    $list.innerHTML = "";
    // タスクのフィルタリング
    const filterTasks = filtered();
    // リストアイテムのレンダリング
    if (filterTasks.length === 0) {
        $list.appendChild(renderEmpty());
    } else {
        filterTasks.forEach(task => $list.appendChild(renderItem(task)));
    }
    // 件数
    $count.textContent = `${filterTasks.length} / ${tasks.length} 件`;
}
/**
 * インライン編集開始
 * @param {*} task 
 * @param {*} spanEl 
 * @returns 
 */
function edit(task, spanEl) {
    // すでに編集入力があれば無視
    if (spanEl.tagName.toLowerCase() === "input") return;
    // 入力フィールドを作成
    const input = document.createElement("input");
    input.type = "text";
    input.value = task.text;
    input.className = "flex-1 text-[15px] rounded-md border border-indigo-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400";
    // span を input に置き換え
    spanEl.replaceWith(input);
    input.focus();
    // 末尾にカーソル
    const len = input.value.length;
    input.setSelectionRange(len, len);
    let committed = false;

    /**
     * 確定処理
     * @returns 
     */
    const commit = () => {
        if (committed) return;
        committed = true;
        const next = input.value.trim();
        if (!next) {
            // 空は削除
            remove(task.id);
        } else {
            task.text = next;
            // 保存
            save();
            // レンダリング
            render();
        }
    };
    /**
     * キャンセル処理
     * @returns 
     */
    const cancel = () => {
        if (committed) return;
        committed = true;
        render();
    };
    // イベント
    input.addEventListener("keydown", (e) => {
        // Enter キーで確定
        if (e.key === "Enter") commit();
        // Escape キーでキャンセル、
        if (e.key === "Escape") cancel();
    });
    // フォーカスが外れたら確定
    input.addEventListener("blur", commit);
}
/**
 * 初期化処理
 * @returns {void}
 */
const init = () => {
    tasks = store.get(KEY);
    // 初期表示（すべて）
    setFilter("all");
    render();
}
// イベントリスナーの設定
$add.addEventListener("click", add);
$filterButtons.addEventListener("click", filterHandler);
$clearDone.addEventListener("click", clearDone);
$clearAll.addEventListener("click", clearAll);
// 初期化処理
init();
