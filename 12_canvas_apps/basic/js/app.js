// Canvas 要素を取得し、2D コンテキストを取得
const canvas = document.getElementById('myCanvas');
// TODO: 2D コンテキストを取得
// const ctx = canvas.getContext('2d');

// Canvas の幅と高さを取得
const width = canvas.width;
const height = canvas.height;

// UI ボタンの要素を取得
const cardButton = document.getElementById('cardButton');
const squareButton = document.getElementById('squareButton');
const triangleButton = document.getElementById('triangleButton');
const circleButton = document.getElementById('circleButton');
const blobButton = document.getElementById('blobButton');
const curvesButton = document.getElementById('curvesButton');
const textButton = document.getElementById('textButton');
const clearButton = document.getElementById('clearButton');

/**
 * clearCanvas
 */
function clearCanvas() {
    ctx.clearRect(0, 0, width, height);
}

// カード描画（角丸長方形）
function drawCard() {
    const radius = 34;
    const rectWidth = 564;
    const rectHeight = 552;
    const x = 78;
    const y = 84;

    // 描画状態を保存
    ctx.save();

    // パス開始
    ctx.beginPath();
    // 線のスタイルを設定
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.22)';
    ctx.lineWidth = 2;

    // TODO: 角丸長方形のパスを定義
    // ctx.quadraticCurveTo(x + rectWidth, y, x + rectWidth, y + radius);
    // ctx.lineTo(x + rectWidth, y + rectHeight - radius);
    // ctx.quadraticCurveTo(x + rectWidth, y + rectHeight, x + rectWidth - radius, y + rectHeight);
    // ctx.lineTo(x + radius, y + rectHeight);
    // ctx.quadraticCurveTo(x, y + rectHeight, x, y + rectHeight - radius);
    // ctx.lineTo(x, y + radius);
    // ctx.quadraticCurveTo(x, y, x + radius, y);

    // パスを閉じる
    ctx.closePath();
    // 描画
    ctx.stroke();
}

// 四角形描画
function drawSquare() {
    // 描画状態を保存
    ctx.save();

    // グラデーションの定義
    const squareGradient = ctx.createLinearGradient(200, 500, 300, 600); // 矩形の範囲に合わせて調整
    squareGradient.addColorStop(0, '#38bdf8');
    squareGradient.addColorStop(1, '#6366f1');

    // TODO: 四角形の描画
    ctx.beginPath();
    // ctx.rect(150, 300, 200, 200);
    // // 塗りつぶしのスタイル適用
    // ctx.fillStyle = squareGradient;
    // ctx.fill();
    ctx.closePath();

    // 描画状態を復元
    ctx.restore();
}


// 三角形描画
function drawTriangle() {
    // 描画状態を保存
    ctx.save();
    // 塗りつぶしと線のスタイルを設定
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';

    // TODO: 三角形の描画
    ctx.beginPath();
    // ctx.moveTo(424, 226);
    // ctx.lineTo(536, 420);
    // ctx.lineTo(312, 420);
    ctx.closePath();
    // 塗りつぶしのスタイル適用
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

// 円描画
function drawCircle() {
    // 塗りつぶしのスタイル適用
    const circleGradient = ctx.createRadialGradient(474, 286, 18, 474, 286, 78);
    circleGradient.addColorStop(0, '#ffffff');
    circleGradient.addColorStop(0.48, '#67e8f9');
    circleGradient.addColorStop(1, '#0284c7');

    // 描画状態を保存
    ctx.save();

    // グラデーションの定義
    ctx.shadowColor = 'rgba(14, 165, 233, 0.32)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;

    // TODO: 円の描画
    ctx.beginPath();
    // ctx.arc(474, 286, 72, 0, Math.PI * 2);
    // ctx.fillStyle = circleGradient;
    // ctx.fill();
    ctx.restore();
}


// Blob 描画（ベジェ曲線）
function drawBlob() {
    const blobGradient = ctx.createRadialGradient(268, 240, 40, 268, 240, 230);
    blobGradient.addColorStop(0, 'rgba(125, 211, 252, 0.84)');
    blobGradient.addColorStop(0.58, 'rgba(165, 180, 252, 0.36)');
    blobGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    // 塗りつぶしのスタイル適用
    ctx.fillStyle = blobGradient;

    // ベジェ曲線で Blob を描画
    ctx.beginPath();
    ctx.moveTo(177, 234);
    ctx.bezierCurveTo(188, 142, 307, 126, 386, 168);
    ctx.bezierCurveTo(474, 216, 463, 344, 372, 393);
    ctx.bezierCurveTo(281, 442, 158, 371, 177, 234);
    ctx.fill();
}

// 楕円描画（ellipse メソッド）
function drawOrbit() {
    ctx.save();
    ctx.translate(360, 360);
    ctx.rotate(-0.18);
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.34)';
    ctx.lineWidth = 4;

    // ellipse メソッドで楕円を描画
    ctx.beginPath();
    ctx.ellipse(0, 0, 204, 82, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(360, 360);
    ctx.rotate(0.62);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 184, 64, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

// テキスト描画
function drawText() {
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 44px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    // テキストの描画
    ctx.fillText('Hello, Canvas!', 126, 126);

    ctx.fillStyle = '#0369a1';
    ctx.font = '700 22px Arial, sans-serif';
    // テキストの描画
    ctx.fillText('shape / gradient / shadow / text', 128, 182);
}

// イベントリスナーの登録
cardButton.addEventListener('click', drawCard);
squareButton.addEventListener('click', drawSquare);
triangleButton.addEventListener('click', drawTriangle);
circleButton.addEventListener('click', drawCircle);
blobButton.addEventListener('click', drawBlob);
curvesButton.addEventListener('click', drawOrbit);
textButton.addEventListener('click', drawText);
clearButton.addEventListener('click', clearCanvas);

clearCanvas();