const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('ui');
const gameOverMenu = document.getElementById('game-over-menu');
const finalScoreEl = document.getElementById('final-score');
const btnRestartFresh = document.getElementById('btn-restart-fresh');
const btnRestartCurrent = document.getElementById('btn-restart-current');

// Set canvas size (mobile friendly)
const width = Math.min(window.innerWidth, 400);
const height = Math.min(window.innerHeight, 600);
canvas.width = width;
canvas.height = height;

// Game Constants
const GRAVITY = 0.15; // Dikurangi dari 0.25
const JUMP = -4;      // Disesuaikan dari -5
const PIPE_WIDTH = 60;
const PIPE_GAP = 180; // Diperlebar dari 150 agar lebih mudah lewat
const INITIAL_PIPE_SPEED = 1.5; 
const INITIAL_PIPE_SPAWN_RATE = 120;

// Game State
let bird = { x: 50, y: height / 2, v: 0, r: 15 };
let pipes = [];
let score = 0;
let gameActive = false;
let frameCount = 0;
let pipeSpeed = INITIAL_PIPE_SPEED;
let pipeSpawnRate = INITIAL_PIPE_SPAWN_RATE;

// Audio Context for Procedural Sound Effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, type, duration, volume) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + duration);

    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

function playJumpSound() {
    playSound(400, 'triangle', 0.1, 0.1);
}

function playScoreSound() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1100, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
}

function playHitSound() {
    playSound(150, 'sawtooth', 0.3, 0.1);
}

let lastPipeTop = height / 2; // Simpan posisi pipa sebelumnya

function spawnPipe() {
    const minHeight = 50;
    const maxHeight = height - PIPE_GAP - minHeight;
    
    // Tentukan batas atas dan bawah berdasarkan pipa sebelumnya agar tidak terlalu jauh melompatnya
    const maxChange = 150; // Batas maksimal perubahan posisi lubang (px)
    let low = Math.max(minHeight, lastPipeTop - maxChange);
    let high = Math.min(maxHeight, lastPipeTop + maxChange);
    
    const topHeight = Math.floor(Math.random() * (high - low + 1)) + low;
    
    pipes.push({ x: width, top: topHeight, passed: false });
    lastPipeTop = topHeight; // Update posisi untuk pipa berikutnya
}

function resetGame(keepSpeed = false) {
    bird = { x: 50, y: height / 2, v: 0, r: 15 };
    pipes = [];
    score = 0;
    scoreEl.textContent = '0';
    gameActive = true;
    frameCount = 1; 
    
    if (!keepSpeed) {
        pipeSpeed = INITIAL_PIPE_SPEED;
        pipeSpawnRate = INITIAL_PIPE_SPAWN_RATE;
    }
    
    gameOverMenu.style.display = 'none';
}

function update() {
    if (!gameActive) return;

    // Bird physics
    bird.v += GRAVITY;
    bird.y += bird.v;

    // Boundary check
    if (bird.y + bird.r > height || bird.y - bird.r < 0) {
        gameOver();
    }

    // Pipes logic
    if (frameCount % Math.floor(pipeSpawnRate) === 0) spawnPipe();

    pipes.forEach((pipe, index) => {
        pipe.x -= pipeSpeed;

        // Collision detection
        if (
            bird.x + bird.r > pipe.x &&
            bird.x - bird.r < pipe.x + PIPE_WIDTH &&
            (bird.y - bird.r < pipe.top || bird.y + bird.r > pipe.top + PIPE_GAP)
        ) {
            gameOver();
        }

        // Score check
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
            score++;
            pipe.passed = true;
            scoreEl.textContent = score;
            playScoreSound();

            // Tingkatkan kesulitan setiap 10 poin
            if (score % 10 === 0) {
                pipeSpeed += 0.25;
                // Kurangi spawn rate agar jarak antar pipa tetap stabil meskipun lebih cepat
                pipeSpawnRate = Math.max(60, pipeSpawnRate - 10); 
                
                // RESET frameCount agar perhitungan modulo % pipeSpawnRate 
                // konsisten dengan nilai pipeSpawnRate yang baru
                frameCount = 1; 
                
                logMessage(`Speed Up! New Speed: ${pipeSpeed}`);
            }
        }

        // Remove off-screen pipes
        if (pipe.x + PIPE_WIDTH < 0) pipes.splice(index, 1);
    });

    frameCount++;
}

function draw() {
    // Clear background
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, width, height);

    // Draw Pipes
    pipes.forEach(pipe => {
        ctx.fillStyle = '#2ecc71';
        // Top pipe
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, height - (pipe.top + PIPE_GAP));
        ctx.strokeRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, height - (pipe.top + PIPE_GAP));
    });

    // Draw Bird
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (!gameActive && frameCount === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0,0,width,height);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Tap to Start!', width/2, height/2);
    }
}

function gameOver() {
    if (gameActive) playHitSound();
    gameActive = false;
    
    // Tampilkan menu game over
    finalScoreEl.textContent = `Score: ${score} (Current Speed: ${pipeSpeed.toFixed(2)})`;
    gameOverMenu.style.display = 'block';
    
    setTimeout(() => {
        frameCount = 0;
        draw();
    }, 100);
}

function handleInput() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (!gameActive) {
        resetGame();
    } else {
        bird.v = JUMP;
        playJumpSound();
    }
}

// Controls
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
        handleInput();
    }
});

canvas.addEventListener('mousedown', () => {
    handleInput();
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput();
});

// Restart Buttons Logic
btnRestartFresh.onclick = (e) => {
    e.stopPropagation();
    resetGame(false);
};

btnRestartCurrent.onclick = (e) => {
    e.stopPropagation();
    resetGame(true);
};

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

function logMessage(msg) {
    console.log(msg);
}

loop();
