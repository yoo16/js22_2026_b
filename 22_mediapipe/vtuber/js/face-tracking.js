// FaceLandmarker をインポート
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
// Mediapipe の WASM ベースとモデルアセットのパスを設定
const MEDIAPIPE_WASM_BASE = new URL('../../vendor/@mediapipe/tasks-vision/wasm', import.meta.url).toString();
const MEDIAPIPE_MODEL_ASSET = new URL(
  '../../vendor/@mediapipe/models/face_landmarker.task',
  import.meta.url,
).toString();
// 顔ランドマークのインデックスを定義
const LANDMARK_INDEX = {
  leftEyeOuter: 33,
  leftEyeInner: 133,
  rightEyeOuter: 263,
  rightEyeInner: 362,
  noseTip: 1,
  forehead: 10,
  chin: 152,
  leftCheek: 234,
  rightCheek: 454,
  upperLip: 13,
  lowerLip: 14,
  mouthLeftCorner: 61,
  mouthRightCorner: 291,
  leftEyeUpperPoints: [159, 158, 157],
  leftEyeLowerPoints: [145, 144, 153],
  rightEyeUpperPoints: [386, 385, 384],
  rightEyeLowerPoints: [374, 373, 380],
};
// 頭の回転の制限値を定義
const LIMITS = {
  yaw: Math.PI / 5,
  pitch: Math.PI / 6,
  roll: Math.PI / 6,
};
// デフォルトの顔フレームを定義
export const DEFAULT_FRAME = {
  detected: false,
  head: { yaw: 0, pitch: 0, roll: 0 },
  eyes: { leftBlink: 0, rightBlink: 0 },
  mouth: { open: 0, aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 },
};

// 「あ・い・う・え・お」を口の「開き具合(openness)」と「すぼまり具合(roundness)」
const VOWEL_SHAPES = {
  aa: { openness: 0.9, roundness: 0.4 }, // あ: 大きく開く、横幅は普通
  ih: { openness: 0.15, roundness: 0.05 }, // い: 狭く開く、横に引く
  ou: { openness: 0.2, roundness: 0.85 }, // う: 狭く開く、すぼめる
  ee: { openness: 0.4, roundness: 0.15 }, // え: 中程度に開く、横に引く
  oh: { openness: 0.55, roundness: 0.7 }, // お: 中〜大きく開く、すぼめる
};
// 値が小さいほど母音の境界がくっきり、大きいほどなだらかに混ざる。
const VOWEL_SOFTNESS = 0.35;
// 口の母音形状の境界の柔らかさを定義
const SMOOTHING = {
  head: 0.22,
  blink: 0.42,
  mouth: 0.32,
};
// カメラやVRMの設置が正面から傾いている場合の手動補正
let headOffset = { yaw: 0, pitch: 0, roll: 0 };
let calibratingHead = false;

// 頭のキャリブレーションをリセット
export function resetHeadCalibration() {
  calibratingHead = true;
}

// 頭のキャリブレーションを開始
export async function createFaceDetector() {
  // 頭のキャリブレーションを開始
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_BASE);
  // TODO: FaceLandmarker で顔ランドマークを検出インスタンス
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MEDIAPIPE_MODEL_ASSET,
    },
    numFaces: 1,
    runningMode: 'VIDEO',
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
}

// カメラ映像のストリーム
export async function startCameraStream(video) {
  // カメラ映像のストリームを取得
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user',
    },
    audio: false,
  });
  // video 要素にカメラの映像 stream を設定して再生: video.srcObject, video.play()
  video.srcObject = stream;
  await video.play();
}

// 顔フレームを滑らかに補間して取得
export function getSmoothedFaceFrame({ detector, video, now, currentFrame }) {
  if (!detector || !isVideoReady(video)) {
    return smoothFrame(currentFrame, DEFAULT_FRAME);
  }

  try {
    // 動画フレームから顔ランドマークを検出
    const result = detector.detectForVideo(video, now);
    // 検出結果から最初の顔のランドマークを取得
    const landmarks = result.faceLandmarks[0];
    // ランドマークから顔の向きや目の開き具合、口の形を解析
    const nextFrame = landmarks ? analyzeLandmarks(landmarks) : DEFAULT_FRAME;
    // 次のフレームを滑らかに補間
    return smoothFrame(currentFrame, nextFrame);
  } catch {
    return smoothFrame(currentFrame, DEFAULT_FRAME);
  }
}

