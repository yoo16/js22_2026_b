const recordToggleBtn = document.getElementById('record-toggle');
const consoleEl = document.getElementById('console');
const statusDot = document.getElementById('status-dot');
const timerEl = document.getElementById('timer');
const progressBar = document.getElementById('input-level');
const levelFill = document.getElementById('level-fill');
const levelLabel = document.getElementById('level-label');
const peakLabel = document.getElementById('peak-label');
const levelBars = document.getElementById('level-bars');
const playbackShell = document.getElementById('playback-shell');
const playbackEl = document.getElementById('playback');
const downloadLink = document.getElementById('download-link');
const waveformCanvas = document.getElementById('waveform');

const idleMessage = 'Press Record to start.';
// 周波数バーの数
const barCount = 24;
// 周波数バーの配列
const meterBars = [];

// 録音・メーター用の変数
let isRecording = false;
let audioContext;
let analyser;
let microphoneStream;
let mediaRecorder;
let recordedChunks = [];
let animationId;
let smoothedLevel = 0;
let peakLevel = 0;
let timerIntervalId;
let recordingStartedAt = 0;
let recordedObjectUrl;

for (let i = 0; i < barCount; i += 1) {
    const bar = document.createElement('span');
    bar.className = 'block h-3 rounded-full bg-slate-700 transition-all duration-75';
    levelBars.appendChild(bar);
    meterBars.push(bar);
}

/**
 * コンソール要素にメッセージを表示する
 * @param {string} message 表示するメッセージ
 */
function displayConsole(message) {
    consoleEl.textContent = message;
}

function setStatus(state) {
    statusDot.classList.remove('bg-slate-500', 'bg-rose-400', 'shadow-rose-400/40');

    if (state === 'recording') {
        statusDot.classList.add('bg-rose-400', 'shadow-rose-400/40', 'animate-pulse');
        return;
    }

    statusDot.classList.remove('animate-pulse');
    statusDot.classList.add('bg-slate-500');
}

// 経過時間を mm:ss 形式にフォーマットする関数
function formatElapsed(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

// 録音ボタンの表示を更新する関数
function updateRecordButton() {
    recordToggleBtn.textContent = isRecording ? 'Stop' : 'Record';
    recordToggleBtn.classList.toggle('bg-rose-500', !isRecording);
    recordToggleBtn.classList.toggle('hover:bg-rose-400', !isRecording);
    recordToggleBtn.classList.toggle('shadow-rose-500/25', !isRecording);
    recordToggleBtn.classList.toggle('bg-slate-200', isRecording);
    recordToggleBtn.classList.toggle('text-slate-950', isRecording);
    recordToggleBtn.classList.toggle('shadow-white/20', isRecording);
}

/**
 * マイク入力レベルを表示するために Web Audio API を利用
 */
async function startRecording() {
    try {
        // TODO: メディアストリーム取得
        // const stream = null;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // TODO: オーディオコンテキストの作成: new AudioContext() または window.webkitAudioContext()
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // MediaStream からオーディオソースノードを生成: createMediaStreamSource()
        const source = audioContext.createMediaStreamSource(stream);

        // AnalyserNode を作成して FFT サイズを設定
        analyser = audioContext.createAnalyser();

        // FFT サイズを 1024 に設定（2 の累乗である必要がある）
        analyser.fftSize = 1024;
        // スムージング係数を設定（0.0 から 1.0 の範囲で、値が大きいほど平滑化される）
        analyser.smoothingTimeConstant = 0.78;
        // TODO: オーディオソースを AnalyserNode に接続
        source.connect(analyser);

        // ストリームオブジェクトを保持
        microphoneStream = stream;

        // 直前の再生データを片付ける
        playbackShell.hidden = true;
        if (recordedObjectUrl) {
            URL.revokeObjectURL(recordedObjectUrl);
            recordedObjectUrl = null;
        }

        // MediaRecorder で録音データを収集
        recordedChunks = [];

        // MediaRecorder : 録音データを収集するためのオブジェクトを生成
        mediaRecorder = new MediaRecorder(stream);
        // TODO: MediaRecorder のイベントリスナーを設定
        mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0) {
                // TODO: 録音データを配列に追加: event.data
            }
        });
        // 録音停止のイベントリスナーを設定
        mediaRecorder.addEventListener('stop', handleRecordingStop);
        // 録音開始のイベントリスナー設定
        mediaRecorder.start();

        // レコード開始
        isRecording = true;

        // 録音開始時刻を記録
        recordingStartedAt = Date.now();
        // タイマーを開始(200msごとに更新)
        timerIntervalId = setInterval(() => {
            // 録音中の経過時間を更新
            timerEl.textContent = formatElapsed(Date.now() - recordingStartedAt);
        }, 200);

        setStatus('recording');
        updateRecordButton();
        displayConsole('Recording...');
        smoothedLevel = 0;
        peakLevel = 0;
        updateInputLevel();
    } catch (error) {
        console.error('Error accessing microphone:', error);
        displayConsole('Microphone access was blocked.');
    }
}

