import * as THREE from 'three';
import { addObstacle } from './walking';

export const WORLD_Y   = new THREE.Vector3(0, 1, 0);
export const WORLD_X   = new THREE.Vector3(1, 0, 0);
export const GROUND_Y  = 0.25; // height of the ground plane
export const turnSpeed = Math.PI / 2;      // 90 ° per second

export const groundRay = new THREE.Raycaster();

export const tempBox = new THREE.Box3();        // temporary box for the player
export const tempPosition = new THREE.Vector3(); // for calculating next pos

class KeyManager {
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
    isShiftDown = false;
    canJump = true;          // can jump if on the ground
    jumpPressed = false;     // jump was pressed this frame
    velocity = new THREE.Vector3(); // current velocity of the player

    constructor() {
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isShiftDown = false;
        this.canJump = true;
        this.jumpPressed = false;
        this.velocity = new THREE.Vector3();
    }
}

export function extractPerTriangle(staticBoxes: THREE.Box3[], mesh: THREE.Mesh) {
    const tmpBox = new THREE.Box3();
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

    mesh.geometry = mesh.geometry.toNonIndexed();   // ensure positions are flat

    const pos = mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
        a.fromBufferAttribute(pos, i    ).applyMatrix4(mesh.matrixWorld);
        b.fromBufferAttribute(pos, i + 1).applyMatrix4(mesh.matrixWorld);
        c.fromBufferAttribute(pos, i + 2).applyMatrix4(mesh.matrixWorld);

        tmpBox.setFromPoints([a, b, c]);
        if (tmpBox.max.y - tmpBox.min.y > 3) continue; // skip tall walls

        addObstacle(staticBoxes, tmpBox.clone() as any);       // push a tiny box
        spatialHashStaticBoxes([tmpBox.clone()]);
    }
}

/*
Spatial hash keeps just 9 tiny lists
Store every obstacle in a hashed grid keyed by 2m tiles
*/

const tileSize = 2;
const spatial = new Map();
// Map<"x,z" , Box3[]>

export function spatialHashStaticBoxes(staticBoxes: THREE.Box3[]) {
    staticBoxes.forEach(box => {
        const minX = Math.floor(box.min.x / tileSize);
        const maxX = Math.floor(box.max.x / tileSize);
        const minZ = Math.floor(box.min.z / tileSize);
        const maxZ = Math.floor(box.max.z / tileSize);

        for (let gx = minX; gx <= maxX; gx++) {
            for (let gz = minZ; gz <= maxZ; gz++) {
                const key = `${gx},${gz}`;
                (spatial.get(key) || spatial.set(key, []).get(key)).push(box);
            }
        }
    });
}

function nearbyBoxes(px: number, pz: number) {
    const gx = Math.floor(px / tileSize);
    const gz = Math.floor(pz / tileSize);
    const out: THREE.Box3[] = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            const cell = spatial.get(`${gx+dx},${gz+dz}`);
            if (cell) out.push(...cell);
        }
    }
    return out;
}


export function checkCollisionSpatialHashes(
    playerSize: number,
    position: THREE.Vector3,
    obstacleBoxes: THREE.Box3[] = [],
    ignore: THREE.Box3 | null = null
) {
    tempBox.setFromCenterAndSize(position, new THREE.Vector3(playerSize, playerSize * 2, playerSize));

    const boxes: THREE.Box3[] = nearbyBoxes(position.x, position.z);

    for (const box of boxes) {
        if (box === ignore) continue;
        if (box.intersectsBox(tempBox)) return true;
    }

    return false; // no collision
}

export function checkCollision(
    playerSize: number,
    position: THREE.Vector3,
    obstacleBoxes: THREE.Box3[] = [],
    ignore: THREE.Box3 | null = null
) {
    tempBox.setFromCenterAndSize(position, new THREE.Vector3(playerSize, playerSize * 2, playerSize));

    const boxes: THREE.Box3[] = obstacleBoxes;

    for (const box of boxes) {
        if (box === ignore) continue;
        if (box.intersectsBox(tempBox)) return true;
    }

    return false; // no collision
}

