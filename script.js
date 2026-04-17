const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElem = document.getElementById('score');
const messageElem = document.getElementById('message');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let musicStarted = false;

const player = { x: 50, y: 540, width: 28, height: 46, vx: 0, vy: 0, onGround: false };
const enemy = { x: 640, y: 80, width: 64, height: 84 };
const gravity = 0.7;
const speed = 4;
const jumpPower = -14;
let score = 0;
let canTimer = 0;
let cans = [];

const platforms = [
    { x: 0, y: 580, width: 800, height: 20 },
    { x: 100, y: 460, width: 520, height: 16 },
    { x: 180, y: 340, width: 440, height: 16 },
    { x: 100, y: 220, width: 520, height: 16 },
];

const ladders = [
    { x: 120, y: 240, width: 40, height: 220 },
    { x: 520, y: 360, width: 40, height: 220 },
];

const keys = { left: false, right: false, up: false };

function resetGame() {
    player.x = 50;
    player.y = 540;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    score = 0;
    cans = [];
    canTimer = 0;
    messageElem.textContent = 'MaTs må unngå ølboksene!';
    updateScore();
}

function updateScore() {
    scoreElem.textContent = `Score: ${Math.floor(score)}`;
}

function startMusic() {
    if (musicStarted) return;
    musicStarted = true;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.04;
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 110;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();

    const notes = [110, 132, 156, 104, 124, 148, 176, 130];
    let index = 0;
    setInterval(() => {
        osc.frequency.setValueAtTime(notes[index % notes.length], audioCtx.currentTime);
        index += 1;
    }, 250);
}

function playScream() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const gain = audioCtx.createGain();
    gain.gain.value = 0.25;
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 550;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
}


function createCan() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    startMusic();
    playScream();
    const startX = enemy.x + enemy.width / 2;
    const startY = enemy.y + enemy.height;
    const dx = (player.x - startX) / 40 + (Math.random() * 2 - 1);
    const dy = 4 + Math.random() * 2;
    cans.push({ x: startX, y: startY, radius: 10, vx: dx, vy: dy });
    messageElem.textContent = 'Christian skriker mens han kaster!';
}

function collideRect(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function onLadder() {
    return ladders.some(l => player.x + player.width > l.x && player.x < l.x + l.width && player.y + player.height > l.y && player.y < l.y + l.height);
}

function update() {
    if (keys.left) player.vx = -speed;
    else if (keys.right) player.vx = speed;
    else player.vx = 0;

    if (keys.up && player.onGround) {
        player.vy = jumpPower;
        player.onGround = false;
    }

    if (onLadder() && keys.up) {
        player.vy = -3;
    }

    player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.vy = 0;
        player.onGround = true;
    }

    player.onGround = false;
    platforms.forEach(platform => {
        if (player.vy >= 0 && player.y + player.height <= platform.y + player.vy && collideRect(player, platform)) {
            player.y = platform.y - player.height;
            player.vy = 0;
            player.onGround = true;
        }
    });

    // Sjekk om MaTs hopper på Christian og vinner
    if (player.vy > 0 && player.y + player.height >= enemy.y && player.y + player.height <= enemy.y + 16 &&
        player.x + player.width > enemy.x + 10 && player.x < enemy.x + enemy.width - 10) {
        alert('MaTs vant! Christian er slått!');
        resetGame();
        return;
    }

    canTimer += 1;
    if (canTimer > 70) {
        createCan();
        canTimer = 0;
    }

    cans.forEach(can => {
        can.x += can.vx;
        can.y += can.vy;
        if (can.y > canvas.height + 20) can.y = -20;
    });

    cans = cans.filter(can => can.y < canvas.height + 50 && can.x > -50 && can.x < canvas.width + 50);

    cans.forEach(can => {
        const distX = can.x - (player.x + player.width / 2);
        const distY = can.y - (player.y + player.height / 2);
        if (Math.sqrt(distX * distX + distY * distY) < can.radius + Math.max(player.width, player.height) / 2) {
            alert('Du ble truffet av en ølboks! Spillet starter på nytt.');
            resetGame();
        }
    });

    score += 0.02;
    updateScore();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#8b4513';
    platforms.forEach(platform => ctx.fillRect(platform.x, platform.y, platform.width, platform.height));

    ctx.fillStyle = '#000'; // Ladder color
    ladders.forEach(ladder => ctx.fillRect(ladder.x, ladder.y, ladder.width, ladder.height));

    ctx.fillStyle = '#666'; // Robot body
    ctx.fillRect(player.x, player.y + 10, 28, 26); // body
    ctx.fillRect(player.x + 8, player.y, 12, 12); // head
    ctx.fillRect(player.x - 4, player.y + 12, 6, 16); // left arm
    ctx.fillRect(player.x + 26, player.y + 12, 6, 16); // right arm
    ctx.fillRect(player.x + 4, player.y + 36, 6, 10); // left leg
    ctx.fillRect(player.x + 18, player.y + 36, 6, 10); // right leg

    // MaTs inside the robot
    ctx.fillStyle = '#00aa00';
    ctx.beginPath();
    ctx.arc(player.x + 14, player.y + 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.fillText('MaTs', player.x + 5, player.y - 2);

    ctx.fillStyle = '#c0392b'; // Robot body
    ctx.fillRect(enemy.x, enemy.y + 10, 64, 54); // body
    ctx.fillRect(enemy.x + 24, enemy.y, 16, 16); // head
    ctx.fillRect(enemy.x - 8, enemy.y + 12, 12, 32); // left arm
    ctx.fillRect(enemy.x + 60, enemy.y + 12, 12, 32); // right arm
    ctx.fillRect(enemy.x + 16, enemy.y + 64, 12, 20); // left leg
    ctx.fillRect(enemy.x + 36, enemy.y + 64, 12, 20); // right leg

    // Christian inside the robot
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(enemy.x + 32, enemy.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText('Christian', enemy.x + 10, enemy.y - 2);

    cans.forEach(can => {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(can.x, can.y, can.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#555';
        ctx.fillRect(can.x - 6, can.y - 12, 12, 6);
    });
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

window.addEventListener('keydown', event => {
    if (event.code === 'ArrowLeft') keys.left = true;
    if (event.code === 'ArrowRight') keys.right = true;
    if (event.code === 'ArrowUp') keys.up = true;
});
window.addEventListener('keyup', event => {
    if (event.code === 'ArrowLeft') keys.left = false;
    if (event.code === 'ArrowRight') keys.right = false;
    if (event.code === 'ArrowUp') keys.up = false;
});

resetGame();
loop();