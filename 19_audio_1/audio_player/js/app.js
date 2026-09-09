const tracks = [];
const audio = document.getElementById('audio');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const playlist = document.getElementById('playlist');
const trackCount = document.getElementById('trackCount');
const progressBar = document.getElementById('progressBar');
const currentTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const volumeBar = document.getElementById('volumeBar');
const speedSelect = document.getElementById('speedSelect');
const visualizer = document.getElementById('visualizer');
const visualizerCanvas = document.getElementById('visualizerCanvas');
const albumCover = document.getElementById('albumCover');
const coverFallback = document.getElementById('coverFallback');

let currentTrackIndex = 0;
let isShuffle = false;
let isRepeat = false;
let audioContext = null;
let analyser = null;
let sourceNode = null;
let coverRequestId = 0;
const coverCache = new Map();
const audioVisualizer = new AudioVisualizer(visualizerCanvas, {
    getAnalyser: () => analyser,
    isPlaying: () => !audio.paused,
});

async function fetchTracks() {
    try {
        // api/audio.jsonからトラック情報を取得
        const response = await fetch('api/audio.json');
        // レスポンスが正常でない場合はエラーをスロー
        const data = await response.json();
        // TODO: tracks配列に取得したトラック情報を追加
        // tracks.push(...data);

        // プレイリストをレンダリングし、最初のトラックを読み込む
        renderPlaylist();
        // 現在のトラックインデックスに基づいてトラックを読み込む
        loadTrack(currentTrackIndex);
    } catch (error) {
        console.error('Error loading tracks:', error);
    }
}

// フォーマット時間を分:秒形式に変換
function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
}

// ボタンのアクティブ状態
function setActiveButton(button, isActive) {
    button.classList.toggle('bg-cyan-300', isActive);
    button.classList.toggle('text-slate-950', isActive);
    button.classList.toggle('bg-white/10', !isActive);
    button.classList.toggle('text-slate-200', !isActive);
}

// ID3v2のシンクセーフ整数を読み取る
function readSynchsafeInteger(bytes, offset) {
    return (
        // シンクセーフ整数は、各バイトの最上位ビットが0であることを保証
        // 通常の整数よりも少し異なる方法でエンコード
        (bytes[offset] << 21)
        | (bytes[offset + 1] << 14)
        | (bytes[offset + 2] << 7)
        | bytes[offset + 3]
    );
}

// ID3v2の整数をビッグエンディアンで読み取る
function readBigEndianInteger(bytes, offset, length) {
    let value = 0;

    for (let i = 0; i < length; i += 1) {
        value = (value << 8) | bytes[offset + i];
    }

    return value;
}

// ID3フレームIDを読み取る
function readFrameId(bytes, offset, length) {
    return String.fromCharCode(...bytes.slice(offset, offset + length));
}

// テキストの終端を見つける
function findTextTerminator(bytes, offset, encoding) {
    const step = encoding === 1 || encoding === 2 ? 2 : 1;

    for (let i = offset; i < bytes.length - (step - 1); i += step) {
        if (step === 1 && bytes[i] === 0) return i;
        if (step === 2 && bytes[i] === 0 && bytes[i + 1] === 0) return i;
    }

    return -1;
}

// ID3v2のAPICフレームを解析してカバー画像を抽出
function parseApicFrame(frameData) {
    const encoding = frameData[0];
    let offset = 1;
    let mimeType = '';

    // MIMEタイプを読み取る
    while (offset < frameData.length && frameData[offset] !== 0) {
        mimeType += String.fromCharCode(frameData[offset]);
        offset += 1;
    }
    offset += 2;

    // 説明テキストの終端を見つける
    const descriptionEnd = findTextTerminator(frameData, offset, encoding);
    if (descriptionEnd === -1) return null;

    // 画像データの開始位置を計算
    const imageStart = descriptionEnd + (encoding === 1 || encoding === 2 ? 2 : 1);
    // 画像データを抽出
    const imageBytes = frameData.slice(imageStart);
    // MIMEタイプが空、または画像データが空の場合はnull
    if (!mimeType || imageBytes.length === 0) return null;

    // Blob URLを作成して返す
    const blob = new Blob([imageBytes], { type: mimeType });
    return URL.createObjectURL(blob);
}

