import * as THREE from 'three';
import { addObstacle } from './walking';
import { ThreeJSDrawing } from '../threejsDrawing';

export const WORLD_Y   = new THREE.Vector3(0, 1, 0);
export const WORLD_X   = new THREE.Vector3(1, 0, 0);
//export const GROUND_Y  = 0.25; // height of the ground plane
export const GROUND_Y  = 1.0;
export const turnSpeed = Math.PI / 2;      // 90 ° per second

export const groundRay = new THREE.Raycaster();

export const tempBox = new THREE.Box3();        // temporary box for the player
export const tempPosition = new THREE.Vector3(); // for calculating next pos

function isGroundHit(hit: THREE.Intersection) {
    let obj: THREE.Object3D | null = hit.object;
    while (obj) {
        if (obj.userData.isGround) return true;
        obj = obj.parent;
    }
    return false;
}

function faceNormal(hit: THREE.Intersection): THREE.Vector3 {
    if (!hit.face) return new THREE.Vector3();
    const n = hit.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize();
    return n; // upward‑facing surface
}

export function getYawObject(controls: any): THREE.Object3D {
    const yawObject =
      controls.object?.quaternion ? controls.object              // camera
    : controls?._controls?.object?.quaternion ? controls._controls.object
    : controls;

    return yawObject;
}

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