// 録音停止処理
function stopRecording() {
    mediaRecorder.stop();
    // MediaRecorder(録音) が stop イベントを発火させるのを待つ
    microphoneStream?.getAudioTracks().forEach((track) => track.stop());

    if (animationId) {
        // アニメーションを停止
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    // タイマーを停止
    clearInterval(timerIntervalId);

    isRecording = false;
    setStatus('idle');
    updateRecordButton();
    renderLevel(0);
    displayConsole('Processing recording...');
}

/**
 * 録音停止後、Blob をデコードして波形を描画し再生できるようにする
 */
async function handleRecordingStop() {
    const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
    recordedChunks = [];

    recordedObjectUrl = URL.createObjectURL(blob);
    playbackEl.src = recordedObjectUrl;
    downloadLink.href = recordedObjectUrl;

    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    drawWaveform(audioBuffer);

    playbackShell.hidden = false;
    timerEl.textContent = '00:00';
    displayConsole(idleMessage);
}

/**
 * AudioBuffer の波形を Canvas に描画する
 * @param {AudioBuffer} audioBuffer デコード済みの録音データ
 */
function drawWaveform(audioBuffer) {
    const ctx = waveformCanvas.getContext('2d');
    const width = waveformCanvas.width;
    const height = waveformCanvas.height;
    // 1チャンネル目のサンプルデータを取得
    const channelData = audioBuffer.getChannelData(0);
    // 1ピクセルあたりのサンプル数
    const samplesPerPixel = Math.floor(channelData.length / width);
    const mid = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let x = 0; x < width; x += 1) {
        const start = x * samplesPerPixel;
        let min = 1;
        let max = -1;

        // このピクセル幅分のサンプルから最小値・最大値を求める
        for (let i = 0; i < samplesPerPixel; i += 1) {
            const value = channelData[start + i] ?? 0;
            if (value < min) min = value;
            if (value > max) max = value;
        }

        ctx.moveTo(x, mid + min * mid);
        ctx.lineTo(x, mid + max * mid);
    }

    ctx.stroke();
}

// オーディオレベルを Canvas に描画する関数
function renderLevel(level) {
    // オーディオレベルを 0-100 の範囲に丸める
    const roundedLevel = Math.round(level);
    // progress 要素の値を更新
    progressBar.value = roundedLevel;
    // オーディオレベルの表示を更新
    levelFill.style.width = `${roundedLevel}%`;
    // ラベルの表示を更新
    levelLabel.textContent = `${roundedLevel}%`;

    // ピークレベル
    peakLevel = Math.max(level, peakLevel * 0.985);
    // ピークレベルの表示を更新
    peakLabel.textContent = `Peak ${Math.round(peakLevel)}%`;

    // オーディオメーターのバーを更新
    meterBars.forEach((bar, index) => {
        // バーのしきい値を計算（0-100 のスケール）
        const threshold = ((index + 1) / meterBars.length) * 100;
        // バーがアクティブかどうかを判定
        const isActive = threshold <= level;
        // バーの高さを計算
        const height = isActive ? 28 + (index / meterBars.length) * 104 : 12;
        // バーがホット状態かどうかを判定（上位 22% のバーをホットとする）
        const isHot = index > meterBars.length * 0.78;

        // バーのスタイルを更新
        bar.style.height = `${height}px`;
        bar.classList.toggle('bg-cyan-300', isActive && !isHot);
        bar.classList.toggle('bg-fuchsia-300', isActive && isHot);
        bar.classList.toggle('bg-slate-700', !isActive);
        bar.classList.toggle('shadow-lg', isActive);
        bar.classList.toggle('shadow-cyan-500/30', isActive && !isHot);
        bar.classList.toggle('shadow-fuchsia-500/30', isActive && isHot);
    });
}

/**
 * 録音中の入力レベルを測定し progress 要素を更新する
 */
function updateInputLevel() {
    if (!analyser || !isRecording) {
        animationId = null;
        return;
    }

    // 解析の周波数ビン（データポイント）から配列(Uint8Array)を作成
    const dataArray = new Uint8Array(analyser.fftSize);
    // analyser から時間領域データを取得
    analyser.getByteTimeDomainData(dataArray);

    let sumSquares = 0;
    // データ配列の各サンプルを正規化して RMS 値を計算
    for (let i = 0; i < dataArray.length; i += 1) {
        const normalized = (dataArray[i] / 128) - 1;
        sumSquares += normalized * normalized;
    }
    // TODO: RMS値: ルート平均二乗値を計算して音量レベルを求める: Math.sqrt(sumSquares / dataArray.length)
    const rms = Math.sqrt(sumSquares, dataArray.length)
    // rms を 0-100 のスケールに変換（調整が必要な場合は multiplier を変更）
    const level = Math.min(100, rms * 260);

    // スムージングを適用してレベルを更新
    smoothedLevel = smoothedLevel * 0.72 + level * 0.28;
    // オーディオレベルを表示
    renderLevel(smoothedLevel);
    // アニメーション: updateInputLevel を繰り返し呼び出す
    animationId = requestAnimationFrame(updateInputLevel);
}

/**
 * 録音開始/停止ボタンのトグル処理
 */
recordToggleBtn.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

/**
 * 初期化
 */
function app() {
    displayConsole(idleMessage);
    setStatus('idle');
    renderLevel(0);
}

// メインアプリ実行
app();
