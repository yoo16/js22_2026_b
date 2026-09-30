// Three.js をインポート
import * as THREE from 'three';
// face-landmarker.js から必要な関数をインポート
import { createFaceLandmarker, estimateFaces } from './face-landmarker.js';

// スタンプ画像データ設定
const faceImages = {
    dog2: { scale: 600, point: 1, dx: 5, dy: 100 },
    panda1: { scale: 600, point: 1, dx: 5, dy: 100 },
    bear1: { scale: 600, point: 1, dx: 5, dy: 100 },
    monkey1: { scale: 600, point: 1, dx: 5, dy: 100 },
};
// デフォルト
let currentFaceImage = Object.keys(faceImages)[0];

// 画像の縦横比
const decoImageRatios = {};

// Three.jsの準備
const canvasEl = document.getElementById('canvas');
const videoEl = document.getElementById('video');

// 動画サイズ
const videoWidth = 640;
const videoHeight = 480;

// メッシュ
let mesh;
// 検出器
let detector;
// 検出結果
let results;
// 顔の法線
let faceNormalVector;

let positionX = 0;
let positionY = 0;
// 法線の強度
const depthStrength = 200;
// 法線のオフセット
const zOffset = 300;
// Three.js のシーン、カメラ、レンダラーへんす
let scene, camera, renderer;

// Three.jsの初期設定を行う関数
function setupWebGL() {
    // レンダラーを作成
    renderer = new THREE.WebGLRenderer({
        canvas: canvasEl,
        alpha: true
    });
    // ピクセル比を設定
    renderer.setPixelRatio(window.devicePixelRatio);
    // サイズを設定
    renderer.setSize(videoWidth, videoHeight);
    // 背景色を設定
    renderer.setClearColor(0x000000, 0);

    // シーンを作成
    scene = new THREE.Scene();

    // カメラを作成
    const fov = 45;
    // 縦横比を設定
    camera = new THREE.PerspectiveCamera(fov, videoWidth / videoHeight, 1, 1000);
    // カメラの位置を設定
    camera.position.set(0, 0, 680);

    createDecoPlane();
}

/**
 * FaceMesh検出器を設定する
 * @returns {Promise<void>} 設定が完了したpromise
 */
async function loadModels() {
    // 検出器を作成（vendor/ 内の MediaPipe Tasks Vision を利用）
    detector = await createFaceLandmarker();
}

/**
 * スタンプ切り替えボタンとスタンプ位置調整ボタンを生成
 */
function createImageButtons() {
    // スタンプ切り替えボタンを生成
    const buttonContainer = document.querySelector('.image-buttons');
    Object.keys(faceImages).forEach(name => {
        const button = document.createElement('button');
        button.classList.add('image-button', 'border', 'border-gray-300', 'rounded-full', 'p-1');
        button.dataset.deco = name;
        // 画像要素を作成
        const img = document.createElement('img');
        img.src = `images/${name}.png`;
        img.alt = name;
        img.classList.add('w-20');

        // ボタンに画像追加
        button.appendChild(img);
        // 画像ボタンクリッ処理
        button.addEventListener('click', () => {
            document.querySelectorAll('.image-button').forEach(btn => btn.classList.remove('current'));
            button.classList.add('current');
            positionX = 0;
            positionY = 0;
            currentFaceImage = name;
            updateFace();
        });

        buttonContainer.appendChild(button);
    });
}

/**
 * スタンプ位置調整ボタンを生成する
 * 
 * クリックすると、スタンプの位置が5pxずつ移動する。
 */
function createPositionButtons() {
    // スタンプ位置調整ボタンを生成
    const positionContainer = document.querySelector('.position-buttons');
    const positions = ['top', 'bottom', 'left', 'right'];
    const positionSymbols = { top: '↑', bottom: '↓', left: '←', right: '→' };

    // 各位置のボタンを生成
    positions.forEach(pos => {
        const button = document.createElement('button');
        button.classList.add('position-controllerButton', 'bg-gray-500', 'hover:bg-blue-600', 'text-white', 'font-semibold', 'px-4', 'py-2', 'rounded-full');
        button.dataset.position = pos;
        button.textContent = positionSymbols[pos];

        button.addEventListener('click', () => {
            if (pos === 'top') positionY += 5;
            if (pos === 'bottom') positionY -= 5;
            if (pos === 'left') positionX += 5;
            if (pos === 'right') positionX -= 5;
        });

        positionContainer.appendChild(button);
    });
}

/**
 * スタンプ画像を読み込み
 * 
 * すべての画像が読み込まれたら、setupWebGL() を呼び出す。
 */
function loadImages() {
    let imagesLoaded = 0;
    const keys = Object.keys(faceImages);
    const done = () => {
        imagesLoaded++;
        if (imagesLoaded === keys.length) {
            setupWebGL();
        }
    };
    keys.forEach(name => {
        // 画像オブジェクト作成
        const img = new Image();
        // 画像の読み込み完了時の処理を設定
        img.onload = () => {
            decoImageRatios[name] = img.width / img.height;
            done();
        };
        img.onerror = () => {
            console.warn(`スタンプ画像が見つかりません: images/${name}.png`);
            done();
        };
        // TODO: 画像のパスを設定
        // img.src = `images/${name}.png`;
    });
}

