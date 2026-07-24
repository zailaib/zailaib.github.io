/* House Dismantle — UI: legend, selection, events, buttons */
import * as THREE from 'three';
import { CATEGORIES, getDisassembleOffset } from './config.js';

export function initUI(state) {
  const { parts, selected, targetOff, camera, renderer, controls } = state;
  const ref = state;

  // ── Legend ──────────────────────────────────────────────────────────
  const legendItems = document.getElementById('legend-items');
  const catBar = document.createElement('div');
  catBar.id = 'cat-bar';
  let activeCat = null;

  for (const [catKey, cat] of Object.entries(CATEGORIES)) {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.textContent = cat.label;
    btn.style.setProperty('--cat-color', cat.color);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const catParts = cat.parts.filter(n => parts.has(n));
      const allOut = catParts.every(n => {
        const tgt = targetOff.get(n);
        return tgt && (tgt.x !== 0 || tgt.y !== 0 || tgt.z !== 0);
      });
      if (allOut) {
        btn.classList.remove('active');
        if (activeCat === catKey) activeCat = null;
        for (const n of catParts) { targetOff.get(n).set(0, 0, 0); const p = parts.get(n); if (p) p.assembled = true; }
      } else {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCat = catKey;
        for (const n of catParts) {
          const off = getDisassembleOffset(n);
          targetOff.get(n).set(off[0], off[1], off[2]);
        }
      }
      ref.isDisassembled = catParts.some(n => { const t = targetOff.get(n); return t && (t.x !== 0 || t.y !== 0 || t.z !== 0); });
      ref.tweenActive = true;
      updateLegendUI();
      updateDismantleBtn();
    });
    catBar.appendChild(btn);
  }
  legendItems.before(catBar);

  for (const [catKey, cat] of Object.entries(CATEGORIES)) {
    const catLabel = document.createElement('div');
    catLabel.className = 'legend-cat-label';
    catLabel.textContent = cat.label;
    legendItems.appendChild(catLabel);
    for (const name of cat.parts) {
      const p = parts.get(name);
      if (!p) continue;
      const div = document.createElement('div');
      div.className = 'legend-item';
      div.dataset.part = name;
      div.innerHTML = `<span class="legend-dot" style="background:${p.color}"></span>${p.label}`;
      div.addEventListener('click', (e) => { e.stopPropagation(); togglePart(name); });
      legendItems.appendChild(div);
    }
  }

  // ── UI helpers ──────────────────────────────────────────────────────
  function updateLegendUI() {
    document.querySelectorAll('.legend-item').forEach(el => {
      const name = el.dataset.part;
      if (!name) return;
      const p = parts.get(name);
      if (!p) return;
      el.classList.toggle('selected', selected.has(name));
      el.style.opacity = p.assembled ? (selected.has(name) ? '1' : '') : '0.5';
    });
  }

  function updatePartHighlights() {
    for (const [name, p] of parts) {
      const sel = selected.has(name);
      for (const m of p.meshArr) {
        const mat = m.material;
        const mats = Array.isArray(mat) ? mat : [mat];
        for (const mm of mats) {
          mm.emissive = new THREE.Color(sel ? 0x336699 : 0x000000);
          mm.emissiveIntensity = sel ? 0.5 : 0;
        }
      }
    }
  }

  function updateInfoPanel() {
    const nameEl = document.getElementById('part-name');
    const hintEl = document.getElementById('part-hint');
    if (selected.size === 0) {
      nameEl.textContent = '点击选择部件';
      hintEl.innerHTML = '拖拽框选 · 按 <kbd>1</kbd> 拆解';
    } else if (selected.size === 1) {
      const [n] = selected;
      const p = parts.get(n);
      nameEl.textContent = p ? p.label : n;
      hintEl.innerHTML = '按 <kbd>1</kbd> 拆解 · 点击取消';
    } else {
      nameEl.textContent = `已选 ${selected.size} 个部件`;
      hintEl.innerHTML = '按 <kbd>1</kbd> 拆解 · 点击空白取消';
    }
  }

  function updateDismantleBtn() {
    const btn = document.getElementById('btn-dismantle');
    if (ref.isDisassembled) {
      btn.textContent = '🔧 组装 (1)'; btn.classList.add('active');
    } else {
      btn.textContent = '🔧 拆解 (1)'; btn.classList.remove('active');
    }
  }

  function refreshUI() { updateLegendUI(); updatePartHighlights(); updateInfoPanel(); }

  // ── Selection ──────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster(); raycaster.far = 40;
  const mouse = new THREE.Vector2();

  function getAllSelectable() {
    const meshes = [];
    for (const [, p] of parts) for (const m of p.meshArr) meshes.push(m);
    return meshes;
  }

  function raycastPart(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(getAllSelectable(), false);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj) {
        if (obj.userData.partName) return obj.userData.partName;
        obj = obj.parent;
      }
    }
    return null;
  }

  function togglePart(name) {
    if (selected.has(name)) selected.delete(name); else selected.add(name);
    refreshUI();
  }

  function clearSelection() { selected.clear(); refreshUI(); }

  // ── Rubber-band selection ──────────────────────────────────────────
  const selBox = document.getElementById('sel-box');
  let selStart = new THREE.Vector2(), selActive = false, ctrlSelecting = false;

  function selectInRect(x1, y1, x2, y2) {
    const mx = Math.min(x1, x2), MX = Math.max(x1, x2);
    const my = Math.min(y1, y2), MY = Math.max(y1, y2);
    const found = new Set();
    for (const [name, p] of parts) {
      const wp = new THREE.Vector3(); p.group.getWorldPosition(wp);
      const v = wp.clone().project(camera);
      const r = renderer.domElement.getBoundingClientRect();
      const sx = (v.x * 0.5 + 0.5) * r.width + r.left;
      const sy = (-v.y * 0.5 + 0.5) * r.height + r.top;
      if (sx >= mx && sx <= MX && sy >= my && sy <= MY) found.add(name);
    }
    return found;
  }

  // ── Events ─────────────────────────────────────────────────────────
  const pointerDownPos = new THREE.Vector2();

  renderer.domElement.addEventListener('pointerdown', (event) => {
    pointerDownPos.set(event.clientX, event.clientY);
    if (event.ctrlKey || event.metaKey) {
      ctrlSelecting = true;
      event.stopPropagation();
      selStart.set(event.clientX, event.clientY);
      selBox.style.display = 'block';
      selBox.style.left = event.clientX + 'px';
      selBox.style.top = event.clientY + 'px';
      selBox.style.width = '0px'; selBox.style.height = '0px';
      renderer.domElement.style.cursor = 'crosshair';
    } else { ctrlSelecting = false; }
  }, { capture: true });

  window.addEventListener('pointermove', (event) => {
    if (ctrlSelecting) {
      if (Math.abs(event.clientX - pointerDownPos.x) > 2 || Math.abs(event.clientY - pointerDownPos.y) > 2) selActive = true;
      if (selActive) {
        const x1 = selStart.x, y1 = selStart.y, x2 = event.clientX, y2 = event.clientY;
        selBox.style.left = Math.min(x1, x2) + 'px';
        selBox.style.top = Math.min(y1, y2) + 'px';
        selBox.style.width = Math.abs(x2 - x1) + 'px';
        selBox.style.height = Math.abs(y2 - y1) + 'px';
      }
    }
    if (!ctrlSelecting) {
      const part = raycastPart(event);
      if (part !== ref.hoveredPart) { ref.hoveredPart = part; renderer.domElement.style.cursor = part ? 'pointer' : ''; }
    }
  });

  window.addEventListener('pointerup', (event) => {
    const clickDist = Math.hypot(event.clientX - pointerDownPos.x, event.clientY - pointerDownPos.y);
    const wasClick = clickDist < 4;
    if (ctrlSelecting && selActive) {
      const found = selectInRect(selStart.x, selStart.y, event.clientX, event.clientY);
      selected.clear(); for (const n of found) selected.add(n);
      refreshUI();
    } else if (ctrlSelecting && wasClick) {
      const part = raycastPart(event);
      if (part) togglePart(part);
    } else if (!ctrlSelecting && wasClick) {
      if (ref.isDisassembled) { clearSelection(); ref.doReassembleAll(); }
      else { const part = raycastPart(event); if (part) togglePart(part); else clearSelection(); }
    }
    selActive = false; ctrlSelecting = false;
    selBox.style.display = 'none';
    selBox.style.width = '0px'; selBox.style.height = '0px';
    renderer.domElement.style.cursor = ref.hoveredPart ? 'pointer' : '';
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === '1' || event.key === 'd' || event.key === 'D') {
      event.preventDefault();
      if (ref.isDisassembled) ref.doReassembleAll(); else ref.doDisassemble();
    }
    if (event.key === 'Escape') clearSelection();
    if (event.key === '0') {
      camera.position.set(14, 8, 20);
      controls.target.set(0, 3.5, 0);
      controls.update();
    }
  });

  document.getElementById('btn-dismantle').addEventListener('click',
    () => ref.isDisassembled ? ref.doReassembleAll() : ref.doDisassemble());
  document.getElementById('btn-reset').addEventListener('click', () => {
    clearSelection(); ref.doReassembleAll();
    camera.position.set(10, 7, 16);
    controls.target.set(0, 2.2, 0); controls.update();
  });

  return { refreshUI, updateLegendUI, updateInfoPanel, updateDismantleBtn, clearSelection };
}