// ID3v2のPICフレームを解析してカバー画像を抽出
function parsePicFrame(frameData) {
    const encoding = frameData[0];
    const format = String.fromCharCode(...frameData.slice(1, 4)).toLowerCase();
    // MIMEタイプを決定
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    // 画像データの開始位置を計算
    const descriptionStart = 5;
    const descriptionEnd = findTextTerminator(frameData, descriptionStart, encoding);

    if (descriptionEnd === -1) return null;

    // 画像データの開始位置を計算
    const imageStart = descriptionEnd + (encoding === 1 || encoding === 2 ? 2 : 1);
    // 画像データを抽出
    const imageBytes = frameData.slice(imageStart);
    // MIMEタイプが空、または画像データが空の場合はnull
    if (!mimeType || imageBytes.length === 0) return null;

    const blob = new Blob([imageBytes], { type: mimeType });
    return URL.createObjectURL(blob);
}

// ID3タグからカバー画像を抽出
function extractCoverFromId3(arrayBuffer) {
    // Uint8Arrayを作成してID3タグの存在を確認
    const bytes = new Uint8Array(arrayBuffer);
    // ID3タグが存在しない場合はnullを返す
    if (readFrameId(bytes, 0, 3) !== 'ID3') return null;

    // ID3タグのバージョン
    const majorVersion = bytes[3];
    // ID3タグのフラグ
    const flags = bytes[5];
    // ID3タグの終了位置を計算
    const tagEnd = 10 + readSynchsafeInteger(bytes, 6);
    let offset = 10;

    if (flags & 0x40) {
        // 拡張ヘッダーが存在する場合は、拡張ヘッダーのサイズを読み取り、オフセットを更新
        const extendedHeaderSize = majorVersion === 4
            ? readSynchsafeInteger(bytes, offset)
            : readBigEndianInteger(bytes, offset, 4) + 4;
        offset += extendedHeaderSize;
    }

    // フレームをループしてAPICまたはPICフレームを探す
    while (offset < tagEnd) {
        const frameIdLength = majorVersion === 2 ? 3 : 4;
        const frameHeaderLength = majorVersion === 2 ? 6 : 10;
        const frameId = readFrameId(bytes, offset, frameIdLength);

        if (!frameId.trim() || /^\0+$/.test(frameId)) break;

        const frameSize = majorVersion === 2
            ? readBigEndianInteger(bytes, offset + 3, 3)
            : majorVersion === 4
                ? readSynchsafeInteger(bytes, offset + 4)
                : readBigEndianInteger(bytes, offset + 4, 4);
        const frameStart = offset + frameHeaderLength;
        const frameEnd = frameStart + frameSize;

        if (frameSize <= 0 || frameEnd > bytes.length) break;

        if (frameId === 'APIC') {
            return parseApicFrame(bytes.slice(frameStart, frameEnd));
        }

        if (frameId === 'PIC') {
            return parsePicFrame(bytes.slice(frameStart, frameEnd));
        }

        offset = frameEnd;
    }

    return null;
}