// デコレーション用のプレーンを作成
function createDecoPlane() {
    // 現在選択されているスタンプ画像の設定
    const settings = faceImages[currentFaceImage];
    // スタンプ画像の縦横比取得
    const ratio = decoImageRatios[currentFaceImage];
    // ジオメトリを作成
    const geometry = new THREE.PlaneGeometry(ratio, 1); 
    // テクスチャを読み込むためのローダー作成
    const loader = new THREE.TextureLoader();
    // テクスチャに画像を読み込む
    const texture = loader.load(`images/${currentFaceImage}.png`, function (map) {
        map.colorSpace = THREE.SRGBColorSpace;
    });
    // マテリアル作成
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true
    });
    // メッシュ作成
    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(settings.scale, settings.scale, 0);
    // シーンにメッシュを追加
    scene.add(mesh);
}

// スタンププレーンを更新する関数
function updateFace() {
    if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        mesh = null;
    }
    // 新しいメッシュを作成
    createDecoPlane();
}

// スタンプのためのプレーンの位置と回転、スケールを更新
function updatemesh() {
    if (!results || results.length === 0) {
        return;
    }

    // 顔の傾き処理
    const quaternion = calculateNormalVector();
    // TODO: スタンプの回転: three.js のクォータニオンを使用: mesh.quaternion.copy(quaternion)

    // スタンプの位置
    const settings = faceImages[currentFaceImage];
    // スタンプの位置調整
    const landmark = fixLandmarkValue(results[0].keypoints);

    // 鼻の位置
    const position = landmark[settings.point];
    // TODO: 顔の中心位置を計算
    // const faceCenter = new THREE.Vector3(
    //     position.x + positionX + settings.dx,
    //     position.y + positionY + settings.dy,
    //     position.z - zOffset,
    // );

    // 鼻のY座標の中間点を計算
    // TODO: 左鼻の座標: landmark[279]
    const leftNose = { x: 0, y: 0, z: 0 };
    // TODO: 右鼻の座標: landmark[49]
    const rightNose = { x: 0, y: 0, z: 0 };
    // TODO: 左右の鼻のY座標の中間点を計算
    const noseYMidpoint = 0;

    // TODO: 鼻のY座標の中間点に位置を調整
    // faceCenter.y = noseYMidpoint + settings.dy;

    // TODO: デコレーションを適切に配置
    // mesh.position.copy(faceCenter);
}


/**
 * 顔の向き（法線ベクトル）を計算し、three.jsのクォータニオンに変換
 */
function calculateNormalVector() {
    if (!results || results.length === 0) {
        return;
    }

    // ランドマーク取得
    const landmark = fixLandmarkValue(results[0].keypoints);
    // 鼻の先端のキーポイント: landmark[1]
    const noseTip = landmark[1];
    // 鼻の左端のキーポイント: landmark[279]
    const leftNose = landmark[279];
    // 鼻の右端のキーポイント: landmark[49]
    const rightNose = landmark[49];

    // 鼻の中央を計算（x, y, z）
    const midpoint = {
        x: (leftNose.x + rightNose.x) / 2,
        y: (leftNose.y + rightNose.y) / 2,
        z: (leftNose.z + rightNose.z) / 2,
    };

    // 顔の向き（法線ベクトル）を計算
    faceNormalVector = new THREE.Vector3(noseTip.x, noseTip.y, noseTip.z)
        .sub(new THREE.Vector3(midpoint.x, midpoint.y, midpoint.z))
        .normalize();

    // TODO: クォータニオンを作成
    // const quaternion = new THREE.Quaternion();
    // quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), faceNormalVector);
    // return quaternion;
}

/**
 * Webカメラを有効化する
 * @return {Promise<HTMLVideoElement>} streamの取得が完了したpromise
 */
async function setupCamera() {
    // Webカメラの映像設定
    const constraints = {
        video: {
            width: videoWidth,
            height: videoHeight,
            facingMode: 'user',
        },
        audio: false
    };

    try {
        // Webカメラの映像を取得
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        // video要素にストリームを設定
        videoEl.srcObject = stream;
        // video要素を再生
        await videoEl.play();
        return videoEl;
    } catch (error) {
        console.error(error);
    }
}

// 顔を検知
function detectFace() {
    // 顔を検知して結果を更新
    results = estimateFaces(detector, videoEl, performance.now());
}

/**
 * Face Landmark の座標を Three.js で使用できる形に変換
 * @param {Object[]} data Face Landmark の座標データ
 * @return {Object[]} Three.js で使用できる座標データ
 */
function fixLandmarkValue(data) {
    return data.map((el) => {
        return {
            x: el.x - videoEl.videoWidth / 2,
            y: -el.y + videoEl.videoHeight / 2,
            z: ((el.z / 100) * -1 + 1) * depthStrength
        };
    });
}

function render() {
    // 顔の向きを計算
    detectFace();
    // 顔の向きに基づいてメッシュを更新する処理を追加
    updatemesh();
    // シーンをレンダリング
    renderer.render(scene, camera);
    // 次のフレームの描画をリクエスト
    requestAnimationFrame(render);
}

// 初期化関数
async function init() {
    createImageButtons();
    createPositionButtons();
    loadImages();
    await setupCamera();
    await loadModels();
    render();
}

init();