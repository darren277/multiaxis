import { PointLight, SphereGeometry, CylinderGeometry, Mesh, MeshStandardMaterial, MathUtils, Vector3 } from 'three';

// Define shared geometries/materials outside
const particleGeo = new SphereGeometry(0.2, 8, 8);
const particleMat = new MeshStandardMaterial({ color: 0xffaa00 });

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
}

// Animate neurotransmitter release
function releaseNeurotransmitters(scene, vesicles, particles) {
    vesicles.forEach(v => {
        const particle = new Mesh(particleGeo, particleMat.clone());
        particle.position.copy(v.position);
        particle.userData.velocity = new Vector3(0, -0.05 - Math.random() * 0.05, (Math.random() - 0.5) * 0.05);
        particles.push(particle);
        scene.add(particle);
    });
}


// Animate
let frame = 0;
function animateSynapse(scene, vesicles, particles) {
    if (frame % 150 === 0) {
        releaseNeurotransmitters(scene, vesicles, particles);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.add(p.userData.velocity);
        if (p.position.y < -5) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    }

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
        const { scene, particles = [], vesicles = [] } = threejsDrawing.data;

        if (scene && vesicles.length > 0) {
            animateSynapse(scene, vesicles, particles);
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