const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('ui');

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
const PIPE_SPEED = 1.5; // Diperlambat dari 2
const PIPE_SPAWN_RATE = 120; // Ditambah dari 100 agar jarak antar pipa lebih jauh

// Game State
let bird = { x: 50, y: height / 2, v: 0, r: 15 };
let pipes = [];
let score = 0;
let gameActive = false;
let frameCount = 0;

function spawnPipe() {
    const minHeight = 50;
    const maxHeight = height - PIPE_GAP - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    pipes.push({ x: width, top: topHeight, passed: false });
}

function resetGame() {
    bird = { x: 50, y: height / 2, v: 0, r: 15 };
    pipes = [];
    score = 0;
    scoreEl.textContent = '0';
    gameActive = true;
    frameCount = 1; // Mulai dari 1 agar tidak langsung spawn di frame 0
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
    if (frameCount % PIPE_SPAWN_RATE === 0) spawnPipe();

    pipes.forEach((pipe, index) => {
        pipe.x -= PIPE_SPEED;

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
    gameActive = false;
    setTimeout(() => {
        frameCount = 0;
        draw();
    }, 100);
}

function handleInput() {
    if (!gameActive) {
        resetGame();
    } else {
        bird.v = JUMP;
    }
}

// Controls
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') handleInput();
});
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput();
});

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
