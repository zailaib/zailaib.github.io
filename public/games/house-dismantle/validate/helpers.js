/* House Dismantle — Validation Helpers */
import * as THREE from 'three';

/** Compute world-space AABB for a single mesh */
export function getWorldAABB(mesh) {
  if (!mesh.geometry) return new THREE.Box3();
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox.clone();
  mesh.updateWorldMatrix(true, false);
  box.applyMatrix4(mesh.matrixWorld);
  return box;
}

/** Intersection volume of two AABBs. Returns 0 if disjoint. */
export function intersectVolume(boxA, boxB) {
  const ix = Math.max(0, Math.min(boxA.max.x, boxB.max.x) - Math.max(boxA.min.x, boxB.min.x));
  const iy = Math.max(0, Math.min(boxA.max.y, boxB.max.y) - Math.max(boxA.min.y, boxB.min.y));
  const iz = Math.max(0, Math.min(boxA.max.z, boxB.max.z) - Math.max(boxA.min.z, boxB.min.z));
  return ix * iy * iz;
}

/** Volume of a Box3 */
export function boxVolume(box) {
  return (box.max.x - box.min.x) * (box.max.y - box.min.y) * (box.max.z - box.min.z);
}

/** Intersection volume / min(volA, volB). Returns 0–1. */
export function volumeRatio(boxA, boxB) {
  const iv = intersectVolume(boxA, boxB);
  if (iv === 0) return 0;
  return iv / Math.min(boxVolume(boxA), boxVolume(boxB));
}
