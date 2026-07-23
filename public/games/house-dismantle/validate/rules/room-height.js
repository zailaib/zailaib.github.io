/* Rule: Room Height — check habitable clearances */
import { WALL_H1, WALL_H2 } from '../../config.js';

const MIN_HABITABLE = 1.8; // minimum usable room height in meters

export function checkRoomHeight() {
  const violations = [];

  if (WALL_H1 < MIN_HABITABLE) {
    violations.push({
      rule: 'room-height',
      severity: 'error',
      parts: ['floor', 'wallFront'],
      detail: `一层净高 ${WALL_H1.toFixed(1)}m < ${MIN_HABITABLE}m 最低居住标准`,
      metrics: { actual: WALL_H1, minRequired: MIN_HABITABLE },
      fix: { file: 'config.js', line: 8, suggestion: `WALL_H1 至少设为 ${MIN_HABITABLE}m` },
    });
  }

  if (WALL_H2 < MIN_HABITABLE) {
    violations.push({
      rule: 'room-height',
      severity: 'error',
      parts: ['floor2', 'upperWallFront'],
      detail: `二层净高 ${WALL_H2.toFixed(1)}m < ${MIN_HABITABLE}m 最低居住标准`,
      metrics: { actual: WALL_H2, minRequired: MIN_HABITABLE },
      fix: { file: 'config.js', line: 9, suggestion: `WALL_H2 至少设为 ${MIN_HABITABLE}m` },
    });
  }

  return violations;
}
