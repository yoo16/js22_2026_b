// hand-landmarker.js: 手のランドマーク検出と描画のメインスクリプト
import {
    createHandLandmarker,
    estimateHands,
    detectExtendedFingers,
    HAND_CONNECTIONS,
    FINGERS,
} from './hand-landmarker.js';

// DOM
const videoEl = document.getElementById('video');
const canvasEl = document.getElementById('canvas');
const ctx = canvasEl.getContext('2d');
const toggleSkeletonEl = document.getElementById('toggle-skeleton');
const toggleIndexEl = document.getElementById('toggle-index');
const liveDotEl = document.getElementById('live-dot');
const liveLabelEl = document.getElementById('live-label');
const statHandsEl = document.getElementById('stat-hands');
const statFingersEl = document.getElementById('stat-fingers');
const statFpsEl = document.getElementById('stat-fps');
const handDetailsEl = document.getElementById('hand-details');

const REQUEST_WIDTH = 640;
const REQUEST_HEIGHT = 480;

// 手ごとの色
const HAND_COLORS = ['#f43f5e', '#22d3ee'];
const HANDEDNESS_LABEL = { Left: '左手', Right: '右手', Unknown: '不明' };

// 状態
let landmarker;
let showSkeleton = true;
let showIndices = false;
let fps = 0;
let lastTime = performance.now();

async function setupCamera() {
    // Webカメラの映像を取得して video 要素に設定
    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: REQUEST_WIDTH },
            height: { ideal: REQUEST_HEIGHT },
            aspectRatio: { ideal: REQUEST_WIDTH / REQUEST_HEIGHT },
            facingMode: 'user',
        },
        audio: false,
    });
    // video 要素に Webカメラの映像を設定
    videoEl.srcObject = stream;
    // video 要素の再生
    await videoEl.play();
}

// 手の描画処理
function drawHands(hands) {
    // キャンバスをクリア
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    // ビデオの幅と高さを取得
    const srcWidth = videoEl.videoWidth || REQUEST_WIDTH;
    const srcHeight = videoEl.videoHeight || REQUEST_HEIGHT;
    const scaleX = canvasEl.width / srcWidth;
    const scaleY = canvasEl.height / srcHeight;
    const toCanvas = (p) => ({ x: p.x * scaleX, y: p.y * scaleY });

    ctx.font = '11px monospace';
    ctx.textBaseline = 'middle';

    // 各手の描画処理を開始
    hands.forEach((hand, handIndex) => {
        const color = HAND_COLORS[handIndex % HAND_COLORS.length];
        // 手のランドマークをキャンバス座標に変換
        const pts = hand.keypoints.map(toCanvas);

        // TODO: 骨格の描画
        // if (showSkeleton) {
        //     ctx.strokeStyle = color;
        //     ctx.lineWidth = 3;
        //     ctx.beginPath();
        //     HAND_CONNECTIONS.forEach(([a, b]) => {
        //         ctx.moveTo(pts[a].x, pts[a].y);
        //         ctx.lineTo(pts[b].x, pts[b].y);
        //     });
        //     ctx.stroke();
        // }

        // TODO: 関節の描画
        // pts.forEach((p, index) => {
        //     ctx.beginPath();
        //     ctx.arc(p.x, p.y, index === 0 ? 6 : 4, 0, 2 * Math.PI);
        //     ctx.fillStyle = '#fff';
        //     ctx.fill();
        //     ctx.lineWidth = 2;
        //     ctx.strokeStyle = color;
        //     ctx.stroke();

        //     if (showIndices) {
        //         const label = String(index);
        //         ctx.fillStyle = 'rgba(15,23,42,0.75)';
        //         const w = ctx.measureText(label).width + 6;
        //         ctx.fillRect(p.x + 6, p.y - 8, w, 16);
        //         ctx.fillStyle = '#fff';
        //         ctx.fillText(label, p.x + 9, p.y);
        //     }
        // });
    });
}

// 手の詳細情報
function renderHandDetails(hands) {
    handDetailsEl.replaceChildren();
    // 手の詳細情報を表示するためのカードを生成
    hands.forEach((hand, handIndex) => {
        const color = HAND_COLORS[handIndex % HAND_COLORS.length];
        // 各指の状態を検出: hand-landmarker.js の detectExtendedFingers() を使用
        const fingers = detectExtendedFingers(hand.keypoints);
        // 立てている指の本数
        const upCount = Object.values(fingers).filter(Boolean).length;

        const card = document.createElement('div');
        card.className = 'rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-900/5 backdrop-blur';
        card.innerHTML = `
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span class="h-3 w-3 rounded-full" style="background:${color}"></span>
                ${HANDEDNESS_LABEL[hand.handedness] ?? hand.handedness}
              </span>
              <span class="font-mono text-xs text-slate-400">${(hand.score * 100).toFixed(0)}%</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-1.5"></div>
            <p class="mt-2 text-xs text-slate-400">立てている指: <span class="font-mono text-slate-600">${upCount}</span></p>
        `;

        const chips = card.querySelector('div.mt-3');
        for (const [key, f] of Object.entries(FINGERS)) {
            const up = fingers[key];
            const chip = document.createElement('span');
            chip.textContent = f.name;
            chip.className = [
                'rounded-full px-2 py-0.5 text-xs font-medium',
                up ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400',
            ].join(' ');
            chips.appendChild(chip);
        }

        handDetailsEl.appendChild(card);
    });
}

function updateStatus(hands) {
    const detected = hands.length > 0;
    liveDotEl.className = `h-2 w-2 rounded-full ${detected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`;
    liveLabelEl.textContent = detected ? `${hands.length} 手を検出` : '手を探しています';

    // 総検出指の数を計算
    const totalFingers = hands.reduce(
        (sum, hand) => sum + Object.values(detectExtendedFingers(hand.keypoints)).filter(Boolean).length,
        0,
    );
    statHandsEl.textContent = hands.length;
    statFingersEl.textContent = totalFingers;
    statFpsEl.textContent = `${fps} fps`;
}

function tickFps() {
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    if (delta > 0) fps = Math.round(fps * 0.8 + (1000 / delta) * 0.2);
}

function render() {
    tickFps();
    // タイムスタンプ
    const timestamp = performance.now();
    // TODO: 手のランドマークを推定: estimateHands(): 引数: landmarker, videoEl, timestamp
    const hands = {};
    // 手のランドマークの描画
    drawHands(hands);
    // 手の詳細情報の描画
    renderHandDetails(hands);
    // ステータスの更新
    updateStatus(hands);
    // 次のフレームを描画
    requestAnimationFrame(render);
}

async function app() {
    toggleSkeletonEl.addEventListener('change', () => (showSkeleton = toggleSkeletonEl.checked));
    toggleIndexEl.addEventListener('change', () => (showIndices = toggleIndexEl.checked));

    landmarker = await createHandLandmarker(2);
    await setupCamera();
    render();
}

app();
