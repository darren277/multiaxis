import * as THREE from 'three';

const planets = [
    {"name": "Mercury", "diameter": 4879, "rotation": 58.6, "revolution": 87.97, "distance_from_sun": 57.9*(10**6), "texture": "8k_mercury.jpg"},
    {"name": "Venus", "diameter": 12104, "rotation": 243, "revolution": 224.7, "distance_from_sun": 108.2*(10**6), "texture": "8k_venus.jpg"},
    {"name": "Earth", "diameter": 12756, "rotation": 0.99, "revolution": 365.26, "distance_from_sun": 149.6*(10**6), "texture": "8k_earth_daymap.jpg"},
    {"name": "Mars", "diameter": 6792, "rotation": 1.03, "revolution": 1.88, "distance_from_sun": 227.9*(10**6), "texture": "8k_mars.jpg"},
    {"name": "Jupiter", "diameter": 142984, "rotation": 0.41, "revolution": 11.86, "distance_from_sun": 778.6*(10**6), "texture": "8k_jupiter.jpg"},
    {"name": "Saturn", "diameter": 120536, "rotation": 0.45, "revolution": 29.46, "distance_from_sun": 1433.5*(10**6), "texture": "8k_saturn.jpg"},
    {"name": "Uranus", "diameter": 51118, "rotation": 0.72, "revolution": 84.01, "distance_from_sun": 2872.5*(10**6), "texture": "2k_uranus.jpg"},
    {"name": "Neptune", "diameter": 49528, "rotation": 0.67, "revolution": 164.79, "distance_from_sun": 4495.1*(10**6), "texture": "2k_neptune.jpg"},
]

let planetObjects = [];

const textureLoader = new THREE.TextureLoader();

// Example: 1 unit = 10,000 km (arbitrary but keeps numbers smaller)
const SCALE_FACTOR = 1 / 10000;

//const SUN_ACTUAL_RADIUS = 1391400;   // km
const SUN_ACTUAL_RADIUS = 1391400; // km (scaled down)

// Scaled down for easier visualization
const sunRadius = (SCALE_FACTOR * SUN_ACTUAL_RADIUS);

const PLANET_DISTANCE_SCALE_FACTOR = 0.05; // Scale factor for planet distances
const PLANET_SIZE_SCALE_FACTOR = 10;

// multiplying by 10 for easier visualization...
const dayToRealSeconds = 1.0;
// Then each second, Earth covers (360° / 365.26) = ~0.9856° of its orbit.

function createPlanet(planetData, scene) {
    // Convert diameter (km) to radius in Three.js units
    const radius = (planetData.diameter / 2) * SCALE_FACTOR * PLANET_SIZE_SCALE_FACTOR;

    // Create geometry & material
    const geometry = new THREE.SphereGeometry(radius, 32, 32);

    // If you have texture images, load them here:
    const texture = textureLoader.load(`textures/${planetData.texture}`);

    const material = new THREE.MeshStandardMaterial({
        map: texture,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Position the planet at the correct orbital distance from Sun
    // (on the +X axis initially).
    // distance_from_sun is in km, so multiply by SCALE_FACTOR
    const orbitRadius = planetData.distance_from_sun * SCALE_FACTOR * PLANET_DISTANCE_SCALE_FACTOR;
    mesh.position.set(orbitRadius, 0, 0);

    // If you plan on casting/receiving shadows:
    mesh.castShadow = true;
    mesh.receiveShadow = false;

    // Add the planet mesh to the scene
    scene.add(mesh);

    // Return an object that holds all relevant info for animation
    return {
        name: planetData.name,
        mesh: mesh,
        orbitAngle: 0, // We'll increment this in animation
        rotationAngle: 0, // optional if you want separate axis spin
        orbitRadius: orbitRadius,
        revolution: planetData.revolution, // days to orbit (Mercury: 88 days, Earth: 365, etc.)
        rotation: planetData.rotation,     // days to rotate once
    };
}


function castStars(scene, threejsDrawing) {
    const starTexture = textureLoader.load('textures/8k_stars.jpg');

    // reduce mipmap blurring
    starTexture.minFilter = THREE.LinearFilter;
    starTexture.magFilter = THREE.LinearFilter;

    const cubeSize = 100000; // Large enough to encompass entire solar system

    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

    // Material with your star texture on all sides
    const material = new THREE.MeshBasicMaterial({
        map: starTexture,
        side: THREE.BackSide // Invert the faces so the texture is visible from inside
    });

    const skybox = new THREE.Mesh(geometry, material);
    scene.add(skybox);

    threejsDrawing.data.skybox = skybox; // Store reference to the skybox in data
}

function drawFloor(scene, orbitRadius) {
    const size = orbitRadius * 2.5;

    const floorGeometry = new THREE.PlaneGeometry(size, size);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // make it horizontal
    floor.position.y = -100;
    floor.receiveShadow = true;
    scene.add(floor);
}

// TODO: The Moon...

function drawOrbits(scene, threejsDrawing) {
    const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
    //const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    // (Or a more realistic texture for the Sun.)
    const sunTexture = textureLoader.load('textures/8k_sun.jpg');
    const sunMaterial = new THREE.MeshStandardMaterial({
        map: sunTexture,
        //emissive: 0xffff00, // Emissive color for Sun
        //emissiveIntensity: 1, // Adjust intensity as needed
    });

    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sunMesh);

    planets.forEach((p) => {
        const planetObj = createPlanet(p, scene);
        planetObjects.push(planetObj);
    });

    threejsDrawing.data.planetObjects = planetObjects; // Store reference to all planet meshes in data

    //drawFloor(scene, earthOrbitRadius);
    //drawFloor(scene, threejsDrawing.data.planetObjects[7].orbitRadius);

    const light = new THREE.PointLight(0xffffff, 1, 0); // last arg = infinite distance
    light.position.set(0, 0, 0); // Place the light at the Sun's position
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    castStars(scene, threejsDrawing);
}

let clock = new THREE.Clock(); // Three.js clock to track deltaTime


function animatePlanet(planet, daysPassed) {
    // 1) ORBIT around the Sun
    // revolve once per `planet.revolution` days
    const orbitSpeed = (2 * Math.PI) / planet.revolution;
    planet.orbitAngle += orbitSpeed * daysPassed;

    // Circular orbit in the XZ plane, around (0, 0, 0)
    planet.mesh.position.x = Math.cos(planet.orbitAngle) * planet.orbitRadius;
    planet.mesh.position.z = Math.sin(planet.orbitAngle) * planet.orbitRadius;

    // 2) SPIN on its own axis
    // If planet.rotation = number of Earth days for a full spin:
    // => 2π rad / rotationDays
    const rotationSpeed = (2 * Math.PI) / planet.rotation;
    planet.mesh.rotation.y += rotationSpeed * daysPassed;
}


const orbitsDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawOrbits, 'dataSrc': null}
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
        // Time since last frame in seconds:
        const delta = clock.getDelta();

        // Convert delta time into fraction of days
        const daysPassed = delta / dayToRealSeconds;

        for (const planet of threejsDrawing.data.planetObjects) {
            animatePlanet(planet, daysPassed);
        }

        // Keep skybox centered on camera
        threejsDrawing.data.skybox.position.copy(camera.position);
    },
    'data': {
    },
    'sceneConfig': {
        'startPosition': {
            'x': 0,
            'y': 500,
            'z': 2000
        },
        'clippingPlane': 200000
    }
}


export { orbitsDrawing };
