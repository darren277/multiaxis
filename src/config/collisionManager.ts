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

function isGroundHit(hit: THREE.Intersection) {
    let obj: THREE.Object3D | null = hit.object;
    while (obj) {
        if (obj.userData.isGround) return true;
        obj = obj.parent;
    }
    return false;
}

export function getYawObject(controls: any): THREE.Object3D {
    const yawObject =
      controls.object?.quaternion ? controls.object              // camera
    : controls?._controls?.object?.quaternion ? controls._controls.object
    : controls;

    return yawObject;
}

function applyInput(
    keyManager: KeyManager,
    qTmp: THREE.Quaternion,
    yawObject: THREE.Object3D,
    direction: THREE.Vector3,
    velocity: THREE.Vector3,
    dt: number,
    speed: number,
    turnSpeed: number,
    jumpVelocity: number,
) {
    if (keyManager.isShiftDown) {
        // rotate instead of move...
        if (keyManager.moveLeft) {
            qTmp.setFromAxisAngle(WORLD_Y,  turnSpeed * dt);
            yawObject.quaternion.premultiply(qTmp);
        }
        if (keyManager.moveRight) {
            qTmp.setFromAxisAngle(WORLD_Y, -turnSpeed * dt);
            yawObject.quaternion.premultiply(qTmp);
        }
        // (you could also implement forward/back when shift is down here)
    } else {
        // Normal WASD → world‐space velocity.x/z
        direction.z = Number(keyManager.moveBackward) - Number(keyManager.moveForward);
        direction.x = Number(keyManager.moveRight)   - Number(keyManager.moveLeft);
        direction.normalize();

        // build a local move vector and rotate it into world space
        const moveVector = new THREE.Vector3(direction.x, 0, direction.z).applyQuaternion(yawObject.quaternion);

        // scale by your speed
        velocity.x = moveVector.x * speed;
        velocity.z = moveVector.z * speed;
    }

    // jumping:
    if (keyManager.canJump && keyManager.jumpPressed) {
        velocity.y        = jumpVelocity;
        keyManager.canJump  = false;     // consume your jump
        keyManager.jumpPressed = false;  // reset the press
    }
}

const wrappedCheckCollision: typeof checkCollision = (
    playerSize: number,
    position: THREE.Vector3,
    obstacleBoxes: THREE.Box3[] | undefined,
    ignore: THREE.Box3 | null = null
) => checkCollision(playerSize, position, obstacleBoxes ?? [], ignore);

type CollisionManagerParams = {
    player?: THREE.Object3D,
    worldMeshes?: THREE.Mesh[],
    staticBoxes?: THREE.Box3[],
    movingMeshes?: THREE.Mesh[],
    obstacleBoxes?: THREE.Box3[],
    params?: {
        playerSize?: number,
        stepDown?: number,
        gravity?: number,
        speed?: number,
        jumpVelocity?: number,
        checkCollisionFunc?: typeof checkCollision
    }
}

