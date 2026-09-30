// HandLandmarker, FilesetResolver のインポート
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// vendor/ 内の wasmフォルダ パス
const WASM_BASE = new URL('../../vendor/@mediapipe/tasks-vision/wasm', import.meta.url).toString();
// モデル本体（.task）のパス
const MODEL_ASSET_PATH = new URL(
    '../../vendor/@mediapipe/models/hand_landmarker.task',
    import.meta.url,
).toString();

/**
 * HandLandmarker を生成する
 * @param {number} numHands 検出する手の最大数
 * @returns {Promise<HandLandmarker>}
 */
export async function createHandLandmarker(numHands = 2) {
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
    return HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_ASSET_PATH },
        numHands,
        runningMode: 'VIDEO',
    });
}

let lastTimestamp = 0;

/**
 * 動画フレームから手のランドマークを推定する。
 * 各手 21 点をピクセル座標へ変換して返す。
 * @param {HandLandmarker} landmarker
 * @param {HTMLVideoElement} video
 * @param {number} timestampMs 単調増加する値（performance.now() など）
 * @returns {{keypoints: {x:number,y:number,z:number}[], handedness: string, score: number}[]}
 */
export function estimateHands(landmarker, video, timestampMs) {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return [];

    // detectForVideo は単調増加するタイムスタンプを要求する
    const timestamp = timestampMs > lastTimestamp ? timestampMs : lastTimestamp + 1;
    lastTimestamp = timestamp;

    //  動画フレームから手のランドマークを検出: landmarker.detectForVideo()
    const result = landmarker.detectForVideo(video, timestamp);
    return (result.landmarks ?? []).map((landmarks, i) => {
        const category = result.handednesses?.[i]?.[0];
        return {
            keypoints: landmarks.map((p) => ({
                x: p.x * width,
                y: p.y * height,
                z: p.z * width,
            })),
            handedness: category?.categoryName ?? 'Unknown',
            score: category?.score ?? 0,
        };
    });
}

// MediaPipe Hand の 21 ランドマーク名
export const HAND_LANDMARK_NAMES = [
    'WRIST',
    'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
    'INDEX_MCP', 'INDEX_PIP', 'INDEX_DIP', 'INDEX_TIP',
    'MIDDLE_MCP', 'MIDDLE_PIP', 'MIDDLE_DIP', 'MIDDLE_TIP',
    'RING_MCP', 'RING_PIP', 'RING_DIP', 'RING_TIP',
    'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP',
];

// 骨格の接続（描画用）
export const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],            // 親指
    [0, 5], [5, 6], [6, 7], [7, 8],            // 人差し指
    [5, 9], [9, 10], [10, 11], [11, 12],       // 中指
    [9, 13], [13, 14], [14, 15], [15, 16],     // 薬指
    [13, 17], [17, 18], [18, 19], [19, 20],    // 小指
    [0, 17],                                   // 手のひら
];

// 指ごとの [MCP, PIP, TIP]（親指は [CMC, MCP, TIP]）
export const FINGERS = {
    thumb: { name: '親指', mcp: 2, pip: 3, tip: 4 },
    index: { name: '人差し指', mcp: 5, pip: 6, tip: 8 },
    middle: { name: '中指', mcp: 9, pip: 10, tip: 12 },
    ring: { name: '薬指', mcp: 13, pip: 14, tip: 16 },
    pinky: { name: '小指', mcp: 17, pip: 18, tip: 20 },
};

// 親指が「まっすぐ伸びている」とみなす角度のしきい値（度）。
// CMC-MCP-TIPの角度は、まっすぐ伸ばすと180度に近づき、
// 握ったり手のひら側に曲げたりすると小さくなる。
const THUMB_STRAIGHT_ANGLE = 150;

function angleAt(a, b, c) {
    const v1 = { x: a.x - b.x, y: a.y - b.y };
    const v2 = { x: c.x - b.x, y: c.y - b.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
    if (mag === 0) return 0;
    const cos = Math.min(1, Math.max(-1, dot / mag));
    return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * 各指が伸びているか判定する（TIP が PIP より手首から遠ければ伸展とみなす簡易ロジック）。
 * 親指だけは、手首との距離で判定すると横方向の動きを誤検出しやすいため、
 * 関節の曲がり具合（CMC-MCP-TIPの角度）で判定する。手の向きに影響されにくく、
 * ピースサインで軽く立った程度では反応せず、まっすぐ開いたときだけ true になる。
 * @param {{x:number,y:number}[]} keypoints ピクセル座標の 21 点
 * @returns {Record<string, boolean>}
 */
export function detectExtendedFingers(keypoints) {
    const wrist = keypoints[0];
    const thumbCmc = keypoints[1];
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const state = {};
    for (const [key, f] of Object.entries(FINGERS)) {
        if (key === 'thumb') {
            state[key] = angleAt(thumbCmc, keypoints[f.mcp], keypoints[f.tip]) > THUMB_STRAIGHT_ANGLE;
        } else {
            state[key] = dist(keypoints[f.tip], wrist) > dist(keypoints[f.pip], wrist);
        }
    }
    return state;
}