// オーディオファイルのカバー画像を取得
async function getCoverUrl(src) {
    if (coverCache.has(src)) return coverCache.get(src);

    try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Failed to load ${src}`);

        const coverUrl = extractCoverFromId3(await response.arrayBuffer());
        coverCache.set(src, coverUrl);
        return coverUrl;
    } catch {
        coverCache.set(src, null);
        return null;
    }
}

function setCover(coverUrl) {
    albumCover.classList.toggle('hidden', !coverUrl);
    coverFallback.classList.toggle('hidden', Boolean(coverUrl));

    if (coverUrl) {
        albumCover.src = coverUrl;
    } else {
        albumCover.removeAttribute('src');
    }
}

// オーディオファイルのカバー画像を更新
async function updateCover(src) {
    const requestId = ++coverRequestId;
    setCover(null);

    // TODO: オーディオファイルのカバー画像を取得
    // const coverUrl = await getCoverUrl(src);
    // if (requestId === coverRequestId) {
    //     setCover(coverUrl);
    // }
}

// プレイリストのレンダリング
function renderPlaylist() {
    playlist.innerHTML = '';
    trackCount.textContent = tracks.length;

    tracks.forEach((track, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = [
            'playlist-item',
            'flex',
            'w-full',
            'items-center',
            'gap-3',
            'rounded-2xl',
            'border',
            'p-3',
            'text-left',
            'transition',
        ].join(' ');
        button.dataset.trackIndex = index;
        button.innerHTML = `
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-black">${index + 1}</span>
            <span class="min-w-0">
                <span class="block truncate text-sm font-black">${track.title}</span>
                <span class="block truncate text-xs font-semibold text-slate-400">${track.artist}</span>
            </span>
        `;
        button.addEventListener('click', () => {
            loadTrack(index);
            playAudio();
        });
        playlist.appendChild(button);
    });
}

// プレイリストの状態を更新
function updatePlaylistState() {
    document.querySelectorAll('.playlist-item').forEach((item) => {
        const isActive = Number(item.dataset.trackIndex) === currentTrackIndex;
        item.classList.toggle('border-cyan-300', isActive);
        item.classList.toggle('bg-cyan-300/15', isActive);
        item.classList.toggle('text-white', isActive);
        item.classList.toggle('border-white/10', !isActive);
        item.classList.toggle('bg-white/[0.04]', !isActive);
        item.classList.toggle('text-slate-200', !isActive);
        item.classList.toggle('hover:bg-white/[0.08]', !isActive);
    });
}

// トラックを読み込む
function loadTrack(index) {
    currentTrackIndex = index;
    // 現在のトラックを取得
    const track = tracks[currentTrackIndex];

    // TODO: オーディオのsrcを設定

    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;

    // プログレスバーと時間表示をリセット
    progressBar.value = 0;
    currentTime.textContent = '0:00';
    duration.textContent = '0:00';

    updatePlaylistState();
    updateCover(track.src);
}

// オーディオアナライザーのセットアップ
function setupAudioAnalyzer() {
    if (analyser) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    // オーディオコンテキスト
    audioContext = new AudioContext();
    // アナライザーの作成
    analyser = audioContext.createAnalyser();
    // FFTサイズ
    analyser.fftSize = 1024;
    // スムージングタイム定数
    analyser.smoothingTimeConstant = 0.82;

    // オーディオソースノードを作成
    sourceNode = audioContext.createMediaElementSource(audio);
    // オーディオソースノードをアナライザーに接続
    sourceNode.connect(analyser);
    // アナライザーをオーディオコンテキストの出力に接続
    analyser.connect(audioContext.destination);
}

// オーディオの再生
function playAudio() {
    setupAudioAnalyzer();
    // サスペンド状態の場合は、オーディオコンテキストを再開
    if (audioContext?.state === 'suspended') {
        audioContext.resume();
    }

    // TODO: オーディオを再生: play()
}

// オーディオの一時停止
function pauseAudio() {
    // TODO: オーディオを一時停止: pause()
}

// 再生/一時停止の切り替え
function togglePlayback() {
    if (audio.paused) {
        playAudio();
    } else {
        pauseAudio();
    }
}

// 次のトラックのインデックスを取得
function getNextIndex() {
    // トラックが1つしかない場合は、現在のトラックインデックスを返す
    if (tracks.length === 1) return currentTrackIndex;
    // シャッフルが無効な場合は、次のトラックインデックスを返す
    if (!isShuffle) return (currentTrackIndex + 1) % tracks.length;
    // シャッフルの場合、ランダムなインデックスを返す
    return getRandomIndex();
}

// 前のトラックのインデックスを取得
function getPrevIndex() {
    // トラックが1つしかない場合は、現在のトラックインデックスを返す
    if (tracks.length === 1) return currentTrackIndex;
    // シャッフルが無効な場合は、前のトラックインデックスを返す
    if (!isShuffle) return (currentTrackIndex - 1 + tracks.length) % tracks.length;
    // シャッフルの場合、ランダムなインデックスを返す
    return getRandomIndex();
}

// ランダムなインデックスを取得
function getRandomIndex() {
    if (tracks.length <= 1) return currentTrackIndex;
    let randomIndex = Math.floor(Math.random() * tracks.length);
    return randomIndex;
}

// 次のトラックを再生
function nextTrack() {
    loadTrack(getNextIndex());
    playAudio();
}

// 前のトラックを再生
function prevTrack() {
    loadTrack(getPrevIndex());
    playAudio();
}

// オーディオの進行状況を更新
function updateProgress() {
    // オーディオの再生時間が取得できない場合は、進行状況バーを0に設定
    progressBar.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    // オーディオの現在の再生時間をフォーマットして表示
    currentTime.textContent = formatTime(audio.currentTime);
}

// オーディオのシーク
function seekAudio() {
    if (!audio.duration) return;
    // 進行状況バーの値に基づいて、オーディオの再生位置を更新
    audio.currentTime = (Number(progressBar.value) / 100) * audio.duration;
}

function initVisualizer() {
    // アイドル状態のフレームを描画
    audioVisualizer.drawIdleFrame();
}

// オーディオビジュアライザーの更新
function updateVisualizer() {
    visualizer.classList.toggle('opacity-60', audio.paused);
}

// オーディオビジュアライザーの開始
function startVisualizer() {
    updateVisualizer();
    audioVisualizer.start();
}

// オーディオビジュアライザーの停止
function stopVisualizer() {
    updateVisualizer();
    audioVisualizer.stop();
}

// 再生ボタンイベント
playBtn.addEventListener('click', togglePlayback);
// 前のトラックボタンイベント
prevBtn.addEventListener('click', prevTrack);
// 次のトラックボタンイベント
nextBtn.addEventListener('click', nextTrack);
// 進行状況バーイベント
progressBar.addEventListener('input', seekAudio);

// TODO: 音量バーイベント
// volumeBar.addEventListener('input', (event) => {
//     audio.volume = Number(event.target.value);
// });

// TODO: 速度セレクトイベント
// speedSelect.addEventListener('change', (event) => {
//     audio.playbackRate = Number(event.target.value);
// });

// シャッフルボタンイベント
shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    setActiveButton(shuffleBtn, isShuffle);
});

// リピートボタンイベント
repeatBtn.addEventListener('click', () => {
    isRepeat = !isRepeat;
    setActiveButton(repeatBtn, isRepeat);
});

// TODO: オーディオ再生イベント
// audio.addEventListener('play', () => {
//     playBtn.textContent = 'Ⅱ';
//     startVisualizer();
// });

// TODO: オーディオ一時停止イベント
// audio.addEventListener('pause', () => {
//     playBtn.textContent = '▶';
//     stopVisualizer();
// });

// TODO: オーディオのメタデータが読み込み完了イベント
// audio.addEventListener('loadedmetadata', () => {
//     duration.textContent = formatTime(audio.duration);
// });

// TODO: オーディオのタイム更新イベント
// audio.addEventListener('timeupdate', updateProgress);

// オーディオの再生終了イベント
audio.addEventListener('ended', () => {
    if (isRepeat) {
        // TODO: オーディオの再生位置をリセット: currentTime = 0

        // オーディオを再生
        playAudio();
        return;
    }

    nextTrack();
});

// オーディオ取得
(async () => {
    // トラック情報を取得
    await fetchTracks();
    // オーディオの音量
    audio.volume = Number(volumeBar.value);
    // オーディオの再生速度
    audio.playbackRate = Number(speedSelect.value);
    // オーディオビジュアライザーの初期状態を更新
    initVisualizer();
})();
