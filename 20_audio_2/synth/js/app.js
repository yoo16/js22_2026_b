const consoleEl = document.getElementById('console');
const statusDot = document.getElementById('status-dot');
const keyboardEl = document.getElementById('keyboard');
const octaveDownBtn = document.getElementById('octave-down');
const octaveUpBtn = document.getElementById('octave-up');
const octaveRangeEl = document.getElementById('octave-range');

const waveformSelect = document.getElementById('waveform');
const subOscCheckbox = document.getElementById('sub-osc');
const masterVolumeSlider = document.getElementById('master-volume');
const cutoffSlider = document.getElementById('cutoff');
const resonanceSlider = document.getElementById('resonance');
const envAmountSlider = document.getElementById('env-amount');
const filterDecaySlider = document.getElementById('filter-decay');
const attackSlider = document.getElementById('attack');
const releaseSlider = document.getElementById('release');
const glideSlider = document.getElementById('glide');

// PCキーボード -> MIDIノート番号（Herbie Hancock "Chameleon" のようなアナログベースを弾くための2オクターブ分）
const KEY_MIDI_MAP = {
    a: 48, w: 49, s: 50, e: 51, d: 52, f: 53, t: 54, g: 55, y: 56,
    h: 57, u: 58, j: 59, k: 60, o: 61, l: 62, p: 63, ';': 64,
};

// 白鍵・黒鍵のレイアウト定義（描画用）
const WHITE_NOTES = [48, 50, 52, 53, 55, 57, 59, 60, 62, 64];
const BLACK_NOTES = [
    { midi: 49, afterWhiteIndex: 0 },
    { midi: 51, afterWhiteIndex: 1 },
    { midi: 54, afterWhiteIndex: 3 },
    { midi: 56, afterWhiteIndex: 4 },
    { midi: 58, afterWhiteIndex: 5 },
    { midi: 61, afterWhiteIndex: 7 },
    { midi: 63, afterWhiteIndex: 8 },
];

// MIDIノート番号 -> 押すべきPCキー（鍵盤ラベル表示用）
const MIDI_TO_KEY = Object.fromEntries(Object.entries(KEY_MIDI_MAP).map(([key, midi]) => [midi, key]));

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVE_SHIFT_MIN = -2;
const OCTAVE_SHIFT_MAX = 2;
// 鍵盤・PCキーは常に「基準の相対ノート番号」を持ち、実際に鳴らす音程はここに半音単位のシフトを足して決める
let octaveShift = 0;

/**
 * MIDIノート番号を周波数(Hz)に変換する
 * @param {number} midi MIDIノート番号
 */
function midiToFrequency(midi) {
    // TODO: 正しい周波数計算を実装する
    return 440
    // return 440 * (2 ** ((midi - 69) / 12));
}

/**
 * MIDIノート番号を "C3" のような音名表記にする
 * @param {number} midi MIDIノート番号
 */
