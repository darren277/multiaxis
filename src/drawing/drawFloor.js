import { Mesh, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace, DoubleSide, TextureLoader } from 'three';

export function loadWoodTextures(path = 'textures/') {
    const loader = new TextureLoader();

    const diffuse  = loader.load(path + 'hardwood2_diffuse.jpg');
    const bump     = loader.load(path + 'hardwood2_bump.jpg');
    const rough    = loader.load(path + 'hardwood2_roughness.jpg');

    // configure once, re‑used everywhere
    [diffuse, bump, rough].forEach(t => {
        t.wrapS = t.wrapT = RepeatWrapping;
        t.colorSpace = SRGBColorSpace;          // only needed on the color map
        t.anisotropy = 4;                       // or renderer.capabilities.getMaxAnisotropy()
        t.repeat.set(10, 24);
    });

    return { diffuse, bump, rough };
}

export function makeWoodMaterial(tex) {
    return new MeshStandardMaterial({map: tex.diffuse, bumpMap: tex.bump, roughnessMap: tex.rough, roughness: 0.8, metalness: 0.2, side: DoubleSide});
}

export function drawFloor(scene, woodMat, size = 20) {
    const floorGeometry = new PlaneGeometry(size, size);
    const floorMesh = new Mesh(floorGeometry, woodMat);
    floorMesh.receiveShadow = true;
    floorMesh.rotation.x = -Math.PI / 2;
    scene.add(floorMesh);

    // Return the floor material or mesh if you need to update it
    return floorMesh;
}
