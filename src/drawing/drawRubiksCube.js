import { Mesh, MeshBasicMaterial, BoxGeometry, Group, Vector3 } from 'three';
import { Tween, Easing } from 'tween';

function getMaterials(faceColors) {
    const colors = {
        white: 0xffffff,
        yellow: 0xffff00,
        red: 0xff0000,
        orange: 0xffa500,
        green: 0x00ff00,
        blue: 0x0000ff,
        black: 0x000000
    };

    return [
        new MeshBasicMaterial({ color: colors[faceColors.right] || colors.black }),  // +X
        new MeshBasicMaterial({ color: colors[faceColors.left] || colors.black }),   // -X
        new MeshBasicMaterial({ color: colors[faceColors.top] || colors.black }),    // +Y
        new MeshBasicMaterial({ color: colors[faceColors.bottom] || colors.black }), // -Y
        new MeshBasicMaterial({ color: colors[faceColors.front] || colors.black }),  // +Z
        new MeshBasicMaterial({ color: colors[faceColors.back] || colors.black })    // -Z
    ];
}



function drawRubiksCube(scene, threejsDrawing) {
    const cubelets = [];
    const spacing = 1.05;
    const half = 1;

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                const faceColors = {
                    right: x === 1 ? 'red' : null,
                    left: x === -1 ? 'orange' : null,
                    top: y === 1 ? 'white' : null,
                    bottom: y === -1 ? 'yellow' : null,
                    front: z === 1 ? 'blue' : null,
                    back: z === -1 ? 'green' : null
                };

                const geometry = new BoxGeometry(1, 1, 1);
                const materials = getMaterials(faceColors);
                const cubelet = new Mesh(geometry, materials);
                cubelet.position.set(x * spacing, y * spacing, z * spacing);

                scene.add(cubelet);
                cubelets.push(cubelet);
            }
        }
    }
}


function getFaceCubelets(cubelets, axis, value, epsilon = 0.01) {
    return cubelets.filter(cubelet => Math.abs(cubelet.position[axis] - value) < epsilon);
}


function rotateFace(scene, cubelets, axis, value, direction = 1) {
    const faceGroup = new Group();
    scene.add(faceGroup);

    const faceCubelets = getFaceCubelets(cubelets, axis, value);

    // Parent the cubelets to the group
    faceCubelets.forEach(cubelet => {
        faceGroup.attach(cubelet);  // maintains world transform
    });

    // Rotate the group (direction: +1 = clockwise)
    const angle = direction * Math.PI / 2; // 90 degrees
    const rotationAxis = new Vector3(
        axis === 'x' ? 1 : 0,
        axis === 'y' ? 1 : 0,
        axis === 'z' ? 1 : 0
    );

    // Animate rotation (optional)
    new Tween(faceGroup.rotation)
        .to({
            [axis]: faceGroup.rotation[axis] + angle
        }, 300)
        .easing(Easing.Quadratic.InOut)
        .onComplete(() => {
            // Unparent cubelets
            faceCubelets.forEach(cubelet => {
                scene.attach(cubelet); // preserves new world transform
            });
            scene.remove(faceGroup);
        })
        .start();
}


// Rotate the top (U) face clockwise
//rotateFace(cubelets, 'y', 1.05, +1);
// Rotate the front (F) face counter-clockwise
//rotateFace(cubelets, 'z', 1.05, -1);

const faceMap = {
    U: { axis: 'y', value: 1.05 },
    D: { axis: 'y', value: -1.05 },
    F: { axis: 'z', value: 1.05 },
    B: { axis: 'z', value: -1.05 },
    R: { axis: 'x', value: 1.05 },
    L: { axis: 'x', value: -1.05 },
};


const eventListeners = {
    'keydown': (event, { camera, data, controls, uiState }) => {
        const key = event.key.toUpperCase();
        console.log('Key pressed:', key);
        if (faceMap[key]) {
            const { axis, value } = faceMap[key];
            rotateFace(uiState.scene, data.cubelets, axis, value);
        }
    }
};



const rubiksCubeDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawRubiksCube, 'dataSrc': null}
    ],
    'uiState': null,
    'eventListeners': eventListeners,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
    },
    'data': {
    }
}


export { rubiksCubeDrawing };