function midiToNoteName(midi) {
    const name = NOTE_NAMES[((midi % 12) + 12) % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${name}${octave}`;
}

function updateOctaveDisplay() {
    // TODO: オクターブを更新
    // const lowest = WHITE_NOTES[0] + octaveShift * 12;
    // const highest = WHITE_NOTES[WHITE_NOTES.length - 1] + octaveShift * 12;
    // octaveRangeEl.textContent = `${midiToNoteName(lowest)} – ${midiToNoteName(highest)}`;
    // octaveDownBtn.disabled = octaveShift <= OCTAVE_SHIFT_MIN;
    // octaveUpBtn.disabled = octaveShift >= OCTAVE_SHIFT_MAX;
}

function shiftOctave(delta) {
    const next = octaveShift + delta;
    if (next < OCTAVE_SHIFT_MIN || next > OCTAVE_SHIFT_MAX) return;
    octaveShift = next;
    updateOctaveDisplay();
    // 保持中のキーがあれば、新しいオクターブでグライドさせる
    refreshHeldNote();
}

octaveDownBtn.addEventListener('click', () => shiftOctave(-1));
octaveUpBtn.addEventListener('click', () => shiftOctave(1));

let audioContext;
// フィルター・アンプの共通ノード（オシレーターは音を鳴らすたびに作り直す）
let filterNode;
let ampGainNode;
let masterGainNode;
let mainOscillator;
let subOscillator;
let subOscGain;

// モノフォニック・シンセの押鍵スタック（アナログシンセの「最後に弾いた音」優先の挙動を再現）
let heldNotes = [];
let isSoundOn = false;

/**
 * コンソール要素にメッセージを表示する
 * @param {string} message 表示するメッセージ
 */
function displayConsole(message) {
    consoleEl.textContent = message;
}

function setStatus(state) {
    statusDot.classList.remove('bg-slate-500', 'bg-amber-300', 'shadow-amber-300/40');
    if (state === 'active') {
        statusDot.classList.add('bg-amber-300', 'shadow-amber-300/40');
        return;
    }
    statusDot.classList.add('bg-slate-500');
}

/**
 * オーディオグラフを構築する（オシレーター → フィルター(レゾナンス付き) → アンプエンベロープ → 出力）
 */
function ensureAudioGraph() {
    if (audioContext) return;

    // オーディオ
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // レゾナンス付きローパスフィルター（アナログシンセの「ワウ」の要）
    filterNode = audioContext.createBiquadFilter();
    filterNode.type = 'lowpass';

    // アンプエンベロープ用ゲイン
    ampGainNode = audioContext.createGain();
    ampGainNode.gain.value = 0;

    // 全体音量
    masterGainNode = audioContext.createGain();
    // TODO: マスターボリュームをスライダーで調整できるようにする
    masterGainNode.gain.value = Number(masterVolumeSlider.value) / 100;

    // TODO: ノードを接続する順序を確認: フィルター → アンプ → マスター → 出力
    // filterNode.connect(ampGainNode);
    // ampGainNode.connect(masterGainNode);
    // masterGainNode.connect(audioContext.destination);

    // メインオシレーター（常時発振させておき、周波数だけ動かしてポルタメントを実現）
    mainOscillator = audioContext.createOscillator();
    mainOscillator.type = waveformSelect.value;
    mainOscillator.frequency.value = midiToFrequency(48);
    mainOscillator.connect(filterNode);
    mainOscillator.start();

    // サブオシレーター（1オクターブ下でベースを太くする）
    subOscGain = audioContext.createGain();
    subOscGain.gain.value = subOscCheckbox.checked ? 0.5 : 0;
    subOscillator = audioContext.createOscillator();
    subOscillator.type = 'square';
    subOscillator.frequency.value = midiToFrequency(36);
    subOscillator.connect(subOscGain);
    subOscGain.connect(filterNode);
    subOscillator.start();

    setStatus('active');
    displayConsole('Ready. Play with the keyboard below.');
}

/**
 * 指定したMIDIノートで発音する（すでに発音中なら周波数をグライドさせる）
 * @param {number} midi MIDIノート番号
 */
function noteOn(midi) {
    ensureAudioGraph();
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    // 現在の時間を取得
    const now = audioContext.currentTime;
    // 指定したMIDIノートの周波数を計算
    const freq = midiToFrequency(midi);
    // グライド時間を取得
    const glideSeconds = Number(glideSlider.value) / 1000;
    // 初回の発音かどうかを判定
    const isFirstNote = !isSoundOn;

    // ポルタメント（グライド）: 直前の音から滑らかに周波数を変化させる
    mainOscillator.frequency.cancelScheduledValues(now);
    subOscillator.frequency.cancelScheduledValues(now);
    if (isFirstNote || glideSeconds === 0) {
        mainOscillator.frequency.setValueAtTime(freq, now);
        subOscillator.frequency.setValueAtTime(freq / 2, now);
    } else {
        mainOscillator.frequency.setTargetAtTime(freq, now, glideSeconds / 3);
        subOscillator.frequency.setTargetAtTime(freq / 2, now, glideSeconds / 3);
    }

    const cutoff = Number(cutoffSlider.value);
    const envAmount = Number(envAmountSlider.value);
    const filterDecay = Number(filterDecaySlider.value) / 1000;
    const attack = Math.max(0.001, Number(attackSlider.value) / 1000);
    const sustainLevel = 0.9;

    // フィルターエンベロープ: 弾いた瞬間に開いて、じわっと閉じる「ワウ」の動き
    filterNode.frequency.cancelScheduledValues(now);
    filterNode.frequency.setValueAtTime(cutoff + envAmount, now);
    filterNode.frequency.exponentialRampToValueAtTime(Math.max(cutoff, 40), now + filterDecay);
    filterNode.Q.setValueAtTime(Number(resonanceSlider.value), now);

    // アンプエンベロープ: アタックで音量を持ち上げ、鍵盤を押している間はサステイン
    ampGainNode.gain.cancelScheduledValues(now);
    ampGainNode.gain.setValueAtTime(ampGainNode.gain.value, now);
    ampGainNode.gain.linearRampToValueAtTime(sustainLevel, now + attack);

    isSoundOn = true;
}

/**
 * 発音を止める（リリースエンベロープ）
 */
function noteOff() {
    if (!audioContext) return;
    const now = audioContext.currentTime;
    const release = Number(releaseSlider.value) / 1000;

    ampGainNode.gain.cancelScheduledValues(now);
    ampGainNode.gain.setValueAtTime(ampGainNode.gain.value, now);
    ampGainNode.gain.linearRampToValueAtTime(0, now + release);

    isSoundOn = false;
}

/**
 * 押鍵スタックの一番上の音を鳴らす。何も押されていなければ音を止める。
 */
function refreshHeldNote() {
    if (heldNotes.length > 0) {
        noteOn(heldNotes[heldNotes.length - 1] + octaveShift * 12);
    } else {
        noteOff();
    }
}

function handleKeyPress(midi) {
    if (heldNotes.includes(midi)) return;
    heldNotes.push(midi);
    refreshHeldNote();
}

function handleKeyRelease(midi) {
    heldNotes = heldNotes.filter((note) => note !== midi);
    refreshHeldNote();
}

/**
 * 鍵盤(白鍵・黒鍵)のDOM要素を生成する
 */
function buildKeyboard() {
    const whiteKeyWidthPercent = 100 / WHITE_NOTES.length;

    WHITE_NOTES.forEach((midi) => {
        const key = document.createElement('div');
        key.className = 'white-key flex items-end justify-center rounded-b-lg bg-slate-100 text-slate-500 hover:bg-white active:bg-amber-200 transition';
        key.dataset.midi = String(midi);

        const label = document.createElement('span');
        label.className = 'key-label';
        label.textContent = MIDI_TO_KEY[midi] ?? '';
        key.appendChild(label);

        keyboardEl.appendChild(key);
        bindKeyEvents(key, midi);
    });

    BLACK_NOTES.forEach(({ midi, afterWhiteIndex }) => {
        const key = document.createElement('div');
        key.className = 'black-key flex items-end justify-center rounded-b-md bg-slate-900 text-slate-400 hover:bg-slate-800 active:bg-amber-500 transition';
        key.dataset.midi = String(midi);
        key.style.left = `${(afterWhiteIndex + 1) * whiteKeyWidthPercent}%`;

        const label = document.createElement('span');
        label.className = 'key-label';
        label.textContent = MIDI_TO_KEY[midi] ?? '';
        key.appendChild(label);

        keyboardEl.appendChild(key);
        bindKeyEvents(key, midi);
    });
}

/**
 * マウス/タッチ操作を鍵盤要素にバインドする
 * @param {HTMLElement} el 鍵盤のDOM要素
 * @param {number} midi MIDIノート番号
 */
function bindKeyEvents(el, midi) {
    const press = (event) => {
        event.preventDefault();
        handleKeyPress(midi);
    };
    const release = () => handleKeyRelease(midi);

    el.addEventListener('mousedown', press);
    el.addEventListener('mouseup', release);
    el.addEventListener('mouseleave', release);
    el.addEventListener('touchstart', press, { passive: false });
    el.addEventListener('touchend', release);
}

// PCキーボード操作
window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const midi = KEY_MIDI_MAP[event.key.toLowerCase()];
    if (midi === undefined) return;
    handleKeyPress(midi);
});

window.addEventListener('keyup', (event) => {
    const midi = KEY_MIDI_MAP[event.key.toLowerCase()];
    if (midi === undefined) return;
    handleKeyRelease(midi);
});

// パラメーター変更のハンドリング
waveformSelect.addEventListener('change', () => {
    // TODO: オシレーターの波形を変更
    // if (mainOscillator) mainOscillator.type = waveformSelect.value;
});

subOscCheckbox.addEventListener('change', () => {
    if (subOscGain) subOscGain.gain.value = subOscCheckbox.checked ? 0.5 : 0;
});

masterVolumeSlider.addEventListener('input', () => {
    // TODO: マスターボリュームを反映
    // if (masterGainNode) masterGainNode.gain.value = Number(masterVolumeSlider.value) / 100;
});

const sliderDisplays = [
    { slider: cutoffSlider, output: document.getElementById('cutoff-value'), unit: ' Hz' },
    { slider: resonanceSlider, output: document.getElementById('resonance-value'), unit: '' },
    { slider: envAmountSlider, output: document.getElementById('env-amount-value'), unit: ' Hz' },
    { slider: filterDecaySlider, output: document.getElementById('filter-decay-value'), unit: ' ms' },
    { slider: attackSlider, output: document.getElementById('attack-value'), unit: ' ms' },
    { slider: releaseSlider, output: document.getElementById('release-value'), unit: ' ms' },
    { slider: glideSlider, output: document.getElementById('glide-value'), unit: ' ms' },
];

sliderDisplays.forEach(({ slider, output, unit }) => {
    slider.addEventListener('input', () => {
        output.textContent = `${slider.value}${unit}`;
    });
});

/**
 * 初期化
 */
function app() {
    displayConsole('Click a key or press A S D F G H J K L to start.');
    setStatus('idle');
    buildKeyboard();
    updateOctaveDisplay();
}

// メインアプリ実行
app();
