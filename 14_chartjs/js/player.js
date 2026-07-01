// キャラクターデータ変数
let playersList = [];
let playerChart;
// Canvasのコンテキストを取得
const playerCanvas = document.getElementById('playerChart');
const ctx = playerCanvas.getContext('2d');

// DOM要素の参照を取得
const playerImageWrapper = document.getElementById('player-image-wrapper');
const playerImage = document.getElementById('playerImage');
const playerName = document.getElementById('player-name');
const thumbnailContainer = document.getElementById('thumbnailContainer');

// ノイズエフェクトのフレーム数と画像切り替えタイミング
const TOTAL_FRAMES = 100;
const SWAP_FRAME = 50;

// チャート設定
const chartCustom = {
    title: { display: true, text: 'STATUS ANALYSIS', font: { size: 13, weight: 'bold' }, color: '#00e5ff', padding: { top: 8, bottom: 12 } },
    legend: { labels: { font: { size: 13 }, color: '#e2e8f0' } },
    tooltip: {
        backgroundColor: 'rgba(0, 10, 20, 0.85)',
        borderColor: 'rgba(0, 229, 255, 0.4)',
        borderWidth: 1,
        titleColor: '#00e5ff',
        bodyColor: '#e2e8f0',
        bodyFont: { size: 13 },
    },
    scales: {
        r: {
            suggestedMin: 0,
            angleLines: { color: 'rgba(0, 229, 255, 0.2)' },
            grid: { color: 'rgba(0, 229, 255, 0.15)' },
            ticks: {
                stepSize: 25,
                color: 'rgba(0, 229, 255, 0.55)',
                backdropColor: 'transparent',
                font: { size: 11 },
            },
            pointLabels: {
                font: {
                    size: 13,
                    weight: 'bold'
                },
                color: '#00e5ff',
            },
        },
    }
}

// チャートを生成する関数
function createChart(chartConfig) {
    // 既存のチャートがあれば破棄してから新規作成
    if (playerChart) playerChart.destroy();

    // チャート設定をカスタム設定で上書き（マージ）
    chartConfig.options.scales = {};
    chartConfig.options.plugins = {};
    chartConfig.options.scales.r = Object.assign(chartCustom.scales.r, chartConfig.options.scales.r);
    chartConfig.options.plugins.legend = Object.assign(chartCustom.legend, chartConfig.options.plugins.legend);
    chartConfig.options.plugins.tooltip = Object.assign(chartCustom.tooltip, chartConfig.options.plugins.tooltip);
    chartConfig.options.plugins.title = Object.assign(chartCustom.title, chartConfig.options.plugins.title);

    // TODO: 新しいチャートを作成
    // playerChart = new Chart(ctx, chartConfig);
}

// サムネイル生成とクリックイベント
function createThumbnails(players) {
    //  サムネイルを初期化
    thumbnailContainer.innerHTML = '';
    // サムネイルを生成してコンテナに追加
    players.map((player) => {
        const thumb = createThumbnail(player);
        thumbnailContainer.appendChild(thumb);
    });
}

// サムネイル要素を生成し、クリックでプレイヤーデータを読み込むイベントを設定
function createThumbnail(player) {
    const thumb = document.createElement('img');
    thumb.src = player.image;
    thumb.alt = player.name;
    thumb.id = `thumb-${player.id}`;
    thumb.className = 'w-20 h-20 object-cover cursor-pointer border-2 border-cyan-900/60 transition-all duration-200 opacity-50 hover:opacity-90';

    // TODO: クリックでプレイヤーデータを読み込む
    thumb.addEventListener('', () => loadPlayer(player.id));
    return thumb;
}

// プレイヤーデータを読み込んでUIを更新
function loadPlayer(playerId) {
    // IDに対応するプレイヤーデータを検索
    const playerData = playersList.find(p => p.id === playerId);
    if (!playerData) return;

    // サムネイル選択状態を更新
    document.querySelectorAll('#thumbnailContainer img').forEach(img => {
        img.classList.remove('thumb-active');
    });
    // クリックされたサムネイルにアクティブクラスを追加
    const activeThumb = document.getElementById(`thumb-${playerId}`);
    if (activeThumb) activeThumb.classList.add('thumb-active');

    // 画像更新
    transitionImage(playerData.image);

    // ID更新（4桁ゼロパディング）
    document.getElementById('hud-id').textContent = String(playerId).padStart(4, '0');

    // キャラクター名更新（グリッチ用 data-text も同期）
    playerName.textContent = playerData.name;
    playerName.dataset.text = playerData.name;

    // チャート更新
    createChart(playerData);
}

