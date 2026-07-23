/* House Dismantle — Spatial Validation Engine
 *
 * Usage:
 *   import { validateHouse } from './validate/index.js';
 *   const violations = validateHouse(parts);
 *
 * Returns Violation[] — each with rule, severity, parts, detail, metrics, fix.
 * Also prints console.table() summary.
 */
import { PART_DEFS } from '../config.js';
import { checkDepTopology } from './rules/dep-topology.js';
import { checkRoomHeight } from './rules/room-height.js';
import { checkColumnPlacement } from './rules/column-placement.js';
import { checkPolyConsistency } from './rules/poly-consistency.js';
import { checkClearance } from './rules/clearance.js';
import { checkOverlap } from './rules/overlap.js';
import { checkZFighting } from './rules/z-fighting.js';

export function validateHouse(parts) {
  const allViolations = [
    ...checkDepTopology(PART_DEFS),
    ...checkRoomHeight(),
    ...checkColumnPlacement(parts),
    ...checkPolyConsistency(parts),
    ...checkClearance(parts),
    ...checkOverlap(parts),
    ...checkZFighting(parts),
  ];

  const errors = allViolations.filter(v => v.severity === 'error');
  const warnings = allViolations.filter(v => v.severity === 'warning');

  if (allViolations.length > 0) {
    console.group(
      `%c🏠 House Spatial Validation %c— ${errors.length} errors, ${warnings.length} warnings`,
      '', 'color:#f90;',
    );
    console.table(allViolations.map(v => ({
      rule: v.rule,
      sev: v.severity,
      parts: v.parts.join(', '),
      detail: v.detail,
    })));
    console.groupEnd();
  } else {
    console.log('%c🏠 House Spatial Validation — ✅ all clear', 'color:#0a0;');
  }

  return allViolations;
}
