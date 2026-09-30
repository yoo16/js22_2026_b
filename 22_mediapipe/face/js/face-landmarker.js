import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// wasm を利用: vendor/@mediapipe/tasks-vision/wasm
const WASM_BASE = new URL('../../vendor/@mediapipe/tasks-vision/wasm', import.meta.url).toString();
// モデル本体: vendor/vendor/@mediapipe/models/face_landmarker.task のパス
const MODEL_ASSET_PATH = new URL(
    '../../vendor/@mediapipe/models/face_landmarker.task',
    import.meta.url,
).toString();

/**
 * FaceLandmarker を生成する
 * @returns {Promise<FaceLandmarker>}
 */
export async function createFaceLandmarker() {
    // Vision Tasks のファイルセットを初期化
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
    return FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_ASSET_PATH },
        numFaces: 1,
        runningMode: 'VIDEO',
    });
}

/**
 * 動画フレームから顔ランドマークを推定
 * @param {FaceLandmarker} landmarker
 * @param {HTMLVideoElement} video
 * @param {number} timestampMs performance.now() など単調増加する値
 * @returns {{keypoints: {x:number, y:number, z:number}[]}[]}
 */
let lastTimestamp = 0;

export function estimateFaces(landmarker, video, timestampMs) {
    // 動画フレームの幅と高さを取得
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return [];

    // detectForVideo は単調増加するタイムスタンプを要求する
    const ts = timestampMs > lastTimestamp ? timestampMs : lastTimestamp + 1;
    lastTimestamp = ts;
    // 顔ランドマークを検出: detectForVideo メソッドを使用
    const result = landmarker.detectForVideo(video, ts);
    return (result.faceLandmarks ?? []).map((landmarks) => ({
        keypoints: landmarks.map((point) => ({
            x: point.x * width,
            y: point.y * height,
            z: point.z * width,
        })),
    }));
}
