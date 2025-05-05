import { Vector3, Raycaster, Clock, Quaternion, Box3 } from 'three';

export function getYawObject(controls) {
    const yawObject =
      controls.object?.quaternion ? controls.object              // camera
    : controls?._controls?.object?.quaternion ? controls._controls.object
    : controls;

    return yawObject;
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
        this.canJump    = true;
    }

    /** Call once per frame */
    update(controls, obstacleIgnore = null) {
        const dt         = this.clock.getDelta();
        const yawObject  = getYawObject(controls);
        const pos        = yawObject.position;
        const halfHeight = this.playerSize;

        // —— 1) handle rotation or movement input
        this._applyInput(controls, yawObject, dt);

        // —— 2) apply horizontal collision
        this._moveHorizontal(yawObject, dt, obstacleIgnore);

        // —— 3) apply gravity & vertical collision
        this._applyGravityAndGroundClamp(yawObject, pos, halfHeight);

        // —— 4) refresh obstacle boxes
        this._updateObstacleBoxes();
    }

    _applyInput(controls, yawObject, dt) {
        // copy your existing WASD / Shift-to-rotate logic here,
        // writing into this.velocity.x/z or yawObject.quaternion,
        // using this.direction and this.quatTmp…
        // then at the end velocity.x,z are set correctly.
    }

    _moveHorizontal(yawObject, dt, ignore) {
        const temp = new Vector3();
        // try X
        temp.copy(yawObject.position).addScaledVector(new Vector3(this.velocity.x,0,0), dt);
        if (!checkCollision(temp, this.obstacleBoxes, ignore)) {
            yawObject.position.x = temp.x;
        }
        // try Z
        temp.copy(yawObject.position).addScaledVector(new Vector3(0,0,this.velocity.z), dt);
        if (!checkCollision(temp, this.obstacleBoxes, ignore)) {
            yawObject.position.z = temp.z;
        }
    }

    _applyGravityAndGroundClamp(yawObject, pos, halfHeight) {
        // apply gravity
        this.velocity.y -= this.gravity * this.clock.getDelta();
        pos.y           += this.velocity.y * this.clock.getDelta();

        // set up the down-ray
        const footPos = pos.clone().subScalar(halfHeight - 0.01);
        this.ray.set(footPos, this.DOWN);

        // adaptive far
        this.ray.far = this.stepDown + Math.max((this.lastGroundY||0) - footPos.y, 0);

        // raycast
        const hit = this.ray.intersectObjects(this.worldMeshes, true)[0];
        if (hit && this.velocity.y <= 0) {
            const gap = footPos.y - hit.point.y;
            if (gap <= this.stepDown + 0.01) {
                // we’re on the ground
                yawObject.position.y = hit.point.y + halfHeight;
                this.velocity.y      = 0;
                this.canJump         = true;
                this.lastGroundY     = hit.point.y;
            }
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
