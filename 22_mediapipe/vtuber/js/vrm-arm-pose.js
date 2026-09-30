// pixiv/three-vrm を使用して VRM モデルの腕のポーズを適用する
import { VRMHumanBoneName } from '@pixiv/three-vrm';

const DEG2RAD = Math.PI / 180;

// T-pose（腕を水平に伸ばした状態）を基準角度とする: 90
const REST_SHOULDER_DEG = 90;

// ひねりの最大角度を制限 : 約34°
const TWIST_MAX_RAD = 0.6;

// VRM モデルの腕の回転の符号を調整するための定数
const SIGN = {
  shoulder: { left: 1, right: -1 },
  twist: 1,
};

// 腕のトラッキング情報を VRM モデルに適用する関数
export function applyArmTrackingToVRM(vrm, frame) {
  if (!frame.detected) {
    return;
  }

  setUpperArm(vrm, VRMHumanBoneName.LeftUpperArm, frame.left.shoulderDeg, SIGN.shoulder.left);
  setUpperArm(vrm, VRMHumanBoneName.RightUpperArm, frame.right.shoulderDeg, SIGN.shoulder.right);
  setTwist(vrm, frame.twistRad);
}

// VRM モデルの上腕の回転を設定
function setUpperArm(vrm, boneName, shoulderDeg, sign) {
  const node = vrm.humanoid?.getNormalizedBoneNode(boneName);
  if (!node) return;

  // TODO: 肩の角度を z 回転（ラジアン）に変換: sign * (REST_SHOULDER_DEG - shoulderDeg) * DEG2RAD;
  const z = sign * (REST_SHOULDER_DEG - shoulderDeg) * DEG2RAD;
  node.rotation.set(0, 0, z, 'XYZ');
}

// VRM モデルの胸の捻り（肩ラインの回転）を設定
function setTwist(vrm, twistRad) {
  const chest = vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Chest)
    ?? vrm.humanoid?.getNormalizedBoneNode(VRMHumanBoneName.Spine);
  if (!chest) return;

  // TODO: twistRad を -TWIST_MAX_RAD 〜 TWIST_MAX_RAD の範囲に制限: Math.max(), Math.min()
  const clamped = Math.max(-TWIST_MAX_RAD, Math.min(TWIST_MAX_RAD, twistRad));
  chest.rotation.set(0, SIGN.twist * clamped, 0, 'XYZ');
}
