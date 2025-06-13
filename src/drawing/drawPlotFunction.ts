import * as THREE from 'three';
import { ThreeJSDrawing } from '../threejsDrawing';

function plotFunction(
scene: THREE.Scene,
{
    fn = (x: number) => x, // Provide a default function to avoid missing 'fn'
    xRange = [-5, 5],
    samples = 100,
    material = new THREE.LineBasicMaterial({ color: 0xff0000 }),
    zOffset = 0
}: {
    fn?: (x: number) => number,
    xRange?: [number, number],
    samples?: number,
    material?: THREE.Material,
    zOffset?: number
} = {}
) {
    const [xMin, xMax] = xRange;

    // Step 1: Sample the function
    const points = [];
    for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        // interpolate x between xMin and xMax
        const x = xMin + (xMax - xMin) * t;
        // compute y
        const y = fn(x);

        // store as a Vector3
        points.push(new THREE.Vector3(x, y, zOffset));
    }

    // Step 2: Create geometry and line
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    return line; // in case you want a reference to the line object
}


function plotSomeFunctions(scene: THREE.Scene) {
    // Example 1: Linear f(x) = 2x + 1
    plotFunction(scene,
    {
        fn: (x) => 2 * x + 1,
        xRange: [-5, 5],
        samples: 200,
        material: new THREE.LineBasicMaterial({ color: 0x0000ff }) // optional
    });

    // Example 2: Exponential f(x) = e^x
    plotFunction(scene,
    {
        fn: (x) => Math.exp(x),
        xRange: [-2, 2],
        samples: 300,
        material: new THREE.LineBasicMaterial({ color: 0x00ff00 })
    });

    // Example 3: Piecewise function
    // f(x) =  x^2  if x < 0
    //        2x+1 if x >= 0
    plotFunction(scene,
    {
        fn: (x) => x < 0 ? x * x : 2 * x + 1,
        xRange: [-5, 5],
        samples: 500,
        material: new THREE.LineBasicMaterial({ color: 0xff00ff })
    });
}

function addAxes(scene: THREE.Scene, size = 10) {
    // X axis (red)
    const xPoints = [
        new THREE.Vector3(-size, 0, 0),
        new THREE.Vector3(size, 0, 0),
    ];
    const xGeom = new THREE.BufferGeometry().setFromPoints(xPoints);
    const xMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const xAxis = new THREE.Line(xGeom, xMat);
    scene.add(xAxis);

    // Y axis (green)
    const yPoints = [
        new THREE.Vector3(0, -size, 0),
        new THREE.Vector3(0, size, 0),
    ];
    const yGeom = new THREE.BufferGeometry().setFromPoints(yPoints);
    const yMat = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const yAxis = new THREE.Line(yGeom, yMat);
    scene.add(yAxis);
}


/*
Extending This Approach
    Multiple Curves: You can plot any number of different functions by calling plotFunction multiple times with different fns, ranges, or materials.
    3D Surfaces: For a function of two variables f(x,z)f(x,z), you can create a mesh by sampling a grid of points (x,f(x,z),z)(x,f(x,z),z). That’s a bit more involved but follows a similar idea.
    Piecewise/Conditional: Simply define your function as an arrow function that branches on xx (or other criteria).

fn: (x) => x < 0 ? Math.pow(x, 2) : Math.log(x + 1)

Interactivity: Let users dynamically change the function or range via a GUI (e.g., dat.GUI or a simple HTML input) and re-generate the plot in real time.
*/

function drawPlotFunction(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing) {
    // Add axes
    addAxes(scene, 5);

    // Plot some functions
    plotSomeFunctions(scene);

    // Add any additional scene elements from threejsDrawing
//    for (const element of threejsDrawing.sceneElements) {
//        scene.add(element);
//    }
}



const plotFunctionDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawPlotFunction, 'dataSrc': null}
    ],
    'eventListeners': null,
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.PerspectiveCamera) => {
    },
    'data': {
    }
}



export { plotFunctionDrawing, addAxes };
