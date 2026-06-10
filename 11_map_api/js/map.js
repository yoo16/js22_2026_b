// ============================================================
// map.js - 地図表示切替・スタイル変更・描画のサンプル
// ============================================================

let map;
let geocoder;
let selectedMarker;
let infoWindow;
let activeMode = 'marker';
let linePath = [];
let polygonPath = [];
let lineOverlay;
let polygonOverlay;
let circleOverlay;
// クリックして追加したマーカーを保存する配列
const clickMarkers = [];

// 東京駅の座標
const tokyo = { lat: 35.681236, lng: 139.767125 };

// 地図スタイルの定義
const mapStyles = {
  default: null,
  // 淡い色合いのスタイル
  muted: [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#52525b' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a5f3fc' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#bbf7d0' }] },
  ],
  // 夜間モード風のスタイル
  night: [
    { elementType: 'geometry', stylers: [{ color: '#18181b' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#d4d4d8' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#18181b' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3f3f46' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#083344' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#064e3b' }] },
  ],
};

// 地図初期化関数: Google Maps API の読み込み後に呼び出される
window.initMap = function initMap() {
  // ジオコーディング API 
  // TODO: 現在の座標から住所を取得
  // geocoder = new google.maps.Geocoder();

  // 情報ウィンドウ
  infoWindow = new google.maps.InfoWindow();

  // TODO: 地図の初期化
  // center: tokyo 
  // zoom: 14
  // mapTypeId: 'roadmap'
  map = new google.maps.Map(document.getElementById('map'), {
    center: tokyo,
    zoom: 1,
    mapTypeId: 'roadmap',
    mapTypeControl: false,
    streetViewControl: true,
    fullscreenControl: true,
  });

  // TODO: 初期マーカーの設定
  // selectedMarker = new google.maps.Marker({
  //   position: tokyo,
  //   map,
  //   title: '東京駅',
  // });

  bindEvents();
  showSelectedPoint(tokyo);
  setModeMessage('マーカーモード: 地図をクリックすると地点情報を表示します。');
};

// イベントのバインド
function bindEvents() {
  map.addListener('click', (event) => {
    handleMapClick(event.latLng);
  });

  // 地図タイプ切替ボタンのイベント
  document.querySelectorAll('.map-type').forEach((button) => {
    button.addEventListener('click', () => {
      // TODO: data-type 属性を使って地図のタイプを切り替える
      // setMapType(button.dataset.type);
      setActiveButton('.map-type', button, 'bg-zinc-900');
    });
  });

  // 描画モード切替ボタンのイベント
  document.querySelectorAll('.draw-mode').forEach((button) => {
    button.addEventListener('click', () => {
      // TODO: data-mode 属性を使って描画モードを切り替える
      activeMode = button.dataset.mode;
      setActiveButton('.draw-mode', button, 'bg-cyan-700');
      updateModeMessage();
    });
  });

  // スタイル切替セレクトのイベント
  document.getElementById('style-select').addEventListener('change', (event) => {
    map.setOptions({ styles: mapStyles[event.target.value] });
  });

  document.getElementById('btn-close-polygon').addEventListener('click', closePolygon);
  document.getElementById('btn-clear').addEventListener('click', clearDrawings);
}

// 地図クリック時の処理
function handleMapClick(latLng) {
  // TODO: マーカーモード: marker
  if (activeMode === '') {
    const position = latLng.toJSON();
    selectedMarker.setPosition(position);
    map.panTo(position);
    showSelectedPoint(position);
    return;
  }

  // TODO: 線描画モード: line
  if (activeMode === '') {
    addLinePoint(latLng);
    return;
  }

  // TODO: 範囲描画モード: polygon
  if (activeMode === '') {
    addPolygonPoint(latLng);
    return;
  }

  // TODO: 円描画モード: circle
  if (activeMode === 'circle') {
    drawCircle(latLng);
  }
}

// 地図タイプの切替
function setMapType(type) {
  map.setMapTypeId(type);

  // ハイブリッド
  if (type === 'hybrid') {
    map.setZoom(Math.max(map.getZoom(), 18));
    map.setTilt(45);
    map.setHeading(45);
    return;
  }

  map.setTilt(0);
  map.setHeading(0);
}

// 線描画モードで点を追加
function addLinePoint(latLng) {
  linePath.push(latLng);
  addClickMarker(latLng, `${linePath.length}`);

  if (!lineOverlay) {
    lineOverlay = new google.maps.Polyline({
      map,
      path: linePath,
      strokeColor: '#0891b2',
      strokeOpacity: 0.9,
      strokeWeight: 4,
    });
  }

  lineOverlay.setPath(linePath);
  setModeMessage(`線を描画中: ${linePath.length} 点`);
}

// 範囲描画モードで点を追加
function addPolygonPoint(latLng) {
  polygonPath.push(latLng);
  addClickMarker(latLng, `${polygonPath.length}`);

  if (!polygonOverlay) {
    polygonOverlay = new google.maps.Polygon({
      map,
      paths: polygonPath,
      strokeColor: '#16a34a',
      strokeOpacity: 0.9,
      strokeWeight: 3,
      fillColor: '#22c55e',
      fillOpacity: 0.18,
    });
  }

  polygonOverlay.setPaths(polygonPath);
  setModeMessage(`範囲を描画中: ${polygonPath.length} 点`);
}

// 範囲描画モードで範囲を閉じる
function closePolygon() {
  if (polygonPath.length < 3) {
    setModeMessage('範囲を閉じるには 3 点以上クリックしてください。', true);
    return;
  }

  polygonOverlay.setPaths(polygonPath);
  setModeMessage('範囲を閉じました。');
}

// 円描画モードで円を描く
function drawCircle(latLng) {
  if (circleOverlay) {
    circleOverlay.setMap(null);
  }

  // 半径 600m の円を描画
  circleOverlay = new google.maps.Circle({
    map,
    center: latLng,
    radius: 600,
    strokeColor: '#e11d48',
    strokeOpacity: 0.9,
    strokeWeight: 3,
    fillColor: '#fb7185',
    fillOpacity: 0.2,
  });

  setModeMessage('半径 600m の円を描画しました。');
}

// クリックした地点にマーカーを追加
function addClickMarker(latLng, label) {
  // クリックマーカーを追加: google.maps.Marker
  const marker = new google.maps.Marker({
    position: latLng,
    map,
    label,
  });
  clickMarkers.push(marker);
}

// 描画をすべて消去
function clearDrawings() {
  linePath = [];
  polygonPath = [];

  if (lineOverlay) {
    lineOverlay.setMap(null);
    lineOverlay = null;
  }

  if (polygonOverlay) {
    polygonOverlay.setMap(null);
    polygonOverlay = null;
  }

  if (circleOverlay) {
    circleOverlay.setMap(null);
    circleOverlay = null;
  }

  // クリックマーカーも消去
  clickMarkers.forEach((marker) => marker.setMap(null));
  clickMarkers.length = 0;
  setModeMessage('描画を消去しました。');
}

// 選択した地点の情報を表示
function showSelectedPoint(position) {
  setPointPanel('<p>住所を取得しています...</p>');

  // ジオコーディング API を使って住所を取得
  geocoder.geocode({ location: position }, (results, status) => {
    const html = `
    <dl class="grid grid-cols-2 gap-2">
      <div class="rounded-md bg-zinc-100 p-3"><dt class="text-xs text-zinc-500">緯度</dt><dd class="font-bold text-zinc-900">${position.lat.toFixed(6)}</dd></div>
      <div class="rounded-md bg-zinc-100 p-3"><dt class="text-xs text-zinc-500">経度</dt><dd class="font-bold text-zinc-900">${position.lng.toFixed(6)}</dd></div>
    </dl>
  `;

    setPointPanel(html);
    infoWindow.setContent(`<strong>クリック地点</strong><br>${escapedAddress}`);
    infoWindow.open(map, selectedMarker);
  });
}

// 地図タイプ切替や描画モード切替のメッセージ更新
function updateModeMessage() {
  const messages = {
    marker: 'マーカーモード: 地図をクリックすると地点情報を表示します。',
    line: '線を描くモード: 地図をクリックして点を追加します。',
    polygon: '範囲を描くモード: 3 点以上クリックして範囲を作ります。',
    circle: '円を描くモード: 地図をクリックして半径 600m の円を表示します。',
  };

  setModeMessage(messages[activeMode]);
}

function setActiveButton(selector, activeButton, activeClass) {
  document.querySelectorAll(selector).forEach((button) => {
    button.classList.remove(activeClass, 'text-white');
    button.classList.add('border', 'border-zinc-300');
  });

  activeButton.classList.add(activeClass, 'text-white');
  activeButton.classList.remove('border', 'border-zinc-300');
}

function setPointPanel(html) {
  document.getElementById('point-panel').innerHTML = html;
}

// モード切替や地図タイプ切替のメッセージ表示
function setModeMessage(text, isError = false) {
  const message = document.getElementById('mode-message');
  message.textContent = text;
  message.className = `mt-3 min-h-5 text-sm ${isError ? 'text-red-600' : 'text-zinc-600'}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
