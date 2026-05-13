// バニラJS
// document.getElementById('click-button').addEventListener("click", function () { 
//     $("#result-event").text('クリックしました')
//  })

// TODO: クリックイベント: イベント名 = click
$("#click-button").on("", function () {
    // TODO: id=input-text のデータ取得: val()
    var userName = "";
    if (userName) {
        var message = userName + "さん、ようこそ！";
        // TODO: id=result-event にメッセージ表示: text()
    }
});

$('#input-text').on({
    // TODO: inputイベント
    "": function () {
        // TODO: 入力されたテキストを取得
        const inputText = "";
        $("#result-event").text(inputText);
    },
    // TODO: focusイベント
    "": function () {
        $(this).addClass('bg-blue-100')
    },
    // TODO: blurイベント
    "": function () {
        $(this).removeClass('bg-blue-100')
    }
});

// change イベント
$('#character-select').on('change', function () {
    // TODO: プルダウンで選択された値を取得: $(this).val()
    const id = 0;
    updateImage(id);
});

// #character-list li だとクリックが反応しない
// TODO: イベントデリゲーション: on('click', 'li', function() {...})
$('#character-list li').on('click', function () {
    // data-character を取得
    const id = $(this).data('character');
    updateImage(id);
});

// 画像更新
function updateImage(id) {
    const imagePath = `images/character_${id}.png`;
    // TODO: img タグの src に画像パスを設定: attr();
    $('#character-image')
}

// mouseoverイベントハンドラー
const mouseOverHandler = function (event) {
    const imagePath = `images/character_5.png`;
    $(this).attr('src', imagePath);
}

// mouseoutイベントハンドラー
const mouseOutHandler = function (event) {
    const imagePath = `images/character_4.png`;
    $(this).attr('src', imagePath);
}

// mouseイベント
// TODO: マウスオーバーイベントに mouseOverHandler を登録
// TODO: マウスアウトイベントに mouseOutHandler を登録
$('#hoverBox').on(
    {
        "": "",
        "": "",
    }
)

// mouseイベント削除
// マウスオーバーイベントから mouseOverHandler を削除
// マウスアウトイベントから mouseOutHandler を削除
$('#event-off-button').on('click', function () {
    $('#hoverBox').off('mouseover', mouseOverHandler)
    $('#hoverBox').off('mouseout', mouseOutHandler)
});

// キャラクターリスト作成
const characters = [
    { id: 1, name: "Character1" },
    { id: 2, name: "Character2" },
    { id: 3, name: "Character3" },
];

function createCharacterList() {
    // list に li 要素を動的に追加
    $.each(characters, function (index, char) {
        const $li = $("<li>")
            .addClass("p-2 cursor-pointer bg-gray-100 rounded hover:bg-gray-200")
            .attr("data-character", char.id)
            .text(char.name);

        $("#character-list").append($li);
    });
}

// メイン画像の表示
updateImage(1)
// キャラクターリストの作成
createCharacterList();