// シーン作成
const scene = new THREE.Scene();

// アスペクト比はウィンドウサイズ
const aspect = window.innerWidth / window.innerHeight;
// TODO: 視野角: 75
const fov = 0;
// TODO: 近接面遠方面: 0.1
const near = 0;
// TODO: 遠方面: 1000
const far = 0;
// カメラ作成 
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// TODO: カメラ位置を設定（z軸：奥行き）
camera.position.z = 0;

// レンダラー作成
const renderer = new THREE.WebGLRenderer({ antialias: true });
// レンダラーのサイズをウィンドウサイズに設定
renderer.setSize(window.innerWidth, window.innerHeight);
// 背景を白に設定
renderer.setClearColor(0xffffff, 1);
// レンダラーのDOM要素をbodyに追加
document.body.appendChild(renderer.domElement);

/**
 * 球体を生成してシーンに追加
 * @return {THREE.Mesh} 球体のメッシュ
 */
function addSphere(params = {}) {
    // デフォルト値を設定
    const { radius = 1, width = 16, height = 16, color = 0xff0000 } = params;

    // ジオメトリを作成
    const geometry = new THREE.SphereGeometry(radius, width, height);
    // マテリアルを作成
    const material = new THREE.MeshStandardMaterial({ color: color });
    // メッシュを作成
    const mesh = new THREE.Mesh(geometry, material);
    // メッシュの位置を設定
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = 0;
    // TODO: メッシュをシーンに追加
    // scene.add(mesh);
    return mesh;
}

/**
 * 簡易的なライトを追加
 */
function addLight() {
    // ディレクショナルライト
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    // TODO: ディレクショナルライトの影を有効化
    // scene.add(directionalLight);
}

/**
 * キャンバステクスチャを用いてテキストを描画し、スプライトとして返す
 * @param {string} message 描画するテキスト
 * @param {object} params オプション設定
 * @return {THREE.Sprite} テキストスプライト
 */
function addTextSprite(message, params = {}) {
    const fontface = params.fontface || "Arial";
    const fontsize = params.fontsize || 24;

    // キャンバス要素作成
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = fontsize + "px " + fontface;

    // テキストの幅を測定
    const metrics = context.measureText(message);
    const textWidth = metrics.width;

    canvas.width = textWidth;
    canvas.height = fontsize * 1.4;

    // テキスト描画
    context.fillStyle = "rgba(0, 0, 0, 1.0)";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = fontsize + "px " + fontface;
    context.fillText(message, canvas.width / 2, canvas.height / 2);

    // キャンバスをテクスチャに変換
    const texture = new THREE.CanvasTexture(canvas);
    // スプライトマテリアルを作成
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });

    // スプライト作成
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(canvas.width / 100, canvas.height / 100, 1.0);
    sprite.position.set(0, 2, 0);

    // プライトをシーンに追加
    scene.add(sprite);
    return sprite;
}

// アニメーションループ
function animate() {
    // animate() を requestAnimationFrame() で再起的に呼び出す
    requestAnimationFrame(animate);

    // TODO: 立方体と球体の回転
    // sphere.rotation.x += 0.01;
    // sphere.rotation.y += 0.01;

    // 時間を取得
    const time = Date.now() * 0.002;
    // TODO: Y軸を中心に上下に揺れる（sin波で振動）
    // textSprite.position.y = 2 + Math.sin(time) * 0.5;
    // TODO: Z軸回転
    // textSprite.rotation.z += 0.01;

    // レンダリング
    renderer.render(scene, camera);
}

// ウィンドウリサイズ時の処理
function resizeRenderer() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resizeRenderer);

// 球体をグローバル変数として作成
const sphere = addSphere();

// テキストスプライトを作成
const textSprite = addTextSprite("Hello, Three.js!");

// ライトを追加
addLight();

// アニメーション開始
animate();
