import * as THREE from 'three';

type CubeDef = {
    position: [number, number, number];
    color: number;
    targetScene: string;
};

function drawNavCube(cubeDef: CubeDef, scene: THREE.Scene, threejsDrawing: any, debug = false) {
    // Add a clickable object
    const boxGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    //const boxMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const boxMat = new THREE.MeshStandardMaterial({ color: cubeDef.color, transparent: true, opacity: 0.5 });
    const navCube = new THREE.Mesh(boxGeo, boxMat);
    //navCube.position.set(1, 0.25, -2); // place it somewhere visible
    navCube.position.set(cubeDef.position[0], cubeDef.position[1], cubeDef.position[2]); // place it somewhere visible
    //navCube.userData.targetScene = 'library'; // <-- match a key in THREEJS_DRAWINGS
    if (!debug) {
        // for when you need to click on the cubes for the debug controller to place them...
        navCube.userData.targetScene = cubeDef.targetScene; // <-- match a key in THREEJS_DRAWINGS
    }
    navCube.name = cubeDef.targetScene; // <-- match a key in THREEJS_DRAWINGS
    scene.add(navCube);

    // Save it for later if needed
    threejsDrawing.data.navCube = navCube;
}


function drawNavCubes(scene: THREE.Scene, threejsDrawing: any, cubeDefs: CubeDef[], debug = false) {
    cubeDefs.forEach(cubeDef => {
        drawNavCube(cubeDef, scene, threejsDrawing, debug);
    });
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClickNav(event: MouseEvent, scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj.userData && obj.userData.targetScene) {
            const target = obj.userData.targetScene;
            console.log(`Navigating to scene: ${target}`);
            const prev = window.location.pathname.split('/').pop(); // get the last part of the URL
            window.location.href = `/threejs/${target}?prev=${prev}&nav=true&controls=walking`;
            break;
        }
    }
}

const CUBE_DEFS = [
    { targetScene: 'library', position: [1, 0.25, -2], color: 0x00ff00 },
    { targetScene: 'farm', position: [2, 0.25, -2], color: 0x0000ff },
    { targetScene: 'room', position: [3, 0.25, -2], color: 0xff0000 },
    { targetScene: 'kitchen', position: [4, 0.25, -2], color: 0xffff00 },
    { targetScene: 'bathroom', position: [5, 0.25, -2], color: 0xff00ff },
    { targetScene: 'livingroom', position: [6, 0.25, -2], color: 0x00ffff }
]

const FULL_MAP = [
    ['farm', 'forest', null],
    ['town', 'racetrack', null],
    ['library', null, null],
]

const FULL_MAP_TEST = [
    ['farm', 'forest', 'mountain'],
    ['town', 'racetrack', 'desert'],
    ['complex', 'kitchen', 'bathroom'],
    ['livingroom', 'diningroom', 'office'],
    ['bedroom', null, null],
]

const CUBE_DEFS_LIBRARY = [
    { targetScene: 'library', position: [-100, 0.25, -100], color: 0x00ff00 }, // color name: green
    { targetScene: 'livingroom', position: [-100, 0.25, 0], color: 0x0000ff }, // color name: blue
    { targetScene: 'room', position: [-100, 0.25, -100], color: 0xff0000 }, // color name: red
    { targetScene: 'kitchen', position: [0, 0.25, -100], color: 0xffff00 }, // color name: yellow
    { targetScene: 'bathroom', position: [0, 0.25, 0], color: 0xff00ff }, // color name: magenta
    { targetScene: 'farm', position: [0, 0.25, 100], color: 0x00ffff }, // color name: cyan,
    { targetScene: 'diningroom', position: [100, 0.25, -100], color: 0x33ff33 }, // color name: light green
    { targetScene: 'office', position: [100, 0.25, 0], color: 0x3333ff }, // color name: light blue
    { targetScene: 'bedroom', position: [100, 0.25, 100], color: 0xff33ff }, // color name: light magenta
]

const CUBE_DEFS_FARM = [
    { targetScene: 'library', position: [-100, 0.25, -100], color: 0x00ff00 }, // color name: green
    { targetScene: 'livingroom', position: [-100, 0.25, 0], color: 0x0000ff }, // color name: blue
    { targetScene: 'room', position: [-100, 0.25, -100], color: 0xff0000 }, // color name: red
    { targetScene: 'kitchen', position: [0, 0.25, -100], color: 0xffff00 }, // color name: yellow
    { targetScene: 'bathroom', position: [0, 0.25, 0], color: 0xff00ff }, // color name: magenta
    { targetScene: 'farm', position: [0, 0.25, 100], color: 0x00ffff }, // color name: cyan,
    { targetScene: 'diningroom', position: [100, 0.25, -100], color: 0x33ff33 }, // color name: light green
    { targetScene: 'office', position: [100, 0.25, 0], color: 0x3333ff }, // color name: light blue
    { targetScene: 'bedroom', position: [100, 0.25, 100], color: 0xff33ff }, // color name: light magenta
]

