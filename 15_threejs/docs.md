## Three.jsとは

`Three.js` は、ブラウザ上で3Dグラフィックを表示するための `JavaScript` ライブラリです。

ブラウザには `WebGL` という3D描画の仕組みがありますが、`Three.js` を使うと `WebGL` で難しい 3Dオブジェクトの表示やアニメーションを作ることができます。

### Three.jsでできること

`Three.js` を使うと、次のような3D表現を作ることができます。

| 例 | 内容 |
| ---- | ---- |
| 回転する立方体 | 基本的な3Dオブジェクトの表示 |
| 惑星のアニメーション | 球体、光、軌道の表現 |
| 3Dゲーム画面 | キャラクターやステージの表示 |
| 商品の3Dビュー | 商品を回転して確認する画面 |
| 3Dデータ可視化 | 数値や地図を立体的に表す画面 |

> Three.js は「JavaScriptで3Dを作りやすくするための道具」と考えるとわかりやすいです。

## Three.jsをはじめる

### CDNで読み込む

バニラ `JavaScript` で学習を始める場合は、`CDN` から読み込む方法が簡単です。

```html
<script src="https://unpkg.com/three@0.152.0/build/three.min.js"></script>
```

`HTML` ファイルでこのコードを読み込むと、`THREE` という名前で `Three.js` の機能を使えるようになります。

### 基本部品

`Three.js` の3D表示は、主に次の部品でできています。

| 部品 | 役割 | 現実の撮影での例 |
| ---- | ---- | ---- |
| Scene | 3Dオブジェクトを配置する空間 | 撮影スタジオ |
| Camera | 3D空間を見る視点 | カメラ |
| Renderer | 3D空間を画面に描画する処理 | 映像をモニターに出す処理 |
| Geometry | オブジェクトの形状データ | 設計図や型 |
| Material | オブジェクトの色や質感 | 塗料や表面加工 |
| Mesh | 形状と質感を組み合わせた3D物体 | 完成した小道具 |
| Light | オブジェクトを照らす光源 | 照明 |

### 基本の流れ

`Three.js` の基本的な流れは、次の5ステップです。

| 順番 | 処理 | 内容 |
| ---- | ---- | ---- |
| 1 | Sceneを作る | 3D空間の準備 |
| 2 | Cameraを作る | 見る位置の準備 |
| 3 | Rendererを作る | 画面に描画する準備 |
| 4 | Meshを作る | 表示したい3Dオブジェクトの作成 |
| 5 | 描画する | sceneとcameraを使って画面に表示 |

## 基本プログラム

### 立方体を表示する

次のコードは、緑色の立方体を1つ表示する基本プログラムです。

```js
// シーンを作る
const scene = new THREE.Scene();

// カメラを作る
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 5;

// レンダラーを作る
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 立方体の形を作る
const geometry = new THREE.BoxGeometry(1, 1, 1);

// 立方体の見た目を作る
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// 形と見た目を組み合わせる
const cube = new THREE.Mesh(geometry, material);

// シーンに立方体を追加する
scene.add(cube);

// 描画する
renderer.render(scene, camera);
```

### コードのポイント

このコードでは、`Scene`、`Camera`、`Renderer`、`Geometry`、`Material`、`Mesh` を順番に作成しています。

| コード | 内容 |
| ---- | ---- |
| new THREE.Scene() | 3D空間の作成 |
| new THREE.PerspectiveCamera(...) | カメラの作成 |
| new THREE.WebGLRenderer() | レンダラーの作成 |
| new THREE.BoxGeometry(...) | 立方体の形の作成 |
| new THREE.MeshBasicMaterial(...) | 色や見た目の作成 |
| new THREE.Mesh(...) | 3Dオブジェクトの作成 |
| scene.add(cube) | シーンへの追加 |
| renderer.render(scene, camera) | 描画 |

## Scene、Camera、Renderer

### Scene

`Scene` は、3Dオブジェクトを置くための空間です。`Three.js` のプログラムでは、最初に用意することが多い部品です。

```js
const scene = new THREE.Scene();
```

立方体、球体、ライトなどは、`scene.add(...)` でシーンに追加します。

```js
scene.add(cube);
scene.add(light);
```

### Camera

`Camera` は、3D空間を見る視点です。

`PerspectiveCamera` は、遠くのものが小さく見えるカメラです。人間の目や普通のカメラに近い見え方になります。

```js
new THREE.PerspectiveCamera(fov, aspect, near, far);
```

| 引数 | 名前 | 内容 |
| ---- | ---- | ---- |
| fov | Field of View | 視野角 |
| aspect | Aspect Ratio | 画面の横幅と縦幅の比率 |
| near | Near Plane | 描画を開始する一番近い距離 |
| far | Far Plane | 描画を終了する一番遠い距離 |

```js
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 5;
```

### Renderer

`Renderer` は、3D空間をブラウザの画面に描画する役割です。

`renderer.domElement` は、`Three.js` が作成した `<canvas>` 要素です。これを `HTML` の `body` に追加することで、画面に3Dが表示されます。

```js
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.render(scene, camera);
```

## Geometry、Material、Mesh

### Geometry

