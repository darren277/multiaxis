import { Mesh, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from 'three';

export function drawFloor(scene, textureLoader) {
    const floorMat = new MeshStandardMaterial({
        roughness: 0.8,
        color: 0xffffff,
        metalness: 0.2,
        bumpScale: 1
    });

    // Load texture maps
    textureLoader.load('textures/hardwood2_diffuse.jpg', (map) => {
        map.wrapS = RepeatWrapping;
        map.wrapT = RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set(10, 24);
        map.colorSpace = SRGBColorSpace;
        floorMat.map = map;
        floorMat.needsUpdate = true;
    });

    textureLoader.load('textures/hardwood2_bump.jpg', (map) => {
        map.wrapS = RepeatWrapping;
        map.wrapT = RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set(10, 24);
        floorMat.bumpMap = map;
        floorMat.needsUpdate = true;
    });

    textureLoader.load('textures/hardwood2_roughness.jpg', (map) => {
        map.wrapS = RepeatWrapping;
        map.wrapT = RepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set(10, 24);
        floorMat.roughnessMap = map;
        floorMat.needsUpdate = true;
    });

    const floorGeometry = new PlaneGeometry(20, 20);
    const floorMesh = new Mesh(floorGeometry, floorMat);
    floorMesh.receiveShadow = true;
    floorMesh.rotation.x = -Math.PI / 2;
    scene.add(floorMesh);

    // Return the floor material or mesh if you need to update it
    return floorMat;
}
