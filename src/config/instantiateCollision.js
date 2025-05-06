import { CollisionManager } from '../config/collisionManager.js';

export function instantiateCollision(threejsDrawing) {
    const collision = new CollisionManager({
        player:        threejsDrawing.data.controls.object,
        worldMeshes:   threejsDrawing.data.worldMeshes,
        staticBoxes:   threejsDrawing.data.staticBoxes,
        movingMeshes:  threejsDrawing.data.movingMeshes,
        obstacleBoxes: threejsDrawing.data.obstacleBoxes,
        params: {playerSize:  1.0, stepDown: 1.0, gravity: 9.8 * 10, speed: 20.0}
    });

    collision.lastGroundY         = undefined;
    collision.keyManager.canJump  = true;
    collision.velocity.set(0, 0, 0);

    threejsDrawing.data.collision = collision;
    threejsDrawing.data.keyManager = collision.keyManager;

    threejsDrawing.data.controls.object.position.set(threejsDrawing.sceneConfig.startPosition.x, threejsDrawing.sceneConfig.startPosition.y, threejsDrawing.sceneConfig.startPosition.z)

    threejsDrawing.data.ready = true;
}
