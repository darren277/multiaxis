import * as THREE from "three";

import { TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

import { determineLabelCoordinates } from '../config/utils';

import chartConfig from './chartConfig';
import { ThreeJSDrawing } from "../types.js";


const surrounding_opacity = 0.1;


/**
 * Draw a 3D chart into the scene, using the given config object.
 * If no config is passed in, we default to the imported 'chartConfig'.
 */
function drawChart( scene: THREE.Scene, data: any, state: any, config = chartConfig ) {
    const graphData = data;

    // --- 1) Surrounding box ---
    const xSize = graphData.axes[0].max;
    const ySize = graphData.axes[1].max;
    const zSize = graphData.axes[2].max;

    const boxGeometry = config.surroundingBox.geometry(xSize, ySize, zSize);
    // Center the box if you want
    boxGeometry.translate(xSize / 2, ySize / 2, zSize / 2);

    const boxMaterial = config.surroundingBox.material();
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    scene.add(boxMesh);

    // --- 2) Axes, labels, and ticks ---
    const loader = new FontLoader();

    // You probably only want to load your font once, rather than re-loading for each axis/point.
    loader.load(config.fontUrl, (font: Font) => {
        graphData.axes.forEach((axis: any) => {
            // Axis geometry & material
            const axisGeometry = config.axis.geometry(axis.label, axis.max);
            const axisMaterial = config.axis.material();
            const axisMesh = new THREE.Mesh(axisGeometry, axisMaterial);
            scene.add(axisMesh);

            // Axis label
            const axisLabelGeo = new TextGeometry(axis.label, {
                font,
                size: config.axisLabels.size,
                depth: config.axisLabels.depth,
            });
            // Reposition label
            if (axis.label === 'x') {
                axisLabelGeo.translate(axis.max, 0, 0);
            } else if (axis.label === 'y') {
                axisLabelGeo.translate(0, axis.max, 0);
            } else if (axis.label === 'z') {
                axisLabelGeo.translate(0, 0, axis.max);
            }
            const axisLabelMat = config.axisLabels.material(axis.label);
            const axisLabelMesh = new THREE.Mesh(axisLabelGeo, axisLabelMat);
            scene.add(axisLabelMesh);

            // Ticks
            for (let i = axis.min; i <= axis.max; i += axis.step) {
                const tickGeometry = config.axisTicks.geometry();
                if (axis.label === 'x') {
                    tickGeometry.translate(i, 0, 0);
                } else if (axis.label === 'y') {
                    tickGeometry.translate(0, i, 0);
                } else if (axis.label === 'z') {
                    tickGeometry.translate(0, 0, i);
                }
                const tickMaterial = config.axisTicks.material();
                const tickMesh = new THREE.Mesh(tickGeometry, tickMaterial);
                scene.add(tickMesh);
            }
        });

        // --- 3) Plot data points ---
        graphData.points.forEach((point: any) => {
            // point is like [ x, y, z, color, { size, label, icon } ]
            const icon = point[4]?.icon;
            let pointObject: THREE.Object3D; // Use a generic THREE.Object3D type

            if (icon) {
                const pointGeometry = config.points.geometry(point);
                
                // --- Create a Sprite for the icon ---
                const pointMaterial = config.points.material(point) as unknown as THREE.MeshBasicMaterial;
                pointObject = new THREE.Mesh(pointGeometry, pointMaterial);

                pointObject.userData.htmlContent = point[4]?.htmlContent;

                pointObject.position.set(point[0], point[1], point[2]);

                // Scale the sprite. The 'size' property can control how large the icon appears.
                const size = point[4]?.size ?? 1.0; // Default size of 1x1
                pointObject.scale.set(size, size, 1);

                // Store the original scale for the un-hover effect
                pointObject.userData.originalScale = pointObject.scale.clone();
                
                // *** ADD THE OBJECT TO OUR INTERACTIVE LIST ***
                state.data.interactiveObjects.push(pointObject);
            } else {
                // --- Create a Mesh for the geometry (original logic) ---
                const pointGeometry = config.points.geometry(point);
                // translate geometry to correct location
                pointGeometry.translate(point[0], point[1], point[2]);
                const pointMaterial = config.points.material(point);
                pointObject = new THREE.Mesh(pointGeometry, pointMaterial);
            }
            
            scene.add(pointObject);

            // If there is a label for this point, draw it (no changes needed here)
            if (point[4]?.label) {
                // ... your existing label code remains the same
                const labelGeo = new TextGeometry(point[4].label, {
                    font,
                    size: config.pointLabels.size(point),
                    depth: config.pointLabels.depth,
                });
                const labelCoordinates = determineLabelCoordinates(
                    point[0],
                    point[1],
                    point[2],
                    point[4]?.size ?? 0.1
                );
                labelGeo.translate(
                    labelCoordinates[0],
                    labelCoordinates[1],
                    labelCoordinates[2]
                );

                const labelMat = config.pointLabels.material(point);
                const labelMesh = new THREE.Mesh(labelGeo, labelMat);
                scene.add(labelMesh);
            }
        });

        // 4) Optionally adjust camera, lighting, etc. based on data
        // ...

        // Set initial camera position based on the data
//        const maxDimension = Math.max(
//            graphData.axes[0].max,
//            graphData.axes[1].max,
//            graphData.axes[2].max
//        );
    });
}

const multiAxisDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawChart, 'dataSrc': 'data', 'dataType': 'json'}
    ],
    'eventListeners': null,
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
    },
    'data': {
        'sheetMusic': null,
    }
};

export { multiAxisDrawing };
