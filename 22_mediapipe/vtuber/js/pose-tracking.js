// PoseLandmarker をインポート
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
// MediaPipe の WASM ベースとモデルアセットのパスを設定
const MEDIAPIPE_WASM_BASE = new URL('../../vendor/@mediapipe/tasks-vision/wasm', import.meta.url).toString();
const MEDIAPIPE_MODEL_ASSET = new URL(
  '../../vendor/@mediapipe/models/pose_landmarker.task',
  import.meta.url,
).toString();

// BlazePose（MediaPipe Pose）のランドマーク番号
const LANDMARK_INDEX = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftHip: 23,
  rightHip: 24,
};
// デフォルトの腕のフレーム情報
export const DEFAULT_ARM_FRAME = {
  detected: false,
  left: { shoulderDeg: 0 },
  right: { shoulderDeg: 0 },
  twistRad: 0,
};

const SMOOTHING = {
  shoulder: 0.12,
  twist: 0.08,
};

// 肩の捻りの基準角度を保持するための変数
let twistRestAngle = null;

// 肩の捻りのキャリブレーションをリセット
export function resetTwistCalibration() {
  twistRestAngle = null;
}

// 肩の捻りのキャリブレーションを開始
export async function createPoseDetector() {
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_BASE);
  // PoseLandmarker で姿勢ランドマークを検出インスタンス
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MEDIAPIPE_MODEL_ASSET },
    numPoses: 1,
    runningMode: 'VIDEO',
  });
}

// 腕のフレームを滑らかに補間して取得
export function getSmoothedArmFrame({ detector, video, now, currentFrame }) {
  if (!detector || !isVideoReady(video)) {
    return smoothFrame(currentFrame, DEFAULT_ARM_FRAME);
  }

  try {
    // 動画フレームから姿勢ランドマークを検出
    const result = detector.detectForVideo(video, now);
    // 最初の検出結果のランドマークを取得
    const landmarks = result.landmarks?.[0];
    const nextFrame = landmarks ? analyzeLandmarks(landmarks) : DEFAULT_ARM_FRAME;
    // 次のフレームを滑らかに補間して返す
    return smoothFrame(currentFrame, nextFrame);
  } catch {
    return smoothFrame(currentFrame, DEFAULT_ARM_FRAME);
  }
}

function isVideoReady(video) {
  return (
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0 &&
    !video.paused &&
    !video.ended
  );
}

function analyzeLandmarks(landmarks) {
  const leftShoulder = landmarks[LANDMARK_INDEX.leftShoulder];
  const rightShoulder = landmarks[LANDMARK_INDEX.rightShoulder];
  const leftElbow = landmarks[LANDMARK_INDEX.leftElbow];
  const rightElbow = landmarks[LANDMARK_INDEX.rightElbow];
  const leftHip = landmarks[LANDMARK_INDEX.leftHip];
  const rightHip = landmarks[LANDMARK_INDEX.rightHip];

  if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow || !leftHip || !rightHip) {
    return DEFAULT_ARM_FRAME;
  }

  return {
    detected: true,
    // 左肩の情報
    left: {
      shoulderDeg: angleAt(leftHip, leftShoulder, leftElbow),
    },
    // 右肩の情報
    right: {
      shoulderDeg: angleAt(rightHip, rightShoulder, rightElbow),
    },
    // 肩の捻りの情報
    twistRad: calculateTwist(leftShoulder, rightShoulder),
  };
}

// 左肩と右肩の位置から肩ラインの回転（体の捻り）を計算
function calculateTwist(leftShoulder, rightShoulder) {
  // 左肩と右肩のx座標とz座標の差を計算
  const dx = leftShoulder.x - rightShoulder.x;
  const dz = leftShoulder.z - rightShoulder.z;
  //  肩ラインの角度を計算: Math.atan2(): 引数: dz, dx
  const rawAngle = Math.atan2(dz, dx);
  // 初回は現在の角度を基準 0
  if (twistRestAngle === null) {
    twistRestAngle = rawAngle;
    return 0;
  }
  // 現在の角度から基準角度を引いて正規化して返す
  return normalizeAngle(rawAngle - twistRestAngle);
}

// 角度を -π から π の範囲に正規化
function normalizeAngle(angle) {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

// 3点(a, b, c)から、bを頂点とする角度を計算
function angleAt(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (mag === 0) return 0;
  const cos = Math.min(1, Math.max(-1, dot / mag));
  return (Math.acos(cos) * 180) / Math.PI;
}

// 現在のフレームと次のフレームを滑らかに補間
function smoothFrame(current, next) {
  if (!next.detected) {
    return {
      detected: false,
      left: { shoulderDeg: lerp(current.left.shoulderDeg, 0, SMOOTHING.shoulder) },
      right: { shoulderDeg: lerp(current.right.shoulderDeg, 0, SMOOTHING.shoulder) },
      twistRad: lerp(current.twistRad, 0, SMOOTHING.twist),
    };
  }

  return {
    detected: true,
    left: { shoulderDeg: lerp(current.left.shoulderDeg, next.left.shoulderDeg, SMOOTHING.shoulder) },
    right: { shoulderDeg: lerp(current.right.shoulderDeg, next.right.shoulderDeg, SMOOTHING.shoulder) },
    twistRad: lerp(current.twistRad, next.twistRad, SMOOTHING.twist),
  };
}

// 線形補間
function lerp(from, to, amount) {
  return from + (to - from) * amount;
}