// video 再生可能判定
function isVideoReady(video) {
  return (
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0 &&
    !video.paused &&
    !video.ended
  );
}
// 顔ランドマークを解析
function analyzeLandmarks(landmarks) {
  return {
    detected: true,
    head: calculateHeadRotation(landmarks),
    eyes: {
      leftBlink: calculateEyeBlink(
        landmarks,
        LANDMARK_INDEX.leftEyeUpperPoints,
        LANDMARK_INDEX.leftEyeLowerPoints,
        LANDMARK_INDEX.leftEyeOuter,
        LANDMARK_INDEX.leftEyeInner,
      ),
      rightBlink: calculateEyeBlink(
        landmarks,
        LANDMARK_INDEX.rightEyeUpperPoints,
        LANDMARK_INDEX.rightEyeLowerPoints,
        LANDMARK_INDEX.rightEyeOuter,
        LANDMARK_INDEX.rightEyeInner,
      ),
    },
    mouth: calculateMouthShape(landmarks),
  };
}

// 顔ランドマークから頭の回転角度（yaw, pitch, roll）を計算
function calculateHeadRotation(landmarks) {
  // 左右の目
  const leftEye = landmarks[LANDMARK_INDEX.leftEyeOuter];
  const rightEye = landmarks[LANDMARK_INDEX.rightEyeOuter];
  // 鼻先
  const noseTip = landmarks[LANDMARK_INDEX.noseTip];
  // 額
  const forehead = landmarks[LANDMARK_INDEX.forehead];
  // 顎
  const chin = landmarks[LANDMARK_INDEX.chin];
  // 頬
  const leftCheek = landmarks[LANDMARK_INDEX.leftCheek];
  const rightCheek = landmarks[LANDMARK_INDEX.rightCheek];

  if (!leftEye || !rightEye || !noseTip || !forehead || !chin || !leftCheek || !rightCheek) {
    return DEFAULT_FRAME.head;
  }

  // 顔の中心点を計算
  const eyesMidpointY = (leftEye.y + rightEye.y) / 2;
  // 顔の縦横比を計算するための基準値
  const faceHeight = Math.abs(chin.y - forehead.y);
  const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
  // 顔の幅と高さを使って yaw と pitch のスケールを計算
  const yawBase = (leftCheek.x + rightCheek.x) / 2;
  const yawScale = Math.max(faceWidth * 0.5, Number.EPSILON);
  const pitchScale = Math.max(faceHeight * 0.5, Number.EPSILON);

  // 頭の回転角度（yaw, pitch, roll）を計算するための基準値
  const rawYaw = ((yawBase - noseTip.x) / yawScale) * LIMITS.yaw;
  // yaw, pitch, roll の生値を計算
  const rawPitch = ((eyesMidpointY - noseTip.y) / pitchScale) * LIMITS.pitch;
  // 両目を結ぶ線の傾き（roll）を計算: Math.atan2(y の差, x の差)。右目 - 左目
  const rawRoll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

  if (calibratingHead) {
    headOffset = { yaw: rawYaw, pitch: rawPitch, roll: rawRoll };
    calibratingHead = false;
  }

  // 頭の回転角度を返す
  return {
    yaw: clamp(rawYaw - headOffset.yaw, -LIMITS.yaw, LIMITS.yaw),
    pitch: clamp(rawPitch - headOffset.pitch, -LIMITS.pitch, LIMITS.pitch),
    roll: clamp(rawRoll - headOffset.roll, -LIMITS.roll, LIMITS.roll),
  };
}

// 顔ランドマークの検出結果から、頭の向き・目の開き具合・口の形を解析してフレームを生成
function calculateEyeBlink(landmarks, upperIndices, lowerIndices, outerIndex, innerIndex) {
  // 上下まぶたのランドマークの平均位置を計算
  const upper = averageLandmark(landmarks, upperIndices);
  const lower = averageLandmark(landmarks, lowerIndices);
  // 外側と内側のランドマークを取得
  const outer = landmarks[outerIndex];
  const inner = landmarks[innerIndex];

  if (!upper || !lower || !outer || !inner) {
    return 0;
  }

  // 目の縦横比を計算
  const eyeHeight = distance2D(upper, lower);
  const eyeWidth = distance2D(outer, inner);
  if (eyeWidth <= 0) {
    return 0;
  }

  return clamp(1 - normalize(eyeHeight / eyeWidth, 0.16, 0.3), 0, 1);
}