// 初期化処理：JSONデータのフェッチとUIのセットアップ
async function init() {
    try {
        // TODO: API URL: api/players.json 
        const uri = '';
        // APIからデータを取得
        const res = await fetch(uri);
        // JSONをプレイヤーリストに変換
        const data = await res.json();
        // グローバル変数にプレイヤーデータを保存
        playersList = data.players;
    } catch (e) {
        console.error('データ取得エラー:', e);
        playerName.textContent = 'データの読み込みに失敗しました';
        return;
    }

    // サムネイルを生成し、最初のプレイヤーをロード
    createThumbnails(playersList);
    if (playersList.length > 0) loadPlayer(playersList[0].id);
}

// ノイズエフェクト付き画像切り替え
function transitionImage(newSrc) {
    // 画像を一旦空にしてからノイズエフェクトを開始
    playerImage.src = "";

    // ノイズキャンバスを取得または作成
    let canvas = playerImageWrapper.querySelector('.noise-canvas');
    if (!canvas) {
        // 初回はキャンバスがないので作成して追加
        canvas = document.createElement('canvas');
        canvas.className = 'noise-canvas';
        playerImageWrapper.appendChild(canvas);
    }

    // キャンバスサイズを画像サイズに合わせる
    const rect = playerImage.getBoundingClientRect();
    canvas.width = rect.width || playerImage.offsetWidth || 400;
    canvas.height = rect.height || playerImage.offsetHeight || 500;
    canvas.style.transition = 'none';
    // ノイズキャンバスを表示
    canvas.style.opacity = '1';

    // Canvasの2Dコンテキストを取得
    const ctx = document.createElementNS ? canvas.getContext('2d') : null;
    if (!ctx) {
        playerImage.src = newSrc;
        return;
    }

    let frame = 0;
    let swapped = false;

    // フェードイン処理
    function fadeIn() {
        // ノイズキャンバスを非表示
        canvas.style.opacity = '0';
        // キャラクタ画像をフェードインさせるためにクラス削除
        playerImage.classList.remove('img-fadein');
        // 再フローを強制してクラス削除を確実に反映
        void playerImage.offsetWidth;
        // img-fadeinクラスを再度追加し
        playerImage.classList.add('img-fadein');
        // キャラクター画像を透明度を1に設定
        playerImage.style.opacity = '1';
    }

    // ノイズを生成のキャンバスドロー
    function drawNoise() {
        const w = canvas.width, h = canvas.height;
        const id = ctx.createImageData(w, h);
        const d = id.data;

        // スキャンラインのランダムな帯
        const scanY = (Math.random() * h) | 0;
        const scanH = ((Math.random() * 18) + 4) | 0;

        // 全ピクセルをループしてノイズを生成
        for (let y = 0; y < h; y++) {
            const inScan = y >= scanY && y < scanY + scanH;
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                if (inScan) {
                    // 水平スキャン帯: 明るいシアン
                    d[i] = 20;
                    d[i + 1] = 200;
                    d[i + 2] = 230;
                    d[i + 3] = (Math.random() * 160 + 80) | 0;
                } else {
                    // スパースなノイズ粒子 (15% の確率で点灯)
                    if (Math.random() > 0.85) {
                        const v = (Math.random() * 200 + 55) | 0;
                        const cyan = Math.random() > 0.4;
                        d[i] = cyan ? 0 : v;
                        d[i + 1] = cyan ? (v * 0.9) | 0 : (v * 0.7) | 0;
                        d[i + 2] = v;
                        d[i + 3] = (Math.random() * 180 + 60) | 0;
                    }
                }
            }
        }
        ctx.putImageData(id, 0, 0);

        // 中間で画像ソースを差し替え
        if (frame === SWAP_FRAME && !swapped) {
            playerImage.style.opacity = '0';
            playerImage.src = newSrc;
            swapped = true;
        }

        frame++;
        // TOTAL_FRAMESまで描画を続ける
        if (frame < TOTAL_FRAMES) {
            requestAnimationFrame(drawNoise);
        } else {
            fadeIn();
        }
    }

    // アニメーション開始
    requestAnimationFrame(drawNoise);
}

// Typewriter
function typeWriter(el, text, speed = 75) {
    el.textContent = '';
    const cursor = document.createElement('span');
    cursor.className = 'tw-cursor';
    el.appendChild(cursor);
    let i = 0;
    const tick = setInterval(() => {
        if (i < text.length) {
            cursor.insertAdjacentText('beforebegin', text[i++]);
        } else {
            clearInterval(tick);
        }
    }, speed);
}

document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('header-title');
    typeWriter(el, el.dataset.text);
});

// ページロード時に初期化関数を呼び出す
window.addEventListener('load', init);