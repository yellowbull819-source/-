const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
const coinCount = document.querySelector("#coin-count");
const distanceCount = document.querySelector("#distance-count");
const lifeCount = document.querySelector("#life-count");
const message = document.querySelector("#message");
const restartButton = document.querySelector("#restart-button");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRAVITY = 0.65;
const keys = new Set();
let game;

const platforms = [
  { x: 0, y: 455, w: 620, h: 85 }, { x: 720, y: 455, w: 430, h: 85 },
  { x: 1240, y: 390, w: 240, h: 150 }, { x: 1560, y: 455, w: 500, h: 85 },
  { x: 2160, y: 350, w: 260, h: 190 }, { x: 2530, y: 455, w: 690, h: 85 },
  { x: 3320, y: 400, w: 300, h: 140 }, { x: 3720, y: 455, w: 650, h: 85 }
];

function createGame() {
  return {
    player: { x: 90, y: 390, w: 30, h: 48, vx: 0, vy: 0, grounded: false },
    cameraX: 0, coins: 0, lives: 3, state: "playing", invincible: 0,
    collectibles: [
      { x: 300, y: 405 }, { x: 520, y: 405 }, { x: 840, y: 405 },
      { x: 1050, y: 405 }, { x: 1320, y: 340 }, { x: 1730, y: 405 },
      { x: 2260, y: 300 }, { x: 2750, y: 405 }, { x: 3000, y: 405 },
      { x: 3450, y: 350 }, { x: 3970, y: 405 }
    ],
    enemies: [{ x: 430, y: 423, w: 32, h: 32, vx: 1 }, { x: 1660, y: 423, w: 32, h: 32, vx: 1.2 },
      { x: 2820, y: 423, w: 32, h: 32, vx: -1 }]
  };
}

function reset() {
  game = createGame();
  message.classList.remove("is-hidden");
  message.innerHTML = "<strong>SKYBOUND RUN</strong><span>← → / A D で移動　・　↑ / W / Space でジャンプ</span>";
  updateHud();
}

