/* Tractatus  The World Is All That Is The Case */

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// ---- Layout ----
let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ---- Tractatus propositions (revealed in order) ----
const propositions = [
  { num: '1',    en: 'The world is everything that is the case.', zh: '世界是一切发生的事情。' },
  { num: '1.1',  en: 'The world is the totality of facts, not of things.', zh: '世界是事实的总和，而非事物的总和。' },
  { num: '2',    en: 'What is the case  a fact  is the existence of states of affairs.', zh: '发生的事情——事实——是事态的存在。' },
  { num: '2.01', en: 'A state of affairs is a combination of objects.', zh: '事态是诸对象的结合。' },
  { num: '2.01231', en: 'If I know an object, I also know all its possible occurrences in states of affairs.', zh: '如果我知道一个对象，我也知道它在事态中的所有可能的出现。' },
  { num: '7',    en: 'Whereof one cannot speak, thereof one must be silent.', zh: '对于不可言说的，必须保持沉默。' },
];

// ---- Objects (nodes) in this world ----
// Each object has a "logical form" (innerDots: count + pattern type)
// Compatible = same innerDots count AND same patternType
const nodesRaw = [
  { id: 0, shape: 'circle',    innerDots: 2, patternType: 0, label: 'a' },
  { id: 1, shape: 'triangle',  innerDots: 2, patternType: 0, label: 'b' },
  { id: 2, shape: 'square',    innerDots: 3, patternType: 1, label: 'c' },
  { id: 3, shape: 'diamond',   innerDots: 3, patternType: 1, label: 'd' },
  { id: 4, shape: 'hexagon',   innerDots: 1, patternType: 2, label: 'e' },
  { id: 5, shape: 'pentagon',  innerDots: 1, patternType: 2, label: 'f' },
];

// Pairs that CAN connect (same innerDots + same patternType)
const validPairs = new Set(['0-1', '2-3', '4-5']);

// ---- Place nodes in a circle ----
const nodes = [];
{
  const cx = W / 2, cy = H / 2;
  const radius = Math.min(W, H) * 0.30;
  const n = nodesRaw.length;
  nodesRaw.forEach((raw, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    nodes.push({
      ...raw,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      r: 28,
    });
  });
}

// ---- State ----
let discovered = new Set();         // e.g. '0-1'
let facts = [];                     // {from, to, alpha, propIdx}
let dragging = null;                // {fromIdx, toX, toY}
let hoveredIdx = -1;
let showProp = null;                // {text, timer}
let allDiscovered = false;
let attemptCount = 0;

// ---- DOM ----
const propText = document.getElementById('prop-text');
const instrEl = document.getElementById('instructions');

function revealProposition(idx) {
  const p = propositions[idx];
  propText.innerHTML = `<span style="color:#888;font-size:14px">${p.num}</span><br><span style="color:#ccc">${p.zh}</span><br><span style="color:#666;font-size:12px;font-style:italic">${p.en}</span>`;
  propText.classList.add('show');
  clearTimeout(showProp?.timer);
  showProp = { text: p, timer: setTimeout(() => propText.classList.remove('show'), 5000) };
}

// ---- Drawing helpers ----
function drawShape(shape, x, y, size) {
  ctx.beginPath();
  switch (shape) {
    case 'circle':
      ctx.arc(x, y, size, 0, Math.PI * 2);
      break;
    case 'triangle':
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 * i) / 3 - Math.PI / 2;
        const px = x + Math.cos(a) * size;
        const py = y + Math.sin(a) * size;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    case 'square':
      ctx.rect(x - size * 0.75, y - size * 0.75, size * 1.5, size * 1.5);
      break;
    case 'diamond':
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size * 0.75, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size * 0.75, y);
      ctx.closePath();
      break;
    case 'hexagon':
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const px = x + Math.cos(a) * size * 0.85;
        const py = y + Math.sin(a) * size * 0.85;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    case 'pentagon':
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const px = x + Math.cos(a) * size * 0.85;
        const py = y + Math.sin(a) * size * 0.85;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
  }
}

