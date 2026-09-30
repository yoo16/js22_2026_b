// pose-landmarker.js 姿勢ランドマーク推定機能をインポート
import { createPoseLandmarker, estimatePoses, POSE_CONNECTIONS } from './pose-landmarker.js';
// pose-data.js 体のランドマークの部位情報をインポート
import { landmarkParts, PART_LABELS, LANDMARK_NAMES } from './pose-data.js';

// DOM
const videoEl = document.getElementById('video');
const canvasEl = document.getElementById('canvas');
const ctx = canvasEl.getContext('2d');
const partButtonsEl = document.getElementById('part-buttons');
const indexListEl = document.getElementById('index-list');
const indexTitleEl = document.getElementById('index-title');
const toggleIndexEl = document.getElementById('toggle-index');
const liveDotEl = document.getElementById('live-dot');
const liveLabelEl = document.getElementById('live-label');
const statPoseEl = document.getElementById('stat-pose');
const statTotalEl = document.getElementById('stat-total');
const statCountEl = document.getElementById('stat-count');
const statFpsEl = document.getElementById('stat-fps');

// カメラ解像度
const REQUEST_WIDTH = 640;
const REQUEST_HEIGHT = 480;

// 状態
let detector;   // 姿勢ランドマーク推定器
let selectedPart = 'rightArm';
let showIndices = false;
let highlightIndex = null;
let fps = 0;
let lastTime = performance.now();

// 部位ごとの重複を除いた番号リスト
function uniqueIndices(part) {
    // 部位に対応するランドマーク番号の重複を除去
    const landmarks = [...new Set(landmarkParts[part])];
    // ソートして返す
    return landmarks.sort((a, b) => a - b);
}

// UI 構築
function buildPartButtons() {
    // TODO: 部位選択ボタンの生成
    // Object.keys(landmarkParts).forEach((key) => {
    //     const btn = document.createElement('button');
    //     btn.type = 'button';
    //     btn.dataset.part = key;
    //     btn.textContent = PART_LABELS[key] ?? key;
    //     btn.className = baseChipClass(false);
    //     btn.addEventListener('click', () => selectPart(key));
    //     partButtonsEl.appendChild(btn);
    // });
}

function baseChipClass(active) {
    return [
        'rounded-full px-3 py-1 text-sm font-medium transition',
        active
            ? 'bg-indigo-600 text-white shadow'
            : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
    ].join(' ');
}

// 部位選択
function selectPart(key) {
    selectedPart = key;
    highlightIndex = null;
    [...partButtonsEl.children].forEach((btn) => {
        btn.className = baseChipClass(btn.dataset.part === key);
    });
    buildIndexList();
    indexTitleEl.textContent = `ランドマーク番号 — ${PART_LABELS[key] ?? key}`;
}

// 選択中の部位に対応するランドマーク番号リスト
function buildIndexList() {
    // TODO: 選択中の部位に対応するランドマーク番号リストを表示
    // indexListEl.replaceChildren();
    // const landmarks = uniqueIndices(selectedPart);
    // landmarks.forEach((index) => {
    //     const chip = document.createElement('button');
    //     chip.type = 'button';
    //     chip.dataset.index = String(index);
    //     // 番号と名前を表示（例: 14 右ひじ）
    //     chip.textContent = `${index} ${LANDMARK_NAMES[index]}`;
    //     chip.className = indexChipClass(false);
    //     chip.addEventListener('click', () => {
    //         highlightIndex = highlightIndex === index ? null : index;
    //         refreshIndexChips();
    //     });
    //     indexListEl.appendChild(chip);
    // });
}

function indexChipClass(active) {
    return [
        'rounded-md px-1.5 py-0.5 text-xs transition',
        active
            ? 'bg-rose-500 text-white'
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
    ].join(' ');
}

function refreshIndexChips() {
    [...indexListEl.children].forEach((chip) => {
        const isActive = Number(chip.dataset.index) === highlightIndex;
        chip.className = indexChipClass(isActive);
    });
}

// 検出
async function setupCamera() {
    // ビデオストリームを取得
    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: REQUEST_WIDTH },
            height: { ideal: REQUEST_HEIGHT },
            aspectRatio: { ideal: REQUEST_WIDTH / REQUEST_HEIGHT },
            facingMode: 'user',
        },
        audio: false,
    });
    videoEl.srcObject = stream;
    // ビデオ再生
    await videoEl.play();
}

