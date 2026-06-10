// ============================================================
// basic.js - Google Maps API の基本サンプル
// ============================================================

let map;
let marker;
let geocoder;
let infoWindow;
let spotMarkers = [];

// 東京駅の座標
const tokyo = {
  name: '東京駅',
  position: { lat: 35.681236, lng: 139.767125 },
  address: '東京都千代田区丸の内1丁目',
};
// 新宿駅の座標
const shinjuku = {
  name: '新宿駅',
  position: { lat: 35.689487, lng: 139.691706 },
  address: '東京都新宿区西新宿1丁目',
};

// デフォルトのスポット情報
const defaultPlace = tokyo;

const spotsApiUrl = 'api/spots.php';

// Google Maps API の callback=initMap から呼ばれるため、window に公開する。
window.initMap = function initMap() {
  geocoder = new google.maps.Geocoder();
  infoWindow = new google.maps.InfoWindow();

  map = new google.maps.Map(document.getElementById('map'), {
    // TODO: 中心をデフォルトスポットの座標に設定
    center: null,
    // TODO: ズームレベルを設定 (例: 14)
    zoom: 1,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });

  // TODO: マーカーを作成
  // marker = createMarker(defaultPlace);

  // サンプルスポットを PHP サーバーから取得して地図に表示
  loadSampleSpots();

  // イベントのバインド
  bindEvents();
};

function bindEvents() {
  const currentButton = document.getElementById('btn-current');
  currentButton.addEventListener('click', showCurrentLocation);
}

function showCurrentLocation() {
  if (!navigator.geolocation) {
    setMessage('このブラウザは現在地取得に対応していません。', true);
    return;
  }

  setMessage('現在地を取得しています...');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      // Geolocation API で取得した位置を地図に表示するためのオブジェクトを作成
      const place = {
        name: '現在地',
        position: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        address: 'ブラウザの Geolocation API で取得した位置です。',
      };

      // 地図を現在地に移動
      moveToPlace(place, 16);

      // メッセージを更新
      showPlaceMessage(place);
    },
    () => {
      setMessage('現在地を取得できませんでした。ブラウザの許可設定を確認してください。', true);
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    },
  );
}

// マーカーを移動して情報ウィンドウを開く
function moveToPlace(place, zoom) {
  marker.setMap(null);
  marker = createMarker(place);
  map.setCenter(place.position);
  map.setZoom(zoom);
  openInfoWindow(place, marker);
}

// マーカーを作成
function createMarker(place) {
  const nextMarker = new google.maps.Marker({
    position: place.position,
    map,
    title: place.name,
  });

  // マーカーをクリックしたときに情報ウィンドウを開く
  nextMarker.addListener('click', () => {
    openInfoWindow(place, nextMarker);
  });

  return nextMarker;
}

// サンプルスポットを PHP サーバーから取得して地図に表示
async function loadSampleSpots() {
  try {
    const response = await fetch(spotsApiUrl);
    const spots = await response.json();

    if (!Array.isArray(spots)) {
      throw new Error('Invalid spots data');
    }

    addSampleSpotMarkers(spots);
    renderSpotList(spots);
  } catch (error) {
    console.error(error);
    setMessage('サンプルスポットの取得に失敗しました。PHP サーバー経由で開いているか確認してください。', true);
  }
}

function addSampleSpotMarkers(spots) {
  spotMarkers = [];
  spots.forEach((spot) => {
    if (!isValidSpot(spot)) {
      spotMarkers.push(null);
      return;
    }

    const spotMarker = new google.maps.Marker({
      position: spot.position,
      map,
      title: spot.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#2563eb',
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 8,
      },
    });

    spotMarker.addListener('click', () => {
      openInfoWindow(spot, spotMarker);
    });

    spotMarkers.push(spotMarker);
  });
}

function renderSpotList(spots) {
  const container = document.getElementById('spot-list');
  if (!container) return;

  container.innerHTML = spots.map((spot, i) => `
    <button type="button" data-index="${i}"
      class="spot-card flex w-full items-start gap-3 rounded-lg bg-white p-4 shadow text-left transition hover:bg-blue-50 hover:shadow-md active:scale-[0.98]">
      <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">${i + 1}</span>
      <div class="min-w-0 flex-1">
        <p class="font-bold text-slate-800">${escapeHtml(spot.name)}</p>
        <p class="mt-0.5 truncate text-xs text-slate-500">${escapeHtml(spot.address)}</p>
      </div>
      <span class="mt-1 shrink-0 text-sm text-blue-400">→</span>
    </button>
  `).join('');

  container.querySelectorAll('.spot-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.index);
      focusSpot(spots[i], i);
    });
  });
}

function focusSpot(spot, index) {
  map.panTo(spot.position);
  map.setZoom(16);
  const target = spotMarkers[index];
  if (target) openInfoWindow(spot, target);
}

function isValidSpot(spot) {
  return (
    spot
    && typeof spot.name === 'string'
    && typeof spot.address === 'string'
    && typeof spot.position?.lat === 'number'
    && typeof spot.position?.lng === 'number'
  );
}

function openInfoWindow(place, targetMarker) {
  showPlaceMessage(place);

  infoWindow.setContent(`
    <div style="min-width: 180px">
      <p style="margin: 0 0 4px; font-weight: 700;">${place.name}</p>
      <p style="margin: 0; color: #475569;">${place.address}</p>
    </div>
  `);
  infoWindow.open(map, targetMarker);
}

function showPlaceMessage(place) {
  const message = `現在地: 緯度 ${place.position.lat.toFixed(5)}, 経度 ${place.position.lng.toFixed(5)}`;
  setMessage(message);
}

function setMessage(text, isError = false) {
  const message = document.getElementById('message');
  if (!message) return;
  message.textContent = text;
  message.className = `mt-3 min-h-5 text-sm ${isError ? 'text-red-600' : 'text-slate-600'}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