// 口の形を計算するためのランドマークを取得
function calculateMouthShape(landmarks) {
  // 上下の唇のランドマークを取得
  const upperLip = landmarks[LANDMARK_INDEX.upperLip];
  const lowerLip = landmarks[LANDMARK_INDEX.lowerLip];
  // 顔の輪郭のランドマークを取得
  const forehead = landmarks[LANDMARK_INDEX.forehead];
  // 顎のランドマークを取得
  const chin = landmarks[LANDMARK_INDEX.chin];
  // 頬のランドマークを取得
  const leftCheek = landmarks[LANDMARK_INDEX.leftCheek];
  const rightCheek = landmarks[LANDMARK_INDEX.rightCheek];
  // 口の両端のランドマークを取得
  const mouthLeft = landmarks[LANDMARK_INDEX.mouthLeftCorner];
  const mouthRight = landmarks[LANDMARK_INDEX.mouthRightCorner];

  if (
    !upperLip || !lowerLip || !forehead || !chin || !leftCheek || !rightCheek || !mouthLeft || !mouthRight
  ) {
    return DEFAULT_FRAME.mouth;
  }

  // 顔の大きさを計算
  const faceSize = distance2D(forehead, chin);
  const faceWidth = distance2D(leftCheek, rightCheek);
  if (faceSize <= 0 || faceWidth <= 0) {
    return DEFAULT_FRAME.mouth;
  }

  // 口の開き具合: 上唇と下唇の距離 ÷ 顔の大きさ
  const openness = normalize(distance2D(upperLip, lowerLip) / faceSize, 0.015, 0.12);
  const widthRatio = distance2D(mouthLeft, mouthRight) / faceWidth;
  // 口の丸み計算
  const roundness = 1 - normalize(widthRatio, 0.38, 0.62);

  return { open: openness, ...vowelWeights(openness, roundness) };
}

// 母音の開き具合と丸みから各母音のスコアを計算
function vowelWeights(openness, roundness) {
  const point = { openness, roundness };
  const scores = {
    aa: vowelScore(point, VOWEL_SHAPES.aa),
    ih: vowelScore(point, VOWEL_SHAPES.ih),
    ou: vowelScore(point, VOWEL_SHAPES.ou),
    ee: vowelScore(point, VOWEL_SHAPES.ee),
    oh: vowelScore(point, VOWEL_SHAPES.oh),
  };
  const total = scores.aa + scores.ih + scores.ou + scores.ee + scores.oh;

  return {
    aa: (scores.aa / total) * openness,
    ih: (scores.ih / total) * openness,
    ou: (scores.ou / total) * openness,
    ee: (scores.ee / total) * openness,
    oh: (scores.oh / total) * openness,
  };
}

// 母音スコアを計算するための距離関数
function vowelScore(point, reference) {
  const d2 = (point.openness - reference.openness) ** 2 + (point.roundness - reference.roundness) ** 2;
  return 1 / (d2 + VOWEL_SOFTNESS);
}

// なめらかに補間
function smoothFrame(current, next) {
  if (!next.detected) {
    return {
      detected: false,
      // 頭の向き
      head: {
        yaw: lerp(current.head.yaw, 0, SMOOTHING.head),
        pitch: lerp(current.head.pitch, 0, SMOOTHING.head),
        roll: lerp(current.head.roll, 0, SMOOTHING.head),
      },
      // 目の開き具合
      eyes: {
        leftBlink: lerp(current.eyes.leftBlink, 0, SMOOTHING.blink),
        rightBlink: lerp(current.eyes.rightBlink, 0, SMOOTHING.blink),
      },
      // 口の形
      mouth: lerpMouth(current.mouth, DEFAULT_FRAME.mouth, SMOOTHING.mouth),
    };
  }

  return {
    detected: true,
    head: {
      yaw: lerp(current.head.yaw, next.head.yaw, SMOOTHING.head),
      pitch: lerp(current.head.pitch, next.head.pitch, SMOOTHING.head),
      roll: lerp(current.head.roll, next.head.roll, SMOOTHING.head),
    },
    eyes: {
      leftBlink: clamp(lerp(current.eyes.leftBlink, next.eyes.leftBlink, SMOOTHING.blink), 0, 1),
      rightBlink: clamp(lerp(current.eyes.rightBlink, next.eyes.rightBlink, SMOOTHING.blink), 0, 1),
    },
    mouth: lerpMouth(current.mouth, next.mouth, SMOOTHING.mouth),
  };
}

function lerpMouth(current, next, amount) {
  return {
    open: clamp(lerp(current.open, next.open, amount), 0, 1),
    aa: clamp(lerp(current.aa, next.aa, amount), 0, 1),
    ih: clamp(lerp(current.ih, next.ih, amount), 0, 1),
    ou: clamp(lerp(current.ou, next.ou, amount), 0, 1),
    ee: clamp(lerp(current.ee, next.ee, amount), 0, 1),
    oh: clamp(lerp(current.oh, next.oh, amount), 0, 1),
  };
}

function averageLandmark(landmarks, indices) {
  const points = indices.map((index) => landmarks[index]).filter(Boolean);
  if (points.length === 0) {
    return null;
  }

  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    z: points.reduce((sum, point) => sum + point.z, 0) / points.length,
  };
}

// 2D座標間の距離を計算
function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// 値を 0〜1 の範囲に正規化
function normalize(value, min, max) {
  if (max === min) {
    return 0;
  }
  return clamp((value - min) / (max - min), 0, 1);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// 線形補間: from から to へ amount（0〜1）の割合だけ近づけた値を返す
function lerp(from, to, amount) {
  return from + (to - from) * amount;
}
