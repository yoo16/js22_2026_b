// シーンを作る
const scene = new THREE.Scene();
// アスペクト比はウィンドウサイズ
const aspect = window.innerWidth / window.innerHeight;
// カメラを作る
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
// カメラ位置を設定
camera.position.z = 5;

// レンダラーを作る
const renderer = new THREE.WebGLRenderer();
// レンダラーのサイズをウィンドウサイズに設定
renderer.setSize(window.innerWidth, window.innerHeight);
// 背景を白に設定（カラー：白、アルファ：1）
document.body.appendChild(renderer.domElement);

// 立方体のジオメトリを作る
const geometry = new THREE.BoxGeometry(1, 1, 1);
// マテリアルを作る
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// メッシュを作る
const cube = new THREE.Mesh(geometry, material);
// シーンに立方体を追加する
scene.add(cube);

// ライトを作る
const light = new THREE.PointLight(0xffffff, 1.5);
// 
light.position.set(0, 10, 10);
// シーンにライトを追加する
scene.add(light);

// アニメーション関数
function animate() {
    // 次のフレームを要求
    requestAnimationFrame(animate);

    // 立方体を回転させる
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // レンダリング
    renderer.render(scene, camera);
}

// アニメーション開始
animate();