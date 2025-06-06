import {
    Group, Vector3, Color, DirectionalLight, BoxGeometry, IcosahedronGeometry, Mesh, MeshStandardMaterial, MeshPhongMaterial,
    PlaneGeometry, ArrowHelper, AmbientLight
} from 'three';

import { PDBLoader } from 'pdbloader';
import { CSS2DRenderer, CSS2DObject } from 'css2drenderer';
import { drawBasicLights } from './drawLights.js';

let labelRenderer;

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

const layout = {
    ethanol:      new Vector3(-360, 0, 0),
    acetaldehyde: new Vector3(   0, 0, 0),
    ethylCl:      new Vector3( 360, 0, 0)
};

const chemistry = {
    // Map<string, THREE.Group>
    nodeGroups : new Map(),
    // Map<string, THREE.Vector3>
    nodeCenters: new Map(),
    // Array<THREE.Object3D>
    edgeArrows : []
};


const loader = new PDBLoader();
const offset = new Vector3();



function loadOneMolecule(node, scene) {
    return new Promise((resolve) => {
        const root = new Group();
        scene.add(root);

        loader.load(`imagery/pdb/${node.pdb}`, pdb => {
            const geometryAtoms = pdb.geometryAtoms;
            const geometryBonds = pdb.geometryBonds;
            const json = pdb.json;

            const boxGeometry = new BoxGeometry(1, 1, 1);
            const sphereGeometry = new IcosahedronGeometry(1, 3);

            geometryAtoms.computeBoundingBox();
            geometryAtoms.boundingBox.getCenter(offset).negate();

            geometryAtoms.translate(offset.x, offset.y, offset.z);
            geometryBonds.translate(offset.x, offset.y, offset.z);

            let positions = geometryAtoms.getAttribute('position');
            const colors = geometryAtoms.getAttribute('color');

            const position = new Vector3();
            const color = new Color();

            for (let i = 0; i < positions.count; i++) {
                position.x = positions.getX(i);
                position.y = positions.getY(i);
                position.z = positions.getZ(i);

                color.r = colors.getX(i);
                color.g = colors.getY(i);
                color.b = colors.getZ(i);

                const material = new MeshPhongMaterial({color: color});

                const object = new Mesh(sphereGeometry, material);
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

            const start = new Vector3();
            const end = new Vector3();

            for (let i=0; i < positions.count; i+=2) {

                start.x = positions.getX(i);
                start.y = positions.getY(i);
                start.z = positions.getZ(i);

                end.x = positions.getX(i+1);
                end.y = positions.getY(i+1);
                end.z = positions.getZ(i+1);

                start.multiplyScalar(75);
                end.multiplyScalar(75);

                const object = new Mesh(boxGeometry, new MeshPhongMaterial({color: 0xffffff}));
                object.position.copy(start);
                object.position.lerp(end, 0.5);
                object.scale.set(5, 5, start.distanceTo(end));
                object.lookAt(end);
                root.add(object);
            }

            root.position.copy(layout[node.id]);
            chemistry.nodeGroups.set(node.id, root);

            // world‑space centre
            const centre = new Vector3();
            pdb.geometryAtoms.boundingBox.getCenter(centre).applyMatrix4(root.matrixWorld);
            chemistry.nodeCenters.set(node.id, centre);

            resolve();
        });
    });
}

function drawAllEdges(scene) {
    const arrowMat = new MeshPhongMaterial({ color: 0x2194ce });

    molGraph.edges.forEach(edge => {
        const from = chemistry.nodeCenters.get(edge.from);
        const to   = chemistry.nodeCenters.get(edge.to);
        if (!from || !to) return;

        const dir  = new Vector3().subVectors(to, from).normalize();
        const len  = from.distanceTo(to) - 40;          // trim a bit so it doesn't pierce atoms
        const arrow = new ArrowHelper(dir, from, len, 0x2194ce, 12, 6);
        scene.add(arrow);
        chemistry.edgeArrows.push(arrow);

        // put the reaction conditions in the middle
        const mid = new Vector3().addVectors(from, to).multiplyScalar(0.5);
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = edge.label;
        const lbl = new CSS2DObject(div);
        lbl.position.copy(mid);
        scene.add(lbl);
    });
}



function drawChemistry(scene, threejsDrawing) {
    // Add basic lights
    drawBasicLights(scene);

    // ambient light...
    const ambientLight = new DirectionalLight(0xffffff, 0.5);
    ambientLight.position.set(0, 0, 1);

    scene.background = new Color(0x050505);

    const light1 = new DirectionalLight(0xffffff, 2.5);
    light1.position.set(1, 1, 1);
    scene.add(light1);

    const light2 = new DirectionalLight(0xffffff, 1.5);
    light2.position.set(-1, -1, 1);
    scene.add(light2);

    const root = new Group();
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
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
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
