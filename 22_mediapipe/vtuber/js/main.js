// Three.js のモジュールをインポート
import {
  AmbientLight,
  Clock,
  Color,
  DirectionalLight,
  Group,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';

// pose-tracking.js から腕のトラッキング関連の機能をインポート
import {
  DEFAULT_FRAME,
  createFaceDetector,
  getSmoothedFaceFrame,
  resetHeadCalibration,
  startCameraStream,
} from './face-tracking.js';

// vrm.js モジュールをインポート
import {
  applyTrackingToVRM,
  disposeObject,
  loadVRM,
  prepareVRMForFaceStage,
  resetVRMPose,
} from './vrm.js';

// pose-tracking.js から腕のトラッキング関連の機能をインポート
import {
  DEFAULT_ARM_FRAME,
  createPoseDetector,
  getSmoothedArmFrame,
  resetTwistCalibration,
} from './pose-tracking.js';
import { applyArmTrackingToVRM } from './vrm-arm-pose.js';

// シーンの初期化とレンダラーの設定
const elements = {
  canvas: document.querySelector('#avatar-canvas'),
  video: document.querySelector('#camera-video'),
  vrmFile: document.querySelector('#vrm-file'),
  startCamera: document.querySelector('#start-camera'),
  resetPose: document.querySelector('#reset-pose'),
  calibratePose: document.querySelector('#calibrate-pose'),
  detectorStatus: document.querySelector('#detector-status'),
  cameraStatus: document.querySelector('#camera-status'),
  faceStatus: document.querySelector('#face-status'),
  yawValue: document.querySelector('#yaw-value'),
  pitchValue: document.querySelector('#pitch-value'),
  rollValue: document.querySelector('#roll-value'),
  blinkValue: document.querySelector('#blink-value'),
  mouthValue: document.querySelector('#mouth-value'),
  armToggle: document.querySelector('#arm-tracking-toggle'),
  armStatus: document.querySelector('#arm-status'),
  shoulderValue: document.querySelector('#shoulder-value'),
  twistValue: document.querySelector('#twist-value'),
};

// アプリケーションの状態を管理するオブジェクト
const state = {
  detector: null,
  poseDetector: null,
  currentVrm: null,
  frame: structuredClone(DEFAULT_FRAME),
  armFrame: structuredClone(DEFAULT_ARM_FRAME),
  armTrackingEnabled: false,
  lastDebugUpdate: 0,
};
// シーンの初期化とレンダラーの設定を行う関数を呼び出す
const sceneState = createScene(elements.canvas);
// レンダリング用のクロックを作成
const clock = new Clock();
// アプリケーションを起動
boot();

// アプリケーションの起動処理を実行
async function boot() {
  resizeRenderer();
  window.addEventListener('resize', resizeRenderer);
  elements.startCamera.addEventListener('click', startCamera);
  elements.vrmFile.addEventListener('change', handleVrmFile);
  elements.resetPose.addEventListener('click', resetPose);
  elements.calibratePose?.addEventListener('click', calibratePose);
  elements.armToggle?.addEventListener('change', handleArmToggle);

  requestAnimationFrame(renderLoop);
  await initializeFaceDetector();
}

// 腕のトラッキングの有効/無効を切り替えるハンドラ
async function handleArmToggle(event) {
  state.armTrackingEnabled = event.target.checked;

  if (state.armTrackingEnabled && !state.poseDetector) {
    try {
      setText(elements.armStatus, 'loading');
      state.poseDetector = await createPoseDetector();
      setText(elements.armStatus, 'ready');
    } catch (error) {
      setText(elements.armStatus, `error: ${toMessage(error)}`);
      state.armTrackingEnabled = false;
      elements.armToggle.checked = false;
    }
  }

  if (state.armTrackingEnabled) {
    // 正面を向いた状態をオンにするタイミングを基準として、捻りをキャリブレーションする。
    resetTwistCalibration();
  } else {
    state.armFrame = structuredClone(DEFAULT_ARM_FRAME);
    setText(elements.armStatus, 'off');
  }
}

// 顔ランドマーク推定器を初期化する関数
async function initializeFaceDetector() {
  try {
    setText(elements.detectorStatus, 'loading');
    // 顔ランドマーク推定器を初期化(非同期): createFaceDetector()
    state.detector = await createFaceDetector();
    setText(elements.detectorStatus, 'ready');
  } catch (error) {
    setText(elements.detectorStatus, `error: ${toMessage(error)}`);
  }
}

// Webカメラ開始
async function startCamera() {
  try {
    setText(elements.cameraStatus, 'requesting');
    //  Webカメラを開始(非同期): startCameraStream(): 引数: elements.video
    await startCameraStream(elements.video);
    setText(elements.cameraStatus, 'running');
  } catch (error) {
    setText(elements.cameraStatus, `error: ${toMessage(error)}`);
  }
}

// VRM ファイル読み込みハンドラ
async function handleVrmFile(event) {
  // 選択されたファイルを取得
  const [file] = event.target.files ?? [];
  if (!file) {
    return;
  }

  try {
    // 既存の VRM があれば削除して破棄
    const vrm = await loadVRM(file);
    if (state.currentVrm) {
      sceneState.root.remove(state.currentVrm.scene);
      disposeObject(state.currentVrm.scene);
    }
    // VRM を顔ステージ用に準備
    prepareVRMForFaceStage(vrm);
    // VRM のシーンを 3D 空間に追加
    sceneState.root.add(vrm.scene);
    state.currentVrm = vrm;
  } catch (error) {
    alert(`VRMを読み込めませんでした: ${toMessage(error)}`);
  }
}

// メインのレンダリングループ
function renderLoop(now) {
  // フレームの開始時刻を取得
  requestAnimationFrame(renderLoop);

  // 顔の向き・まばたき・口の形を推定
  state.frame = getSmoothedFaceFrame({
    detector: state.detector,
    video: elements.video,
    now,
    currentFrame: state.frame,
  });

  // 腕のトラッキング結果を取得
  if (state.armTrackingEnabled) {
    state.armFrame = getSmoothedArmFrame({
      detector: state.poseDetector,
      video: elements.video,
      now,
      currentFrame: state.armFrame,
    });
  }

  if (state.currentVrm) {
    // 推定結果を VRM に反映: applyTrackingToVRM(): 引数: state.currentVrm, state.frame
    applyTrackingToVRM(state.currentVrm, state.frame);

    // 腕のトラッキング結果を VRM に反映
    if (state.armTrackingEnabled) {
      applyArmTrackingToVRM(state.currentVrm, state.armFrame);
    }
    state.currentVrm.update(clock.getDelta());
  }

  updateDebugPanel(now);
  sceneState.renderer.render(sceneState.scene, sceneState.camera);
}

// VRM のポーズをリセット
function resetPose() {
  state.frame = structuredClone(DEFAULT_FRAME);
  state.armFrame = structuredClone(DEFAULT_ARM_FRAME);
  if (state.armTrackingEnabled) {
    resetTwistCalibration();
  }
  if (!state.currentVrm) {
    return;
  }

  resetVRMPose(state.currentVrm);
  applyTrackingToVRM(state.currentVrm, DEFAULT_FRAME);
}

// 現在の頭の向きと肩の捻りを基準(0)として記録
function calibratePose() {
  resetHeadCalibration();
  if (state.armTrackingEnabled) {
    resetTwistCalibration();
  }
}

// 3Dシーンを作成(Three.js)
function createScene(canvas) {
  const scene = new Scene();
  scene.background = new Color('#181818');

  const camera = new PerspectiveCamera(24, 1, 0.1, 100);
  camera.position.set(0, 0.35, 2.05);
  camera.lookAt(0, 0.35, 0);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const root = new Group();
  scene.add(root);

  const ambient = new AmbientLight('#ffffff', 1.7);
  scene.add(ambient);

  const keyLight = new DirectionalLight('#ffffff', 2.2);
  keyLight.position.set(1.5, 2.5, 2.2);
  scene.add(keyLight);

  const fillLight = new DirectionalLight('#f4d4b8', 0.8);
  fillLight.position.set(-1.5, 1.2, 1.5);
  scene.add(fillLight);

  return { scene, camera, renderer, root };
}

// レンダラーのサイズ調整
function resizeRenderer() {
  const width = elements.canvas.clientWidth;
  const height = elements.canvas.clientHeight;
  sceneState.camera.aspect = width / height;
  sceneState.camera.updateProjectionMatrix();
  sceneState.renderer.setSize(width, height, false);
}

// デバッグパネルの更新
function updateDebugPanel(now) {
  if (now - state.lastDebugUpdate < 100) {
    return;
  }
  state.lastDebugUpdate = now;

  setText(elements.faceStatus, state.frame.detected ? 'detected' : 'not detected');
  setText(elements.yawValue, state.frame.head.yaw.toFixed(2));
  setText(elements.pitchValue, state.frame.head.pitch.toFixed(2));
  setText(elements.rollValue, state.frame.head.roll.toFixed(2));
  setText(elements.blinkValue, `${state.frame.eyes.leftBlink.toFixed(2)} / ${state.frame.eyes.rightBlink.toFixed(2)}`);
  setText(
    elements.mouthValue,
    `a${state.frame.mouth.aa.toFixed(2)} i${state.frame.mouth.ih.toFixed(2)} u${state.frame.mouth.ou.toFixed(2)} e${state.frame.mouth.ee.toFixed(2)} o${state.frame.mouth.oh.toFixed(2)}`,
  );

  if (elements.shoulderValue) {
    setText(
      elements.shoulderValue,
      `${state.armFrame.left.shoulderDeg.toFixed(0)}° / ${state.armFrame.right.shoulderDeg.toFixed(0)}°`,
    );
  }

  if (elements.twistValue) {
    setText(elements.twistValue, `${((state.armFrame.twistRad * 180) / Math.PI).toFixed(0)}°`);
  }
}

function setText(element, text) {
  element.textContent = text;
}

function toMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
