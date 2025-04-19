import { Mesh, MeshStandardMaterial, Color, DirectionalLight } from 'three';
import { PLYLoader } from 'plyloader';

const loader = new PLYLoader();
const regionNames = [
    'caudalanteriorcingulate',
    'caudalmiddlefrontal',
    'cuneus',
    'entorhinal',
    'fusiform',
    'inferiorparietal',
    'inferiortemporal',
    'insula',
    'isthmuscingulate',
    'lateraloccipital',
    'lateralorbitofrontal',
    'lingual',
    'medialorbitofrontal',
    'middletemporal',
    'paracentral',
    'parahippocampal',
    'parsopercularis',
    'parsorbitalis',
    'parstriangularis',
    'pericalcarine',
    'postcentral',
    'posteriorcingulate',
    'precentral',
    'precuneus',
    'rostralanteriorcingulate',
    'rostralmiddlefrontal',
    'superiorfrontal',
    'superiorparietal',
    'superiortemporal',
    'supramarginal',
    'transversetemporal',
    'unknown',
];

const LH_PREFIX = 'lh.pial.DKT.';
const RH_PREFIX = 'rh.pial.DKT.';
const SUFFIX = '.ply';

const constructedRegionNames = [
    ...regionNames.map(name => `/${LH_PREFIX}${name}${SUFFIX}`),
    ...regionNames.map(name => `/${RH_PREFIX}${name}${SUFFIX}`)
];

async function loadRegions(scene) {
    const basePath = 'imagery/brain/ply';  // adjust as needed

    for (const name of constructedRegionNames) {
        loader.load(`${basePath}${name}`, geometry => {
            geometry.computeVertexNormals();  // just in case

            const material = new MeshStandardMaterial({
                color: new Color(Math.random(), Math.random(), Math.random()),
                flatShading: false,
            });

            const mesh = new Mesh(geometry, material);
            mesh.name = name.replace('.ply', '');  // optional
            scene.add(mesh);
        });
    }
}

function drawBrain(scene, threejsDrawing) {
    // Load the regions
    loadRegions(scene);

    // Optionally, you can add lighting or other scene elements here
    const light = new DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);

    // Add more scene setup as needed
}

const brainDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawBrain, 'dataSrc': null, 'dataType': 'ply'}
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
    },
    'data': {
    }
}

export { brainDrawing };
