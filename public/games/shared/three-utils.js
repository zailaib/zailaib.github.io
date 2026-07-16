/* Shared Three.js Utilities for H5 Games
   Import from CDN: import * as THREE from 'three';
   Import this:  import { ... } from '/games/shared/three-utils.js';
*/

// ---- Standardized theme colors ----
export const DARK_BG = 0x0a0a14;
export const LIGHT_BG = 0xd8dae8;

// ---- Dispose helpers ----

/** Recursively dispose all geometries and materials in a group */
export function disposeMeshes(group) {
  group.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((m) => m.dispose());
    }
  });
}

/** Dispose and remove all children from a group */
export function disposeGroupChildren(group) {
  while (group.children.length > 0) {
    const child = group.children[0];
    disposeMeshes(child);
    group.remove(child);
  }
}

// ---- Starfield generator ----

/**
 * Create a starfield Points object.
 * @param {Object} opts
 * @param {number} opts.count - number of stars (default 200)
 * @param {number} opts.radius - inner radius for spherical / half-size for cube
 * @param {number} opts.radiusRange - additional random radius for spherical
 * @param {number} opts.color - THREE.Color-compatible (default 0x8899cc)
 * @param {number} opts.opacity - material opacity (default 0.7)
 * @param {number} opts.size - point size (default 0.04)
 * @param {'spherical'|'cube'|'rect'} opts.distribution
 * @param {number} opts.yMin - for 'rect' distribution
 * @param {number} opts.yMax - for 'rect' distribution
 */
export function createStarfield({
  count = 200,
  radius = 20,
  radiusRange = 25,
  color = 0x8899cc,
  opacity = 0.7,
  size = 0.04,
  distribution = 'spherical',
  yMin = 4,
  yMax = 12,
} = {}) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    if (distribution === 'spherical') {
      const r = radius + Math.random() * radiusRange;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    } else if (distribution === 'rect') {
      // Sky rectangle (history-timeline style)
      positions[i * 3]     = (Math.random() - 0.5) * radius;
      positions[i * 3 + 1] = yMin + Math.random() * (yMax - yMin);
      positions[i * 3 + 2] = (Math.random() - 0.5) * radiusRange;
    } else {
      // cube
      positions[i * 3]     = (Math.random() - 0.5) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * radius;
    }
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    size, color, transparent: true, opacity, depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

// ---- Resize handler ----

/**
 * Setup window resize handler. Returns cleanup function.
 */
export function setupResizeHandler(renderer, camera, container) {
  const handler = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}

// ---- Theme toggle ----

/**
 * Setup standardized theme toggle. Returns cleanup function.
 * @param {Object} opts
 * @param {THREE.Scene} opts.scene
 * @param {number} [opts.fogNear] - fog near distance (default 5)
 * @param {number} [opts.fogFar] - fog far distance (default 40)
 * @param {(light: boolean) => void} [opts.onThemeChange] - callback for per-app material updates
 */
export function setupThemeToggle({
  scene,
  fogNear = 5,
  fogFar = 40,
  onThemeChange,
} = {}) {
  const btn = document.getElementById('theme-btn');
  if (!btn) return () => {};

  const handler = () => {
    const light = document.body.classList.toggle('light');
    btn.textContent = light ? '\u{1F319}' : '\u{2600}\u{FE0F}';

    if (scene) {
      const bg = light ? LIGHT_BG : DARK_BG;
      scene.background = new THREE.Color(bg);
      scene.fog = new THREE.Fog(bg, fogNear, fogFar);
    }

    if (onThemeChange) onThemeChange(light);
  };

  btn.addEventListener('click', handler);
  return () => btn.removeEventListener('click', handler);
}
