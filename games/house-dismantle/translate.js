/* House Dismantle  Translate / Dismantle Logic */

import { getDisassembleOffset } from './config.js';

export function initTranslate(state) {
  const { parts, targetOff, selected } = state;
  const ref = state; // mutable refs

  function getRequiredParts(forParts) {
    const required = new Set(forParts);
    const queue = [...forParts];
    while (queue.length > 0) {
      const name = queue.shift();
      const p = parts.get(name);
      if (!p) continue;
      for (const dep of p.deps) {
        if (!required.has(dep)) { required.add(dep); queue.push(dep); }
      }
    }
    for (const [name, p] of parts) {
      if (required.has(name)) continue;
      for (const dep of p.deps) {
        if (required.has(dep)) { required.add(name); break; }
      }
    }
    return required;
  }

  function doDisassemble() {
    if (selected.size === 0) {
      if (ref.isDisassembled) doReassembleAll();
      return;
    }
    const toMove = getRequiredParts(selected);
    const offsets = new Map();
    for (const name of toMove) offsets.set(name, [...getDisassembleOffset(name)]);
    for (const name of toMove) {
      const p = parts.get(name);
      if (!p) continue;
      const myOff = offsets.get(name);
      for (const dep of p.deps) {
        if (toMove.has(dep) && offsets.has(dep)) {
          const po = offsets.get(dep);
          myOff[0] += po[0]; myOff[1] += po[1]; myOff[2] += po[2];
          break;
        }
      }
    }
    for (const name of toMove) {
      const off = offsets.get(name);
      targetOff.get(name).set(off[0], off[1], off[2]);
      const p = parts.get(name);
      if (p) p.assembled = false;
    }
    ref.isDisassembled = true;
    ref.tweenActive = true;
  }

  function doReassembleAll() {
    for (const [name] of parts) {
      targetOff.get(name).set(0, 0, 0);
      const p = parts.get(name);
      if (p) p.assembled = true;
    }
    ref.isDisassembled = false;
    ref.tweenActive = true;
  }

  function updateDismantleBtn() {
    const btn = document.getElementById('btn-dismantle');
    if (ref.isDisassembled) {
      btn.textContent = '🔧 组装 (1)'; btn.classList.add('active');
    } else {
      btn.textContent = '🔧 拆解 (1)'; btn.classList.remove('active');
    }
  }

  return { doDisassemble, doReassembleAll, getRequiredParts, updateDismantleBtn };
}
