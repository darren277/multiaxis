import * as THREE from 'three';

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
    const loader = new THREE.TextureLoader();

    const diffuse  = loader.load(path + 'hardwood2_diffuse.jpg');
    const bump     = loader.load(path + 'hardwood2_bump.jpg');
    const rough    = loader.load(path + 'hardwood2_roughness.jpg');

    // configure once, re‑used everywhere
    [diffuse, bump, rough].forEach(t => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.colorSpace = THREE.SRGBColorSpace;          // only needed on the color map
        t.anisotropy = 4;                       // or renderer.capabilities.getMaxAnisotropy()
        t.repeat.set(10, 24);
    });

    return { diffuse, bump, rough };
}

export function makeWoodMaterial(tex:{ diffuse: THREE.Texture, bump: THREE.Texture, rough: THREE.Texture }) {
    return new THREE.MeshStandardMaterial({map: tex.diffuse, bumpMap: tex.bump, roughnessMap: tex.rough, roughness: 0.8, metalness: 0.2, side: THREE.DoubleSide});
}

export function drawFloor(scene: THREE.Scene, woodMat: THREE.Material, size = 20) {
    const floorGeometry = new THREE.PlaneGeometry(size, size);
    const floorMesh = new THREE.Mesh(floorGeometry, woodMat);
    floorMesh.receiveShadow = true;
    floorMesh.rotation.x = -Math.PI / 2;
    scene.add(floorMesh);

    // Return the floor material or mesh if you need to update it
    return floorMesh;
}

export function drawPerimeterWalkway(
    scene: THREE.Scene,
    mat: THREE.Material,
    roomSize = 200,     // matches your floor
    rimWidth = 25,      // width of the walkway
    height = 90         // Y position (second storey)
) {
    const half = roomSize / 2;
    //const gLong  = new PlaneGeometry(roomSize - 2 * rimWidth, rimWidth); // north & south
    //const gShort = new PlaneGeometry(rimWidth, roomSize);                 // east & west
    const gLong = new THREE.BoxGeometry(roomSize - 2*rimWidth, rimWidth, 1.0);
    gLong.translate(0, -0.25, 0);   // bottom flush with Y=0 of the ring
    const gShort = new THREE.BoxGeometry(rimWidth, roomSize, 1.0);
    gShort.translate(0, -0.25, 0);   // bottom flush with Y=0 of the ring

    // south (‑Z)
    const south = new THREE.Mesh(gLong, mat);
    south.rotation.x = -Math.PI / 2;
    south.position.set(0, height, -half + rimWidth / 2);
    scene.add(south);

    // north (+Z)
    const north = south.clone();
    north.position.z =  half - rimWidth / 2;
    scene.add(north);

    // west (‑X)
    const west = new THREE.Mesh(gShort, mat);
    west.rotation.x = -Math.PI / 2;
    west.position.set(-half + rimWidth / 2, height, 0);
    scene.add(west);

    // east (+X)
    const east = west.clone();
    east.position.x =  half - rimWidth / 2;
    scene.add(east);

    return {south, north, east, west};   // handy for collision boxes
}

export function drawElevator(scene: THREE.Scene, material: THREE.Material, {
    size      = 20,     // X–Z footprint
    thick     = 0.4,    // elevator slab thickness
    floorY    = 0.2,    // start height (just above ground floor)
    targetY   = 90,     // same height as your walkway
    rimClear  = 25      // distance you want to stop from the wall
} = {}) {

    const geo = new THREE.BoxGeometry(size, thick, size);
    // move geometry so its top sits at geo origin (easier math)
    geo.translate(0, thick / 2, 0);

    const lift = new THREE.Mesh(geo, material);
    lift.castShadow = lift.receiveShadow = true;
    lift.position.set(0, floorY, -(rimClear + size/2));   // centred front of room
    scene.add(lift);

    lift.userData = {
        floorY,
        targetY,
        state : 'down',   // 'down' | 'moving' | 'up'
        box   : new THREE.Box3().setFromObject(lift),
        rider: null,
        offsetY: 0, // offset from lift to player
        isPlatform: true,
        boxNeedsRefresh: true
    };

    return lift;
}

const downRay = new THREE.Raycaster();
const DOWN    = new THREE.Vector3(0, -1, 0);
const STEP_FAR = 2.0;           // enough to hit a 0.2m slab
// (If you later allow crouching, compute STEP_FAR from player height.)

export function playerOnPlatform(platform: THREE.Object3D, player: THREE.Object3D) {
    downRay.set(player.position, DOWN);
    downRay.far = STEP_FAR;
    return downRay.intersectObject(platform, false).length > 0;
}