`Geometry` は、オブジェクトの形状データです。

たとえば、`BoxGeometry` は立方体の形を作るために使います。

```js
const geometry = new THREE.BoxGeometry(1, 1, 1);
```

### Material

`Material` は、オブジェクトの見た目です。色、光の反射、透明度などを決めます。

```js
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
```

### Mesh

`Mesh` は、`Geometry` と `Material` を組み合わせた3Dオブジェクトです。

```js
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
```

> Geometryだけ、またはMaterialだけでは画面に物体として表示されません。Meshとして組み合わせる必要があります。

## アニメーション

### requestAnimationFrame

3Dオブジェクトを動かすには、毎フレーム少しずつ値を変えます。

`JavaScript` では、アニメーションに `requestAnimationFrame` を使います。

```js
function animate() {
    requestAnimationFrame(animate);

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

animate();
```

このコードでは、立方体の `rotation` を少しずつ変えています。

**毎フレーム、位置や回転を更新してから描画することがアニメーションの基本です。**

## ライトとマテリアル

### 光の影響を受けるマテリアル

`Three.js` では、`Material` の種類によって光の影響を受けるかどうかが変わります。

| マテリアル | 特徴 |
| ---- | ---- |
| MeshBasicMaterial | 光の影響を受けない表示 |
| MeshPhongMaterial | 光の影響を受ける立体的な表示 |
| MeshStandardMaterial | より自然な質感を表現しやすい表示 |

光の影響を受けるマテリアルを使う場合は、`Light` を追加します。

```js
const light = new THREE.PointLight(0xffffff, 1.5);
light.position.set(0, 10, 10);
scene.add(light);
```

`PointLight` は、電球のように1点から周囲を照らすライトです。

## 座標の考え方

### x、y、z

`Three.js` の3D空間では、主に `x`、`y`、`z` の3つの座標を使います。

| 軸 | 意味 |
| ---- | ---- |
| x | 左右 |
| y | 上下 |
| z | 奥行き |

たとえば、次のコードはオブジェクトを右に移動します。

```js
cube.position.x = 2;
```

次のコードは、オブジェクトを上に移動します。

```js
cube.position.y = 1;
```

次のコードは、オブジェクトを奥または手前に移動します。

```js
cube.position.z = -3;
```

## 惑星サンプル

### ファイル構成

この教材では、`fin/16_threejs/planet` のサンプルを使って、球体の作成やアニメーションを確認します。

| ファイル | 役割 |
| ---- | ---- |
| planet/index.html | HTML、惑星リスト、リセットボタン、ライブラリ読み込み |
| planet/js/planetData.js | 惑星の名前、サイズ、軌道半径、公転周期、色 |
| planet/js/planet.js | シーン作成、惑星生成、アニメーション、ズーム処理 |

### 惑星データ

`planet/js/planetData.js` には、惑星ごとのデータが入っています。

```js
{
    name: 'Earth',
    orbitRadius: 40,
    size: 3.2,
    orbitPeriod: 16,
    color: 0x3366ff
}
```

| 項目 | 意味 |
| ---- | ---- |
| name | 惑星名 |
| orbitRadius | 太陽からの距離 |
| size | 惑星の大きさ |
| orbitPeriod | 1周する時間 |
| color | 惑星の色 |

データを変えるだけで、惑星の見た目や動きを変更できます。

### 惑星を作る処理

`planet/js/planet.js` では、`planetData` を使って惑星を作っています。

```js
planetData.forEach(data => {
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: data.color });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
});
```

ここでは、惑星1つにつき球体を1つ作っています。

`SphereGeometry` は球体の形、`MeshPhongMaterial` は光を受ける見た目です。

### 惑星を動かす処理

惑星は、太陽の周りを円形に動きます。

```js
const angle = (elapsed / planet.orbitPeriod) * Math.PI * 2;
planet.mesh.position.x = planet.orbitRadius * Math.cos(angle);
planet.mesh.position.z = planet.orbitRadius * Math.sin(angle);
```

`Math.cos` と `Math.sin` を使うことで、円の上を動く座標を計算しています。

## リサイズ対応

### 画面サイズが変わる場合

ブラウザのサイズが変わったときは、`Renderer` と `Camera` の比率を更新します。

```js
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
```

`camera.aspect` を変えたあとは、`camera.updateProjectionMatrix()` を呼びます。

> この処理を忘れると、画面サイズを変えたときに表示がゆがむことがあります。

## まとめ

| 項目 | 内容 |
| ---- | ---- |
| Three.js | JavaScriptで3Dグラフィックを作るためのライブラリ |
| Scene | 3Dオブジェクトを配置する空間 |
| Camera | 3D空間を見る視点 |
| Renderer | 3D空間を画面に描画する処理 |
| Geometry | オブジェクトの形状データ |
| Material | オブジェクトの見た目 |
| Mesh | GeometryとMaterialを組み合わせた3Dオブジェクト |
| Light | オブジェクトを照らす光源 |
| アニメーション | requestAnimationFrameで毎フレーム描画する処理 |
| 惑星サンプル | 球体、光、座標計算、アニメーションを確認できる教材 |
