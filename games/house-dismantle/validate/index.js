/* House Dismantle  Spatial Validation Engine
 * Dabie Mountain 4-bay 2-story house */
import { PART_DEFS } from '../config.js';
import { checkDepTopology } from './rules/dep-topology.js';
import { checkRoomHeight } from './rules/room-height.js';
import { checkColumnPlacement } from './rules/column-placement.js';
import { checkPolyConsistency } from './rules/poly-consistency.js';
import { checkClearance } from './rules/clearance.js';
import { checkOverlap } from './rules/overlap.js';
import { checkZFighting } from './rules/z-fighting.js';
import { checkReachability } from './rules/reachability.js';
import { checkGroupOrigin } from './rules/group-origin.js';
import { checkStairwellOpening } from './rules/stairwell-opening.js';
import { analyzeSite } from './site-analyzer.js';

export function validateHouse(parts) {
  analyzeSite(parts, PART_DEFS);

  const allViolations = [
    ...checkDepTopology(PART_DEFS),
    ...checkRoomHeight(),
    ...checkColumnPlacement(parts),
    ...checkPolyConsistency(parts),
    ...checkClearance(parts),
    ...checkOverlap(parts),
    ...checkZFighting(parts),
    ...checkReachability(parts),
    ...checkGroupOrigin(parts),
    ...checkStairwellOpening(parts),
  ];

  const errors = allViolations.filter(v => v.severity === 'error');
  const warnings = allViolations.filter(v => v.severity === 'warning');

  // Show violations on page
  const el = document.getElementById('validate-output');
  if (el) {
    if (allViolations.length === 0) {
      el.innerHTML = '<div style="color:#4a4">✅ 空间检测通过</div>';
      el.style.display = 'block';
    } else {
      const items = allViolations.map(v =>
        `<div style="color:${v.severity==='error'?'#f66':'#f90'};font-size:11px;margin:1px 0">
          [${v.severity==='error'?'❌':'⚠️'}] ${v.rule}: ${v.detail}
        </div>`
      ).join('');
      el.innerHTML = `<div style="color:#f66;font-weight:700;margin-bottom:4px">🏠 ${errors.length} errors, ${warnings.length} warnings</div>${items}`;
      el.style.display = 'block';
    }
  }
  console.log(`🏠 Validation: ${errors.length} errors, ${warnings.length} warnings`, allViolations);
  return allViolations;
}
