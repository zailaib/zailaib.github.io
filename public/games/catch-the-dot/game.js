/* === Catch the Dot — Game Logic === */

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// ---- Canvas size ----
let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ---- Game state ----
const GAME_TIME = 30;
let score = 0,
  combo = 0,
  bestCombo = 0,
  misses = 0;
let timeLeft = GAME_TIME;
let running = false;
let gameStartTime = 0;
let dot = { x: W / 2, y: H / 2, r: 18, vx: 0, vy: 0, pulse: 0 };
let particles = [];
let missRipples = [];
let bgStars = [];

// ---- Background stars ----
for (let i = 0; i < 80; i++) {
  bgStars.push({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.3,
    a: Math.random(),
    speed: Math.random() * 0.3 + 0.1,
  });
}

// ---- DOM refs ----
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const messageEl = document.getElementById('message');
const subMsgEl = document.getElementById('sub-message');
const restartBtn = document.getElementById('restart-btn');
const overlay = document.getElementById('overlay');

// ---- HUD ----
function updateHUD() {
  timerEl.textContent = Math.ceil(timeLeft);
  scoreEl.textContent = score;
  comboEl.textContent = combo > 1 ? `🔥 x${combo}` : '';
}

// ---- Move the dot ----
function moveDot() {
  const margin = 60;
  const speed = 180 + combo * 15 + Math.random() * 120;
  let tx = dot.x + (Math.random() - 0.5) * 400;
  let ty = dot.y + (Math.random() - 0.5) * 400;
  tx = Math.max(margin, Math.min(W - margin, tx));
  ty = Math.max(margin, Math.min(H - margin, ty));
  const dx = tx - dot.x;
  const dy = ty - dot.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 0) {
    dot.vx = (dx / dist) * speed;
    dot.vy = (dy / dist) * speed;
  }
  dot.r = Math.max(10, 18 - combo * 0.6);
}

// ---- Particle burst on catch ----
function burst(x, y) {
  const count = 16 + combo * 3;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const spd = 120 + Math.random() * 260;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1,
      decay: 0.6 + Math.random() * 0.8,
      r: 2 + Math.random() * 3,
      color: `hsl(${35 + Math.random() * 20}, 90%, ${55 + Math.random() * 30}%)`,
    });
  }
}

// ---- Miss ripple ----
function missRipple(x, y) {
  missRipples.push({ x, y, r: 5, life: 1 });
}

// ---- Pointer handler ----
function onPointer(e) {
  e.preventDefault();
  if (!running) return;

  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  const dx = px - dot.x;
  const dy = py - dot.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const hitRadius = dot.r + 16;

  if (dist < hitRadius) {
    combo++;
    if (combo > bestCombo) bestCombo = combo;
    score += combo;
    burst(dot.x, dot.y);
    moveDot();
  } else {
    combo = 0;
    misses++;
    missRipple(px, py);
  }
  updateHUD();

  if (combo >= 5) {
    comboEl.classList.add('pop');
    setTimeout(() => comboEl.classList.remove('pop'), 100);
  }
}

canvas.addEventListener('pointerdown', onPointer);
canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

// ---- Start / restart ----
function startGame() {
  score = 0;
  combo = 0;
  bestCombo = 0;
  misses = 0;
  timeLeft = GAME_TIME;
  particles = [];
  missRipples = [];
  dot.x = W / 2;
  dot.y = H / 2;
  dot.r = 18;
  dot.vx = 0;
  dot.vy = 0;
  running = true;
  gameStartTime = performance.now();
  moveDot();
  updateHUD();
  messageEl.classList.remove('show');
  subMsgEl.classList.remove('show');
  restartBtn.classList.remove('show');
  overlay.classList.remove('active');
}

function endGame() {
  running = false;
  overlay.classList.add('active');
  if (score >= 30) {
    messageEl.textContent = '🎉 太厉害了！';
  } else if (score >= 15) {
    messageEl.textContent = '👏 不错哦！';
  } else if (score >= 5) {
    messageEl.textContent = '😺 继续加油~';
  } else {
    messageEl.textContent = '😿 再试试？';
  }
  messageEl.classList.add('show');
  subMsgEl.textContent = `抓到 ${score} 个 · 最高连击 x${bestCombo} · 失误 ${misses} 次`;
  subMsgEl.classList.add('show');
  restartBtn.classList.add('show');
}

