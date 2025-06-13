import * as THREE from "three";
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { drawBasicLights } from './drawLights';
import { ThreeJSDrawing } from "../../threejsDrawing";

const svgLoader = new SVGLoader();
const interactiveSvgGroups: THREE.Object3D<THREE.Object3DEventMap>[] = [];
const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2();
let   hovered: THREE.Object3D<THREE.Object3DEventMap> | null   = null;

function cssToColor(cssString: string, fallback = 0x888888) {
    const c = new THREE.Color();
    // setStyle understands rgb(), hsl(), hex, named colours … everything the <svg> can throw at you
    const ok = c.setStyle(cssString);
    return ok ? c : new THREE.Color(fallback);
}

function renderLinearGradientCanvas(colA: THREE.Color, colB: THREE.Color, horizontal = true) {
    const size    = 128;               // tiny; will be stretched by UVs
    const canvas  = document.createElement('canvas');
    canvas.width  = canvas.height = size;
    const ctx     = canvas.getContext('2d');

    if (!ctx) {
        console.error('Failed to create canvas context');
        return new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide, toneMapped: false });
    }

    const grad = ctx.createLinearGradient(0, 0, horizontal ? size : 0, horizontal ? 0    : size);
    grad.addColorStop(0, colA.getStyle());
    grad.addColorStop(1, colB.getStyle());
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.MirroredRepeatWrapping;   // ⇐ “reflect” like SVG
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false });
}

function renderLinearGradient(vDirValues: [number, number], colorA: string, colorB: string) {
    //const vDir = new Vector2(1004.84 - 924.84, 654.9  - 614.9).normalize();
    const vDir = new THREE.Vector2(vDirValues[0], vDirValues[1]).normalize();

    const material = new THREE.ShaderMaterial({
        uniforms: {
            colorA: {value: new THREE.Color(colorA)},
            colorB: {value: new THREE.Color(colorB)},
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
            }`,
        side: THREE.DoubleSide,
        toneMapped: false                 // keep colours pure when colour-management is on
    });

    //const mesh = new Mesh(new PlaneGeometry(2,1), material);
    //scene.add(mesh);
    return material;
}

function isGiantWhiteBox(path: THREE.Path) {
    const style = path.userData?.style || {};
    const fillColor = style.fill || style.stroke || '';
    const isGiantWhiteBox = (fillColor === '#ffffff' || fillColor === 'white' || fillColor === 'rgb(255,255,255)') && path.toShapes(true).length === 1;
    if (isGiantWhiteBox) {
        console.log('Giant white box detected');
        console.log('isGiantWhiteBox', fillColor, path.toShapes(true).length, isGiantWhiteBox);
    }
    return isGiantWhiteBox;
}

function removeSpacesRGB(rgb: string) {
    const rgbString = rgb.match(/\d+/g);
    return `#${rgbString.map(num => parseInt(num).toString(16).padStart(2, '0')).join('')}`;
}

function processShape(
    shape: THREE.Shape,
    depth: number,
    fillColor: string,
    isText = false,
    linearGradient: { vDir: number[]; colorA: string; colorB: string; } | null = null
) {
    const geometry = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: false});

    let material;
    if (linearGradient) {
        //material = renderLinearGradient(linearGradient.vDir, linearGradient.colorA, linearGradient.colorB);
        material = renderLinearGradientCanvas(linearGradient.colorA, linearGradient.colorB, Math.abs(linearGradient.vDir[0]) > Math.abs(linearGradient.vDir[1]));
    } else {
        const threeColor = cssToColor(fillColor, 0x888888);
        console.log('threeColor', threeColor, fillColor);
        material = new THREE.MeshBasicMaterial({ color: threeColor, toneMapped: false });
    }
    material.side = THREE.DoubleSide;

    const mesh = new THREE.Mesh(geometry, material);

    // Example transform to ensure correct orientation
    if (isText) {
        mesh.scale.set(0.1, -0.1, 0.1);
    } else {
        mesh.scale.set(0.1, -0.1, 0.1);
    }

    //mesh.scale.set(0.1, 0.1, 0.1);
    //mesh.rotateX(Math.PI);

    return mesh;
}

