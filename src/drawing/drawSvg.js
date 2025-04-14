import * as THREE from 'three';
import { SVGLoader } from 'svgloader';
import { drawBasicLights } from './drawLights.js';

const loader = new SVGLoader();

function isGiantWhiteBox(path) {
    const isGiantWhiteBox = path.color === 0xffffff && path.toShapes(true).length === 1;
    if (isGiantWhiteBox) {
        console.log('Giant white box detected');
        console.log('isGiantWhiteBox', path.color, path.toShapes(true).length, isGiantWhiteBox);
    }
    return isGiantWhiteBox;
}

function determineColor(path) {
    const style = path.userData?.style || {};
    // Some color fields might be inherited:
    //   - path.color        => usually the fill color
    //   - style.fill        => e.g. "rgb(255,204,0)" or "#ffcc00" or "none"
    //   - style.stroke      => e.g. "#000" or "none"

    let fillColor = style.fill;
    if (fillColor === 'none' || !fillColor) {
        fillColor = style.stroke;
    }
    if (!fillColor || fillColor === 'none') {
        // fallback
        //fillColor = '#888888';
        fillColor = 'none';
    }

    console.log('style', style);

    if (fillColor.startsWith('rgb')) {
        console.log('rgb', fillColor);
        const rgb = fillColor.match(/\d+/g);
        fillColor = `#${rgb.map(num => parseInt(num).toString(16).padStart(2, '0')).join('')}`;
        //const threeColor = new THREE.Color(fillColor);
        // yellow
        const threeColor = new THREE.Color(0xffff00);
        return threeColor;
    }
    if (fillColor.startsWith('#')) {
        console.log('hex', fillColor);
        const threeColor = new THREE.Color(fillColor);
        return threeColor;
    }
    if (fillColor.startsWith('none')) {
        console.log('none', fillColor);
        return null;
    }

    console.log('unknown', fillColor);
    // default to black...
    const threeColor = new THREE.Color(0x888888);
    return threeColor;
}

function drawSvg(scene) {
    loader.load('imagery/OpenProject_out.svg', (data) => {
        data.paths.forEach((path, i) => {
            const shapes = SVGLoader.createShapes(path);

            //if (isGiantWhiteBox(path)) return;
            if (path.color === '#ffffff' || !path.userData?.style?.fill || path.toShapes().length === 0) {
                return;
            }
            console.log('Path #', i, 'color:', path.color, 'shapes:', shapes);

            const color = determineColor(path);

            // if g.id.startswith 'text'...
            console.log('path', path);

            shapes.forEach(shape => {
                console.log('shape', shape);
                // if color == yellow, exude farther forward...
                let geometry;
                if (color && color.getHex() === 0xffff00) {
                    geometry = new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false });
                } else {
                    geometry = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false });
                }
                let material;
                if (color) {
                    material = new THREE.MeshBasicMaterial({ color });
                } else {
                    material = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5 });
                }
                const mesh = new THREE.Mesh(geometry, material);
                scene.add(mesh);
            });
        });
    });

    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // make it horizontal
    floor.position.y = 0;
    floor.receiveShadow = true;

    scene.add(floor);

    // Add basic lights
    drawBasicLights(scene);
}


const svgDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawSvg, 'dataSrc': null}
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
    },
    'data': {
    }
}

export { svgDrawing };
