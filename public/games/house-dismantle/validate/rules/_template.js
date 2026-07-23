/* Rule Template — copy and fill in for new spatial constraints
 *
 * Export: checkXxx(parts, PART_DEFS) → Violation[]
 * Import this in validate/index.js and add to the validateHouse() pipeline.
 */

// import { getWorldAABB } from '../helpers.js';
// import { SOME_CONSTANT } from '../../config.js';

export function checkTemplate(parts, PART_DEFS) {
  const violations = [];

  // ── Step 1: Check part exists ──────────────────────────────────
  // const myPart = parts.get('yourPartName');
  // if (!myPart) return violations; // skip if not yet built

  // ── Step 2: Spatial checks ─────────────────────────────────────
  // Use getWorldAABB(mesh) for bounding box checks
  // Use volumeRatio(boxA, boxB) for overlap detection

  // ── Step 3: Structural checks ──────────────────────────────────
  // Height, thickness, clearance

  // ── Step 4: Dependency checks ──────────────────────────────────
  // Verify PART_DEFS deps are consistent

  // ── Step 5: Visual consistency ─────────────────────────────────
  // Material, segment counts

  return violations;
}
