import * as THREE from "three";
import { Tween, Easing } from 'tween';
import { ThreeJSDrawing } from "../types";

type ColorKey = 'white' | 'yellow' | 'red' | 'orange' | 'green' | 'blue' | 'black';

function getMaterials(faceColors: { [key: string]: ColorKey | null }): THREE.Material[] {
    const colors: Record<ColorKey, number> = {
        white: 0xffffff,
        yellow: 0xffff00,
        red: 0xff0000,
        orange: 0xffa500,
        green: 0x00ff00,
        blue: 0x0000ff,
        black: 0x000000
    };

    return [
        new THREE.MeshBasicMaterial({ color: faceColors.right ? colors[faceColors.right as ColorKey] : colors.black }),  // +X
        new THREE.MeshBasicMaterial({ color: faceColors.left ? colors[faceColors.left as ColorKey] : colors.black }),   // -X
        new THREE.MeshBasicMaterial({ color: faceColors.top ? colors[faceColors.top as ColorKey] : colors.black }),    // +Y
        new THREE.MeshBasicMaterial({ color: faceColors.bottom ? colors[faceColors.bottom as ColorKey] : colors.black }), // -Y
        new THREE.MeshBasicMaterial({ color: faceColors.front ? colors[faceColors.front as ColorKey] : colors.black }),  // +Z
        new THREE.MeshBasicMaterial({ color: faceColors.back ? colors[faceColors.back as ColorKey] : colors.black })    // -Z
    ];
}



function drawRubiksCube(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing) {
    const cubelets: THREE.Mesh[] = [];
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

                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const materials = getMaterials(faceColors);
                const cubelet = new THREE.Mesh(geometry, materials);
                cubelet.position.set(x * spacing, y * spacing, z * spacing);

                scene.add(cubelet);
                cubelets.push(cubelet);
            }
        }
    }
}


function getFaceCubelets(cubelets: THREE.Mesh[], axis: 'x' | 'y' | 'z', value: number, epsilon = 0.01) {
    return cubelets.filter(cubelet => Math.abs(cubelet.position[axis] - value) < epsilon);
}


function rotateFace(scene: THREE.Scene, cubelets: THREE.Mesh[], axis: 'x' | 'y' | 'z', value: number, direction = 1) {
    const faceGroup = new THREE.Group();
    scene.add(faceGroup);

    const faceCubelets = getFaceCubelets(cubelets, axis, value);

    // Parent the cubelets to the group
    faceCubelets.forEach(cubelet => {
        faceGroup.attach(cubelet);  // maintains world transform
    });

    // Rotate the group (direction: +1 = clockwise)
    const angle = direction * Math.PI / 2; // 90 degrees
    const rotationAxis = new THREE.Vector3(
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

type FaceKey = 'U' | 'D' | 'F' | 'B' | 'R' | 'L';

const faceMap: Record<FaceKey, { axis: 'x' | 'y' | 'z'; value: number }> = {
    U: { axis: 'y', value: 1.05 },
    D: { axis: 'y', value: -1.05 },
    F: { axis: 'z', value: 1.05 },
    B: { axis: 'z', value: -1.05 },
    R: { axis: 'x', value: 1.05 },
    L: { axis: 'x', value: -1.05 },
};


const eventListeners = {
    'keydown': (event: KeyboardEvent, { camera, data, controls }: any) => {
        // TODO: Test threejsDrawing.data.scene...
        if ((key as FaceKey) in faceMap) {
            const { axis, value } = faceMap[key as FaceKey];
            rotateFace(threejsDrawing.data.scene, data.cubelets, axis, value);
        }
    }
};



const rubiksCubeDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawRubiksCube, 'dataSrc': null}
    ],
    'eventListeners': eventListeners,
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
    },
    'data': {
    }
}


export { rubiksCubeDrawing };