function processPath(path: any) {
    const style = path.userData?.style || {};
    const node  = path.userData?.node;  // Original SVG DOM node (if present)
    const configuration = node?.getAttribute('data-configuration') || '';
    const origType = node?.getAttribute('data-orig-type') || configuration || '';
    const fill = node?.getAttribute('data-orig-fill') || '';
    console.log('node', origType, node);
    let linearGradient: {
        vDir: number[],
        colorA: string,
        colorB: string
    } | null = null;
    let fillColor = style.fill || style.stroke || 'none';

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

    const pathGroup = new THREE.Group();

    if (fill === 'white') {
        // this is probably the big white box, so returning...
        // if you intentionally have a white element, adjust the fill (even imperceptibly if desired).
        return;
    }

    // Convert path to shapes
    const shapes = SVGLoader.createShapes(path);
    if (!shapes.length) return;

    if (!fill || fill === 'none') fillColor = style.stroke;

    // Example: If it's "rect," extrude less; if it's "text," extrude more
    let depth = (origType === 'rect') ? 2 : 6;

    if (fill.startsWith('rgb')) {
        fillColor = removeSpacesRGB(fill);
        depth = 4;
    }

    if (origType === 'circle' || origType === 'badge' || origType === 'ellipse' || origType === 'diamond') {
        depth = 6;
    }

    const isText = origType === 'text';

    shapes.forEach((shape: THREE.Shape) => {
        let theColor;
        console.log('fillColor', fillColor, linearGradient);
        if (fillColor === 'none' && isText) {
            console.warn('Skipping shape with fillColor none or linear gradient', fillColor, path);
            theColor = 'black';

            const mesh = processShape(shape, 6, theColor, isText, linearGradient);
            pathGroup.add(mesh);
        } else if (linearGradient) {
            theColor = null;

            const mesh = processShape(shape, 6, theColor, isText, linearGradient);
            pathGroup.add(mesh);
        } else {
            theColor = fillColor || 'blue';

            if (origType === 'edge') {
                const mesh = processShape(shape, 6, 'yellow', isText, linearGradient);
                pathGroup.add(mesh);
            } else if ((origType === 'rect' || origType === 'ellipse' || origType === 'circle') && fillColor !== 'black') {
                // rect or ellipse etc with fillColor black is probably the outline only...
                console.log('rect', theColor);
                //theColor = 'yellow';
                //theColor = '#ffcc00';
                const mesh = processShape(shape, 4, theColor, isText, linearGradient);
                pathGroup.add(mesh);
            }
        }
    });

    pathGroup.userData = {kind : 'svgPath', label: node?.getAttribute('id') ||  node?.getAttribute('class') || 'unnamed'};

    interactiveSvgGroups.push(pathGroup);

    return pathGroup;
}

class Path {
    path: THREE.Path;
    color: THREE.Color;

    constructor(path: THREE.Path) {
        this.path = path;
        this.color = determineColor(path);
    }
}

function determineColor(path: THREE.Path) {
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
        fillColor = 'none';
    }

    if (fillColor.startsWith('rgb')) {
        const rgb = fillColor.match(/\d+/g);
        fillColor = `#${rgb.map((num: string) => parseInt(num).toString(16).padStart(2, '0')).join('')}`;
        const threeColor = new THREE.Color(0xffff00);
        return threeColor;
    }
    if (fillColor.startsWith('#')) {
        const threeColor = new THREE.Color(fillColor);
        return threeColor;
    }
    if (fillColor.startsWith('none')) {
        return null;
    }

    // default to black...
    const threeColor = new THREE.Color(0x888888);
    return threeColor;
}

function drawSvg(scene: THREE.Scene, data: any, threejsDrawing: ThreeJSDrawing) {
    const svgGroup = new THREE.Group();
    data.paths.forEach((path: THREE.Path, i: number) => {
        const pathGroup = processPath(path);
        svgGroup.add(pathGroup);
    });

    svgGroup.scale.set(0.5, 0.5, 0.5);
    svgGroup.position.set(0, 50, -20);
    svgGroup.rotateY(Math.PI);

    scene.add(svgGroup);

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

    // add ambient lights...
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
}

const toArray = (v: any, n: number) => Array.isArray(v) ? v : Array(n).fill(v);
const defaultDepth = 1;

function buildSvgGroup({
    data,                     // SVGLoader output         (required)
    position = [0, 0, 0],     // world-space position      (optional)
    rotation = [0, 0, 0],     // world-space rotation      (optional)
    scale    = 0.1,           // uniform or [sx,sy,sz]     (optional)
    depth    = defaultDepth   // fallback extrusion depth  (optional)
}) {
    const group = new THREE.Group();
    const [sx, sy, sz] = toArray(scale, 3);

    /* --- iterate svg paths --- */
    data.paths.forEach((path: THREE.Path) => {
        //const pathGroup = processPath(path, depth);   // <-- now returns a Group
        const pathGroup = processPath(path);   // <-- now returns a Group
        if (pathGroup) group.add(pathGroup);
    });

    /* --- single flip+scale instead of per-mesh flip --- */
    group.scale.set(sx, sy, sz);      // flip Y (SVG uses Y-down coords)

    /* --- place in world space --- */
    group.position.fromArray(position);
    group.rotation.fromArray([...rotation, 0, 0, 0].slice(0, 3) as [number, number, number]);

    /* (optional) center pivot on the group's own bounding box */
    centerGroupPivot(group);

    return group;
}

/* ---------- 1 SVG path → array<THREE.Mesh> ---------- */