// ----------------------
// 1. Config
// ----------------------
// Designers can tweak these numbers in one place (or load them from JSON at runtime)
export const PhysicsConfig = {
  PLAYER_SIZE: 0.5,      // avatar half‑height
  STEP_DOWN:   0.5,      // curb you can step off without falling
  GRAVITY:     9.81,     // m/s²
  SPEED:       5,        // walk speed (m/s)
  TURN_SPEED:  Math.PI,  // rad/s
  JUMP_VELOCITY: 5,      // m/s (initial upward impulse)
} as const;

// ----------------------
// 2. Math helpers – one‑time temp vectors to avoid GC pressure
// ----------------------
const V_TEMP_A = new THREE.Vector3();
const V_TEMP_B = new THREE.Vector3();
const DOWN     = new THREE.Vector3(0, -1, 0);

// ----------------------
// 3. InputManager – turns keyboard state into a direction vector + jump flag
// ----------------------
export class InputManager {
  public readonly direction = new THREE.Vector3();
  public jumpRequested = false;
  public canJump = false;

  private readonly keys: Record<string, boolean> = {};

  constructor(private readonly doc: Document = document) {
    this._bind();
  }

  private _bind() {
    this.doc.addEventListener('keydown', e => this.keys[e.code] = true);
    this.doc.addEventListener('keyup',   e => this.keys[e.code] = false);
  }

  update() {
    // forward/back & strafe left/right (local XZ plane)
    const forward = (this.keys['KeyW'] ? 1 : 0) - (this.keys['KeyS'] ? 1 : 0);
    const strafe  = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);

    this.direction.set(strafe, 0, forward);
    if (this.direction.lengthSq() > 0) this.direction.normalize();

    // space bar jump
    if (this.keys['Space'] && this.canJump) {
      this.jumpRequested = true;
      this.canJump = false;
    }
  }

  /** Returns true exactly once when a jump was requested. */
  consumeJump(): boolean {
    if (this.jumpRequested) {
      this.jumpRequested = false;
      return true;
    }
    return false;
  }
}

// ----------------------
// 4. PhysicsSystem – owns the velocity vector, applies gravity & jumping
// ----------------------
export class PhysicsSystem {
  public readonly velocity = new THREE.Vector3();

  constructor(private readonly cfg = PhysicsConfig) {}

  applyHorizontal(dir: THREE.Vector3) {
    this.velocity.x = dir.x * this.cfg.SPEED;
    this.velocity.z = dir.z * this.cfg.SPEED;
  }

  applyGravity(dt: number) {
    this.velocity.y -= this.cfg.GRAVITY * dt;
  }

  jump() {
    this.velocity.y = this.cfg.JUMP_VELOCITY;
  }
}

// ----------------------
// 5. CollisionSystem – all geometric tests live here
// ----------------------
export interface CollisionTargets {
  worldMeshes: THREE.Mesh[];   // things you can walk on
  staticBoxes: THREE.Box3[];   // walls, rocks, buildings
  movingMeshes: THREE.Mesh[];  // lifts, doors – recomputed each frame
}

export class CollisionSystem {
  private readonly obstacleBoxes: THREE.Box3[] = [];
  private readonly ray = new THREE.Raycaster(undefined, DOWN.clone());

  constructor(private readonly cfg = PhysicsConfig, private readonly dbg?: THREE.ArrowHelper) {}

  /** Rebuilds the list of obstacle boxes (call once per frame _before_ movement). */
  refreshObstacles(targets: CollisionTargets) {
    this.obstacleBoxes.length = 0;

    // static AABBs
    targets.staticBoxes.forEach(b => this.obstacleBoxes.push(b));

    // dynamic – reuse/create boxes on the mesh's userData to avoid reallocs
    targets.movingMeshes.forEach(m => {
      let box = (m.userData._box as THREE.Box3) || new THREE.Box3();
      m.userData._box = box;
      box.setFromObject(m);
      this.obstacleBoxes.push(box);
    });
  }

