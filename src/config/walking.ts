// walking.ts ── TS‑friendly helpers for the refactored physics stack
//------------------------------------------------------------
import * as THREE from 'three';
import { CollisionManager } from './collisionManager';
import { ThreeJSDrawing } from '../types';

//------------------------------------------------------------
// Utilities
//------------------------------------------------------------

/** Register a world mesh the avatar can stand on. */
export function addGround(threejsDrawing: ThreeJSDrawing, mesh: THREE.Mesh) {
  threejsDrawing.data.worldMeshes.push(mesh);
}

/** Register a static obstacle (mesh or pre‑built Box3). */
export function addObstacle(threejsDrawing: ThreeJSDrawing, source: THREE.Object3D | THREE.Box3) {
  if (source instanceof THREE.Box3) {
    threejsDrawing.data.staticBoxes.push(source);
  } else {
    const box = new THREE.Box3().setFromObject(source);
    source.userData.box = box;
    threejsDrawing.data.staticBoxes.push(box);
  }
}

/**
 * Create a ready‑to‑go CollisionManager for this level.
 * You call this once during setup, then call `update()` every frame.
 */
export function makeCollisionManager(
  threejsDrawing: ThreeJSDrawing,
  playerObj: THREE.Object3D,
  scene: THREE.Scene,
  opts: { debugRay?: boolean } = {},
) {
  const debugArrow = opts.debugRay
    ? new THREE.ArrowHelper()
    : undefined;

  if (debugArrow) scene.add(debugArrow);

  // Build and return the manager
  return new CollisionManager({
    player: playerObj,
    targets: { worldMeshes: threejsDrawing.data.worldMeshes, staticBoxes: threejsDrawing.data.staticBoxes, movingMeshes: threejsDrawing.data.movingMeshes },
    debugArrow,
  });
}

/**
 * Convenience animation‑loop wrapper.
 *
 * Example usage:
 * ```ts
 * const collision = makeCollisionManager(player, scene, { debugRay: true });
 *
 * renderer.setAnimationLoop((dt) => {
 *   collision.update();          // input + physics + collisions
 *   renderer.render(scene, cam);
 * });
 * ```
 */
export function runFrame(collision: CollisionManager) {
  collision.update();
}
