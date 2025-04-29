import {
    ExtrudeGeometry, Color, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Group, Box3,
    Vector2, Vector3, Raycaster, DoubleSide, ShaderMaterial
} from 'three';
import { SVGLoader } from 'svgloader';
import { drawBasicLights } from './drawLights.js';

const svgLoader = new SVGLoader();
const interactiveSvgGroups = [];
const raycaster = new Raycaster();
const pointer   = new Vector2();
let   hovered   = null;

function renderLinearGradient(vDirValues, colorA, colorB) {
    //const vDir = new Vector2(1004.84 - 924.84, 654.9  - 614.9).normalize();
    const vDir = new Vector2(vDirValues[0], vDirValues[1]).normalize();

    // pass to shader
    const material = new ShaderMaterial({
        uniforms: {
            //colorA: {value: new Color(0xE8EEF7)},
            //colorB: {value: new Color(0xB7C9E3)},
            colorA: {value: new Color(colorA)},
            colorB: {value: new Color(colorB)},
            gDir:   {value: vDir}
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;                          // pass UV to frag
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }`,
        fragmentShader: `
            uniform vec3 colorA;
            uniform vec3 colorB;
            uniform vec2 gDir;
            varying vec2 vUv;

            void main() {
                // project UV onto gradient direction
                float t = dot(vUv, normalize(gDir));
                // reflect mode ⇒ mirror at every integer
                t = abs(fract(t * 1.0) * 2.0 - 1.0);
                gl_FragColor = vec4(mix(colorA, colorB, t), 1.0);
            }`
        });

    //const mesh = new Mesh(new PlaneGeometry(2,1), material);
    //scene.add(mesh);
    return material;
}

function isGiantWhiteBox(path) {
    const isGiantWhiteBox = path.color === 0xffffff && path.toShapes(true).length === 1;
    if (isGiantWhiteBox) {
        console.log('Giant white box detected');
        console.log('isGiantWhiteBox', path.color, path.toShapes(true).length, isGiantWhiteBox);
    }
    return isGiantWhiteBox;
}

function deriveColorAndDepth(origType, fill, stroke) {
    console.log('origType', origType, fill, stroke);
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

function processShape(shape, depth, fillColor, isText = false, linearGradient = null) {
    const geometry = new ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: false
    });

    // Convert fillColor to a Three.Color
    const threeColor = new Color(fillColor);

    let material;
    if (linearGradient) {
        material = renderLinearGradient(linearGradient.vDir, linearGradient.colorA, linearGradient.colorB);
    } else {
        material = new MeshBasicMaterial({ color: threeColor });
    }
//    const material = new MeshStandardMaterial({
//        color: threeColor,
//        flatShading: true,
//        //transparent: true,
//        //opacity: 0.5,
//        //depthWrite: false,
//        side: DoubleSide,
//        //emissive: threeColor,
//    });

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

function processPath(path) {
    const style = path.userData?.style || {};
    const node  = path.userData?.node;  // The raw SVG DOM node (if present)
    const origType = node?.getAttribute('data-orig-type') || '';
    const fill = node?.getAttribute('data-orig-fill') || '';
    let linearGradient;

    // g: linear-gradient="80.0,40.0,rgb(232,238,247),rgb(183,201,227)"
    if (node?.getAttribute('linear-gradient')) {
        const gradient = node.getAttribute('linear-gradient');
        const [x, y, colorA, colorB] = gradient.split(';');
        const vDir = [parseFloat(x), parseFloat(y)];
        linearGradient = {
            vDir: vDir,
            colorA: colorA,
            colorB: colorB
        }
    }

    const pathGroup = new Group();

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

    const { depth, fillColor } = linearGradient ? { depth: 6, fillColor: null } : deriveColorAndDepth(origType, fill, style.stroke)

    const isText = origType === 'text';
    console.log('path', isText, path);

    shapes.forEach(shape => {
        const mesh = processShape(shape, depth, fillColor, isText, linearGradient);
        pathGroup.add(mesh);
    });

    pathGroup.userData = {
        kind : 'svgPath',
        label: node?.getAttribute('id') ||  node?.getAttribute('class') || 'unnamed'
    };

    interactiveSvgGroups.push(pathGroup);

    return pathGroup;
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

const toArray = (v, n) => Array.isArray(v) ? v : Array(n).fill(v);
const defaultDepth = 1;

function buildSvgGroup({
    data,                     // SVGLoader output         (required)
    position = [0, 0, 0],     // world-space position      (optional)
    rotation = [0, 0, 0],     // world-space rotation      (optional)
    scale    = 0.1,           // uniform or [sx,sy,sz]     (optional)
    depth    = defaultDepth   // fallback extrusion depth  (optional)
}) {
    const group = new Group();
    const [sx, sy, sz] = toArray(scale, 3);

    /* --- iterate svg paths --- */
    data.paths.forEach(path => {
        //const pathGroup = processPath(path, depth);   // <-- now returns a Group
        const pathGroup = processPath(path);   // <-- now returns a Group
        if (pathGroup) group.add(pathGroup);
    });

    /* --- single flip+scale instead of per-mesh flip --- */
    group.scale.set(sx, sy, sz);      // flip Y (SVG uses Y-down coords)

    /* --- place in world space --- */
    group.position.fromArray(position);
    group.rotation.fromArray(rotation);

    /* (optional) center pivot on the group's own bounding box */
    centerGroupPivot(group);

    return group;
}

/* ---------- 1 SVG path → array<THREE.Mesh> ---------- */

function pathToMeshes(path, fallbackDepth) {
    const node  = path.userData?.node;
    const type  = node?.getAttribute('data-orig-type') || '';
    const fill  = node?.getAttribute('data-orig-fill') || '';
    const style = path.userData?.style || {};

    /* skip transparent / unwanted nodes here if you wish */
    if (fill === 'white') return [];

    const { depth, fillColor } = deriveColorAndDepth(type, fill, style.stroke, fallbackDepth);

    const isText = type === 'text';
    const shapes = SVGLoader.createShapes(path);

    return shapes.map(shape => processShape(shape, depth, fillColor, isText));
}

/* ---------- convenience: find BB center & re-pivot ---------- */

function centerGroupPivot(group) {
    const box = new Box3().setFromObject(group);
    const center = box.getCenter(new Vector3());
    group.children.forEach(child => child.position.sub(center));
    group.position.add(center);
}

function loadSvg(url) {
    return new Promise((resolve, reject) => {
        svgLoader.load(url, (data) => {
            resolve(data);
        }, undefined, (err) => {
            console.error('Error loading SVG:', err);
            reject(err);
        });
    });
}

const svgsToRender = [
    {
        //data: svgData_1,              // output of SVGLoader.parse() or loader.loadAsync()
        data_src: 'OpenProject_out_annotated', // path to SVG file
        position: [   0, 0,   0],
        rotation: [   0, 0,   0],     // (optional) radians
        //scale   : 0.1,                // (optional) uniform; can also be [sx,sy,sz]
        scale: 1,
        depth   : 1.5                 // (optional) default extrusion depth for <rect>/<path>
    },
    {
        //data: svgData_2,
        data_src: 'OpenProject_out_annotated', // path to SVG file
        position: [ 50, 0, 25],
        rotation: [  0, Math.PI/2, 0],
        //scale   : 0.05,
        scale: 1,
        depth   : 0.8
    }
];


async function drawMultipleSvgs(scene, data, threejsDrawing) {
    // Load SVG data
    const svgPromises = svgsToRender.map(cfg => {
        return loadSvg(`./imagery/${cfg.data_src}.svg`).then(data => {
            cfg.data = data;
        });
    });

    const res = await Promise.all(svgPromises);
    console.log('SVG data loaded:', res);

    // Create a plane for the ground
    const floorGeometry = new PlaneGeometry(200, 200);
    const floorMaterial = new MeshStandardMaterial({
        color: 0x888888,
    });

    const floor = new Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // make it horizontal
    floor.position.y = 0;
    floor.receiveShadow = true;
    // move floor down 20 units...
    floor.position.y = -100;
    scene.add(floor);

    // Add basic lights
    drawBasicLights(scene);

    svgsToRender.forEach(cfg => {
        const g = buildSvgGroup(cfg);
        scene.add(g);
    });
}

function updatePointer(evt, renderer) {
    const { left, top, width, height } = renderer.domElement.getBoundingClientRect();
    pointer.x =  ( (evt.clientX - left) / width  ) * 2 - 1;
    pointer.y = -( (evt.clientY - top ) / height ) * 2 + 1;
}

function onPointerMove(evt, renderer, camera) {
    updatePointer(evt, renderer);

    raycaster.setFromCamera(pointer, camera);
    const [hit] = raycaster.intersectObjects(interactiveSvgGroups, true);

    const newHovered = hit ? findInteractiveParent(hit.object) : null;

    if (newHovered !== hovered) {
        if (hovered) hovered.traverse(ch => {
            if (ch.material?.color) ch.material.color.copy(ch.userData.origColor);
        });
        hovered = newHovered;
        if (hovered) hovered.traverse(ch => {
            if (ch.material?.color) {
                if (!ch.userData.origColor) {
                    ch.userData.origColor = ch.material.color.clone();
                }
                ch.material.color.offsetHSL(0, 0, 0.2);
            }
        });

        renderer.domElement.style.cursor = hovered ? 'pointer' : 'default';
    }
}

function findInteractiveParent(obj) {
    while (obj) {
        if (obj.userData?.kind === 'svgPath') return obj;
        obj = obj.parent;
    }
    return null;
}

function onPointerClick(evt) {
    if (!hovered) return;            // nothing under pointer

    // simple demo: log info
    console.log('Clicked SVG path', hovered.userData.label);

    //  tailor behaviour per-path if you want …
    if (hovered.userData.label === 'my-special-rect') {
        // do something unique
    }
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

const multiSvgDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawMultipleSvgs, 'dataSrc': null, 'dataType': 'svg'}
    ],
    'eventListeners': {
        'pointermove': (event, data) => {
            onPointerMove(event, data.renderer, data.camera);
        },
        'click': (event, data) => {
            console.log('click', event, data);
            onPointerClick(event, data.renderer, data.camera);
        }
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
    },
    'data': {
    },
    'sceneConfig': {
        'startPosition': {'x': 0, 'y': 0, 'z': -100},
    }
}

export { svgDrawing, multiSvgDrawing };