export function extractPerTriangle(threejsDrawing: ThreeJSDrawing, mesh: THREE.Mesh, scene: THREE.Scene) {
    mesh.updateMatrixWorld();

    const tmpBox = new THREE.Box3();
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

    mesh.geometry = mesh.geometry.toNonIndexed();   // ensure positions are flat

    const pos = mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
        a.fromBufferAttribute(pos, i    ).applyMatrix4(mesh.matrixWorld);
        b.fromBufferAttribute(pos, i + 1).applyMatrix4(mesh.matrixWorld);
        c.fromBufferAttribute(pos, i + 2).applyMatrix4(mesh.matrixWorld);

        tmpBox.setFromPoints([a, b, c]);

        //if (tmpBox.max.y - tmpBox.min.y > 3) continue; // skip tall walls

        addObstacle(threejsDrawing, tmpBox.clone() as any, scene);       // push a tiny box
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

export function nearbyBoxes(px: number, pz: number) {
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
  PLAYER_SIZE: 1.5,      // avatar half‑height
  PLAYER_HEIGHT: 3.0,    // avatar full height
  STEP_DOWN:   0.5,      // curb you can step off without falling
  GRAVITY:     9.81,     // m/s²
  SPEED:       20,       // walk speed (m/s)
  TURN_SPEED:  Math.PI,  // rad/s
  //JUMP_VELOCITY: 20,      // m/s (initial upward impulse)
  JUMP_VELOCITY: 12,      // m/s (initial upward impulse)
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

  public readonly keys: Record<string, boolean> = {};
  
  public setKeyState(code: string, isPressed: boolean) {
    this.keys[code] = isPressed;
  }

  constructor(private readonly doc: Document = document) {
    this._bind();
  }

  get isShiftDown() {
    return this.keys['ShiftLeft'] || this.keys['ShiftRight'];
  }

  private _bind() {
    this.doc.addEventListener('keydown', e => this.setKeyState(e.code, true));
    this.doc.addEventListener('keyup',   e => this.setKeyState(e.code, false));
  }

  update(controls?: any) {
    // forward/back & strafe left/right (local XZ plane)
    const forward = ((this.keys['KeyW'] || this.keys['ArrowUp']) ? 1 : 0) - ((this.keys['KeyS'] || this.keys['ArrowDown']) ? 1 : 0);
    let strafe  = ((this.keys['KeyA'] || this.keys['ArrowLeft']) ? 1 : 0) - ((this.keys['KeyD'] || this.keys['ArrowRight']) ? 1 : 0);

    // If rotating POV with Shift + Arrow keys, prevent strafe
    if (this.isShiftDown && (this.keys['ArrowLeft'] || this.keys['ArrowRight'])) {
        strafe = 0;
    }

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

  rotateY(yawObject: THREE.Object3D, angle: number) {
    yawObject.rotation.y += angle;
    yawObject.updateMatrixWorld(); // ensure the new rotation is applied
  }
}

function getCameraRelativeDirection(cameraObj: THREE.Object3D, inputDir: THREE.Vector3): THREE.Vector3 {
  const forward = new THREE.Vector3();
  cameraObj.getWorldDirection(forward);
  forward.y = 0; forward.normalize();

  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  return new THREE.Vector3()
    .addScaledVector(forward, inputDir.z)
    .addScaledVector(right, inputDir.x);
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
  /* ─── fields ─────────────────────────────────────────────────── */
  private readonly obstacleBoxes: THREE.Box3[] = [];
  private readonly ray = new THREE.Raycaster(undefined, DOWN.clone());
  private lastGroundY?: number;

  constructor(
    private readonly cfg  = PhysicsConfig,
    private readonly dbg?: THREE.ArrowHelper
  ) {}

  /* ─── public API ──────────────────────────────────────────────── */
  refreshObstacles(t: CollisionTargets) {
    this.obstacleBoxes.length = 0;
    t.staticBoxes .forEach(b => this.obstacleBoxes.push(b));
    t.movingMeshes.forEach(m => this.obstacleBoxes.push(this._boxOf(m)));
  }

  slideHorizontal(p: THREE.Object3D, v: THREE.Vector3, dt: number) {
    if (!this._collides(this._nextPos(p, v.x, 0, dt))) p.position.x += v.x * dt;
    if (!this._collides(this._nextPos(p, 0, v.z, dt))) p.position.z += v.z * dt;
  }

  groundClamp(
    p: THREE.Object3D, v: THREE.Vector3, meshes: THREE.Mesh[],
    dt: number, setCanJump: (b:boolean)=>void
  ) {
    this._integrateY(p, v, dt);
    const foot = this._setRayFromFeet(p);
    this._showDebugRay();

    this._maybeDetach(p, foot);
    const hit = this._firstWalkableHit(p, meshes);

    hit && v.y <= 0
      ? this._land(p, v, hit, setCanJump)
      : this._clampToPlane(p, v, setCanJump);
  }

  /* ─── helpers (<5 lines each) ─────────────────────────────────── */

  /** single AABB for moving mesh */
  private _boxOf(m: THREE.Mesh) {
    return (m.userData._box ||= new THREE.Box3()).setFromObject(m);
  }

  private _nextPos(p: THREE.Object3D, dx=0, dz=0, dt=0) {
    return p.position.clone().addScaledVector(new THREE.Vector3(dx, 0, dz), dt);
  }

  private _collides(pt: THREE.Vector3) {
    return this.obstacleBoxes.some(b => b.containsPoint(pt));
  }

  private _integrateY(p: THREE.Object3D, v: THREE.Vector3, dt: number) {
    v.y -= this.cfg.GRAVITY * dt;
    p.position.y += v.y * dt;
  }

  private _setRayFromFeet(p: THREE.Object3D) {
    const o = V_TEMP_A.copy(p.position);
    o.y -= this.cfg.PLAYER_SIZE - 0.01;
    this.ray.ray.origin.copy(o);
    this.ray.far = 2;                         // ← test value
    return o;
  }

  private _showDebugRay() {
    if (!this.dbg) return;
    this.dbg.position.copy(this.ray.ray.origin);
    this.dbg.setLength(this.ray.far);
  }

  private _maybeDetach(p: THREE.Object3D, foot: THREE.Vector3) {
    const plat = p.userData.currentPlatform;
    if (!plat) return;
    const box = new THREE.Box3().setFromCenterAndSize(
      foot, new THREE.Vector3(this.cfg.PLAYER_SIZE*0.6,0.1,this.cfg.PLAYER_SIZE*0.6)
    );
    if (!box.intersectsBox(plat.userData.box)) {
      p.userData.currentPlatform = null;
      plat.userData.rider = null;
    }
  }

  private _rayTargets(p: THREE.Object3D, meshes: THREE.Mesh[]) {
    return p.userData.currentPlatform
      ? [...meshes, p.userData.currentPlatform]
      : meshes;
  }

  private _firstWalkableHit(p: THREE.Object3D, meshes: THREE.Mesh[]) {
    return this.ray.intersectObjects(this._rayTargets(p, meshes), true)
      .find(h => isGroundHit(h) && faceNormal(h).y > 0.01);
  }

  private _land(
    p: THREE.Object3D, v: THREE.Vector3,
    hit: THREE.Intersection, setCanJump:(b:boolean)=>void
  ) {
    p.position.y = hit.point.y + this.cfg.PLAYER_SIZE;
    v.y = 0;  setCanJump(true);

    if (hit.object.userData.isPlatform) {
      p.userData.currentPlatform = hit.object;
      hit.object.userData.rider = p;
    } else p.userData.currentPlatform = null;

    p.userData.currentGround = hit.object;
    this.lastGroundY = hit.point.y;
  }

  private _clampToPlane(
    p: THREE.Object3D, v: THREE.Vector3, setCanJump:(b:boolean)=>void
  ) {
    const minY = GROUND_Y + this.cfg.PLAYER_SIZE;
    if (p.position.y < minY) {
      p.position.y = minY; v.y = 0; setCanJump(true);
      p.userData.currentPlatform = null; p.userData.currentGround = null;
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
  update(controls?: any, dt?: number, ignore: any = null) {
    const yawObject = getYawObject(controls);

    const delta = dt ?? Math.min(this.clock.getDelta(), 0.05); // clamp big steps

    // 1. INPUT → direction vector & jump flag
    this.input.update(controls);

    // 2. PHYSICS – horizontal movement from input
    const cameraDir = getCameraRelativeDirection(yawObject, this.input.direction);
    this.physics.applyHorizontal(cameraDir);

    // Apply rotation if shift key and left/right arrows are pressed
    if (this.input.isShiftDown && (this.input.keys['ArrowLeft'] || this.input.keys['ArrowRight'])) {
        const angle = (this.input.keys['ArrowRight'] ? -1 : 1) * turnSpeed * delta;
        this.physics.rotateY(yawObject, angle);
    }

    // 3. JUMP impulse
    if (this.input.consumeJump()) {
        this.physics.jump();
    }

    // 4. GRAVITY continuous acceleration
    this.physics.applyGravity(delta);

    // 5. COLLISIONS – refresh dynamic boxes first
    this.collision.refreshObstacles(this.args.targets);

    //    5a. horizontal slide
    this.collision.slideHorizontal(yawObject, this.physics.velocity, delta);

    //    5b. vertical move (integrate Y) then clamp to ground
    yawObject.position.y += this.physics.velocity.y * delta;
    this.collision.groundClamp(
      yawObject,
      this.physics.velocity,
      this.args.targets.worldMeshes,
      delta,
      v => this.input.canJump = v,
    );
  }
}
