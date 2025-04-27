import { ExtrudeGeometry, Color, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry } from 'three';
import { SVGLoader } from 'svgloader';
import { drawBasicLights } from './drawLights.js';

const svgLoader = new SVGLoader();

function isGiantWhiteBox(path) {
    const isGiantWhiteBox = path.color === 0xffffff && path.toShapes(true).length === 1;
    if (isGiantWhiteBox) {
        console.log('Giant white box detected');
        console.log('isGiantWhiteBox', path.color, path.toShapes(true).length, isGiantWhiteBox);
    }
    return isGiantWhiteBox;
}

function deriveColorAndDepth(origType, fill, stroke) {
    // Derive color from style or path.color
    //let fillColor = fill || style.fill || path.color;
    let fillColor = fill;
    if (!fillColor || fillColor === 'none') fillColor = stroke;
    //if (!fillColor || fillColor === 'none') fillColor = '#888888';

    // Example: If it's "rect," extrude less; if it's "text," extrude more
    let depth = (origType === 'rect') ? 2 : 6;

    console.log('fillColor', fillColor);
    //    // xffff00
    //    if (fillColor === 'rgb(255,204,0)') {
    //        //fillColor = '#ffff00';
    //        fillColor = 'rgb(255,204,0)'
    //        depth = 4;
    //    }
    //
    //    //rgb(0,204,255)
    //    if (fillColor === 'rgb(0,204,255)') {
    //        fillColor = '#00ccff';
    //        depth = 4;
    //    }

    if (fillColor.startsWith('rgb')) {
        const rgb = fillColor.match(/\d+/g);
        fillColor = `#${rgb.map(num => parseInt(num).toString(16).padStart(2, '0')).join('')}`;
        depth = 4;
    }

    if (origType === 'circle') {
        depth = 6; // make circles pop out more for visibility
        //fillColor = '#00ccff'; // make them blue

        //        const points = shapes[0].getPoints(64);
        //        const geometry2d = new BufferGeometry().setFromPoints(points);
        //        const outline = new LineLoop(geometry2d, new LineBasicMaterial({ color: 0xff0000 }));
        //        scene.add(outline);
    }

    if (origType === 'badge') {
        depth = 6;
    }

    return { depth, fillColor };
}

function processShape(shape, depth, fillColor, isText = false) {
    const geometry = new ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: false
    });

    // Convert fillColor to a Three.Color
    const threeColor = new Color(fillColor);

    const material = new MeshBasicMaterial({ color: threeColor });
    const mesh = new Mesh(geometry, material);

    // Example transform to ensure correct orientation
    if (isText) {
        //mesh.rotation.x = Math.PI / 2; // Rotate text to face up
        // set it to be thicker and more visible
        console.log('isText', isText, mesh);
        //mesh.scale.set(2, 2, 4);
        //mesh.position.x += 2; // Move it up a bit
        mesh.scale.set(0.1, -0.1, 0.1);
    } else {
        mesh.scale.set(0.1, -0.1, 0.1);
    }

    return mesh;
}

function processPath(scene, path) {
    const style = path.userData?.style || {};
    const node  = path.userData?.node;  // The raw SVG DOM node (if present)
    const origType = node?.getAttribute('data-orig-type') || '';
    const fill = node?.getAttribute('data-orig-fill') || '';

    if (fill === 'white') {
        // this is probably the big white box, so returning...
        // if you intentionally have a white element, adjust the fill (even imperceptibly if desired).
        return;
    }

    // If we ONLY want "rect" or "text," skip if not:
    if (origType !== 'rect' && origType !== 'text') {
        //return;
    }

    // Convert path to shapes
    const shapes = SVGLoader.createShapes(path);
    if (!shapes.length) return;

    const { depth, fillColor } = deriveColorAndDepth(origType, fill, style.stroke);

    const isText = origType === 'text';
    console.log('path', isText, path);

    shapes.forEach(shape => {
        const mesh = processShape(shape, depth, fillColor, isText);
        scene.add(mesh);
    });
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
        //const threeColor = new Color(fillColor);
        // yellow
        const threeColor = new Color(0xffff00);
        return threeColor;
    }
    if (fillColor.startsWith('#')) {
        console.log('hex', fillColor);
        const threeColor = new Color(fillColor);
        return threeColor;
    }
    if (fillColor.startsWith('none')) {
        console.log('none', fillColor);
        return null;
    }

    console.log('unknown', fillColor);
    // default to black...
    const threeColor = new Color(0x888888);
    return threeColor;
}

function drawSvg(scene, data, threejsDrawing) {
    data.paths.forEach((path, i) => {
        processPath(scene, path);
    });

    const floorGeometry = new PlaneGeometry(200, 200);
    const floorMaterial = new MeshStandardMaterial({
        color: 0x888888,
    });

    const floor = new Mesh(floorGeometry, floorMaterial);
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
        {'func': drawSvg, 'dataSrc': 'OpenProject', 'dataType': 'svg'}
    ],
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
    },
    'data': {
    }
}

export { svgDrawing };
