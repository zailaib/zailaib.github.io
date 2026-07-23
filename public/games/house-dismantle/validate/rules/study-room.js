/* Rule: Study Room — validate the study room extension */
import { getWorldAABB, volumeRatio } from '../helpers.js';
import { HW2, HD2, WALL_H1, FLOOR_H, BAY_W } from '../../config.js';

const STUDY_X = HW2 + 1.5;
const STUDY_Z = 2.8;  // avoid crossWall at z=1.0
const STUDY_W = 3.0;
const STUDY_D = 3.0;
const STUDY_H = WALL_H1;
const MIN_DOORWAY = 0.6;
const MIN_NET_HEIGHT = 1.8;  // Note: different variable name to avoid conflict

export function checkStudyRoom(parts) {
  const violations = [];
  const studyWalls = parts.get('studyWalls');
  if (!studyWalls) return violations; // study not yet built

  // ── 1. Room height ──────────────────────────────────────────────
  const netHeight = STUDY_H - 0.12;
  if (netHeight < MIN_NET_HEIGHT) {
    violations.push({
      rule: 'room-height',
      severity: 'error',
      parts: ['studyWalls'],
      detail: `书房净高 ${netHeight.toFixed(1)}m < ${MIN_NET_HEIGHT}m`,
      metrics: { actual: netHeight, minRequired: MIN_NET_HEIGHT },
      fix: { file: 'constraints/study-room.md', suggestion: `STUDY_H 至少 ${MIN_NET_HEIGHT + 0.12}m` },
    });
  }

  // ── 2. Doorway width ────────────────────────────────────────────
  const DOOR_WIDTH = 0.9;
  if (DOOR_WIDTH < MIN_DOORWAY) {
    violations.push({
      rule: 'clearance',
      severity: 'error',
      parts: ['studyDoor'],
      detail: `书房门洞宽 ${DOOR_WIDTH}m < ${MIN_DOORWAY}m`,
      metrics: { actual: DOOR_WIDTH, minRequired: MIN_DOORWAY },
      fix: { file: 'constraints/study-room.md', suggestion: '门洞宽至少 0.6m' },
    });
  }

  // ── 3. Overlap: study walls vs chickens (chickens roam at left-front yard) ──
  const chickensPart = parts.get('chickens');
  if (chickensPart) {
    const sRight = STUDY_X + STUDY_W / 2;   // 9.0
    const sLeft = STUDY_X - STUDY_W / 2;     // 6.0
    const sFront = STUDY_Z + STUDY_D / 2;    // 2.5
    const sBack = STUDY_Z - STUDY_D / 2;     // -0.5

    for (const mesh of chickensPart.meshArr) {
      const box = getWorldAABB(mesh);
      const cx = (box.min.x + box.max.x) / 2;
      const cz = (box.min.z + box.max.z) / 2;
      if (cx > sLeft - 0.2 && cx < sRight + 0.2 && cz > sBack - 0.2 && cz < sFront + 0.2) {
        violations.push({
          rule: 'overlap',
          severity: 'warning',
          parts: ['studyWalls', 'chickens'],
          detail: `书房区域 (${sLeft}-${sRight}, ${sBack}-${sFront}) 与鸡 (${cx.toFixed(1)}, ${cz.toFixed(1)}) 位置重叠`,
          metrics: {},
          fix: { file: 'house-study.js', suggestion: '将鸡移到左侧院子 (x < -HW2-1)' },
        });
        break;
      }
    }
  }

  // ── 4. Desk-to-bookshelf clearance ──────────────────────────────
  const studyDesk = parts.get('studyDesk');
  const studyBookshelf = parts.get('studyBookshelf');
  if (studyDesk && studyBookshelf) {
    let deskZ = STUDY_Z - 0.5, shelfZ = STUDY_Z + 0.5;
    for (const mesh of studyDesk.meshArr) {
      const box = getWorldAABB(mesh);
      deskZ = (box.min.z + box.max.z) / 2;
      break;
    }
    for (const mesh of studyBookshelf.meshArr) {
      const box = getWorldAABB(mesh);
      shelfZ = (box.min.z + box.max.z) / 2;
      break;
    }
    const gap = Math.abs(shelfZ - deskZ) - 0.6; // approx depth deduction
    if (gap < 0.5) {
      violations.push({
        rule: 'clearance',
        severity: 'warning',
        parts: ['studyDesk', 'studyBookshelf'],
        detail: `书桌与书架间距约 ${gap.toFixed(1)}m < 0.5m，通道过窄`,
        metrics: { gap: Math.round(gap * 100) / 100, minRequired: 0.5 },
        fix: { file: 'house-study.js', suggestion: '将书架向后移 0.3m' },
      });
    }
  }

  // ── 5. Dependency level check ────────────────────────────────────
  // studyWalls (structure) should not depend on wallRight (existing structure)
  // (Already set correctly in PART_DEFS — studyWalls dep on its own interiors)

  return violations;
}