function pathToMeshes(path: THREE.Path, fallbackDepth: number = defaultDepth) {
    const node  = path.userData?.node;
    const type  = node?.getAttribute('data-orig-type') || '';
    const fill  = node?.getAttribute('data-orig-fill') || '';
    const style = path.userData?.style || {};

    /* skip transparent / unwanted nodes here if you wish */
    if (fill === 'white') return [];

    const { depth, fillColor } = deriveColorAndDepth(type, fill, style.stroke, fallbackDepth);

    const isText = type === 'text';
    const shapes = SVGLoader.createShapes(path);

    return shapes.map((shape: THREE.Shape) => processShape(shape, depth, fillColor, isText));
}

/* ---------- convenience: find BB center & re-pivot ---------- */

function centerGroupPivot(group: THREE.Group) {
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.children.forEach(child => child.position.sub(center));
    group.position.add(center);
}

function loadSvg(url: string) {
    return new Promise((resolve, reject) => {
        svgLoader.load(url, (data: any) => {
            resolve(data);
        }, undefined, (err: any) => {
            console.error('Error loading SVG:', err);
            reject(err);
        });
    });
}

type SvgToRenderConfig = {
    data_src: string;
    position: number[];
    rotation: number[];
    scale: number;
    depth: number;
    data?: any;
};

const svgsToRender: SvgToRenderConfig[] = [
    {
        //data: svgData_1,              // output of SVGLoader.parse() or loader.loadAsync()
        data_src: 'OpenProject_out_annotated', // path to SVG file
        position: [-50, 50, -98],
        rotation: [   0, 0,   0],     // (optional) radians
        //scale   : 0.1,                // (optional) uniform; can also be [sx,sy,sz]
        scale: 1,
        depth   : 1.5                 // (optional) default extrusion depth for <rect>/<path>
    },
    {
        //data: svgData_2,
        data_src: 'OpenProject_out_annotated', // path to SVG file
        position: [-80, 50, -98],
        //rotation: [  0, Math.PI/2, 0],
        rotation: [0, 0, 0],     // (optional) radians
        //scale   : 0.05,
        scale: 1,
        depth   : 0.8
    }
];


async function drawMultipleSvgs(scene: THREE.Scene, data: any, threejsDrawing: ThreeJSDrawing) {
    // Load SVG data
    const svgPromises = svgsToRender.map(cfg => {
        return loadSvg(`./imagery/${cfg.data_src}.svg`).then(data => {
            cfg.data = data;
        });
    });

    const res = await Promise.all(svgPromises);
    console.log('SVG data loaded:', res);

    // Create a plane for the ground
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
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

function updatePointer(evt: PointerEvent, renderer: THREE.WebGLRenderer) {
    const { left, top, width, height } = renderer.domElement.getBoundingClientRect();
    pointer.x =  ( (evt.clientX - left) / width  ) * 2 - 1;
    pointer.y = -( (evt.clientY - top ) / height ) * 2 + 1;
}

function onPointerMove(evt: PointerEvent, renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    updatePointer(evt, renderer);

    raycaster.setFromCamera(pointer, camera);
    const [hit] = raycaster.intersectObjects(interactiveSvgGroups, true);

    const newHovered = hit ? findInteractiveParent(hit.object) : null;

    if (newHovered !== hovered) {
        if (hovered) hovered.traverse(ch => {
            if ((ch as THREE.Mesh).material && ((ch as THREE.Mesh).material as any).color) {
                ((ch as THREE.Mesh).material as any).color.copy(ch.userData.origColor);
            }
        });
        hovered = newHovered;
        if (hovered) hovered.traverse(ch => {
            if ((ch as THREE.Mesh).material && ((ch as THREE.Mesh).material as any).color) {
                if (!ch.userData.origColor) {
                    ch.userData.origColor = ((ch as THREE.Mesh).material as any).color.clone();
                }
                ((ch as THREE.Mesh).material as any).color.offsetHSL(0, 0, 0.2);
            }
        });

        renderer.domElement.style.cursor = hovered ? 'pointer' : 'default';
    }
}

function findInteractiveParent(obj: THREE.Object3D | null): THREE.Object3D | null {
    while (obj) {
        if (obj.userData?.kind === 'svgPath') return obj;
        obj = obj.parent;
    }
    return null;
}

function onPointerClick(evt: PointerEvent, renderer: any, camera: any) {
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
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
    },
    'data': {
    },
    'sceneConfig': {
        'startPosition': {'x': 0, 'y': 0, 'z': -80},
        'clippingPlane': 2000,
    }
}

const multiSvgDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawMultipleSvgs, 'dataSrc': null, 'dataType': 'svg'}
    ],
    'eventListeners': {
        'pointermove': (event: PointerEvent, data: any) => {
            onPointerMove(event, data.renderer, data.camera);
        },
        'click': (event: PointerEvent, data: any) => {
            console.log('click', event, data);
            onPointerClick(event, data.renderer, data.camera);
        }
    },
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
    },
    'data': {
    },
    'sceneConfig': {
        'startPosition': {'x': 0, 'y': 0, 'z': -100},
    }
}

export { svgDrawing, multiSvgDrawing, drawSvg, drawMultipleSvgs };
