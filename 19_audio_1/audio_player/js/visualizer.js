class AudioVisualizer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.getAnalyser = options.getAnalyser;
        this.isPlaying = options.isPlaying;
        this.animationId = null;
        this.frequencyData = null;
        this.timeData = null;
        this.particles = [];
        this.width = 0;
        this.height = 0;
        this.pixelRatio = 1;
        this.lastEnergy = 0;
        this.phase = 0;

        this.resize = this.resize.bind(this);
        this.draw = this.draw.bind(this);

        this.resizeObserver = new ResizeObserver(this.resize);
        this.resizeObserver.observe(canvas);
        this.resize();
        this.drawIdleFrame();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.width = Math.max(1, Math.floor(rect.width));
        this.height = Math.max(1, Math.floor(rect.height));
        this.canvas.width = Math.floor(this.width * this.pixelRatio);
        this.canvas.height = Math.floor(this.height * this.pixelRatio);
        this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    }

    start() {
        if (!this.animationId) {
            // アニメーションループを開始
            this.animationId = requestAnimationFrame(this.draw);
        }
    }

    stop() {
        if (this.animationId) {
            // アニメーションループを停止
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.drawIdleFrame();
    }

    getAnalyserData() {
        const analyser = this.getAnalyser?.();
        if (!analyser || !this.isPlaying?.()) return null;

        if (!this.frequencyData || this.frequencyData.length !== analyser.frequencyBinCount) {
            this.frequencyData = new Uint8Array(analyser.frequencyBinCount);
            this.timeData = new Uint8Array(analyser.fftSize);
        }

        analyser.getByteFrequencyData(this.frequencyData);
        analyser.getByteTimeDomainData(this.timeData);

        return {
            frequency: this.frequencyData,
            time: this.timeData,
        };
    }

    drawBackground(alpha) {
        const gradient = this.context.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, `rgba(8, 15, 30, ${alpha})`);
        gradient.addColorStop(0.45, `rgba(14, 26, 47, ${alpha})`);
        gradient.addColorStop(1, `rgba(5, 10, 25, ${alpha})`);
        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, this.width, this.height);
    }

    // グリッドを描画
    drawGrid() {
        this.context.save();
        this.context.globalAlpha = 0.18;
        this.context.strokeStyle = '#1f3a50';
        this.context.lineWidth = 1;

        // 縦線を描画
        for (let x = 0; x <= this.width; x += 48) {
            this.context.beginPath();
            this.context.moveTo(x, 0);
            this.context.lineTo(x, this.height);
            this.context.stroke();
        }

        // 横線を描画
        for (let y = 24; y <= this.height; y += 32) {
            this.context.beginPath();
            this.context.moveTo(0, y);
            this.context.lineTo(this.width, y);
            this.context.stroke();
        }

        this.context.restore();
    }

    drawBars(frequency) {
        const barCount = Math.min(72, frequency.length);
        const gap = 3;
        const barWidth = Math.max(3, (this.width - gap * (barCount - 1)) / barCount);
        const binSize = Math.floor(frequency.length / barCount);
        const baseline = this.height - 12;
        const gradient = this.context.createLinearGradient(0, 18, 0, baseline);
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(0.22, '#67e8f9');
        gradient.addColorStop(0.58, '#22d3ee');
        gradient.addColorStop(1, '#0f766e');

        this.context.save();
        this.context.shadowColor = 'rgba(34, 211, 238, 0.55)';
        this.context.shadowBlur = 14;

        for (let index = 0; index < barCount; index += 1) {
            const start = index * binSize;
            const end = index === barCount - 1 ? frequency.length : start + binSize;
            let total = 0;

            for (let i = start; i < end; i += 1) {
                total += frequency[i];
            }

            const average = total / Math.max(1, end - start);
            const normalized = average / 255;
            const height = 5 + normalized * (this.height * 0.68);
            const x = index * (barWidth + gap);
            const y = baseline - height;

            this.context.fillStyle = gradient;
            this.roundRect(x, y, barWidth, height, Math.min(barWidth / 2, 5));
            this.context.fill();
        }

        this.context.restore();
    }

    drawWaveform(time, energy) {
        const centerY = this.height * 0.5;
        const amplitude = 28 + energy * 34;

        this.context.save();
        this.context.lineWidth = 2.5;
        this.context.strokeStyle = '#a7f3d0';
        this.context.shadowColor = 'rgba(167, 243, 208, 0.55)';
        this.context.shadowBlur = 18;
        this.context.beginPath();

        for (let i = 0; i < time.length; i += 1) {
            const x = (i / (time.length - 1)) * this.width;
            const value = (time[i] - 128) / 128;
            const y = centerY + value * amplitude;

            if (i === 0) {
                this.context.moveTo(x, y);
            } else {
                this.context.lineTo(x, y);
            }
        }

        this.context.stroke();
        this.context.restore();
    }

    updateParticles(frequency) {
        const bassBins = frequency.slice(0, 12);
        const bass = bassBins.reduce((sum, value) => sum + value, 0) / Math.max(1, bassBins.length) / 255;
        const spawnCount = bass > 0.22 ? Math.ceil(bass * 4) : 0;

        for (let i = 0; i < spawnCount; i += 1) {
            this.particles.push({
                x: Math.random() * this.width,
                y: this.height - 18 - Math.random() * 20,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -0.6 - Math.random() * 1.8 - bass * 1.4,
                radius: 1.2 + Math.random() * 2.8 + bass * 2,
                alpha: 0.45 + bass * 0.45,
                hue: 178 + Math.random() * 55,
            });
        }

        this.particles = this.particles
            .map((particle) => ({
                ...particle,
                x: particle.x + particle.vx,
                y: particle.y + particle.vy,
                vy: particle.vy - 0.01,
                radius: particle.radius * 0.985,
                alpha: particle.alpha - 0.01,
            }))
            .filter((particle) => particle.alpha > 0.02 && particle.radius > 0.4 && particle.y > -12);
    }

    drawParticles() {
        this.context.save();
        this.context.globalCompositeOperation = 'lighter';

        this.particles.forEach((particle) => {
            const gradient = this.context.createRadialGradient(
                particle.x,
                particle.y,
                0,
                particle.x,
                particle.y,
                particle.radius * 4,
            );
            gradient.addColorStop(0, `hsla(${particle.hue}, 95%, 75%, ${particle.alpha})`);
            gradient.addColorStop(1, `hsla(${particle.hue}, 95%, 50%, 0)`);
            this.context.fillStyle = gradient;
            this.context.beginPath();
            this.context.arc(particle.x, particle.y, particle.radius * 4, 0, Math.PI * 2);
            this.context.fill();
        });

        this.context.restore();
    }

    // アイドル状態のフレームを描画する関数
    drawIdleFrame() {
        this.phase += 0.04;
        this.drawBackground(1);
        this.drawGrid();

        // フェイクの周波数データと時間領域データを生成
        const fakeFrequency = Array.from({ length: 72 }, () => { return 0; });
        // フェイクの時間領域データを生成
        const fakeTime = Array.from({ length: 180 }, () => { return 0; });
        // 描画
        this.drawBars(fakeFrequency);
        this.drawWaveform(fakeTime, 0.16);
    }

    // アニメーションループ
    draw() {
        const data = this.getAnalyserData();

        if (!data) {
            this.stop();
            return;
        }

        const energy = data.frequency.reduce((sum, value) => sum + value, 0) / data.frequency.length / 255;
        this.lastEnergy = this.lastEnergy * 0.78 + energy * 0.22;

        // 背景
        this.drawBackground(0.22);
        // グリッド
        this.drawGrid();
        // パーティクル
        this.updateParticles(data.frequency);
        this.drawParticles();
        // 周波数バー
        this.drawBars(data.frequency);
        // 周波数波形
        this.drawWaveform(data.time, this.lastEnergy);

        this.animationId = requestAnimationFrame(this.draw);
    }

    // 角丸矩形を描画する関数
    roundRect(x, y, width, height, radius) {
        this.context.beginPath();
        this.context.moveTo(x + radius, y);
        this.context.lineTo(x + width - radius, y);
        this.context.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.context.lineTo(x + width, y + height - radius);
        this.context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.context.lineTo(x + radius, y + height);
        this.context.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.context.lineTo(x, y + radius);
        this.context.quadraticCurveTo(x, y, x + radius, y);
    }
}

window.AudioVisualizer = AudioVisualizer;
