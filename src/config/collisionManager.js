import { Vector3, Raycaster, Clock, Quaternion, Box3 } from 'three';

export const WORLD_Y   = new Vector3(0, 1, 0);
export const WORLD_X   = new Vector3(1, 0, 0);
export const GROUND_Y  = 0.25; // height of the ground plane
export const turnSpeed = Math.PI / 2;      // 90 ° per second

export const groundRay = new Raycaster();

export const tempBox = new Box3();        // temporary box for the player
export const tempPosition = new Vector3(); // for calculating next pos

class KeyManager {
    constructor() {
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isShiftDown = false;
        this.canJump = true;
        this.jumpPressed = false;
        this.velocity = new Vector3();
    }
}

function checkCollision(playerSize, position, obstacleBoxes = [], ignore = null) {
    tempBox.setFromCenterAndSize(position, new Vector3(playerSize, playerSize * 2, playerSize));

    for (const box of obstacleBoxes) {
        if (box === ignore) continue;
        if (box.intersectsBox(tempBox)) {
            return true; // collision detected
        }
    }

    return false; // no collision
}

function isGroundHit(hit) {
    let obj = hit.object;
    while (obj) {
        if (obj.userData.isGround) return true;
        obj = obj.parent;
    }
    return false;
}

export function getYawObject(controls) {
    const yawObject =
      controls.object?.quaternion ? controls.object              // camera
    : controls?._controls?.object?.quaternion ? controls._controls.object
    : controls;

    return yawObject;
}

function applyInput(
    keyManager,
    qTmp,
    yawObject,
    direction,
    velocity,
    dt,
    speed,
    turnSpeed,
    jumpVelocity,
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
        const moveVector = new Vector3(direction.x, 0, direction.z).applyQuaternion(yawObject.quaternion);

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

export class CollisionManager {
    constructor({ player, worldMeshes, staticBoxes, movingMeshes, obstacleBoxes, params }) {
        this.player        = player;
        this.worldMeshes   = worldMeshes;
        this.staticBoxes   = staticBoxes;
        this.movingMeshes  = movingMeshes;
        this.obstacleBoxes = obstacleBoxes;

        // unpack your tuning constants
        ({ playerSize: this.playerSize, stepDown: this.stepDown, gravity: this.gravity, speed: this.speed} = params);

        this.velocity   = new Vector3();
        this.direction  = new Vector3();
        this.DOWN       = new Vector3(0, -1, 0);
        this.ray        = new Raycaster();
        this.clock      = new Clock();
        this.quatTmp    = new Quaternion();
        this.keyManager = new KeyManager();
        this.jumpVelocity = 50;

        // prime clock...
        this.clock.getDelta();
    }

    /** Call once per frame */
    update(controls, dt, obstacleIgnore = null) {
        //const dt         = Math.min(this.clock.getDelta(), 0.1);
        //const dt         = this.clock.getDelta();
        console.log('dt (s):', dt.toFixed(3), 'vel.x:', this.velocity.x.toFixed(2), 'vel.y:', this.velocity.y.toFixed(2));

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

    _applyInput(controls, yawObject, dt) {
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

    _moveHorizontal(yawObject, dt, ignore) {
        const temp = new Vector3();
        // try X
        temp.copy(yawObject.position).addScaledVector(new Vector3(this.velocity.x,0,0), dt);
        if (!checkCollision(this.playerSize, temp, this.obstacleBoxes, ignore)) {
            yawObject.position.x = temp.x;
        }
        // try Z
        temp.copy(yawObject.position).addScaledVector(new Vector3(0,0,this.velocity.z), dt);
        if (!checkCollision(this.playerSize, temp, this.obstacleBoxes, ignore)) {
            yawObject.position.z = temp.z;
        }
    }

    _applyGravityAndGroundClamp(yawObject, pos, halfHeight, dt) {
        // apply gravity
        this.velocity.y -= this.gravity * dt;
        pos.y           += this.velocity.y * dt;

        // set up the down-ray
        const footPos = pos.clone().subScalar(halfHeight - 0.01);
        this.ray.set(footPos, this.DOWN);

        // adaptive far
        if (this.lastGroundY === undefined) {
            // first frame: look far down
            this.ray.far = 50;
        } else {
            this.ray.far = this.stepDown + Math.max(this.lastGroundY - footPos.y, 0);
        }

        // raycast
        const hits = this.ray.intersectObjects(this.worldMeshes, true);
        const hit = hits[0]; // first hit
        if (hit && this.velocity.y <= 0) {
            const floorY = hit.point.y;
            const mesh   = hit.object;
            const gap    = footPos.y - floorY;
            const eyeY   = floorY + halfHeight;

            // — SNAP ON ANY GROUND MESH —
            if (isGroundHit(hit)) {
                // you’re on the floor plane → always clamp
                yawObject.position.y    = eyeY;
                this.velocity.y         = 0;
                this.keyManager.canJump = true;
                this.lastGroundY        = floorY;
            }
            // — OTHERWISE, handle little steps (optional) —
            else {
                const gap = footPos.y - floorY;
                if (gap <= this.stepDown + 0.01) {
                    yawObject.position.y    = eyeY;
                    this.velocity.y         = 0;
                    this.keyManager.canJump = true;
                    this.lastGroundY        = floorY;
                }
            }
        }

        const minY = GROUND_Y + halfHeight;
        if (yawObject.position.y < minY) {
            yawObject.position.y    = minY;
            this.velocity.y         = 0;
            this.keyManager.canJump = true;
            this.lastGroundY        = GROUND_Y;
        }
    }

    _updateObstacleBoxes() {
        this.obstacleBoxes.length = 0;
        this.staticBoxes   .forEach(b => this.obstacleBoxes.push(b));
        this.movingMeshes  .forEach(m => {
        if (!m.userData._box) m.userData._box = new Box3();
            m.userData._box.setFromObject(m).expandByVector(new Vector3(0,2,0));
            this.obstacleBoxes.push(m.userData._box);
        });
    }
}
