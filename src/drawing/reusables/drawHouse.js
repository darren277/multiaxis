import { DataTexture, Vector3, Group, Color, Mesh, MeshToonMaterial, ConeGeometry, CylinderGeometry, BoxGeometry, PlaneGeometry, RedFormat } from 'three';


function buildHollowWalls(w, h, d, wallMat, rng, thickness = 0.3) {
    const group = new Group();

    // Front wall (with potential door/window)
    const front = new Mesh(new BoxGeometry(w, h, thickness), wallMat);
    front.position.set(0, h / 2, d / 2 - thickness / 2);
    group.add(front);

    // Back wall
    const back = new Mesh(new BoxGeometry(w, h, thickness), wallMat);
    back.position.set(0, h / 2, -d / 2 + thickness / 2);
    group.add(back);

    // Left wall
    const left = new Mesh(new BoxGeometry(thickness, h, d), wallMat);
    left.position.set(-w / 2 + thickness / 2, h / 2, 0);
    group.add(left);

    // Right wall
    const right = new Mesh(new BoxGeometry(thickness, h, d), wallMat);
    right.position.set(w / 2 - thickness / 2, h / 2, 0);
    group.add(right);

    // Floor (optional)
    const floor = new Mesh(new BoxGeometry(w, thickness, d), wallMat);
    floor.position.set(0, thickness / 2, 0);
    group.add(floor);

    // New: Ceiling (top cap before the roof starts)
    const ceiling = new Mesh(new BoxGeometry(w, thickness, d), wallMat);
    ceiling.position.set(0, h - thickness / 2, 0);
    group.add(ceiling);

    for (let mesh of group.children) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    return group;
}

function addDoorAndWindow(houseGroup, wallWidth, wallHeight, rng, wallThickness = 0.3, wallDepth = 0.3) {
    const doorWidth = rng(1.2, 2);
    const doorHeight = rng(2.2, 3);
    const doorMat = new MeshToonMaterial({ color: 0x663300 });

    // Get front wall Z position (first wall added in buildHollowWalls)
    const frontWall = houseGroup.children.find(mesh =>
        mesh.geometry instanceof BoxGeometry &&
        Math.abs(mesh.position.z - (wallDepth / 2 - wallThickness / 2)) < 0.01
    );

    if (!frontWall) {
        console.warn("Could not find front wall for door placement.");
        return;
    }

    // Position just slightly in front of the wall
    const z = frontWall.position.z + wallThickness / 2 + 0.01;

    const door = new Mesh(new BoxGeometry(doorWidth, doorHeight, wallThickness * 0.9), doorMat);
    door.position.set(
        0,                              // Centered horizontally
        doorHeight / 2,                // Sitting on the ground
        z
    );
    houseGroup.add(door);

    if (rng() > 0.5) {
        const windowWidth = rng(0.8, 1.2);
        const windowHeight = rng(0.8, 1.2);
        const windowY = rng(doorHeight + 0.5, wallHeight - 1.5);
        const windowX = rng(-wallWidth / 3, wallWidth / 3);

        const windowMat = new MeshToonMaterial({ color: 0x99ccff });

        const win = new Mesh(new PlaneGeometry(windowWidth, windowHeight), windowMat);
        win.position.set(windowX, windowY, wallWidth / 2 + 0.01);
        houseGroup.add(win);
    }
}


// Simple gradient map generator (for toon shading)
function generateGradientMap(levels = 5) {
    const data = new Uint8Array(levels);
    for (let i = 0; i < levels; i++) data[i] = (i / levels) * 255;
    const texture = new DataTexture(data, levels, 1, RedFormat);
    texture.needsUpdate = true;
    return texture;
}

const gradientMap = generateGradientMap();

function drawCartoonHouse(scene, options = {}) {
    const {
        position = new Vector3(0, 0, 0),
        scaleFactor = 1,
        rng = null
    } = options;

    const group = new Group();

    // Randomize dimensions
    const width = rng(6, 12) * scaleFactor;
    const depth = rng(6, 12) * scaleFactor;
    const height = rng(6, 10) * scaleFactor;

    const wallColor = new Color().setHSL(rng(0, 1), 0.6, 0.5);
    const roofColor = new Color().setHSL(rng(0, 1), 0.6, 0.4);

    const wallMat = new MeshToonMaterial({ color: wallColor, gradientMap });
    const roofMat = new MeshToonMaterial({ color: roofColor, gradientMap });

    // Walls (hollow cube without top and bottom)
    const hollowWalls = buildHollowWalls(width, height, depth, wallMat, rng);
    addDoorAndWindow(hollowWalls, width, height, rng, 0.3, depth);
    group.add(hollowWalls);

    // Roof (either a triangle prism or a pyramid)
    const roofType = rng(0, 1) > 0.5 ? 'gable' : 'pyramid';

    if (roofType === 'gable') {
        // Triangle prism (like a slanted rectangle)
        const roofHeight = rng(4, 8) * scaleFactor;
        const roofGeo = new CylinderGeometry(0, width * 0.7, roofHeight, 4, 1);
        const roof = new Mesh(roofGeo, roofMat);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = height + roofHeight / 2;
        group.add(roof);
    } else {
        // Pyramid (Cone with square base)
        const roofHeight = rng(5, 10) * scaleFactor;
        const cone = new ConeGeometry(Math.max(width, depth) * 0.75, roofHeight, 4);
        //cone.rotation.y = Math.PI / 4;
        cone.rotateY(Math.PI / 4);
        const roof = new Mesh(cone, roofMat);
        roof.position.y = height + roofHeight / 2;
        group.add(roof);
    }

    group.position.copy(position);
    scene.add(group);
    return group;
}


function generateSeed(seed) {
    // Create random number generator
    let rng;
    if (typeof seed === 'number') {
        // Simple LCG-based seeded RNG
        let s = seed;
        rng = (min = 0, max = 1) => {
            s = (s * 16807) % 2147483647;
            return min + (max - min) * (s / 2147483647);
        };
    } else {
        // Use default Math.random
        rng = (min = 0, max = 1) => min + (max - min) * Math.random();
    }

    return rng;
}


function drawHouses(scene) {
    for (let i = 0; i < 10; i++) {
        const x = (i % 5) * 20 - 50;
        const z = Math.floor(i / 5) * 30 - 30;
        const seed = Math.floor(Math.random() * 1000);
        const rng = generateSeed(seed);
        drawCartoonHouse(scene, {position: new Vector3(x, 0, z), scaleFactor: 1, rng});
    }
}

export { drawCartoonHouse, drawHouses }
