import { Mesh, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, BoxGeometry, SphereGeometry } from 'three';

export function drawWalls(scene, textureLoader) {
    // Create a "brick" material for walls or cubes
    const cubeMat = new MeshStandardMaterial({
        roughness: 0.7,
        color: 0xffffff,
        bumpScale: 1,
        metalness: 0.2
    });

    textureLoader.load('textures/brick_diffuse.jpg', (map) => {
        map.wrapS = RepeatWrapping;
        map.wrapT = RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set(1, 1);
        map.colorSpace = SRGBColorSpace;
        cubeMat.map = map;
        cubeMat.needsUpdate = true;
    });

    textureLoader.load('textures/brick_bump.jpg', (map) => {
        map.wrapS = RepeatWrapping;
        map.wrapT = RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set(1, 1);
        cubeMat.bumpMap = map;
        cubeMat.needsUpdate = true;
    });

    // Create some wall-like cubes or any geometry you want
    const boxGeometry = new BoxGeometry(0.5, 0.5, 0.5);

    const boxMesh1 = new Mesh(boxGeometry, cubeMat);
    boxMesh1.position.set(-0.5, 0.25, -1);
    boxMesh1.castShadow = true;
    scene.add(boxMesh1);

    const boxMesh2 = new Mesh(boxGeometry, cubeMat);
    boxMesh2.position.set(0, 0.25, -5);
    boxMesh2.castShadow = true;
    scene.add(boxMesh2);

    const boxMesh3 = new Mesh(boxGeometry, cubeMat);
    boxMesh3.position.set(7, 0.25, 0);
    boxMesh3.castShadow = true;
    scene.add(boxMesh3);

    // Also add the sphere here (as you requested)
    const ballMat = new MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 1.0
    });

    textureLoader.load('textures/earth_atmos_2048.jpg', (map) => {
        map.anisotropy = 4;
        map.colorSpace = SRGBColorSpace;
        ballMat.map = map;
        ballMat.needsUpdate = true;
    });

    textureLoader.load('textures/earth_specular_2048.jpg', (map) => {
        map.anisotropy = 4;
        map.colorSpace = SRGBColorSpace;
        ballMat.metalnessMap = map;
        ballMat.needsUpdate = true;
    });

    const ballGeometry = new SphereGeometry(0.25, 32, 32);
    const ballMesh = new Mesh(ballGeometry, ballMat);
    ballMesh.position.set(1, 0.25, 1);
    ballMesh.rotation.y = Math.PI;
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    // Return references if needed
    return {
        cubeMat, ballMat,
        cubeMesh: boxMesh1,
        ballMesh,
    };
}
