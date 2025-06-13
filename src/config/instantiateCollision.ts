import { ArrowHelper } from 'three';
import { CollisionManager, checkCollision } from '../config/collisionManager';
import { ThreeJSDrawing } from '../threejsDrawing';

export function instantiateCollision(threejsDrawing: ThreeJSDrawing) {
    const collision = new CollisionManager({
        player:        (threejsDrawing.data.controls as { object: any }).object,
        worldMeshes:   threejsDrawing.data.worldMeshes,
        staticBoxes:   threejsDrawing.data.staticBoxes,
        movingMeshes:  threejsDrawing.data.movingMeshes,
        obstacleBoxes: threejsDrawing.data.obstacleBoxes,
        params: {
            playerSize: typeof threejsDrawing.sceneConfig?.playerSize === 'number' ? threejsDrawing.sceneConfig.playerSize : 1.0,
            stepDown: typeof threejsDrawing.sceneConfig?.stepDown === 'number' ? threejsDrawing.sceneConfig.stepDown : 1.0,
            gravity: typeof threejsDrawing.sceneConfig?.gravity === 'number' ? threejsDrawing.sceneConfig.gravity : 9.8 * 10,
            speed: typeof threejsDrawing.sceneConfig?.speed === 'number' ? threejsDrawing.sceneConfig.speed : 20.0,
            jumpVelocity: typeof threejsDrawing.sceneConfig?.jumpVelocity === 'number' ? threejsDrawing.sceneConfig.jumpVelocity : 50.0,
            checkCollisionFunc: typeof threejsDrawing.sceneConfig?.checkCollisionFunc === 'function'
                ? threejsDrawing.sceneConfig.checkCollisionFunc
                : checkCollision,
        }
    });

    collision.debugRayHelper = new ArrowHelper();
    threejsDrawing.data.scene.add(collision.debugRayHelper)

    collision.lastGroundY         = undefined;
    collision.keyManager.canJump  = true;
    collision.velocity.set(0, 0, 0);

    threejsDrawing.data.collision = collision;
    threejsDrawing.data.keyManager = collision.keyManager;

    threejsDrawing.data.controls.object.position.set(
        threejsDrawing.sceneConfig?.startPosition?.x ?? 0,
        threejsDrawing.sceneConfig?.startPosition?.y ?? 0,
        threejsDrawing.sceneConfig?.startPosition?.z ?? 0
    )

    threejsDrawing.data.ready = true;
}
