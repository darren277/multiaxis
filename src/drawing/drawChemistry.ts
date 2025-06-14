import * as THREE from "three";

import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { drawBasicLights } from './reusables/drawLights';
import { ThreeJSDrawing } from "../threejsDrawing";

let labelRenderer: CSS2DRenderer;

export const molGraph = {
    nodes: [
        {id: 'ethanol',      pdb: 'ethanol.pdb'},
        {id: 'acetaldehyde', pdb: 'acetaldehyde.pdb'},
        {id: 'ethylCl',      pdb: 'chloroethane.pdb'}
    ],
    edges: [
        {from: 'ethanol',      to: 'acetaldehyde', label: 'PCC / CrO₃'},
        {from: 'acetaldehyde', to: 'ethanol',      label: 'LiAlH₄'},
        {from: 'ethanol',      to: 'ethylCl',      label: 'SOCl₂'}
    ]
};

type LayoutKey = 'ethanol' | 'acetaldehyde' | 'ethylCl';

const layout: Record<LayoutKey, THREE.Vector3> = {
    ethanol:      new THREE.Vector3(-360, 0, 0),
    acetaldehyde: new THREE.Vector3(   0, 0, 0),
    ethylCl:      new THREE.Vector3( 360, 0, 0)
};

const chemistry = {
    // Map<string, THREE.Group>
    nodeGroups : new Map<string, THREE.Group>(),
    // Map<string, THREE.Vector3>
    nodeCenters: new Map<string, THREE.Vector3>(),
    // Array<THREE.ArrowHelper>
    edgeArrows : [] as THREE.ArrowHelper[]
};


const loader = new PDBLoader();
const offset = new THREE.Vector3();


type MoleculeNode = {
    id: string;
    pdb: string;
};


function loadOneMolecule(node: MoleculeNode, scene: THREE.Scene) {
    return new Promise<void>((resolve) => {
        const root = new THREE.Group();
        scene.add(root);

        loader.load(`imagery/pdb/${node.pdb}`, (pdb: any) => {
            const geometryAtoms = pdb.geometryAtoms;
            const geometryBonds = pdb.geometryBonds;
            const json = pdb.json;

            const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
            const sphereGeometry = new THREE.IcosahedronGeometry(1, 3);

            geometryAtoms.computeBoundingBox();
            geometryAtoms.boundingBox.getCenter(offset).negate();

            geometryAtoms.translate(offset.x, offset.y, offset.z);
            geometryBonds.translate(offset.x, offset.y, offset.z);

            let positions = geometryAtoms.getAttribute('position');
            const colors = geometryAtoms.getAttribute('color');

            const position = new THREE.Vector3();
            const color = new THREE.Color();

            for (let i = 0; i < positions.count; i++) {
                position.x = positions.getX(i);
                position.y = positions.getY(i);
                position.z = positions.getZ(i);

                color.r = colors.getX(i);
                color.g = colors.getY(i);
                color.b = colors.getZ(i);

                const material = new THREE.MeshPhongMaterial({color: color});

                const object = new THREE.Mesh(sphereGeometry, material);
                object.position.copy(position);
                object.position.multiplyScalar(75);
                object.scale.multiplyScalar(25);
                root.add(object);

                const atom = json.atoms[i];

                const text = document.createElement('div');
                text.className = 'label';
                text.style.color = `rgb(${atom[3][0]}, ${atom[3][1]}, ${atom[3][2]})`;
                text.textContent = atom[4];

                const label = new CSS2DObject(text);
                label.position.copy(object.position);
                root.add(label);
            }

            positions = geometryBonds.getAttribute('position');

            const start = new THREE.Vector3();
            const end = new THREE.Vector3();

            for (let i=0; i < positions.count; i+=2) {

                start.x = positions.getX(i);
                start.y = positions.getY(i);
                start.z = positions.getZ(i);

                end.x = positions.getX(i+1);
                end.y = positions.getY(i+1);
                end.z = positions.getZ(i+1);

                start.multiplyScalar(75);
                end.multiplyScalar(75);

                const object = new THREE.Mesh(boxGeometry, new THREE.MeshPhongMaterial({color: 0xffffff}));
                object.position.copy(start);
                object.position.lerp(end, 0.5);
                object.scale.set(5, 5, start.distanceTo(end));
                object.lookAt(end);
                root.add(object);
            }

            root.position.copy(layout[node.id as LayoutKey]);
            chemistry.nodeGroups.set(node.id, root);

            // world‑space centre
            const centre = new THREE.Vector3();
            pdb.geometryAtoms.boundingBox.getCenter(centre).applyMatrix4(root.matrixWorld);
            chemistry.nodeCenters.set(node.id, centre);

            resolve();
        });
    });
}

function drawAllEdges(scene: THREE.Scene) {
    const arrowMat = new THREE.MeshPhongMaterial({ color: 0x2194ce });

    molGraph.edges.forEach(edge => {
        const from = chemistry.nodeCenters.get(edge.from);
        const to   = chemistry.nodeCenters.get(edge.to);
        if (!from || !to) return;

        const dir  = new THREE.Vector3().subVectors(to, from).normalize();
        const len  = from.distanceTo(to) - 40;          // trim a bit so it doesn't pierce atoms
        const arrow = new THREE.ArrowHelper(dir, from, len, 0x2194ce, 12, 6);
        scene.add(arrow);
        chemistry.edgeArrows.push(arrow);

        // put the reaction conditions in the middle
        const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = edge.label;
        const lbl = new CSS2DObject(div);
        lbl.position.copy(mid);
        scene.add(lbl);
    });
}



function drawChemistry(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing) {
    // Add basic lights
    drawBasicLights(scene, threejsDrawing);

    // ambient light...
    const ambientLight = new THREE.DirectionalLight(0xffffff, 0.5);
    ambientLight.position.set(0, 0, 1);

    scene.background = new THREE.Color(0x050505);

    const light1 = new THREE.DirectionalLight(0xffffff, 2.5);
    light1.position.set(1, 1, 1);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 1.5);
    light2.position.set(-1, -1, 1);
    scene.add(light2);

    const root = new THREE.Group();
    scene.add(root);

    const promises = molGraph.nodes.map(n => loadOneMolecule(n, scene));

    // once *all* PDBs are finished we can draw edges
    //Promise.all(promises).then(drawAllEdges);
    Promise.all(promises).then(() => {
        drawAllEdges(scene);
    });

    //threejsDrawing.data.molecules[params.molecule] = root;
}


const chemistryDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawChemistry, 'dataSrc': null, 'dataType': 'pdb'}
    ],
    'eventListeners': null,
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) => {
        const t = timestamp * 0.001;
        chemistry.nodeGroups.forEach(root => {
            root.rotation.y = t * 0.0004;
        });
    },
    'data': {
    },
    'sceneConfig': {
        'startPosition': {
            'x': -50,
            'y': 50,
            'z': 200
        },
        'clippingPlane': 200000,
        'cssRenderer': '2D',
    }
}

export { chemistryDrawing };
