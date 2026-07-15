// ES Module インポート
import * as THREE from 'three';
// FBXLoader
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
// GLTFLoader
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// OrbitControls
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// DOM要素の取得
const fileInput = document.getElementById('fileInput');
const statusEl = document.getElementById('status');

// モデルの管理用変数
let currentModel = null;
let mixer = null;
let objectUrls = [];

// シーンの作成
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

// カメラの作成
const aspect = window.innerWidth / window.innerHeight;
const fov = 50; // 視野角
const near = 0.01; // ニアクリップ面
const far = 2000; // ファークリップ面
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(2, 2, 2);

// レンダラーの作成
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
// レンダラーのDOM要素をbodyに追加
document.body.appendChild(renderer.domElement);

// シーンにグリッドヘルパーとライトを追加
scene.add(new THREE.GridHelper(10, 10, 0x555555, 0x333333));
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

// DirectionalLightの作成とシーンへの追加
const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(5, 10, 5);
light.castShadow = true;
scene.add(light);

// OrbitControlsの作成
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// アニメーション用のクロック
const clock = new THREE.Clock();

// ステータス表示の更新
function setStatus(message) {
    statusEl.textContent = message;
}

// オブジェクトURLの解放
function revokeObjectUrls() {
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    objectUrls = [];
}

// 現在のモデルをクリア
function clearCurrentModel() {
    if (!currentModel) return;
    // シーンからモデルを削除し、ジオメトリとマテリアルを解放
    scene.remove(currentModel);
    currentModel.traverse(node => {
        if (!node.isMesh) return;

        node.geometry?.dispose();
        if (Array.isArray(node.material)) {
            node.material.forEach(material => material.dispose());
        } else {
            node.material?.dispose();
        }
    });

    currentModel = null;
    mixer = null;
}

// カメラをモデルにフィット
function fitCamera(object) {
    // モデルのバウンディングボックスを計算してカメラを調整
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // カメラのFOVを考慮して距離を計算
    const fov = camera.fov * (Math.PI / 180);
    const dist = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;

    // カメラの位置とコントロールのターゲットを設定
    camera.position.set(center.x + dist, center.y + (maxDim / 2), center.z + dist);
    controls.target.copy(center);
    controls.update();
}

// ファイルをオブジェクトURLに変換
function prepareObjectUrls(files) {
    revokeObjectUrls();

    // ファイル名とオブジェクトURLのマップを作成
    const fileMap = new Map();
    Array.from(files).forEach(file => {
        const url = URL.createObjectURL(file);
        objectUrls.push(url);
        fileMap.set(file.name, url);
        fileMap.set(file.webkitRelativePath || file.name, url);
    });
    return fileMap;
}

// LoadingManagerを作成
function createLoadingManager(fileMap) {
    // LoadingManagerの作成
    const manager = new THREE.LoadingManager();

    // URLの修正を行うためのsetURLModifierを設定
    manager.setURLModifier(url => {
        const fileName = url.split('/').pop();
        return fileMap.get(url) || fileMap.get(fileName) || url;
    });

    return manager;
}

// モデルのセットアップ
function setupModel(object, animations = []) {
    // 現在のモデルを設定
    currentModel = object;

    // モデルのメッシュに対してシャドウを有効化
    currentModel.traverse(node => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });

    // アニメーションがある場合はAnimationMixerを作成して再生
    if (animations.length > 0) {
        // TODO: AnimationMixerの作成とアニメーションの再生
        mixer = new THREE.AnimationMixer(currentModel);
        mixer.clipAction(animations[0]).play();
    }

    // モデルをシーンに追加
    scene.add(currentModel);
    // カメラをモデルにフィット
    fitCamera(currentModel);
    setStatus('読み込み完了');
}

// 指定されたファイルの中から主要なモデルファイルを取得
function getPrimaryModelFile(files) {
    return Array.from(files).find(file => /\.(glb|gltf|fbx)$/i.test(file.name));
}

// 読み込み進捗の更新
function updateProgress(fileName, xhr) {
    if (!xhr.total) return;
    setStatus(`${fileName} ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`);
}

// モデルが選択されたときの処理
fileInput.addEventListener('change', event => {
    // 選択されたファイルを取得
    const files = event.target.files;
    const file = getPrimaryModelFile(files);

    if (!file) {
        setStatus('GLB / GLTF / FBX ファイルを選択してください');
        return;
    }

    clearCurrentModel();

    // オブジェクトURLの準備とLoadingManagerの作成
    const fileMap = prepareObjectUrls(files);
    const manager = createLoadingManager(fileMap);
    const url = fileMap.get(file.name);
    const extension = file.name.split('.').pop().toLowerCase();

    setStatus(`${file.name} を読み込み中...`);

    // FBXファイルの読み込み
    if (extension === 'fbx') {
        // TODO: FBXLoaderの読み込み
        const loader = new FBXLoader(manager);
        loader.load(
            url,
            object => setupModel(object, object.animations || []),
            xhr => updateProgress(file.name, xhr),
            error => {
                console.error('FBX読込エラー:', error);
                setStatus('FBXの読み込みに失敗しました');
            }
        );
        return;
    }

    // GLB/GLTFファイルの読み込み
    if (extension === 'glb' || extension === 'gltf') {
        // TODO: GLTFLoaderの読み込み
        const loader = new GLTFLoader(manager);
        loader.load(
            url,
            gltf => setupModel(gltf.scene, gltf.animations || []),
            xhr => updateProgress(file.name, xhr),
            error => {
                console.error('GLB/GLTF読込エラー:', error);
                setStatus('GLB / GLTFの読み込みに失敗しました');
            }
        );
        return;
    }

    setStatus('対応していないファイル形式です');
});

// ウィンドウのリサイズ時にカメラとレンダラーを更新
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// アニメーションループ
function animate() {
    // アニメーションフレームのリクエスト
    requestAnimationFrame(animate);

    // アニメーションの更新
    const delta = clock.getDelta();
    //  AnimationMixerの更新
    if (mixer) mixer.update(delta);

    // コントロールの更新とレンダリング
    controls.update();
    // レンダリング
    renderer.render(scene, camera);
}

animate();
