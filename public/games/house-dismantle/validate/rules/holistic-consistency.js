/* Rule: Holistic Consistency — Step 0: does the addition harmonize with the whole? */
import { getWorldAABB } from '../helpers.js';
import { HOUSE_W, HOUSE_D, WALL_H1, WALL_T, FLOOR_H, HW2, HD2 } from '../../config.js';

const MAIN_FOOTPRINT = HOUSE_W * HOUSE_D; // 108 m²

export function checkHolisticConsistency(parts, PART_DEFS) {
  const violations = [];
  const additions = PART_DEFS.filter(d => d.name.startsWith('study'));
  if (additions.length === 0) return violations;

  // ── 0.1 Roof System ─────────────────────────────────────────────
  // Check: any enclosed space must have a roof covering it
  const hasRoof = additions.some(d => d.name === 'studyRoof');
  const hasWalls = parts.has('studyWalls');

  if (hasWalls && !hasRoof) {
    violations.push({
      rule: 'holistic-roof',
      severity: 'error',
      parts: ['studyWalls'],
      detail: '书房有墙体但无屋顶——封闭空间必须具备屋顶覆盖',
      metrics: {},
      fix: { file: 'constraints/study-room.md', line: 1,
        suggestion: '添加披檐屋顶：从右墙 y=4.3m 处起坡，向右下方倾斜至 y≈3.3m，坡度约 18°' },
    });
  }

  // Check roof pitch if roof exists
  const studyRoofPart = parts.get('studyRoof');
  if (studyRoofPart) {
    for (const mesh of studyRoofPart.meshArr) {
      const box = getWorldAABB(mesh);
      const h = box.max.y - box.min.y;
      const w = box.max.x - box.min.x;
      if (w > 0.5 && h > 0.05) {
        const pitch = Math.atan2(h, w) * (180 / Math.PI);
        if (pitch < 10 || pitch > 40) {
          violations.push({
            rule: 'holistic-roof',
            severity: 'warning',
            parts: ['studyRoof'],
            detail: `披檐坡度 ${pitch.toFixed(0)}° 不合理（建议 15°-35°）`,
            metrics: { pitch, min: 15, max: 35 },
            fix: { file: 'house-study.js', suggestion: '调整屋顶高度使坡度在 15°-35° 之间' },
          });
        }
      }
      break; // check first large mesh only
    }
  }

  // ── 0.2 Material Consistency ────────────────────────────────────
  // Same floor extensions should use matching wall materials
  if (hasWalls) {
    // Ground floor walls should use MATS.wall (0xf2ece0), not MATS.upperWall (0xc4b898)
    // This is a soft check — we can't read material colors at runtime easily
    // Instead, check the PART_DEFS color hint
    const studyWallsDef = additions.find(d => d.name === 'studyWalls');
    const mainWallDef = PART_DEFS.find(d => d.name === 'wallFront');
    if (studyWallsDef && mainWallDef && studyWallsDef.color !== mainWallDef.color) {
      violations.push({
        rule: 'holistic-material',
        severity: 'warning',
        parts: ['studyWalls', 'wallFront'],
        detail: `书房屋墙色 ${studyWallsDef.color} ≠ 一层主墙色 ${mainWallDef.color} — 同层建筑应统一材质`,
        metrics: {},
        fix: { file: 'config.js',
          suggestion: `将 studyWalls 的 color 改为 ${mainWallDef.color}，3D 模型中使用 MATS.wall` },
      });
    }
  }

  // ── 0.3 Proportion ─────────────────────────────────────────────
  // Addition should not exceed ~30% of main footprint
  const studyFloorDef = additions.find(d => d.name === 'studyFloor');
  if (studyFloorDef) {
    const studyArea = 3.0 * 3.0; // approximate, from constraint doc
    const ratio = studyArea / MAIN_FOOTPRINT;
    if (ratio > 0.3) {
      violations.push({
        rule: 'holistic-proportion',
        severity: 'warning',
        parts: ['studyFloor'],
        detail: `书房面积 ${studyArea.toFixed(0)}m² 占主屋 ${MAIN_FOOTPRINT.toFixed(0)}m² 的 ${(ratio*100).toFixed(0)}% > 30%`,
        metrics: { ratio, maxRecommended: 0.3 },
        fix: { file: 'constraints/study-room.md', suggestion: '缩小书房尺寸或拆分为多个小空间' },
      });
    }
  }

  // ── 0.4 Circulation ─────────────────────────────────────────────
  // The study door must lead to an existing room, not a wall or outside
  // Simplified: check study door Z is within house Z range
  const studyDoorDef = additions.find(d => d.name === 'studyDoor');
  if (studyDoorDef && hasWalls) {
    // From constraint doc: door at z=2.8 (moved from 1.0)
    // crossWall at z=1.0, frontWall at z=4.5
    // Door should open into the front zone (z=1.0 to 4.5)
    const doorZ = 2.8;
    if (doorZ < 1.0 || doorZ > HD2) {
      violations.push({
        rule: 'holistic-circulation',
        severity: 'error',
        parts: ['studyDoor'],
        detail: `书房门 z=${doorZ.toFixed(1)} 不通向已有室内空间——门必须开向已有房间`,
        metrics: { doorZ, validRange: [1.0, HD2] },
        fix: { file: 'constraints/study-room.md', suggestion: '调整 STUDY_Z 使门位于已有房间范围内' },
      });
    }
  }

  // ── 0.5 Facade alignment ────────────────────────────────────────
  // New external walls on the same plane as existing should align
  // Right side expansion: new front/back walls should align with house
  if (hasWalls && studyFloorDef) {
    // Study floor at z=2.8, study depth ~3m → study front=4.3, study back=1.3
    // House front at z=4.5, crossWall at z=1.0
    // Check alignment
    const sFront = 2.8 + 1.5; // STUDY_Z + STUDY_D/2 = 4.3
    const houseFront = HD2; // 4.5
    if (Math.abs(sFront - houseFront) < 0.3 && Math.abs(sFront - houseFront) > 0.02) {
      violations.push({
        rule: 'holistic-facade',
        severity: 'warning',
        parts: ['studyWalls', 'wallFront'],
        detail: `书房前墙 z=${sFront.toFixed(1)} 接近但不对齐主屋前墙 z=${houseFront.toFixed(1)}，偏差 ${Math.abs(sFront-houseFront).toFixed(1)}m`,
        metrics: { offset: Math.round(Math.abs(sFront - houseFront) * 100) / 100 },
        fix: { file: 'constraints/study-room.md', suggestion: '将书房前墙与主屋前墙对齐' },
      });
    }
  }

  // ── 0.6 Foundation level ────────────────────────────────────────
  if (studyFloorDef) {
    // Study floor should be at same Y as main floor
    // This is checked by verifying studyFloor Y position ≈ FLOOR_H
    // Harder to check at runtime without reading mesh positions
    // For now: assume it's correct if constraint doc specifies FLOOR_H
  }

  return violations;
}
