// DOM 要素
const video = document.getElementById('video');
const captureBtn = document.getElementById('capture-btn');
const photoInput = document.getElementById('photo');
const canvasArea = document.getElementById('canvas-area');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownCircle = document.getElementById('countdownCircle');
const loadingModal = document.getElementById('loadingModal');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const imageModal = document.getElementById('imageModal');
const capturedImage = document.getElementById('capturedImage');
const closeImageModal = document.getElementById('closeImageModal');
const downloadImageBtn = document.getElementById('downloadImage');
const frameTextInput = document.getElementById('frameTextInput');
const frameTextColor = document.getElementById('frameTextColor');
const frameThumbnails = document.querySelectorAll('.frame-thumbnail');
const filterButtons = document.querySelectorAll('.filter-button');

// 合成用の Canvas を作成
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// 現在選択中のフレーム画像（初期は最初のサムネイル）
let currentFrameSrc = document.querySelector('.frame-thumbnail').dataset.frame;

// キャンバスサイズ（フレーム画像と同じ名刺型レイアウト）
const canvasWidth = 592;
const canvasHeight = 896;

// シャッタータイマーの遅延時間（秒）
const shutterDelaySeconds = 3;

// キャプチャされた画像を保持するための DataTransfer オブジェクト
const dataTransfer = new DataTransfer();

// カウントダウンのオーディオを読み込む
const countdownAudio = new Audio('audio/countdown.wav');

// 音声再生のON/OFF制御フラグ（初期値：ON）
let audioEnabled = true;

// 現在の画像フィルター
let currentFilter = document.querySelector('.filter-button').dataset.filter;

// フレームに重ねる文字
let frameText = frameTextInput.value;
let frameTextColorValue = frameTextColor.value;

// 画像フィルターの定義
const imageFilters = {
    puri: 'brightness(1.22) contrast(0.92) saturate(1.18)',
    skin: 'brightness(1.16) contrast(0.9) saturate(1.22) hue-rotate(-5deg)',
    airy: 'brightness(1.2) contrast(0.84) saturate(1.02)',
    pop: 'brightness(1.1) contrast(1.12) saturate(1.42)',
    dreamy: 'brightness(1.18) contrast(0.82) saturate(1.1) blur(0.3px)',
    natural: 'none',
};

// 合成用フレーム画像オブジェクト
const overlayFrame = new Image();
// 現在のフレーム画像を設定
overlayFrame.src = currentFrameSrc;

/**
 * 合成用の Canvas を作成し、DOM へ追加
 *
 * @description
 *   合成用の Canvas を作成し、DOM へ追加する。
 *   この Canvas には、合成された画像が描画される。
 */
function createcanvas() {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    // 合成用のフレーム画像を設定
    canvasArea.appendChild(canvas);
}

/**
 * カメラの有効化
 */
const onCamera = async () => {
    // TODO: カメラの有効化処理を実装
    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: 1280 },
            height: { ideal: 1920 },
            facingMode: 'user',
        },
        audio: false,
    });

    // TODO: ビデオ要素にカメラ映像を表示
    video.srcObject = stream;
};

/**
 * 映像をキャンバス全体に cover 表示する。
 */
function drawVideoCover() {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) return;

    const canvasRatio = canvasWidth / canvasHeight;
    const videoRatio = videoWidth / videoHeight;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;

    // video と canvas のアスペクト比を比較
    if (videoRatio > canvasRatio) {
        sourceWidth = videoHeight * canvasRatio;
        sourceX = (videoWidth - sourceWidth) / 2;
    } else {
        sourceHeight = videoWidth / canvasRatio;
        sourceY = (videoHeight - sourceHeight) / 2;
    }

    // ctx の状態を保存
    ctx.save();
    // TODO: 選択されたフィルターを適用
    ctx.filter = imageFilters[currentFilter] || imageFilters.natural;

    // TODO: ビデオをキャンバス全体に cover 表示で描画
    ctx.drawImage(
        video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvasWidth,
        canvasHeight
    );

    // ctx の状態を復元
    ctx.restore();
}

/**
 * 入力された文字をフレーム上へ重ねる。
 */
