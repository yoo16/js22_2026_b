// 色設定
const backgroundColor = '#000000';
const orbitLineColor = '#ffffff';
const pointLightColor = '#ffaa33';

// シーンの初期化
const scene = new THREE.Scene();
scene.background = new THREE.Color(backgroundColor);

// カメラの初期位置と向き
const defaultCameraPosition = new THREE.Vector3(0, 150, 250);
const defaultLookAt = new THREE.Vector3(0, 0, 0);

// カメラの設定
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1500);
camera.position.copy(defaultCameraPosition);
// カメラの向きを設定
camera.lookAt(defaultLookAt);

// WebGLレンダリング
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// --- 太陽 ---
const createSun = () => {
    // 太陽本体
    const geometry = new THREE.SphereGeometry(10, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff7a00 });
    const mesh = new THREE.Mesh(geometry, material);
    // TODO: 太陽をシーンに追加

    // 光源
    const light = new THREE.PointLight(pointLightColor, 5, 420);
    light.position.copy(mesh.position);
    // TODO: 光源をシーンに追加: 他の惑星を照らす

    // 太陽のフレアを追加
    const coreGlow = createSunGlow(mesh, 0xfff0aa, 1.0, 42);
    const outerGlow = createSunGlow(mesh, 0xff7a00, 0.55, 105);

    return {
        mesh,
        light,
        coreGlow,
        outerGlow,
    };
};

// --- 太陽のフレア作成 ---
const createSunGlow = (sunMesh, color, opacity, size) => {
    // テクスチャ
    const textureLoader = new THREE.TextureLoader();
    // glow.pngを読み込む
    const glowTexture = textureLoader.load("./textures/glow.png");
    if (THREE.SRGBColorSpace) {
        glowTexture.colorSpace = THREE.SRGBColorSpace;
    }

    // スプライトマテリアルを作成
    const material = new THREE.SpriteMaterial({
        map: glowTexture,
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
    })
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(size, size, 1);
    sprite.position.copy(sunMesh.position);
    sprite.renderOrder = -1;

    // TODO: スプライトをシーンに追加
    return sprite;
};

// --- 太陽のアニメーション ---
const animateSun = (sun) => {
    const time = performance.now() * 0.001;

    sun.mesh.rotation.y += 0.005;

    const coreScale = 42 + Math.sin(time * 2.4) * 4;
    const outerScale = 105 + Math.sin(time * 1.6) * 8;
    sun.coreGlow.scale.set(coreScale, coreScale, 1);
    sun.outerGlow.scale.set(outerScale, outerScale, 1);
    sun.coreGlow.material.opacity = 0.9 + Math.sin(time * 2.4) * 0.1;
    sun.outerGlow.material.opacity = 0.45 + Math.sin(time * 1.6) * 0.08;
};


// --- 惑星 ---
const planets = [];

planetData.forEach(data => {
    // 惑星ジオメトリ（球体）作成
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    // マテリアル作成
    const material = new THREE.MeshPhongMaterial({ color: data.color });
    // メッシュの作成
    const mesh = new THREE.Mesh(geometry, material);
    // TODO: 惑星をシーンに追加

    // 軌道リング
    const segments = 128;
    const orbitPoints = [];
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(
            data.orbitRadius * Math.cos(angle),
            0,
            data.orbitRadius * Math.sin(angle)
        ));
    }
    // TODO: 軌道ラインのジオメトリとマテリアルを作成
    // const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    // const orbitLine = new THREE.LineLoop(
    //     orbitGeometry,
    //     new THREE.LineBasicMaterial({ color: orbitLineColor, transparent: true, opacity: 0.3 })
    // );
    // // シーンに追加
    // scene.add(orbitLine);

    // 惑星のデータを保存
    planets.push({
        name: data.name,
        mesh: mesh,
        orbitRadius: data.orbitRadius,
        orbitPeriod: data.orbitPeriod
    });
});

// --- DOMリスト生成とズーム処理 ---
const planetListEl = document.querySelector('#planetList ul');
let isZooming = false;
let zoomStart = new THREE.Vector3();
let zoomEnd = new THREE.Vector3();
let zoomLookAt = new THREE.Vector3();
let zoomProgress = 0;
let trackedPlanet = null;

// クリックしてズーム
planets.forEach(planet => {
    const li = document.createElement('li');
    li.textContent = planet.name;
    li.tabIndex = 0;
    li.className = 'cursor-pointer rounded-md px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white';
    li.addEventListener('click', () => {
        // ズーム
        zoomStart.copy(camera.position);
        zoomLookAt.copy(planet.mesh.position);
        zoomEnd.copy(zoomLookAt).add(new THREE.Vector3(0, 10, 20));
        zoomProgress = 0;
        isZooming = true;
        // 追跡惑星設定
        trackedPlanet = planet;
    });
    li.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            li.click();
        }
    });
    planetListEl.appendChild(li);
});

// ズームリセット
document.getElementById('resetButton').addEventListener('click', () => {
    zoomStart.copy(camera.position);
    zoomEnd.copy(defaultCameraPosition);
    zoomLookAt.copy(defaultLookAt);
    zoomProgress = 0;
    isZooming = true;
    trackedPlanet = null;
});

// アニメーション
function animate() {
    requestAnimationFrame(animate);
    const elapsed = performance.now() / 1000;

    // 太陽の回転とフレアのスケール変化
    animateSun(sun);

    // 惑星の軌道更新
    planets.forEach(planet => {
        const angle = (elapsed / planet.orbitPeriod) * Math.PI * 2;
        planet.mesh.position.x = planet.orbitRadius * Math.cos(angle);
        planet.mesh.position.z = planet.orbitRadius * Math.sin(angle);
    });

    // カメラズーム補間
    if (isZooming) {
        // ズームをなめらかにする
        zoomProgress += 0.02;
        if (zoomProgress >= 1) {
            zoomProgress = 1;
            isZooming = false;
        }
        // カメラの位置を補間
        camera.position.lerpVectors(zoomStart, zoomEnd, zoomProgress);
        // カメラの向きを補間
        camera.lookAt(zoomLookAt);
    } else if (trackedPlanet) {
        // TODO: ズーム完了後に惑星を追跡
        // const offset = new THREE.Vector3(0, 10, 20);
        // camera.position.copy(trackedPlanet.mesh.position).add(offset);
        // camera.lookAt(trackedPlanet.mesh.position);
    }
    // レンダリング
    renderer.render(scene, camera);
}

// --- リサイズ対応 ---
window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// 太陽作成
const sun = createSun();

// アニメーション開始
animate();