const CORNER_COLOR_MAP = {
    'LOWER_LEFT': 0x00ff00, // green
    'LEFT': 0x0000ff, // blue
    'UPPER_LEFT': 0xff0000, // red
    'DOWN': 0xffff00, // yellow
    'CENTER': 0xff00ff, // magenta
    'UP': 0x00ffff, // cyan
    'LOWER_RIGHT': 0x33ff33, // light green
    'RIGHT': 0x3333ff, // light blue
    'UPPER_RIGHT': 0xff33ff, // light magenta
};

const CORNER_POSITION_MAP = {
    'LOWER_LEFT': [-100, -100],
    'LEFT': [-100, 0],
    'UPPER_LEFT': [-100, 100],
    'DOWN': [0, -100],
    'CENTER': [0, 0],
    'UP': [0, 100],
    'LOWER_RIGHT': [100, -100],
    'RIGHT': [100, 0],
    'UPPER_RIGHT': [100, 100]
}

function lookUpNeighbors(map: (string | null)[][], i: number, j: number) {
    // returns an array of neighboring scenes (each paired with its position)
    const neighbors: { scene: string; position: [number, number]; cornerKey: string }[] = [];
    const directions = [
        [-1, -1], // UPPER_LEFT
        [-1, 0],  // LEFT
        [-1, 1],  // UPPER_RIGHT
        [0, -1],  // DOWN
        [0, 0],   // CENTER
        [0, 1],   // UP
        [1, -1],  // LOWER_LEFT
        [1, 0],   // LOWER_RIGHT
        [1, 1]    // RIGHT
    ];

    for (const [di, dj] of directions) {
        const ni = i + di;
        const nj = j + dj;
        if (ni >= 0 && ni < map.length && nj >= 0 && nj < map[ni].length) {
            const scene = map[ni][nj];
            if (scene) {
                const position: [number, number] = [di * 100, dj * 100];

                let cornerKey;
                if (di === -1 && dj === -1) {
                    cornerKey = 'UPPER_LEFT';
                } else if (di === -1 && dj === 0) {
                    cornerKey = 'LEFT';
                } else if (di === -1 && dj === 1) {
                    cornerKey = 'UPPER_RIGHT';
                } else if (di === 0 && dj === -1) {
                    cornerKey = 'DOWN';
                } else if (di === 0 && dj === 0) {
                    cornerKey = 'CENTER';
                } else if (di === 0 && dj === 1) {
                    cornerKey = 'UP';
                } else if (di === 1 && dj === -1) {
                    cornerKey = 'LOWER_LEFT';
                } else if (di === 1 && dj === 0) {
                    cornerKey = 'LOWER_RIGHT';
                } else if (di === 1 && dj === 1) {
                    cornerKey = 'RIGHT';
                }
                neighbors.push({ scene, position, cornerKey });
            }
        }
    }
    return neighbors;
}

function constructCubeDefs(map: (string | null)[][], allowDiagonals = false) {
    let cubeDefsMap: { [key: string]: CubeDef[] } = {};
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            const scene = map[i][j];
            let cubeDefs: CubeDef[] = [];
            if (scene) {
                const neighbors = lookUpNeighbors(map, i, j);
                for (const { scene: neighborScene, position, cornerKey } of neighbors) {
                    //const cornerKey = `${position[0] > 0 ? 'LOWER' : 'UPPER'}_${position[1] > 0 ? 'RIGHT' : 'LEFT'}`;
                    console.log('cornerKey', cornerKey);

                    const color = CORNER_COLOR_MAP[cornerKey];

                    const cubeDef: CubeDef = {
                        targetScene: neighborScene,
                        position: [position[0], 0.25, position[1]],
                        color: color
                    };

                    if (cornerKey != 'CENTER' && !allowDiagonals && (cornerKey === 'UPPER_LEFT' || cornerKey === 'UPPER_RIGHT' || cornerKey === 'LOWER_LEFT' || cornerKey === 'LOWER_RIGHT')) {
                        cubeDefs.push(cubeDef);
                    }
                }
                if (cubeDefs.length > 0) {
                    cubeDefsMap[scene] = cubeDefs;
                }
            }
        }
    }
    return cubeDefsMap;
}

const ALL_CUBE_DEFS = constructCubeDefs(FULL_MAP_TEST);

console.log('CUBE DEFS!', ALL_CUBE_DEFS);

export { drawNavCubes, onClickNav, CUBE_DEFS, CUBE_DEFS_LIBRARY, CUBE_DEFS_FARM, ALL_CUBE_DEFS };