  /** Cheap AABB‑point test (player represented by a point for horiz. collision). */
  private _collides(pt: THREE.Vector3): boolean {
    for (let i = 0; i < this.obstacleBoxes.length; i++) {
      if (this.obstacleBoxes[i].containsPoint(pt)) return true;
    }
    return false;
  }

  /** Slide along X then Z, updating the player's x/z if no collision. */
  slideHorizontal(player: THREE.Object3D, vel: THREE.Vector3, dt: number) {
    // test X
    V_TEMP_A.copy(player.position).addScaledVector(V_TEMP_B.set(vel.x, 0, 0), dt);
    if (!this._collides(V_TEMP_A)) player.position.x = V_TEMP_A.x;

    // test Z
    V_TEMP_A.copy(player.position).addScaledVector(V_TEMP_B.set(0, 0, vel.z), dt);
    if (!this._collides(V_TEMP_A)) player.position.z = V_TEMP_A.z;
  }

  /**
   * Ground detection & snapping. Sets canJump(true) when landed.
   */
  groundClamp(player: THREE.Object3D, vel: THREE.Vector3, worldMeshes: THREE.Mesh[], dt: number, canJump: (v: boolean) => void) {
    // ray origin: just above feet
    V_TEMP_A.copy(player.position);
    V_TEMP_A.y -= (this.cfg.PLAYER_SIZE - 0.01);
    this.ray.ray.origin.copy(V_TEMP_A);

    // ray length covers stepDown + any extra fall this frame
    this.ray.far = this.cfg.STEP_DOWN + Math.abs(vel.y * dt) + 0.2;

    // optional debug arrow
    if (this.dbg) {
      this.dbg.position.copy(V_TEMP_A);
      this.dbg.setLength(this.ray.far);
    }

    const hits = this.ray.intersectObjects(worldMeshes, true);
    const walkable = hits.find(h => {
      if (!h.face) return false;
      const n = h.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize();
      return n.y > 0.01; // upward‑facing surface
    });

    if (walkable && vel.y <= 0) {
      player.position.y = walkable.point.y + this.cfg.PLAYER_SIZE;
      vel.y = 0;
      canJump(true);
    }
  }
}

// ----------------------
// 6. CollisionManager – coordinates everything each frame
// ----------------------
export interface CollisionManagerArgs {
  player: THREE.Object3D;      // the avatar/camera wrapper
  targets: CollisionTargets;   // scene geometry
  debugArrow?: THREE.ArrowHelper;
}

export class CollisionManager {
  private readonly input = new InputManager();
  private readonly physics = new PhysicsSystem();
  private readonly collision: CollisionSystem;
  private readonly clock = new THREE.Clock();
  public player: THREE.Object3D; // the avatar/camera wrapper

  constructor(private readonly args: CollisionManagerArgs) {
    this.collision = new CollisionSystem(PhysicsConfig, args.debugArrow);

    // For backwards compatibility, store the player object
    this.player = args.player;
  }

  public get keyManager() {
    return this.input; 
  }

  /** Call from render loop. */
  update() {
    const dt = Math.min(this.clock.getDelta(), 0.05); // clamp big steps

    // 1. INPUT → direction vector & jump flag
    this.input.update();

    // 2. PHYSICS – horizontal movement from input
    this.physics.applyHorizontal(this.input.direction);

    // 3. JUMP impulse
    if (this.input.consumeJump()) this.physics.jump();

    // 4. GRAVITY continuous acceleration
    this.physics.applyGravity(dt);

    // 5. COLLISIONS – refresh dynamic boxes first
    this.collision.refreshObstacles(this.args.targets);

    //    5a. horizontal slide
    this.collision.slideHorizontal(this.args.player, this.physics.velocity, dt);

    //    5b. vertical move (integrate Y) then clamp to ground
    this.args.player.position.y += this.physics.velocity.y * dt;
    this.collision.groundClamp(
      this.args.player,
      this.physics.velocity,
      this.args.targets.worldMeshes,
      dt,
      v => this.input.canJump = v,
    );
  }
}