// Draw inner dots pattern (the "logical form")
function drawInnerDots(x, y, count, patternType) {
  const dotR = 3;
  const spread = 10;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  if (patternType === 0) {
    // Horizontal line
    for (let i = 0; i < count; i++) {
      const dx = (i - (count - 1) / 2) * (spread * 0.8);
      ctx.beginPath();
      ctx.arc(x + dx, y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (patternType === 1) {
    // Triangle arrangement
    const off = count > 1 ? spread * 0.6 : 0;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const dx = Math.cos(angle) * off;
      const dy = Math.sin(angle) * off;
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Vertical line
    for (let i = 0; i < count; i++) {
      const dy = (i - (count - 1) / 2) * (spread * 0.8);
      ctx.beginPath();
      ctx.arc(x, y + dy, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---- Game state functions ----
let lastValidId = -1;
let invalidPair = null;

function tryConnect(i, j) {
  if (i === j) return;
  const key = [i, j].sort().join('-');
  if (discovered.has(key)) return;
  attemptCount++;

  if (validPairs.has(key)) {
    // Valid fact discovered
    discovered.add(key);
    const idx = discovered.size - 1;
    facts.push({ from: i, to: j, alpha: 0, propIdx: idx });
    lastValidId = idx;
    revealProposition(Math.min(idx, propositions.length - 1));

    // Check if all discovered
    if (discovered.size === validPairs.size) {
      setTimeout(() => {
        allDiscovered = true;
        revealProposition(propositions.length - 1); // final: "7. Whereof one cannot speak..."
        instrEl.textContent = '世界已被映射。 The world has been mapped.';
      }, 1200);
    } else {
      instrEl.textContent = `发现了 ${discovered.size}/${validPairs.size} 个事实 · Facts discovered`;
    }
  } else {
    // Invalid attempt
    invalidPair = { i, j, life: 1 };
  }
}

// ---- Pointer events ----
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function findNode(px, py) {
  for (let i = 0; i < nodes.length; i++) {
    const dx = px - nodes[i].x;
    const dy = py - nodes[i].y;
    if (Math.sqrt(dx * dx + dy * dy) < nodes[i].r + 8) return i;
  }
  return -1;
}

canvas.addEventListener('pointerdown', (e) => {
  if (allDiscovered) return;
  const pos = getPos(e);
  const idx = findNode(pos.x, pos.y);
  if (idx >= 0) {
    dragging = { fromIdx: idx, toX: pos.x, toY: pos.y };
  }
});

canvas.addEventListener('pointermove', (e) => {
  const pos = getPos(e);
  hoveredIdx = findNode(pos.x, pos.y);
  if (dragging) {
    dragging.toX = pos.x;
    dragging.toY = pos.y;
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (!dragging) return;
  const pos = getPos(e);
  const toIdx = findNode(pos.x, pos.y);
  if (toIdx >= 0 && toIdx !== dragging.fromIdx) {
    tryConnect(dragging.fromIdx, toIdx);
  }
  dragging = null;
});

canvas.addEventListener('pointerleave', () => {
  dragging = null;
  hoveredIdx = -1;
});

// ---- Render ----
function draw(now) {
  ctx.clearRect(0, 0, W, H);

  // Background: deep near-black
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, W, H);

  // Subtle vignette
  const vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.7);
  vignette.addColorStop(0, '#151518');
  vignette.addColorStop(1, '#0d0d0d');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // Grid (logical space)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  const gridSize = 40;
  for (let x = gridSize; x < W; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = gridSize; y < H; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Existing facts (persistent connections)
  for (const fact of facts) {
    fact.alpha = Math.min(1, fact.alpha + 0.02);
    const a = nodes[fact.from];
    const b = nodes[fact.to];
    // Outer glow
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(255,200,120,${fact.alpha * 0.3})`;
    ctx.lineWidth = 6;
    ctx.stroke();
    // Core line
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(255,220,160,${fact.alpha * 0.7})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Proposition number label at midpoint
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    ctx.fillStyle = `rgba(200,180,140,${fact.alpha * 0.8})`;
    ctx.font = '11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(propositions[Math.min(fact.propIdx, propositions.length - 1)].num, mx, my - 10);
  }

  // Dragging preview line
  if (dragging) {
    const fromNode = nodes[dragging.fromIdx];
    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    ctx.lineTo(dragging.toX, dragging.toY);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Invalid attempt flash
  if (invalidPair) {
    const a = nodes[invalidPair.i];
    const b = nodes[invalidPair.j];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(255,80,80,${invalidPair.life * 0.5})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw nodes
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const isHovered = i === hoveredIdx;
    const isDragging = dragging && i === dragging.fromIdx;
    const isConnected = facts.some(f => f.from === i || f.to === i);

    // Glow for connected nodes
    if (isConnected) {
      const glow = ctx.createRadialGradient(n.x, n.y, n.r * 0.6, n.x, n.y, n.r * 1.8);
      glow.addColorStop(0, 'rgba(255,200,120,0.15)');
      glow.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }

    // Hover glow
    if (isHovered || isDragging) {
      const hoverGlow = ctx.createRadialGradient(n.x, n.y, n.r * 0.5, n.x, n.y, n.r * 1.5);
      hoverGlow.addColorStop(0, 'rgba(255,255,255,0.1)');
      hoverGlow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = hoverGlow;
      ctx.fill();
    }

    // Shape outline
    drawShape(n.shape, n.x, n.y, n.r);
    ctx.strokeStyle = isConnected
      ? 'rgba(255,200,140,0.9)'
      : isHovered
        ? 'rgba(255,255,255,0.7)'
        : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = isConnected ? 2 : isHovered ? 1.5 : 1;
    ctx.stroke();

    // Fill
    ctx.fillStyle = isConnected
      ? 'rgba(30,25,15,0.6)'
      : 'rgba(20,20,20,0.5)';
    ctx.fill();

    // Inner dots (logical form)
    drawInnerDots(n.x, n.y, n.innerDots, n.patternType);

    // Label
    ctx.fillStyle = isConnected
      ? 'rgba(255,200,140,0.7)'
      : 'rgba(255,255,255,0.25)';
    ctx.font = `${isHovered ? '14' : '12'}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(n.label, n.x, n.y + n.r + 20);
  }
}

// ---- Animation loop ----
let lastTime = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // Fade invalid pair
  if (invalidPair) {
    invalidPair.life -= 1.2 * dt;
    if (invalidPair.life <= 0) invalidPair = null;
  }

  // Update node positions on resize
  if (W !== window.innerWidth || H !== window.innerHeight) {
    resize();
    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) * 0.30;
    nodes.forEach((n, i) => {
      const angle = (Math.PI * 2 * i) / nodes.length - Math.PI / 2;
      n.x = cx + Math.cos(angle) * radius;
      n.y = cy + Math.sin(angle) * radius;
    });
  }

  draw(now);
}

// ---- Init ----
instrEl.textContent = '拖拽连接对象 · Drag between objects to find facts';
requestAnimationFrame(loop);

// ---- Reset ----
document.getElementById('reset-btn').addEventListener('click', () => {
  discovered.clear();
  facts = [];
  showProp = null;
  allDiscovered = false;
  attemptCount = 0;
  invalidPair = null;
  dragging = null;
  propText.classList.remove('show');
  instrEl.textContent = '拖拽连接对象 · Drag between objects to find facts';
});
