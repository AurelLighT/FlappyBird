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

// Game Constants (Nilai per detik)
const GRAVITY = 1100; 
const JUMP = -380;     
const PIPE_WIDTH = 60;
const PIPE_GAP = 175;
const INITIAL_PIPE_SPEED = 275; 
const INITIAL_PIPE_SPAWN_INTERVAL = 1040; // ms

// Game State
let bird = { x: 50, y: height / 2, v: 0, r: 15 };
let pipes = [];
let score = 0;
let gameActive = false;
let pipeSpeed = INITIAL_PIPE_SPEED;
let pipeSpawnInterval = INITIAL_PIPE_SPAWN_INTERVAL;
let lastPipeSpawn = 0;
let lastTime = 0;

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

function playJumpSound() { playSound(400, 'triangle', 0.1, 0.1); }
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
function playHitSound() { playSound(150, 'sawtooth', 0.3, 0.1); }

let lastPipeTop = height / 2;

function spawnPipe() {
    const minHeight = 50;
    const maxHeight = height - PIPE_GAP - minHeight;
    const maxChange = 150;
    let low = Math.max(minHeight, lastPipeTop - maxChange);
    let high = Math.min(maxHeight, lastPipeTop + maxChange);
    const topHeight = Math.floor(Math.random() * (high - low + 1)) + low;
    pipes.push({ x: width, top: topHeight, passed: false });
    lastPipeTop = topHeight;
}

function resetGame(keepSpeed = false) {
    bird = { x: 50, y: height / 2, v: 0, r: 15 };
    pipes = [];
    score = 0;
    scoreEl.textContent = '0';
    gameActive = true;
    lastPipeSpawn = performance.now();
    if (!keepSpeed) {
        pipeSpeed = INITIAL_PIPE_SPEED;
        pipeSpawnInterval = INITIAL_PIPE_SPAWN_INTERVAL;
    }
    gameOverMenu.style.display = 'none';
}

function update(dt) {
    if (!gameActive) return;

    bird.v += GRAVITY * dt;
    bird.y += bird.v * dt;

    if (bird.y + bird.r > height || bird.y - bird.r < 0) {
        gameOver();
    }

    const now = performance.now();
    if (now - lastPipeSpawn > pipeSpawnInterval) {
        spawnPipe();
        lastPipeSpawn = now;
    }

    pipes.forEach((pipe, index) => {
        pipe.x -= pipeSpeed * dt;

        if (bird.x + bird.r > pipe.x &&
            bird.x - bird.r < pipe.x + PIPE_WIDTH &&
            (bird.y - bird.r < pipe.top || bird.y + bird.r > pipe.top + PIPE_GAP)) {
            gameOver();
        }

        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
            score++;
            pipe.passed = true;
            scoreEl.textContent = score;
            playScoreSound();
            if (score % 10 === 0) {
                pipeSpeed += 30;
                pipeSpawnInterval = Math.max(800, pipeSpawnInterval - 100);
            }
        }
        if (pipe.x + PIPE_WIDTH < 0) pipes.splice(index, 1);
    });
}

function draw() {
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, width, height);

    pipes.forEach(pipe => {
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
        ctx.fillRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, height - (pipe.top + PIPE_GAP));
        ctx.strokeRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, height - (pipe.top + PIPE_GAP));
    });

    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (!gameActive && pipes.length === 0) {
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
    finalScoreEl.textContent = `Score: ${score}`;
    gameOverMenu.style.display = 'block';
}

function handleInput() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!gameActive && gameOverMenu.style.display === 'none') {
        resetGame();
    } else if (gameActive) {
        bird.v = JUMP;
        playJumpSound();
    }
}

window.addEventListener('keydown', (e) => { if (e.code === 'Space' || e.key === ' ') handleInput(); });
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(); });

btnRestartFresh.onclick = (e) => { e.stopPropagation(); resetGame(false); };
btnRestartCurrent.onclick = (e) => { e.stopPropagation(); resetGame(true); };

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1; // Safety cap
    update(dt);
    draw();
    lastTime = timestamp;
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
