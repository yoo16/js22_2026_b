// ============================================================
// 売上・ソフトウェア分析（sales.js）
// ============================================================

let salesChart;
let softwaresChart;
let salesData     = {};
let softwaresData = {};

// チャートのオプション設定（そのまま使ってOK）
// 売上オプション
const salesOptions = {
    responsive: true,
    plugins: {
        legend: { display: false },
        tooltip: { padding: 10, callbacks: { label: (ctx) => `  ${ctx.parsed.y} 百万円` } },
    },
    scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 } } },
    },
};
// ソフトウェアオプション
const softwaresOptions = {
    responsive: true,
    plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16, boxWidth: 14 } },
        tooltip: { padding: 10 },
    },
};

// ボタンの選択状態を切り替える（そのまま使ってOK）
function setActive(activeBtn, ...rest) {
    rest.forEach(btn => {
        btn.classList.remove('bg-white', 'shadow-sm', 'text-slate-700');
        btn.classList.add('text-slate-400');
    });
    activeBtn.classList.add('bg-white', 'shadow-sm', 'text-slate-700');
    activeBtn.classList.remove('text-slate-400');
}

// 売上チャートの生成（チャート設定はそのまま）
function createSalesChart(type) {
    if (salesChart) salesChart.destroy();
    // コンテキストの取得
    const ctx = document.getElementById('sales-chart').getContext('2d');
    const ds  = salesData.datasets[0];
    ds.backgroundColor = type === 'bar' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(59, 130, 246, 0.1)';
    ds.borderColor     = 'rgba(59, 130, 246, 1)';
    ds.borderWidth     = type === 'bar' ? 0 : 2.5;
    ds.borderRadius    = type === 'bar' ? 6 : 0;
    ds.borderSkipped   = false;
    ds.tension         = 0.4;
    ds.fill            = type === 'line';
    ds.pointRadius     = type === 'line' ? 4 : 0;
    // TODO: チャート作成
    // salesChart = new Chart(ctx, { type, data: salesData, options: salesOptions });
}

// ソフトウェアチャートの生成（チャート設定はそのまま）
function createSoftwaresChart(type) {
    if (softwaresChart) softwaresChart.destroy();
    // コンテキストの取得
    const ctx = document.getElementById('softwares-chart').getContext('2d');
    // TODO: チャート作成
    // softwaresChart = new Chart(ctx, { type, data: softwaresData, options: softwaresOptions });
}

// 統計の表示（そのまま使ってOK）
function renderStats(data) {
    const values = data.datasets[0].data;
    const labels = data.labels;
    const total  = values.reduce((s, v) => s + v, 0).toFixed(1);
    const maxIdx = values.indexOf(Math.max(...values));
    const minIdx = values.indexOf(Math.min(...values));
    document.getElementById('stat-total').textContent       = total;
    document.getElementById('stat-best-month').textContent  = labels[maxIdx];
    document.getElementById('stat-best-val').textContent    = `${values[maxIdx]} 百万円`;
    document.getElementById('stat-worst-month').textContent = labels[minIdx];
    document.getElementById('stat-worst-val').textContent   = `${values[minIdx]} 百万円`;
}

// ─── ボタンのイベントリスナー ───
const salesBarBtn  = document.getElementById('sales-bar-btn');
const salesLineBtn = document.getElementById('sales-line-btn');
const pieBtn       = document.getElementById('softwares-pie-btn');
const doughnutBtn  = document.getElementById('softwares-doughnut-btn');

salesBarBtn.addEventListener('click', () => {
    // 棒グラフに切り替え
    createSalesChart('bar');
    setActive(salesBarBtn, salesLineBtn);
});

salesLineBtn.addEventListener('click', () => {
    // 折れ線グラフに切り替え
    createSalesChart('line');
    setActive(salesLineBtn, salesBarBtn);
});

pieBtn.addEventListener('click', () => {
    // 円グラフに切り替え
    createSoftwaresChart('pie');
    setActive(pieBtn, doughnutBtn);
});

doughnutBtn.addEventListener('click', () => {
    // ドーナツグラフに切り替え
    createSoftwaresChart('doughnut');
    setActive(doughnutBtn, pieBtn);
});

// ─── 初期化 ───
(async function init() {
    try {
        // TODO: Promise.all を使って, 非同期で同時に取得
        // [salesData, softwaresData] = await Promise.all([
        //     fetch('api/sales.json').then(r => r.json()),
        //     fetch('api/softwares.json').then(r => r.json()),
        // ]);
    } catch {
        document.getElementById('message-container').textContent = 'データの取得に失敗しました';
        return;
    }

    // renderStats を呼び出して統計を表示しよう（引数は salesData）
    renderStats(salesData);

    // createSalesChart で最初に棒グラフを表示
    createSalesChart('bar');

    // createSoftwaresChart で最初に円グラフを表示
    createSoftwaresChart('pie');
})();
