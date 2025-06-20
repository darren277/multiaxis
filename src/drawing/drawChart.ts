import * as THREE from "three";
import * as TWEEN from '@tweenjs/tween.js';

import { TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

import { determineLabelCoordinates } from '../config/utils';

import chartConfig from './chartConfig';
import { ThreeJSDrawing } from "../types.js";

import { showOverlay } from './chart/chartOverlay';

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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentIntersected: THREE.Object3D | null = null;

//const SCALE_FACTOR = 1.5;
const SCALE_FACTOR = 1.1;

//const SCALE_UP_DURATION = 350;
//const SCALE_DOWN_DURATION = 500;
const SCALE_UP_DURATION = 1000;
const SCALE_DOWN_DURATION = 1000;

function triggerPulse(tweenGroup: TWEEN.Group, object: THREE.Object3D) {
    // 1. Check the lock: If the object is already animating, do nothing.
    if (object.userData.isPulsating) {
        return;
    }

    // 2. Set the lock: Immediately flag the object as busy.
    object.userData.isPulsating = true;

    const originalScale = object.userData.originalScale;
    const targetScale = originalScale.clone().multiplyScalar(SCALE_FACTOR);

    // 3. Create the two tweens for the pulse effect.
    const scaleUpTween = new TWEEN.Tween(object.scale, tweenGroup)
        .to(targetScale, SCALE_UP_DURATION)
        .easing(TWEEN.Easing.Circular.Out);

    const scaleDownTween = new TWEEN.Tween(object.scale, tweenGroup)
        .to(originalScale, SCALE_DOWN_DURATION)
        .easing(TWEEN.Easing.Bounce.Out);

    // 4. Chain them together: When scaleUp finishes, scaleDown will start automatically.
    scaleUpTween.chain(scaleDownTween);

    // 5. Unlock the object upon completion of the ENTIRE sequence.
    // We add the onComplete callback to the *last* tween in the chain.
    scaleDownTween.onComplete(() => {
        object.userData.isPulsating = false;
    });

    // 6. Start the first tween to kick off the whole sequence.
    scaleUpTween.start();
}

const multiAxisDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawChart, 'dataSrc': 'data', 'dataType': 'json'}
    ],
    'eventListeners': {
        'mousemove': (event: MouseEvent, context: any) => {
            // Handle mouse move events on the chart
            // Calculate mouse position in normalized device coordinates
            // (-1 to +1) for both components
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        },
        'click': (event: MouseEvent, context: any) => {
            console.log('context', context);
            const camera = context.camera;
            
            // We can reuse the same mouse coordinates from the mousemove handler
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(context.data.interactiveObjects);

            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;

                console.log('Clicked on object:', clickedObject);

                // Check if the clicked object has HTML content
                if (clickedObject.userData.htmlContent) {
                    console.log('Clicked on object with HTML content:', clickedObject.userData.htmlContent);
                    showOverlay(clickedObject.userData.htmlContent);
                }
            }
        },
    },
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
        (threejsDrawing.data.tweenGroup as TWEEN.Group).update(timestamp);
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(threejsDrawing.data.interactiveObjects);

        if (intersects.length > 0) {
            const firstIntersected = intersects[0].object;

            // Check if the mouse has moved to a NEW object.
            if (currentIntersected !== firstIntersected) {
                // This is our "mouse enter" event. Trigger the pulse animation.
                triggerPulse(threejsDrawing.data.tweenGroup, firstIntersected);
                
                // Set the new object as the currently intersected one.
                currentIntersected = firstIntersected;
            }
        } else {
            // The mouse is not over any object, so we reset the state.
            currentIntersected = null;
        }

        for (const obj of threejsDrawing.data.interactiveObjects) {
            const randomScale = 0.5 + Math.random() * 0.5; // Random scale between 0.5 and 1.0
            // add a very very slow rotation to all objects...
            //obj.rotation.x += 0.001 * randomScale;
            obj.rotation.y += 0.001 * randomScale;
            //obj.rotation.z += 0.001 * randomScale;
        }
    },
    'data': {
        'sheetMusic': null,
        'interactiveObjects': []
    },
    'sceneConfig': {
        'startPosition': {
            'x': -50,
            'y': 50,
            'z': 200
        },
        'clippingPlane': 200000,
        //'cssRenderer': '2D',
    }
};

export { multiAxisDrawing };