function updateHud() {
  coinCount.textContent = game.coins;
  distanceCount.textContent = Math.max(0, Math.floor(game.player.x / 10));
  lifeCount.textContent = game.lives;
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function respawn() {
  game.lives -= 1;
  if (game.lives <= 0) {
    game.state = "gameover";
    message.innerHTML = "<strong>GAME OVER</strong><span>「最初から」で再挑戦しよう</span>";
    message.classList.remove("is-hidden");
    return;
  }
  game.player.x = Math.max(70, game.player.x - 280);
  game.player.y = 300;
  game.player.vx = 0;
  game.player.vy = 0;
  game.invincible = 100;
}

function update() {
  if (game.state !== "playing") return;
  const player = game.player;
  const left = keys.has("ArrowLeft") || keys.has("a");
  const right = keys.has("ArrowRight") || keys.has("d");
  const jumping = keys.has("ArrowUp") || keys.has("w") || keys.has(" ");
  if (left) player.vx -= 0.6;
  if (right) player.vx += 0.6;
  if (!left && !right) player.vx *= 0.82;
  player.vx = Math.max(-5.2, Math.min(5.2, player.vx));
  if (jumping && player.grounded) { player.vy = -13; player.grounded = false; }
  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;
  player.grounded = false;

  for (const platform of platforms) {
    const wasAbove = player.y + player.h - player.vy <= platform.y;
    if (player.vy >= 0 && wasAbove && player.x + player.w > platform.x && player.x < platform.x + platform.w &&
      player.y + player.h >= platform.y) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  }
  if (player.y > HEIGHT + 80) respawn();
  if (game.invincible > 0) game.invincible -= 1;

  game.collectibles = game.collectibles.filter((coin) => {
    if (intersects(player, { x: coin.x - 10, y: coin.y - 10, w: 20, h: 20 })) {
      game.coins += 1;
      return false;
    }
    return true;
  });
  for (const enemy of game.enemies) {
    enemy.x += enemy.vx;
    const nearbyPlatform = platforms.find((platform) => enemy.x >= platform.x && enemy.x + enemy.w <= platform.x + platform.w &&
      Math.abs(enemy.y + enemy.h - platform.y) < 4);
    if (!nearbyPlatform || enemy.x <= nearbyPlatform.x || enemy.x + enemy.w >= nearbyPlatform.x + nearbyPlatform.w) enemy.vx *= -1;
    if (game.invincible === 0 && intersects(player, enemy)) {
      if (player.vy > 0 && player.y + player.h < enemy.y + 18) {
        enemy.x = -100;
        player.vy = -8;
      } else respawn();
    }
  }
  game.cameraX += (player.x - game.cameraX - WIDTH * 0.35) * 0.08;
  game.cameraX = Math.max(0, Math.min(3470, game.cameraX));
  if (player.x > 4230) {
    game.state = "won";
    message.innerHTML = "<strong>STAGE CLEAR!</strong><span>コインを " + game.coins + " 枚集めたよ</span>";
    message.classList.remove("is-hidden");
  } else if (player.x > 150) message.classList.add("is-hidden");
  updateHud();
}

function draw() {
  const camera = game.cameraX;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#77cce7"); sky.addColorStop(1, "#d5f0dc");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "rgba(255,255,255,.35)";
  for (let i = 0; i < 8; i++) { const x = ((i * 180 - camera * 0.18) % 1100) - 100; ctx.beginPath(); ctx.arc(x, 120 + (i % 3) * 45, 38, 0, Math.PI * 2); ctx.arc(x + 45, 120 + (i % 3) * 45, 52, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#79b899";
  for (const platform of platforms) {
    ctx.fillStyle = "#5e9c80"; ctx.fillRect(platform.x - camera, platform.y, platform.w, platform.h);
    ctx.fillStyle = "#a9db91"; ctx.fillRect(platform.x - camera, platform.y, platform.w, 10);
    ctx.fillStyle = "#417560"; ctx.fillRect(platform.x - camera, platform.y + 10, platform.w, 4);
  }
  for (const coin of game.collectibles) {
    ctx.fillStyle = "#ffd45c"; ctx.beginPath(); ctx.arc(coin.x - camera, coin.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff2a6"; ctx.beginPath(); ctx.arc(coin.x - camera - 3, coin.y - 3, 3, 0, Math.PI * 2); ctx.fill();
  }
  for (const enemy of game.enemies) {
    if (enemy.x < -100) continue;
    ctx.fillStyle = "#ed6b65"; ctx.beginPath(); ctx.roundRect(enemy.x - camera, enemy.y, enemy.w, enemy.h, 8); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillRect(enemy.x - camera + 7, enemy.y + 8, 6, 7); ctx.fillRect(enemy.x - camera + 20, enemy.y + 8, 6, 7);
  }
  ctx.fillStyle = "#f8d26e"; ctx.fillRect(4250 - camera, 300, 5, 155);
  ctx.fillStyle = "#ef7180"; ctx.beginPath(); ctx.moveTo(4255 - camera, 300); ctx.lineTo(4320 - camera, 320); ctx.lineTo(4255 - camera, 340); ctx.fill();
  const p = game.player;
  if (game.invincible % 8 < 4) {
    ctx.fillStyle = "#4b4c9c"; ctx.beginPath(); ctx.roundRect(p.x - camera, p.y, p.w, p.h, 8); ctx.fill();
    ctx.fillStyle = "#f9c7a3"; ctx.beginPath(); ctx.arc(p.x - camera + 15, p.y + 12, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffdb74"; ctx.fillRect(p.x - camera + 5, p.y + 25, 20, 16);
  }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  keys.add(event.key);
});
window.addEventListener("keyup", (event) => keys.delete(event.key));
restartButton.addEventListener("click", reset);
reset();
loop();