restartBtn.addEventListener('click', startGame);

// ---- Render ----
function draw(now) {
  ctx.clearRect(0, 0, W, H);

  // Deep background
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, W, H);

  // Radial gradient
  const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  grad.addColorStop(0, '#151525');
  grad.addColorStop(1, '#0a0a0f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Background stars
  for (const s of bgStars) {
    s.a += s.speed * 0.01;
    const alpha = 0.25 + Math.sin(s.a) * 0.25;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  }

  // Miss ripples
  for (const r of missRipples) {
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,100,100,${r.life * 0.4})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Dot glow layers
  const pulse = 1 + Math.sin(now * 0.008) * 0.15;
  for (let i = 3; i >= 0; i--) {
    const gr = dot.r * (1 + i * 1.2) * pulse;
    const alpha = 0.08 - i * 0.018;
    const glow = ctx.createRadialGradient(dot.x, dot.y, dot.r * 0.5, dot.x, dot.y, gr);
    glow.addColorStop(0, `rgba(255,200,80,${0.7})`);
    glow.addColorStop(0.3, `rgba(255,160,40,${0.35})`);
    glow.addColorStop(0.7, `rgba(255,120,20,${alpha})`);
    glow.addColorStop(1, 'rgba(255,80,10,0)');
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, gr, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  // Inner bright core
  const core = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dot.r * pulse);
  core.addColorStop(0, '#fffde8');
  core.addColorStop(0.2, '#fff9c4');
  core.addColorStop(0.5, '#ffcc80');
  core.addColorStop(1, 'rgba(255,150,30,0)');
  ctx.beginPath();
  ctx.arc(dot.x, dot.y, dot.r * pulse, 0, Math.PI * 2);
  ctx.fillStyle = core;
  ctx.fill();

  // Shimmer ring
  ctx.beginPath();
  ctx.arc(dot.x, dot.y, dot.r * 1.5 * pulse, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,220,150,${0.25 + Math.sin(now * 0.015) * 0.15})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Particles
  for (const p of particles) {
    const alpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fillStyle = p.color.replace('%)', `%, ${alpha})`).replace('hsl', 'hsla');
    ctx.fill();
    // Trail
    ctx.beginPath();
    ctx.arc(p.x - p.vx * 0.03, p.y - p.vy * 0.03, p.r * p.life * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = p.color.replace('%)', `%, ${alpha * 0.4})`).replace('hsl', 'hsla');
    ctx.fill();
  }
}

// ---- Game loop ----
let lastTime = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  if (!running) {
    draw(now);
    return;
  }

  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  timeLeft -= dt;
  if (timeLeft <= 0) {
    timeLeft = 0;
    updateHUD();
    endGame();
  }

  // Move dot
  dot.x += dot.vx * dt;
  dot.y += dot.vy * dt;

  // Wall bounce
  const margin = 30;
  if (dot.x < margin) { dot.x = margin; dot.vx *= -0.6; moveDot(); }
  if (dot.x > W - margin) { dot.x = W - margin; dot.vx *= -0.6; moveDot(); }
  if (dot.y < margin) { dot.y = margin; dot.vy *= -0.6; moveDot(); }
  if (dot.y > H - margin) { dot.y = H - margin; dot.vy *= -0.6; moveDot(); }

  // Arrived at target → pick new
  const spd = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy);
  if (spd < 30 && spd > 0) {
    dot.vx = 0;
    dot.vy = 0;
    if (!dot._moveTimeout) {
      dot._moveTimeout = setTimeout(() => {
        moveDot();
        dot._moveTimeout = null;
      }, 400 + Math.random() * 600);
    }
  }

  // Update particles
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= p.decay * dt;
  }
  particles = particles.filter((p) => p.life > 0);

  // Update ripples
  for (const r of missRipples) {
    r.r += 200 * dt;
    r.life -= 1.8 * dt;
  }
  missRipples = missRipples.filter((r) => r.life > 0);

  draw(now);
}

// ---- Boot ----
updateHUD();
draw(performance.now());
requestAnimationFrame(loop);
setTimeout(startGame, 600);
