// Three.js から必要なクラスをインポート
import { Box3, Vector3 } from 'three';
// GLTFLoader から必要なクラスをインポート
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// @pixiv/three-vrm から必要なクラスをインポート
import {
  VRMExpressionPresetName,
  VRMHumanBoneName,
  VRMLoaderPlugin,
  VRMUtils,
} from '@pixiv/three-vrm';
// 自然な腕のポーズの定義
const NATURAL_ARM_POSE = [
  { bone: VRMHumanBoneName.LeftUpperArm, rotation: { x: 0, y: 0, z: 1.05 } },
  { bone: VRMHumanBoneName.LeftLowerArm, rotation: { x: 0, y: 0.08, z: 0.22 } },
  { bone: VRMHumanBoneName.LeftHand, rotation: { x: 0, y: 0, z: 0.08 } },
  { bone: VRMHumanBoneName.RightUpperArm, rotation: { x: 0, y: 0, z: -1.05 } },
  { bone: VRMHumanBoneName.RightLowerArm, rotation: { x: 0, y: -0.08, z: -0.22 } },
  { bone: VRMHumanBoneName.RightHand, rotation: { x: 0, y: 0, z: -0.08 } },
];

// VRM 読み込み
export async function loadVRM(file) {
  // GLTFLoader を作成
  const loader = new GLTFLoader();
  // GLTFLoader に VRM 用のプラグインを登録
  loader.register((parser) => new VRMLoaderPlugin(parser));
  const objectUrl = URL.createObjectURL(file);

  try {
    // TODO: GLTF ファイルを読み込む: await loader.loadAsync(objectUrl)
    const gltf = await loader.loadAsync(objectUrl);
    const vrm = gltf.userData.vrm;
    if (!vrm) {
      throw new Error('VRMデータが見つかりません。');
    }
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    return vrm;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// VRM を顔ステージ用に準備
export function prepareVRMForFaceStage(vrm) {
  // VRM を初期状態に回転・配置
  VRMUtils.rotateVRM0(vrm);
  // 自然な腕のポーズを適用
  applyNaturalArmPose(vrm);
  // 顔をステージに合わせる
  fitVRMFaceToStage(vrm);
}

// 推定結果を VRM に反映
export function applyTrackingToVRM(vrm, frame) {
  if (!frame.detected) {
    // まばたきの表情をリセット
    setExpression(vrm, VRMExpressionPresetName.Blink, 0);
    setExpression(vrm, VRMExpressionPresetName.BlinkLeft, 0);
    setExpression(vrm, VRMExpressionPresetName.BlinkRight, 0);
    // 口の表情をリセット
    setExpression(vrm, VRMExpressionPresetName.Aa, 0);
    setExpression(vrm, VRMExpressionPresetName.Ih, 0);
    setExpression(vrm, VRMExpressionPresetName.Ou, 0);
    setExpression(vrm, VRMExpressionPresetName.Ee, 0);
    setExpression(vrm, VRMExpressionPresetName.Oh, 0);
    return;
  }

  // TODO: 頭のボーンを取得: vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head)
  const head = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
  // 頭の回転
  if (head) {
    head.rotation.set(frame.head.pitch, frame.head.yaw, -frame.head.roll, 'XYZ');
  }

  // TODO: 首のボーンを取得: vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Neck)
  const neck = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Neck);
  // 首の回転
  if (neck) {
    neck.rotation.set(frame.head.pitch * 0.35, frame.head.yaw * 0.35, -frame.head.roll * 0.2, 'XYZ');
  }

  // TODO: まばたきの表情: Blink は左右の大きい方、BlinkLeft / BlinkRight はそれぞれの値
  setExpression(vrm, VRMExpressionPresetName.Blink, Math.max(frame.eyes.leftBlink, frame.eyes.rightBlink));
  setExpression(vrm, VRMExpressionPresetName.BlinkLeft, frame.eyes.leftBlink);
  setExpression(vrm, VRMExpressionPresetName.BlinkRight, frame.eyes.rightBlink);

  // TODO: 口の表情: あ(Aa)・い(Ih)・う(Ou)・え(Ee)・お(Oh) に frame.mouth の値を設定
  setExpression(vrm, VRMExpressionPresetName.Aa, frame.mouth.aa);
  setExpression(vrm, VRMExpressionPresetName.Ih, frame.mouth.ih);
  setExpression(vrm, VRMExpressionPresetName.Ou, frame.mouth.ou);
  setExpression(vrm, VRMExpressionPresetName.Ee, frame.mouth.ee);
  setExpression(vrm, VRMExpressionPresetName.Oh, frame.mouth.oh);
}

// VRM のポーズをリセット
export function resetVRMPose(vrm) {
  const head = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
  const neck = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Neck);
  head?.rotation.set(0, 0, 0);
  neck?.rotation.set(0, 0, 0);
  applyNaturalArmPose(vrm);
}

// オブジェクトを破棄してメモリを解放
export function disposeObject(root) {
  root.traverse((object) => {
    object.geometry?.dispose?.();

    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material.dispose?.());
      return;
    }

    object.material?.dispose?.();
  });
}

// VRM を顔ステージ用に配置
function fitVRMFaceToStage(vrm) {
  const scene = vrm.scene;
  scene.rotation.y = Math.PI;
  scene.position.set(0, 0, 0);
  scene.scale.setScalar(1);
  scene.updateMatrixWorld(true);

  const bounds = new Box3().setFromObject(scene);
  const size = bounds.getSize(new Vector3());

  if (size.y <= 0) {
    scene.position.set(0, 0, 0);
    return;
  }

  // シーンの高さをターゲットに合わせてスケーリング
  const targetHeight = 3.0;
  const scale = targetHeight / size.y;
  scene.scale.setScalar(scale);
  scene.updateMatrixWorld(true);

  const focus = getVRMFaceFocus(vrm);
  const target = new Vector3(0, 0.35, 0);
  scene.position.add(target.sub(focus));
  scene.updateMatrixWorld(true);
}

// VRM の顔の注視点を取得
function getVRMFaceFocus(vrm) {
  // 頭のボーンを取得
  const head = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
  if (head) {
    return head.getWorldPosition(new Vector3());
  }
  // 頭のボーンが取得できなかった場合は、シーンのバウンディングボックスから注視点を計算
  const bounds = new Box3().setFromObject(vrm.scene);
  const size = bounds.getSize(new Vector3());
  return new Vector3(
    (bounds.min.x + bounds.max.x) / 2,
    bounds.min.y + size.y * 0.82,
    (bounds.min.z + bounds.max.z) / 2,
  );
}

// VRM の顔をステージに合わせて配置
function applyNaturalArmPose(vrm) {
  // アームの自然なポーズを適用する前にシーンの行列を更新
  NATURAL_ARM_POSE.forEach(({ bone, rotation }) => {
    const node = vrm.humanoid.getNormalizedBoneNode(bone);
    node?.rotation.set(rotation.x, rotation.y, rotation.z, 'XYZ');
  });
  vrm.scene.updateMatrixWorld(true);
}

// VRM の表情を設定
function setExpression(vrm, presetName, value) {
  vrm.expressionManager?.setValue(presetName, value);
}
