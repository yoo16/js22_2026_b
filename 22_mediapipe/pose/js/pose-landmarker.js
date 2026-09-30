import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// vendor/ 内の wasm を利用（CDN 不要）
const WASM_BASE = new URL('../../vendor/@mediapipe/tasks-vision/wasm', import.meta.url).toString();
// モデル本体（.task）も vendor/ に同梱（オフライン動作）
const MODEL_ASSET_PATH = new URL(
    '../../vendor/@mediapipe/models/pose_landmarker.task',
    import.meta.url,
).toString();

/**
 * PoseLandmarker を生成する
 * @returns {Promise<PoseLandmarker>}
 */
export async function createPoseLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
    return PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_ASSET_PATH },
        numPoses: 1,
        runningMode: 'VIDEO',
    });
}

let lastTimestamp = 0;

/**
 * 動画フレームから姿勢のランドマークを推定する。
 * face-landmarker.js と同じく、ピクセル座標の keypoints を持つ配列を返す。
 * @param {PoseLandmarker} landmarker
 * @param {HTMLVideoElement} video
 * @param {number} timestampMs performance.now() など単調増加する値
 * @returns {{keypoints: {x:number, y:number, z:number}[]}[]}
 */
export function estimatePoses(landmarker, video, timestampMs) {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return [];

    // detectForVideo は単調増加するタイムスタンプを要求する
    const ts = timestampMs > lastTimestamp ? timestampMs : lastTimestamp + 1;
    lastTimestamp = ts;
    const result = landmarker.detectForVideo(video, ts);
    return (result.landmarks ?? []).map((landmarks) => ({
        keypoints: landmarks.map((point) => ({
            x: point.x * width,
            y: point.y * height,
            z: point.z * width,
        })),
    }));
}

// 骨格の接続（描画用・顔まわりは省略し胴体と四肢のみ）
export const POSE_CONNECTIONS = [
    [11, 12],                       // 肩ライン
    [11, 13], [13, 15],             // 左腕
    [12, 14], [14, 16],             // 右腕
    [15, 17], [15, 19], [17, 19],   // 左手
    [16, 18], [16, 20], [18, 20],   // 右手
    [11, 23], [12, 24], [23, 24],   // 胴体
    [23, 25], [25, 27],             // 左脚
    [24, 26], [26, 28],             // 右脚
    [27, 29], [27, 31], [29, 31],   // 左足
    [28, 30], [28, 32], [30, 32],   // 右足
];