function drawResults(poses) {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const pose = poses[0];
    if (!pose) return;

    const srcWidth = videoEl.videoWidth || REQUEST_WIDTH;
    const srcHeight = videoEl.videoHeight || REQUEST_HEIGHT;
    const scaleX = canvasEl.width / srcWidth;
    const scaleY = canvasEl.height / srcHeight;
    const indices = uniqueIndices(selectedPart);

    // 全身の骨格描画
    ctx.beginPath();
    // TODO: 骨格を描画
    // POSE_CONNECTIONS.forEach(([a, b]) => {
    //     ctx.moveTo(pose.keypoints[a].x * scaleX, pose.keypoints[a].y * scaleY);
    //     ctx.lineTo(pose.keypoints[b].x * scaleX, pose.keypoints[b].y * scaleY);
    // });
    // ctx.lineWidth = 2;
    // ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    // ctx.stroke();

    ctx.font = '12px sans-serif';
    ctx.textBaseline = 'middle';

    // 選択された部位のランドマーク番号を取得
    indices.forEach((index) => {
        // TODO: ランドマークの座標を取得: pose.keypoints[index]
        const point = { x: 0, y: 0 };
        if (!point) return;
        // ランドマークの描画位置を計算
        const x = point.x * scaleX;
        const y = point.y * scaleY;
        // ハイライトされているかどうかを判定
        const isHi = index === highlightIndex;

        // ランドマークを描画
        ctx.beginPath();
        ctx.arc(x, y, isHi ? 8 : 5, 0, 2 * Math.PI);
        ctx.fillStyle = isHi ? '#22d3ee' : '#f43f5e';
        ctx.fill();

        if (isHi) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#0e7490';
            ctx.stroke();
        }

        // ランドマークのラベルを描画
        if (showIndices || isHi) {
            const label = `${index} ${LANDMARK_NAMES[index]}`;
            ctx.fillStyle = 'rgba(15,23,42,0.75)';
            const w = ctx.measureText(label).width + 6;
            ctx.fillRect(x + 8, y - 9, w, 18);
            ctx.fillStyle = '#fff';
            ctx.fillText(label, x + 11, y);
        }
    });
}

function updateStatus(poses) {
    const pose = poses[0];
    const detected = Boolean(pose);

    statPoseEl.textContent = detected ? '検出中' : '未検出';
    statPoseEl.className = `font-semibold ${detected ? 'text-emerald-600' : 'text-slate-400'}`;
    liveDotEl.className = `h-2 w-2 rounded-full ${detected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`;
    liveLabelEl.textContent = detected ? '検出中' : '体を探しています';

    // TODO: ランドマークの総数を更新
    // statTotalEl.textContent = pose ? pose.keypoints.length : 0;
    // TODO: 選択された部位のランドマーク数を更新
    // statCountEl.textContent = detected ? uniqueIndices(selectedPart).length : 0;
    statFpsEl.textContent = `${fps} fps`;
}

// FPS 計測
function tickFps() {
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    if (delta > 0) {
        fps = Math.round(fps * 0.8 + (1000 / delta) * 0.2);
    }
}

// 描画 & 更新
function render() {
    // FPS を更新
    tickFps();
    // 現在のタイムスタンプを取得
    const timestamp = performance.now();
    // 姿勢ランドマークを推定: estimatePoses(): detector, videoEl, timestamp を引数
    const poses = estimatePoses(detector, videoEl, timestamp);
    // 描画
    drawResults(poses);
    // ステータスを更新
    updateStatus(poses);
    // 次のフレームを描画
    requestAnimationFrame(render);
}

async function app() {
    buildPartButtons();
    selectPart(selectedPart);
    // 番号表示の切り替えイベント
    toggleIndexEl.addEventListener('change', () => {
        showIndices = toggleIndexEl.checked;
    });
    // 姿勢ランドマーク推定器を初期化(非同期): createPoseLandmarker
    detector = await createPoseLandmarker();
    // Webカメラをセットアップ
    await setupCamera();
    render();
}

app();
