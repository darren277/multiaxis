import { Mesh, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace, DoubleSide, TextureLoader, BoxGeometry } from 'three';

/*
Some notes:
* Different UV tiling/rotation.
** `texture.repeat` (and `offset`, `rotation`, etc.) belong to the Texture object, so all materials that share that object will change together.
** If your walls need `repeat.set(24, 10)` instead of `10, 24`, call `woodTex.diffuse.clone()` first.
** The clone shares the image data (zero extra GPU memory) but gets its own transform:

const wallTex = woodTex.diffuse.clone();
wallTex.repeat.set(24, 10);

const wallMat = woodMat.clone();
wallMat.map = wallTex;

* Different shading properties.
** If you want glossy varnish on the ceiling but matte walls, keep the same textures but `woodMat.clone()` and tweak `roughness`, etc.
*/

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

export function drawPerimeterWalkway(
    scene,
    mat,
    roomSize = 200,     // matches your floor
    rimWidth = 25,      // width of the walkway
    height = 90         // Y position (second storey)
) {
    const half = roomSize / 2;
    //const gLong  = new PlaneGeometry(roomSize - 2 * rimWidth, rimWidth); // north & south
    //const gShort = new PlaneGeometry(rimWidth, roomSize);                 // east & west
    const gLong = new BoxGeometry(roomSize - 2*rimWidth, rimWidth, 1.0);
    gLong.translate(0, -0.25, 0);   // bottom flush with Y=0 of the ring
    const gShort = new BoxGeometry(rimWidth, roomSize, 1.0);
    gShort.translate(0, -0.25, 0);   // bottom flush with Y=0 of the ring

    // south (‑Z)
    const south = new Mesh(gLong, mat);
    south.rotation.x = -Math.PI / 2;
    south.position.set(0, height, -half + rimWidth / 2);
    scene.add(south);

    // north (+Z)
    const north = south.clone();
    north.position.z =  half - rimWidth / 2;
    scene.add(north);

    // west (‑X)
    const west = new Mesh(gShort, mat);
    west.rotation.x = -Math.PI / 2;
    west.position.set(-half + rimWidth / 2, height, 0);
    scene.add(west);

    // east (+X)
    const east = west.clone();
    east.position.x =  half - rimWidth / 2;
    scene.add(east);

    return {south, north, east, west};   // handy for collision boxes
}
