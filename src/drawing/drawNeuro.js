import { PointLight, AmbientLight, SphereGeometry, CylinderGeometry, Mesh, MeshStandardMaterial, MathUtils, Vector3 } from 'three';
import { modelRegistry } from './neuroGeometries.js';

// Define shared geometries/materials outside
const particleGeo = new SphereGeometry(0.2, 8, 8);
const particleMat = new MeshStandardMaterial({ color: 0xffaa00 });

const receptorColorMap = {
    AMPA: 0x33ff33,
    NMDA: 0x00cccc,
    GABA_A: 0xffffff
};

const highlightColor = 0xffff00; // universal "binding" color

function createNeurotransmitter(type = 'glutamate', position = new Vector3()) {
    const geo = modelRegistry.neurotransmitters.geometries[type];
    const mat = modelRegistry.neurotransmitters.materials[type].clone(); // clone so you can animate opacity, etc.

    const particle = new Mesh(geo, mat);
    particle.position.copy(position);
    particle.userData = {
        type,
        receptorTargets: getReceptorTargetsFor(type),
        velocity: new Vector3(
            0,
            -0.05 - Math.random() * 0.05,
            (Math.random() - 0.5) * 0.05
        )
    };

    return particle;
}

function createReceptor(type = 'AMPA', position = new Vector3()) {
    const geo = modelRegistry.receptors.geometries[type];
    const mat = modelRegistry.receptors.materials[type].clone();

    const receptor = new Mesh(geo, mat);
    receptor.position.copy(position);
    receptor.userData = {
        type,
        bound: false,
        radius: 0.5  // detection radius
    };

    return receptor;
}

function drawSynapse(scene, threejsDrawing) {
    // Light
    const light = new PointLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

    // Axon terminal (presynaptic)
    const preGeometry = new SphereGeometry(5, 32, 32);
    const preMaterial = new MeshStandardMaterial({ color: 0x4444ff, transparent: true, opacity: 0.6 });
    const presynaptic = new Mesh(preGeometry, preMaterial);
    presynaptic.position.set(0, 3, 0);
    scene.add(presynaptic);

    // Dendritic spine (postsynaptic)
    const postGeometry = new SphereGeometry(4, 32, 32);
    const postMaterial = new MeshStandardMaterial({ color: 0x44ff44, transparent: true, opacity: 0.6 });
    const postsynaptic = new Mesh(postGeometry, postMaterial);
    postsynaptic.position.set(0, -3, 0);
    scene.add(postsynaptic);

    // Synaptic cleft
    const cleftGeometry = new CylinderGeometry(2, 2, 2, 32);
    const cleftMaterial = new MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
    const cleft = new Mesh(cleftGeometry, cleftMaterial);
    cleft.rotation.x = Math.PI / 2;
    scene.add(cleft);

    // Vesicles
    const vesicles = [];
    for (let i = 0; i < 10; i++) {
        const vesicleGeo = new SphereGeometry(0.4, 16, 16);
        const vesicleMat = new MeshStandardMaterial({ color: 0xff4444 });
        const vesicle = new Mesh(vesicleGeo, vesicleMat);
        vesicle.position.set(MathUtils.randFloat(-2, 2), MathUtils.randFloat(1, 3), MathUtils.randFloat(-2, 2));
        vesicles.push(vesicle);
        scene.add(vesicle);
    }

    threejsDrawing.data.vesicles = vesicles;

    // Neurotransmitter particles
    const particles = [];
    const particleGeo = new SphereGeometry(0.2, 8, 8);
    const particleMat = new MeshStandardMaterial({ color: 0xffaa00 });

    threejsDrawing.data.scene = scene;
    threejsDrawing.data.particles = particles;

    const receptors = [];
    const receptorTypes = ['AMPA']; // Later: NMDA, GABA_A, etc.

    // Place some example receptors on the postsynaptic surface
    receptorTypes.forEach((type, i) => {
        for (let j = 0; j < 4; j++) {
            const receptor = createReceptor(type, new Vector3(
                -1.5 + j * 1.0,
                -4,
                (Math.random() - 0.5) * 2
            ));
            scene.add(receptor);
            receptors.push(receptor);
        }
    });

    threejsDrawing.data.receptors = receptors;

    // draw ambient light...
    const ambientLight = new AmbientLight(0x404040, 0.5); // soft white light
    scene.add(ambientLight);
}

// Helper: define neurotransmitter-receptor mapping
function getReceptorTargetsFor(ntype) {
    const targets = {
        glutamate: ['AMPA', 'NMDA'],
        dopamine: ['D1', 'D2'],
        serotonin: ['5HT2A'],
        gaba: ['GABA_A']
    };
    return targets[ntype] || [];
}

// Animate neurotransmitter release
function releaseNeurotransmitters(scene, vesicles, particles, transmitters = ['glutamate']) {
    vesicles.forEach(v => {
        const type = transmitters[Math.floor(Math.random() * transmitters.length)];
        const particle = createNeurotransmitter(type, v.position);
        particles.push(particle);
        scene.add(particle);
    });
}

function resetReceptors(receptorMeshes) {
    receptorMeshes.forEach(r => {
        r.userData.bound = false;
        r.material.color.set(modelRegistry.receptors.materials[r.userData.type].color);
    });
}


function onBind(nt, receptor) {
    console.log(`Binding ${nt.userData.type} to ${receptor.userData.type}`);

    // Optional: add feedback on binding
    receptor.material.color.set(highlightColor);
    receptor.userData.pulse = Math.PI * 2;

    // EFFECT: Change neurotransmitter color
    nt.material.color.set(0xff00ff);  // Magenta burst
    nt.material.transparent = true;
    nt.material.opacity = 1.0;

    receptor.userData.bound = true;

    // Optional: remove or freeze particle
    nt.userData.bound = true;
}


// Animate
let frame = 0;
function animateSynapse(scene, vesicles, particles, transmitters = ['glutamate'], receptors = ['AMPA'], receptorMeshes = []) {
    if (frame % 150 === 0) {
        releaseNeurotransmitters(scene, vesicles, particles, transmitters);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.add(p.userData.velocity);

        // Binding detection
        for (let j = 0; j < receptorMeshes.length; j++) {
            const r = receptorMeshes[j];
            if (r.userData.bound) continue;

            const dist = p.position.distanceTo(r.position);
            if (
                dist < r.userData.radius &&
                p.userData.receptorTargets.includes(r.userData.type)
            ) {
                // Bind
                r.userData.bound = true;

                onBind(p, r);

                // Optional: remove or freeze particle
                scene.remove(p);
                particles.splice(i, 1);
                break;
            }
        }

        if (p.position.y < -5) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    }

    receptorMeshes.forEach(r => {
        if (r.userData.pulse > 0) {
            const scale = 1 + 0.1 * Math.sin(r.userData.pulse);
            r.scale.set(scale, scale, scale);
            r.userData.pulse -= 0.3;
            if (r.userData.pulse <= 0) r.scale.set(1, 1, 1); // reset scale
            r.material.color.set(receptorColorMap[r.userData.type]);
        }
    });

    frame++;
}

const synapseDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawSynapse, 'dataSrc': null, 'dataType': null}
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
        const { scene, particles = [], vesicles = [], receptors = [] } = threejsDrawing.data;

        if (scene && vesicles.length > 0) {
            animateSynapse(scene, vesicles, particles, ['glutamate'], ['AMPA'], receptors);
        } else {
            console.warn('Synapse drawing: no vesicles or scene found.');
        }
    },
    'data': {
        'particles': [],
        'scene': null,
    }
}

export { synapseDrawing };