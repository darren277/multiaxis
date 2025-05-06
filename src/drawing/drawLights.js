import { SphereGeometry, Mesh, MeshStandardMaterial, PointLight, HemisphereLight, DirectionalLight, AmbientLight, DirectionalLightHelper } from 'three';

export function drawLights(scene, lightingParams, bulbLuminousPowers, hemiLuminousIrradiances) {
    // Create the bulb light
    const bulbGeometry = new SphereGeometry(0.02, 16, 8);
    const bulbMat = new MeshStandardMaterial({
        emissive: 0xffffee,
        emissiveIntensity: 1,
        color: 0x000000
    });
    const bulbLight = new PointLight(0xffee88, 1, 100, 2);
    bulbLight.add(new Mesh(bulbGeometry, bulbMat));
    bulbLight.position.set(0, 2, 0);
    bulbLight.castShadow = true;
    scene.add(bulbLight);

    // Create the hemisphere light
    const hemiLight = new HemisphereLight(0xddeeff, 0x0f0e0d, 0.02);
    scene.add(hemiLight);

    // Return references so we can update them in animate()
    return { bulbLight, bulbMat, hemiLight };
}

// Optional: a helper function to update lights in animate()
export function updateLights({bulbLight, bulbMat, hemiLight, lightingParams, bulbLuminousPowers, hemiLuminousIrradiances}) {
    // e.g., update intensities based on GUI
    bulbLight.power = bulbLuminousPowers[lightingParams.bulbPower];
    bulbMat.emissiveIntensity = bulbLight.intensity / Math.pow(0.02, 2.0);

    hemiLight.intensity = hemiLuminousIrradiances[lightingParams.hemiIrradiance];
}

// ref for lumens: http://www.power-sure.com/lumens.htm
export const bulbLuminousPowers = {
    '110000 lm (1000W)': 110000,
    '3500 lm (300W)': 3500,
    '1700 lm (100W)': 1700,
    '800 lm (60W)': 800,
    '400 lm (40W)': 400,
    '180 lm (25W)': 180,
    '20 lm (4W)': 20,
    'Off': 0
};

// ref for solar irradiances: https://en.wikipedia.org/wiki/Lux
export const hemiLuminousIrradiances = {
    '0.0001 lx (Moonless Night)': 0.0001,
    '0.002 lx (Night Airglow)': 0.002,
    '0.5 lx (Full Moon)': 0.5,
    '3.4 lx (City Twilight)': 3.4,
    '50 lx (Living Room)': 50,
    '100 lx (Very Overcast)': 100,
    '350 lx (Office Room)': 350,
    '400 lx (Sunrise/Sunset)': 400,
    '1000 lx (Overcast)': 1000,
    '18000 lx (Daylight)': 18000,
    '50000 lx (Direct Sun)': 50000
};

export const lightingParams = {
    shadows: true,
    exposure: 0.68,
    bulbPower: Object.keys(bulbLuminousPowers)[4],
    hemiIrradiance: Object.keys(hemiLuminousIrradiances)[2]
};


export function drawBasicLights(scene, threejsDrawing) {
    const light = new DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    const ambient = new AmbientLight(0x404040);
    scene.add(ambient);
}


export function drawSun(scene) {
    const sunLight = new DirectionalLight(0xffffff, 10.0); // color, intensity
    sunLight.position.set(100, 300, 100); // x, y, z — higher Y for "sun above"

    // Optional: Add helper to visualize the direction
    const helper = new DirectionalLightHelper(sunLight, 10);
    scene.add(helper);

    // Optional: Enable shadows
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.camera.far = 500;

    // Add to scene
    scene.add(sunLight);
}