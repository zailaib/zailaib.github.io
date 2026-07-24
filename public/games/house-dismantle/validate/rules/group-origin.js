/* Rule: Group Origin — part groups must stay at world origin.
 * Meshes should be positioned within the group; the group itself should NOT move.
 * Catches the .add().position.set() anti-pattern (add() returns parent, not child). */
import * as THREE from 'three';

const ORIGIN_THRESHOLD = 0.01; // meter — groups within this of origin are OK

export function checkGroupOrigin(parts) {
  const violations = [];

  for (const [name, p] of parts) {
    p.group.updateWorldMatrix(true, false);
    const pos = new THREE.Vector3();
    p.group.getWorldPosition(pos);

    const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);

    if (dist > ORIGIN_THRESHOLD) {
      violations.push({
        rule: 'group-origin',
        severity: 'error',
        parts: [name],
        detail: `${name} 的 group 偏离原点 (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}) — 距离 ${dist.toFixed(2)}m。可能由 add().position.set() 链式调用导致`,
        metrics: { offsetX: +pos.x.toFixed(2), offsetY: +pos.y.toFixed(2), offsetZ: +pos.z.toFixed(2), distance: +dist.toFixed(2) },
        fix: { file: 'floor1/openings.js 等', suggestion: '拆开链式调用：先 mesh.position.set()，再 group.add(mesh)' },
      });
    }
  }

  return violations;
}