function drawFrameText() {
    const text = frameText.trim();
    if (!text) return;

    const maxTextWidth = canvasWidth - 140;
    let fontSize = 54;
    // ctx の状態を保存
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${fontSize}px Arial, sans-serif`;

    // TODO: テキストの幅が最大幅を超える場合、フォントサイズを小さくして調整
    while (fontSize > 26 && ctx.measureText(text).width > maxTextWidth) {
        fontSize -= 2;
        ctx.font = `900 ${fontSize}px Arial, sans-serif`;
    }

    // テキストをフレーム上に描画
    const x = canvasWidth / 2;
    const y = canvasHeight - 96;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(8, fontSize * 0.18);
    // TODO: フレーム文字を適用
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillStyle = frameTextColorValue;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
}

/**
 * 画像キャプチャ処理
 * canvas の内容（ビデオとフレームの合成済み）をキャプチャして Blob 化
 */
const onCapture = async () => {
    // 画像ファイル名
    const imageFileName = `captured-image-${Date.now()}.jpg`;
    // 画像の MIME タイプ
    const imageType = 'image/jpeg';
    // モーダルを表示
    loadingModal.classList.remove('hidden');

    // TODO: canvas の内容を Blob に変換
    // canvas.toBlob((blob) => {
    //     // 画像ファイルを DataTransfer に追加
    //     const file = new File([blob], imageFileName, { type: imageType });
    //     // データ転送オブジェクトにファイルを追加
    //     dataTransfer.items.add(file);
    //     // 画像入力要素にファイルを設定
    //     photoInput.files = dataTransfer.files;
    //     // 画像URL を生成
    //     const imageUrl = URL.createObjectURL(blob);
    //     // 画像モーダルに表示
    //     capturedImage.src = imageUrl;

    //     // モーダル表示とローディング非表示
    //     imageModal.classList.remove('hidden');
    //     loadingModal.classList.add('hidden');
    // }, imageType);
};

/**
 * カウントダウン処理
 */
const countDown = () => {
    let count = shutterDelaySeconds;
    countdownCircle.textContent = count;
    countdownOverlay.classList.remove('hidden');
    countdownCircle.classList.add('animate-ping');

    // TODO: setInterval を使用してカウントダウンを開始
    // const countdownInterval = setInterval(() => {
    //     count--;
    //     if (count > 0) {
    //         // カウントダウン中
    //         countdownCircle.textContent = count;
    //     } else {
    //         // カウントダウン終了
    //         clearInterval(countdownInterval);
    //         countdownOverlay.classList.add('hidden');
    //         countdownCircle.classList.remove('animate-ping');
    //         // 画像キャプチャを実行
    //         onCapture();
    //         captureBtn.disabled = false;
    //     }
    // }, 1000);
};

/**
 * Countdown Audio の再生
 */
const playSound = () => {
    countdownAudio.currentTime = 0;
    // TODO: カウントダウン音を再生
    // countdownAudio.play();
};

// キャプチャボタン押下時
captureBtn.addEventListener('click', () => {
    captureBtn.disabled = true;
    if (audioEnabled) playSound();
    countDown();
});


// サムネイルクリック時のイベントを設定
frameThumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
        // TODO: data-frame 属性から currentFrameSrc を更新
        currentFrameSrc = thumb.dataset.frame

        // TODO: 合成用のフレーム画像を更新: overlayFrame.src
        overlayFrame.src = currentFrameSrc

        // 選択中のサムネイルにスタイルを適用
        frameThumbnails.forEach(t => t.classList.remove('border-blue-500'));
        thumb.classList.add('border-blue-500');
    });
});

// 画像フィルター変更
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentFilter = button.dataset.filter;
        filterButtons.forEach(b => {
            b.classList.remove('border-sky-500', 'bg-sky-500', 'text-white', 'hover:bg-sky-600');
            b.classList.add('border-sky-200', 'bg-white/80', 'text-sky-700', 'hover:bg-sky-50');
        });
        button.classList.remove('border-sky-200', 'bg-white/80', 'text-sky-700', 'hover:bg-sky-50');
        button.classList.add('border-sky-500', 'bg-sky-500', 'text-white', 'hover:bg-sky-600');
    });
});

// フレーム文字変更
frameTextInput.addEventListener('input', (e) => {
    frameText = e.target.value;
});

// フレーム文字色変更
frameTextColor.addEventListener('input', (e) => {
    frameTextColorValue = e.target.value;
});

// ビデオが再生開始されたら、Canvas に合成描画を開始
video.addEventListener('play', () => {
    const drawComposite = () => {
        if (video.paused || video.ended) return;
        // ビデオの現在のフレームを描画
        drawVideoCover();
        // フレーム画像が読み込まれている場合、合成
        if (overlayFrame.complete) {
            ctx.filter = 'none';
            // TODO: フレーム画像をキャンバスに描画
            ctx.drawImage(overlayFrame, 0, 0, canvasWidth, canvasHeight);
        }
        drawFrameText();
        requestAnimationFrame(drawComposite);
    };
    drawComposite();
});


// 画像モーダルの「Close」ボタン
closeImageModal.addEventListener('click', () => {
    imageModal.classList.add('hidden');
});

// TODO: ダウンロードボタンのイベント
downloadImageBtn.addEventListener('click', () => {
    // const link = document.createElement('a');
    // link.href = capturedImage.src;
    // link.download = `captured-image-${Date.now()}.jpg`;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
});

// Audio ON/OFF 切替
toggleAudioBtn.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    toggleAudioBtn.textContent = audioEnabled ? "Audio ON" : "Audio OFF";
});

// カメラ有効化
onCamera();
// 合成用の Canvas を作成
createcanvas();
