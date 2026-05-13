$(function () {
    // 選択中のメモ
    let selected = $();

    // class設定
    const defaultClass = "flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow";
    const selectedClass = "border-sky-400 bg-sky-50 ring-4 ring-sky-100";
    const doneClass = "text-slate-400 line-through";
    const messageBaseClass = "mt-4 min-h-14 rounded-2xl px-4 py-3 text-sm";
    const messageToneClass = {
        info: "border border-slate-200 bg-slate-50 text-slate-600",
        warning: "border border-amber-200 bg-amber-50 text-amber-700",
    };
    const memoTextClass = "memo-text break-words text-[15px] leading-6 text-slate-700";
    const inlineEditClass = "memo-editor w-full rounded-xl border border-sky-300 bg-white px-3 py-2 text-[15px] leading-6 text-slate-700 outline-none ring-4 ring-sky-100";
    const deleteBtnClass = "shrink-0 rounded-full bg-rose-500 px-3 py-1 text-sm font-semibold text-white transition hover:bg-rose-600";
    const hintClass = "mt-1 text-xs text-slate-400";
    const checkboxClass = "mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-sky-500 focus:ring-sky-300";

    /**
     * メタ情報の更新
     */
    function updateMeta() {
        // TODO: ul#item-list のliの数を数える
        const count = 0;
        // TODO: id=item-count に メモの個数を表示

        // メモがないときは要素を非表示
        $("#empty-state").toggle(count === 0);
    }

    /**
     * メモを選択
     */
    function selectItem(item) {
        // 全てのメモの選択を解除
        $("#item-list li").removeClass(selectedClass);
        // 選択状態を保存
        if (selected.is(item)) {
            // TODO: すでに選択中の場合、選択解除: selected = $()
        } else {
            // 選択状態を追加
            item.addClass(selectedClass);
            // TODO: 選択状態を保存: selected = item
        }
    }

    /**
     * 新規メモ作成
     */
    function newItem() {
        // 現在の入力値を取得
        const value = getInputValue();
        // liタグの生成
        const li = $("<li>", { class: defaultClass });

        // TODO: チェックボックスの生成: type="checkbox"
        const checkbox = $("<input>", {
            type: "",
            "aria-label": "完了",
            class: checkboxClass,
        });
        // テキストエリアの生成
        const textWrap = $("<div>", { class: "min-w-0 flex-1" });
        // テキストの生成
        const text = $("<span>", {
            class: memoTextClass,
            text: value,
        });
        // pタグでヒントの生成
        const hint = $("<p>", {
            class: hintClass,
            text: "クリックで選択 / ダブルクリックで編集",
        });
        textWrap.append(text, hint);

        // 削除ボタンの生成
        const button = $("<button>", {
            type: "button",
            class: deleteBtnClass,
            text: "削除",
        });

        // 削除ボタンのクリックイベント
        button.on("click", function (event) {
            // クリックイベントの伝播を停止
            event.stopPropagation();
            // 選択中のliタグ
            if (selected.is(li)) {
                selected = $();
            }
            // TODO: liタグの削除

            updateMeta();
        });

        // チェックボックスのクリックイベント
        checkbox.on("click", function (event) {
            event.stopPropagation();
            // トグルクラスの付け外し
            text.toggleClass(doneClass, $(this).prop("checked"));
        });

        // クリックイベントで li を選択
        li.on("click", function (event) {
            selectItem(li);
        });

        // ダブルクリックイベントでインライン編集を開始
        li.on("dblclick", function () {
            if (li.data("editing")) {
                return;
            }
            selectItem(li);
            startInlineEdit(li, text);
        });

        // liタグに要素を追加: チェックボックス、テキストエリア、削除ボタン
        li.append(checkbox, textWrap, button);

        return li;
    }

    /**
     * フラッシュメッセージの表示
     */
    function flashMessage(text, tone = "info") {
        $("#message")
            .removeClass(Object.values(messageToneClass).join(" "))
            .addClass(messageBaseClass + " " + messageToneClass[tone])
            .text(text);

        // 2秒後にフラッシュメッセージをクリア
        setTimeout(function () {
            $("#message")
                .removeClass(Object.values(messageToneClass).join(" "))
                .addClass(messageBaseClass)
                .text("");
        }, 2000);
    }

    /**
     * 入力欄から値を取得す
     */
    function getInputValue() {
        return $("#input-text").val().trim() || "new memo";
    }

    /**
     * 入力欄をクリアしてフォーカス
     */
    function clearInput() {
        $("#input-text").val("").trigger("focus");
    }

    /**
     * メモの追加（末尾に追加）: append
     */
    $("#btn-append").on("click", function () {
        const element = newItem();
        // TODO: id="item-list" の末尾に追加

        // メタ情報の更新
        updateMeta();
        // 入力欄をクリアしてフォーカス
        clearInput();
    });

    /**
     * メモの追加（先頭に追加）: prepend
     */
    $("#btn-prepend").on("click", function () {
        const element = newItem();
        // TODO: id="item-list" の先頭に追加

        // メタ情報の更新
        updateMeta();
        // 入力欄をクリアしてフォーカス
        clearInput();
    });

    /**
     * メモの追加（選択中のメモの前に挿入）: before
     */
    $("#btn-before").on("click", function () {
        if (selected.length) {
            const element = newItem();
            // TODO: 選択中のメモの前に挿入

            // メタ情報の更新
            updateMeta();
            // 入力欄をクリアしてフォーカス
            clearInput();
        } else {
            flashMessage("メモを選択してください", "warning");
        }
    });

    /**
     * メモの追加（選択中のメモの後に追加）: after
     */
    $("#btn-after").on("click", function () {
        if (selected.length) {
            const element = newItem();
            // TODO: 選択中のメモの後に追加

            // メタ情報の更新
            updateMeta();
            // 入力欄をクリアしてフォーカス
            clearInput();
        } else {
            flashMessage("メモを選択してください", "warning");
        }
    });

    /**
     * メモの追加（テキスト入力欄でEnterキー）: keydown
     */
    $("#input-text").on("keydown", function (event) {
        const key = event.key || event.originalEvent?.key;

        // TODO: 日本語入力中のEnterキーを無視
        // const isComposing = event.originalEvent?.isComposing || event.isComposing || event.which === 229;
        // if (isComposing) {
        //     return;
        // }

        // Enterキーでメモを追加
        if (key === "Enter" || event.which === 13 || event.keyCode === 13) {
            event.preventDefault();
            // TODO: メモを追加
            // const element = newItem();
            // element.appendTo("#item-list");
            // selectItem(element);
            // updateMeta();
            // clearInput();
        }
    });

    /**
     * インライン編集開始
     */
    function startInlineEdit(li, text) {
        // 編集中のメモを防ぐ
        if (li.data("editing")) {
            return;
        }
        // 編集フラグを立てる
        li.data("editing", true);
        selectItem(li);

        // TODO: inputタグ type=textを生成
        const input = $("", {
            type: "text",
            class: inlineEditClass,
            val: text.text(),
        });

        // 現在のテキストを隠す
        text.addClass("hidden");
        // テキストの後ろにinputを挿入
        text.after(input);
        // inputにフォーカス
        input.trigger("focus").trigger("select");

        // クリックしたらイベントが発生しないようにする
        input.on("click", function (event) {
            event.stopPropagation();
        });
        // ダブルクリックしたらイベントが発生しないようにする
        input.on("dblclick", function (event) {
            event.stopPropagation();
        });
        // フォーカスが外れたらインライン編集を終了する
        input.on("blur", function () {
            finishInlineEdit(li, input, text, true);
        });

        // キー入力時のイベント
        input.on("keydown", function (event) {
            const key = event.key || event.originalEvent?.key;
            const isComposing = event.originalEvent?.isComposing || event.isComposing || event.which === 229;

            // 日本語入力中のEnterキーを無視
            if (isComposing) {
                return;
            }

            // Enterキーで確定
            if (key === "Enter" || event.which === 13 || event.keyCode === 13) {
                event.preventDefault();
                finishInlineEdit(li, input, text, true);
                return;
            }
            // Escapeキーでキャンセル
            if (key === "Escape" || event.which === 27 || event.keyCode === 27) {
                event.preventDefault();
                finishInlineEdit(li, input, text, false);
            }
        });
    }

    /**
     * インライン編集を終了
     */
    function finishInlineEdit(li, input, text, save) {
        // TODO: インライン入力値の取得
        const nextValue = "";
        // 値があればテキストを置き換える
        if (save && nextValue) {
            text.text(nextValue);
        }
        // インライン入力要素を削除
        input.remove();
        // テキストを表示
        text.removeClass("hidden");
        //編集フラグを削除
        li.removeData("editing");
    }

    updateMeta();
});
