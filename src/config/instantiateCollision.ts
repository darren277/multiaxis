import * as THREE from 'three';
import { CollisionManager } from '../config/collisionManager';
import { ThreeJSDrawing } from '../threejsDrawing';

export function instantiateCollision(threejsDrawing: ThreeJSDrawing) {
    const playerObject = (threejsDrawing.data.controls as { object: any }).object;

    const worldMeshes = (threejsDrawing.data.worldMeshes as THREE.Object3D[] | undefined)?.filter(
        (obj): obj is THREE.Mesh => obj instanceof THREE.Mesh
    ) ?? [];

    const staticBoxes = (threejsDrawing.data.staticBoxes as THREE.Object3D[] | undefined)?.map(obj => {
        const box = new THREE.Box3();
        box.setFromObject(obj);
        return box;
    }) ?? [];

    const movingMeshes = (threejsDrawing.data.movingMeshes as THREE.Object3D[] | undefined)?.filter(
        (obj): obj is THREE.Mesh => obj instanceof THREE.Mesh
    ) ?? [];

    const debugRayHelper = new THREE.ArrowHelper();
    (threejsDrawing.data.scene as THREE.Scene).add(debugRayHelper);

    const collision = new CollisionManager({
        player: playerObject,
        targets: {
        worldMeshes,
        staticBoxes,
        movingMeshes
        },
        debugArrow: debugRayHelper
    });

    // Optional: override config if needed (PhysicsConfig is currently fixed, but could be made dynamic)
    // You can add code here to modify PhysicsConfig directly if using from JSON

    threejsDrawing.data.collision = collision;

    playerObject.position.set(
        threejsDrawing.sceneConfig?.startPosition?.x ?? 0,
        threejsDrawing.sceneConfig?.startPosition?.y ?? 0,
        threejsDrawing.sceneConfig?.startPosition?.z ?? 0
    );

    threejsDrawing.data.ready = true;
}
