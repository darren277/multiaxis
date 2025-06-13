import { Mesh, MeshStandardMaterial, Color, DirectionalLight, BufferGeometry, Line, LineBasicMaterial, Box3, Vector3 } from 'three';
import { PLYLoader } from 'plyloader';
import { CSS2DObject } from 'css2drenderer';

const loader = new PLYLoader();

const labelContainer = document.getElementById('labels');
const vector = new Vector3();

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

            // Label
            const labelDiv = document.createElement('div');
            labelDiv.className = 'brain-label';
            labelDiv.textContent = mesh.name;
            const label = new CSS2DObject(labelDiv);

            // Position label above mesh
            const box = new Box3().setFromObject(mesh);
            const center = box.getCenter(new Vector3());
            const labelPos = center.clone().add(new Vector3(0, 10, 0));
            label.position.copy(labelPos);
            mesh.add(label); // anchor to mesh

            // Optional: 3D leader line
            const points = [center, labelPos];
            const lineGeo = new BufferGeometry().setFromPoints(points);
            const line = new Line(lineGeo, new LineBasicMaterial({ color: 0xffffff }));
            scene.add(line);

            scene.add(mesh);
        });
    }
}


function updateLabelPosition(canvas, mesh, labelElement) {
    // Use mesh.position or bounding box center
    const box = new Box3().setFromObject(mesh);
    const center = box.getCenter(new Vector3());

    vector.copy(center);
    vector.project(camera); // project to NDC space

    const x = (vector.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-(vector.y * 0.5) + 0.5) * canvas.clientHeight;

    labelElement.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
}

function createLeaderLine(startPos, endPos) {
    const geometry = new BufferGeometry().setFromPoints([startPos, endPos]);
    const material = new LineBasicMaterial({ color: 0xffffff });
    return new Line(geometry, material);
}

function updateLeaderLine(line, startPos, labelElement) {
    const endVector = new Vector3();
    endVector.set((parseFloat(labelElement.style.left) / canvas.clientWidth) * 2 - 1, -(parseFloat(labelElement.style.top) / canvas.clientHeight) * 2 + 1, 0.5);

    endVector.unproject(camera);
    line.geometry.setFromPoints([startPos, endVector]);
}


/*
raycaster.setFromCamera(mouse, camera);
const intersects = raycaster.intersectObjects(scene.children);

for (const intersect of intersects) {
    if (intersect.object.name.startsWith('lh_')) {
        const label = document.getElementById(`label-${intersect.object.name}`);
        label.style.display = 'block';
    }
}
*/


function drawBrain(scene, threejsDrawing) {
    // Load the regions
    loadRegions(scene);

    // Optionally, you can add lighting or other scene elements here
    const light = new DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);

    threejsDrawing.data.scene = scene;

    // Add more scene setup as needed
}

const brainDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawBrain, 'dataSrc': null, 'dataType': 'ply'}
    ],
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, camera) => {
        const canvas = renderer.domElement;
        const scene = threejsDrawing.data.scene;
        for (const mesh of scene.children) {
            if (mesh.isMesh && mesh.name.startsWith('lh_')) {
                const label = document.getElementById(`label-${mesh.name}`);
                if (label) {
                    updateLabelPosition(mesh, label);
                }
            }
        }
    },
    'data': {
    },
    'sceneConfig': {
        'cssRenderer': '2D',
    }
}

export { brainDrawing };
