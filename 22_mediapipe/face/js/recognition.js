// face-landmarker.js 顔ランドマーク推定機能をインポート
import { createFaceLandmarker, estimateFaces } from './face-landmarker.js';
// face-data.js 顔ランドマークの部位情報をインポート
import { landmarkParts, PART_LABELS } from './face-data.js';

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
const statFaceEl = document.getElementById('stat-face');
const statTotalEl = document.getElementById('stat-total');
const statCountEl = document.getElementById('stat-count');
const statFpsEl = document.getElementById('stat-fps');

// カメラ要求解像度
const REQUEST_WIDTH = 640;
const REQUEST_HEIGHT = 480;

// 状態
let detector;   // 顔ランドマーク推定器
let selectedPart = 'nose';
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
    // TODO: 部位ボタンを生成
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

function buildIndexList() {
    indexListEl.replaceChildren();
    const landmarks = uniqueIndices(selectedPart);
    // TODO: ランドマーク番号のボタンを生成
    // landmarks.forEach((index) => {
    //     const chip = document.createElement('button');
    //     chip.type = 'button';
    //     chip.dataset.index = String(index);
    //     chip.textContent = index;
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
        'rounded-md px-1.5 py-0.5 font-mono text-xs transition',
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
    await videoEl.play();
}

function drawResults(faces) {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const face = faces[0];
    if (!face) return;

    const srcWidth = videoEl.videoWidth || REQUEST_WIDTH;
    const srcHeight = videoEl.videoHeight || REQUEST_HEIGHT;
    const scaleX = canvasEl.width / srcWidth;
    const scaleY = canvasEl.height / srcHeight;
    const indices = uniqueIndices(selectedPart);

    ctx.font = '11px monospace';
    ctx.textBaseline = 'middle';

    // 選択された部位のランドマーク番号を取得
    indices.forEach((index) => {
        // ランドマークの座標を取得
        const point = face.keypoints[index];
        if (!point) return;
        const x = point.x * scaleX;
        const y = point.y * scaleY;
        const isHi = index === highlightIndex;

        // ランドマークを描画
        ctx.beginPath();
        ctx.arc(x, y, isHi ? 6 : 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = isHi ? '#22d3ee' : '#f43f5e';
        ctx.fill();

        if (isHi) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#0e7490';
            ctx.stroke();
        }

        if (showIndices || isHi) {
            const label = String(index);
            ctx.fillStyle = 'rgba(15,23,42,0.75)';
            const w = ctx.measureText(label).width + 6;
            ctx.fillRect(x + 6, y - 8, w, 16);
            ctx.fillStyle = '#fff';
            ctx.fillText(label, x + 9, y);
        }
    });
}

function updateStatus(faces) {
    const face = faces[0];
    const detected = Boolean(face);

    statFaceEl.textContent = detected ? '検出中' : '未検出';
    statFaceEl.className = `font-semibold ${detected ? 'text-emerald-600' : 'text-slate-400'}`;
    liveDotEl.className = `h-2 w-2 rounded-full ${detected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`;
    liveLabelEl.textContent = detected ? '検出中' : '顔を探しています';

    statTotalEl.textContent = face ? face.keypoints.length : 0;
    statCountEl.textContent = detected ? uniqueIndices(selectedPart).length : 0;
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
    // TODO: 顔ランドマークを推定: estimateFaces(): detector, videoEl, timestamp を引数
    const faces = [];
    // 描画
    drawResults(faces);
    // ステータスを更新
    updateStatus(faces);
    // 次のフレームを描画
    requestAnimationFrame(render);
}

async function app() {
    buildPartButtons();
    selectPart(selectedPart);
    // 部位の選択イベント
    toggleIndexEl.addEventListener('change', () => {
        showIndices = toggleIndexEl.checked;
    });
    // TODO: 顔ランドマーク推定器を初期化(非同期): createFaceLandmarker
    detector = {};
    // Webカメラをセットアップ
    await setupCamera();
    render();
}

app();