export class CollisionManager {
    playerSize: number = 0.5; // default player size
    stepDown: number = 0.5;   // how far you can step down
    gravity: number = 9.81;  // gravity strength
    speed: number = 5;       // horizontal speed
    jumpVelocity: number = 5; // vertical jump speed
    checkCollisionFunc = checkCollision; // default collision function
    debugRayHelper = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 0), 1, 0xff0000);
    player: THREE.Object3D<THREE.Object3DEventMap>;
    worldMeshes: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>[];
    staticBoxes: THREE.Box3[];
    movingMeshes: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>[];
    obstacleBoxes: THREE.Box3[];
    velocity: THREE.Vector3;
    direction: THREE.Vector3;
    DOWN: THREE.Vector3;
    ray: THREE.Raycaster;
    clock: THREE.Clock;
    quatTmp: THREE.Quaternion;
    keyManager: KeyManager;
    lastGroundY: number | undefined; // last known ground Y position

    constructor(args?: CollisionManagerParams) {
        const {
            player = new THREE.Object3D(),
            worldMeshes = [],
            staticBoxes = [],
            movingMeshes = [],
            obstacleBoxes = [],
            params = {}
        } = args || {};

        this.player        = player;
        this.worldMeshes   = worldMeshes;
        this.staticBoxes   = staticBoxes;
        this.movingMeshes  = movingMeshes;
        this.obstacleBoxes = obstacleBoxes;
        this.lastGroundY = undefined;

        // unpack your tuning constants
        ({
            playerSize: this.playerSize = 0.5,
            stepDown: this.stepDown = 0.5,
            gravity: this.gravity = 9.81,
            speed: this.speed = 5,
            jumpVelocity: this.jumpVelocity = 5,
            checkCollisionFunc: this.checkCollisionFunc = wrappedCheckCollision,
        } = params);

        this.velocity   = new THREE.Vector3();
        this.direction  = new THREE.Vector3();
        this.DOWN       = new THREE.Vector3(0, -1, 0);
        this.ray        = new THREE.Raycaster();
        this.clock      = new THREE.Clock();
        this.quatTmp    = new THREE.Quaternion();
        this.keyManager = new KeyManager();

        // prime clock...
        this.clock.getDelta();
    }

    /** Call once per frame */
    update(controls: any, dt: number, obstacleIgnore: any = null) {
        //const dt         = Math.min(this.clock.getDelta(), 0.1);
        //const dt         = this.clock.getDelta();
        //console.log('dt (s):', dt.toFixed(3), 'vel.x:', this.velocity.x.toFixed(2), 'vel.y:', this.velocity.y.toFixed(2));

        const yawObject  = getYawObject(controls);
        const pos        = yawObject.position;
        const halfHeight = this.playerSize;

        // —— 1) handle rotation or movement input
        this._applyInput(controls, yawObject, dt);

        // —— 2) apply horizontal collision
        this._moveHorizontal(yawObject, dt, obstacleIgnore);

        // —— 3) apply gravity & vertical collision
        this._applyGravityAndGroundClamp(yawObject, pos, halfHeight, dt);

        // —— 4) refresh obstacle boxes
        this._updateObstacleBoxes();
    }

    _applyInput(controls: any, yawObject: THREE.Object3D, dt: number) {
        // copy your existing WASD / Shift-to-rotate logic here,
        // writing into this.velocity.x/z or yawObject.quaternion,
        // using this.direction and this.quatTmp…
        // then at the end velocity.x,z are set correctly.

        // apply input
        applyInput(
            this.keyManager,
            this.quatTmp,
            yawObject,
            this.direction,
            this.velocity,
            dt,
            this.speed,
            turnSpeed,
            this.jumpVelocity
        );
    }

    _moveHorizontal(yawObject: THREE.Object3D, dt: number, ignore: any = null) {
        const temp = new THREE.Vector3();
        // try X
        temp.copy(yawObject.position).addScaledVector(new THREE.Vector3(this.velocity.x,0,0), dt);
        if (!this.checkCollisionFunc(this.playerSize, temp, this.obstacleBoxes, ignore)) {
            yawObject.position.x = temp.x;
        }
        // try Z
        temp.copy(yawObject.position).addScaledVector(new THREE.Vector3(0,0,this.velocity.z), dt);
        if (!this.checkCollisionFunc(this.playerSize, temp, this.obstacleBoxes, ignore)) {
            yawObject.position.z = temp.z;
        }
    }
    
    _applyGravityAndGroundClamp(yawObject: THREE.Object3D, pos: THREE.Vector3, halfHeight: number, dt: number) {
        // Apply gravity (pos.y is updated)
        this.velocity.y -= this.gravity * dt;
        pos.y += this.velocity.y * dt;

        // Set up the down-ray from player's feet
        const footPos = yawObject.position.clone();
        // Assuming 'this.playerSize' is the distance from player center to feet (half total height)
        footPos.y -= (this.playerSize - 0.01); // Ray starts 0.01 units above the player's base

        console.log("--- Frame Update ---");
        console.log("Initial pos.y:", yawObject.position.y.toFixed(3), "vel.y:", this.velocity.y.toFixed(3));
        // After gravity:
        console.log("After gravity pos.y:", pos.y.toFixed(3), "vel.y:", this.velocity.y.toFixed(3));
        console.log("footPos.y for raycast:", footPos.y.toFixed(3));

        // DETACH from a moving platform if you walked off it (keep this logic)
        let plat;
        if (this.player.userData.currentPlatform) {
            plat = this.player.userData.currentPlatform;
            if (plat.userData.boxNeedsRefresh) { /* ... */ }
            const footBox = new THREE.Box3().setFromCenterAndSize(footPos, new THREE.Vector3(this.playerSize * 0.6, 0.1, this.playerSize * 0.6));
            if (!footBox.intersectsBox(plat.userData.box)) {
                this.player.userData.currentPlatform = null;
                if (plat.userData) plat.userData.rider = null; // Check if plat.userData exists
            }
        }

        this.ray.set(footPos, this.DOWN);
        if (this.lastGroundY === undefined) {
            this.ray.far = 50;
        } else {
            this.ray.far = this.stepDown + 1.5; // Should be sufficient for continuous surfaces
        }

        this.debugRayHelper.setDirection(this.ray.ray.direction);
        this.debugRayHelper.position.copy(this.ray.ray.origin); // ArrowHelper origin is position
        this.debugRayHelper.setLength(this.ray.far, 0.2, 0.1); // headLength, headWidth
        this.debugRayHelper.setColor(0xff0000); // Red

        //const rayTargets = this.player.userData.currentPlatform ? [...this.worldMeshes, this.player.userData.currentPlatform] : this.worldMeshes;
        //const hits = this.ray.intersectObjects(rayTargets, true);

        console.log('--- Frame Raycast ---');
        console.log('Player velocity.y:', this.velocity.y.toFixed(3));
        const currentWorldMeshes = this.worldMeshes.map(m => m.name || m.uuid);
        const currentPlatform = this.player.userData.currentPlatform ? (this.player.userData.currentPlatform.name || this.player.userData.currentPlatform.uuid) : 'None';
        console.log('Current worldMeshes:', currentWorldMeshes);
        console.log('Current platform:', currentPlatform);

        const rayTargets = this.player.userData.currentPlatform ? [...this.worldMeshes, this.player.userData.currentPlatform] : this.worldMeshes;
        console.log('Raycasting against:', rayTargets.map(m => m.name || m.uuid));

        const hits = this.ray.intersectObjects(rayTargets, true);
        console.log('Raw hits found:', hits.length);
        hits.forEach((h, index) => {
            const normalY = h.face ? h.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld)).normalize().y : null;
            console.log(`  Raw Hit <span class="math-inline">\{index\}\: obj\=</span>{h.object.name}, dist=<span class="math-inline">\{h\.distance\.toFixed\(3\)\}, pointY\=</span>{h.point.y.toFixed(3)}, normalY=${normalY ? normalY.toFixed(3) : 'N/A'}`);
        });

        const walkableHit = hits.find(i => {
            if (!i.face) return false;
            const n = i.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(i.object.matrixWorld)).normalize();
            return n.y > 0.01; // Consider a surface walkable if its normal is mostly upward
        });

        if (walkableHit) {
            console.log('Walkable hit found on:', walkableHit.object.name);
        } else if (hits.length > 0) {
            console.log('Hits occurred, but none were deemed walkable.');
        } else {
            console.log('No hits occurred at all.');
        }
        console.log('Condition (walkableHit && this.velocity.y <= 0):', (walkableHit && this.velocity.y <= 0));

        if (!walkableHit) {
            console.log("No walkable ground hit.");
        }

        if (walkableHit && this.velocity.y <= 0) {
            const floorY = walkableHit.point.y;
            const eyeY = floorY + halfHeight; // halfHeight is this.playerSize

            console.log("Hit object:", walkableHit.object.name, "isGround:", walkableHit.object.userData.isGround);
            console.log("Hit point.y:", walkableHit.point.y.toFixed(3));
            console.log("Calculated eyeY:", eyeY.toFixed(3));
            // Log yawObject.position.y right after it's set

            // --- Moving Platform Logic ---
            // Check if the hit object is a designated platform
            if (walkableHit.object.userData.isPlatform) {
                const currentHitPlatform = walkableHit.object;
                if (this.player.userData.currentPlatform !== currentHitPlatform) {
                    // Player has landed on a new platform
                    currentHitPlatform.userData.offsetY = (footPos.y - floorY); // Original calculation, check if still valid
                                                                             // Or, more simply: currentHitPlatform.userData.offsetY = yawObject.position.y - currentHitPlatform.position.y;
                    this.player.userData.currentPlatform = currentHitPlatform;
                    currentHitPlatform.userData.rider = this.player;
                }
                // If it's a moving platform, its own animation/movement should handle its base position.
                // Player's Y might need to be relative to platform's Y + offset.
                // For simplicity now, we'll snap to hit point, but true moving platform might need:
                // yawObject.position.y = currentHitPlatform.position.y + currentHitPlatform.userData.offsetY + halfHeight;
                // For a static curved mesh or one whose Y is directly raycast, eyeY is fine:
                yawObject.position.y = eyeY;

            } else {
                // Not a special platform, just regular ground (could be your curved mesh)
                this.player.userData.currentPlatform = null; // Ensure not attached to a platform if now on regular ground
                yawObject.position.y = eyeY;
            }

            this.velocity.y = 0;
            this.keyManager.canJump = true;
            this.lastGroundY = floorY;
            this.player.userData.currentGround = walkableHit.object;

        } else {
            // Player is in the air (no walkable hit below or moving upwards)
            this.player.userData.currentGround = null;
            // If not on a platform due to no hit, ensure platform is also cleared
            if (!walkableHit || walkableHit.object !== this.player.userData.currentPlatform) {
                 // this.player.userData.currentPlatform = null; // Already handled if hit non-platform
            }
            // canJump remains false if jump was initiated, or becomes false after leaving ground.
            // If player walks off edge, canJump would be true then become false once airborne for a bit.
            // The original jump logic handles setting canJump to false.
        }

        // Fallback ground plane (e.g., if player falls out of the world)
        const minY = GROUND_Y + halfHeight; // GROUND_Y is your absolute minimum floor
        if (yawObject.position.y < minY) {
            // Only snap to minY if not currently grounded on something else higher up
            if (
                !this.player.userData.currentGround ||
                (this.lastGroundY !== undefined && yawObject.position.y < (this.lastGroundY + halfHeight))
            ) {
                 yawObject.position.y = minY;
                 this.velocity.y = 0;
                 this.keyManager.canJump = true;
                 this.lastGroundY = GROUND_Y;
                 this.player.userData.currentGround = null; // Or a conceptual "fallback ground" object
                 this.player.userData.currentPlatform = null;
            }
        }
    }

    _updateObstacleBoxes() {
        this.obstacleBoxes.length = 0;
        this.staticBoxes   .forEach(b => this.obstacleBoxes.push(b));
        this.movingMeshes  .forEach(m => {
        if (!m.userData._box) m.userData._box = new THREE.Box3();
            m.userData._box.setFromObject(m).expandByVector(new THREE.Vector3(0,2,0));
            this.obstacleBoxes.push(m.userData._box);
        });
    }
}
