import * as THREE from 'three';
import { CollisionManager, checkCollision } from '../config/collisionManager';
import { ThreeJSDrawing } from '../threejsDrawing';

export function instantiateCollision(threejsDrawing: ThreeJSDrawing) {
    const collision = new CollisionManager({
        player:        (threejsDrawing.data.controls as { object: any }).object,
        worldMeshes:   (threejsDrawing.data.worldMeshes as THREE.Object3D[] | undefined)?.filter(
            (obj): obj is THREE.Mesh => obj instanceof THREE.Mesh
        ),
        staticBoxes:   (threejsDrawing.data.staticBoxes as THREE.Object3D[] | undefined)?.map(obj => {
            const box = new THREE.Box3();
            box.setFromObject(obj);
            return box;
        }),
        movingMeshes:  (threejsDrawing.data.movingMeshes as THREE.Object3D[] | undefined)?.filter(
            (obj): obj is THREE.Mesh => obj instanceof THREE.Mesh
        ),
        obstacleBoxes: (threejsDrawing.data.obstacleBoxes as THREE.Object3D[] | undefined)?.map(obj => {
            const box = new THREE.Box3();
            box.setFromObject(obj);
            return box;
        }),
        params: {
            playerSize: typeof threejsDrawing.sceneConfig?.playerSize === 'number' ? threejsDrawing.sceneConfig.playerSize : 1.0,
            stepDown: typeof threejsDrawing.sceneConfig?.stepDown === 'number' ? threejsDrawing.sceneConfig.stepDown : 1.0,
            gravity: typeof threejsDrawing.sceneConfig?.gravity === 'number' ? threejsDrawing.sceneConfig.gravity : 9.8 * 10,
            speed: typeof threejsDrawing.sceneConfig?.speed === 'number' ? threejsDrawing.sceneConfig.speed : 20.0,
            jumpVelocity: typeof threejsDrawing.sceneConfig?.jumpVelocity === 'number' ? threejsDrawing.sceneConfig.jumpVelocity : 50.0,
            checkCollisionFunc: (
                typeof threejsDrawing.sceneConfig?.checkCollisionFunc === 'function' &&
                threejsDrawing.sceneConfig.checkCollisionFunc.length >= 2
            )
                ? threejsDrawing.sceneConfig.checkCollisionFunc as (
                    playerSize: number,
                    position: THREE.Vector3,
                    obstacleBoxes?: THREE.Box3[],
                    ignore?: THREE.Box3 | null
                ) => boolean
                : checkCollision,
        }
    });

    collision.debugRayHelper = new THREE.ArrowHelper();
    (threejsDrawing.data.scene as THREE.Scene).add(collision.debugRayHelper)

    collision.lastGroundY         = undefined;
    collision.keyManager.canJump  = true;
    collision.velocity.set(0, 0, 0);

    threejsDrawing.data.collision = collision;
    threejsDrawing.data.keyManager = collision.keyManager;

    (threejsDrawing.data.controls as { object: { position: THREE.Vector3 } }).object.position.set(
        threejsDrawing.sceneConfig?.startPosition?.x ?? 0,
        threejsDrawing.sceneConfig?.startPosition?.y ?? 0,
        threejsDrawing.sceneConfig?.startPosition?.z ?? 0
    )

    threejsDrawing.data.ready = true;
}
