import { CanvasTexture, RepeatWrapping, ShaderMaterial, Group, Mesh, MeshStandardMaterial, PlaneGeometry, Clock } from 'three';
import perlin from 'perlin-noise';
import { generatePerlinNoise } from 'perlin-noise';


function createPerlinGrassTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    const noise = perlin.generatePerlinNoise(size, size);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const val = noise[y * size + x];
            const g = 60 + val * 100;
            ctx.fillStyle = `rgb(${g * 0.4}, ${g}, ${g * 0.4})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
}

const grassMaterial = new ShaderMaterial({
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        void main() {
            float stripes = step(0.5, fract(vUv.x * 40.0)) * 0.2;
            float noise = fract(sin(dot(vUv.xy ,vec2(12.9898,78.233))) * 43758.5453);
            float green = 0.3 + 0.3 * noise + stripes;
            gl_FragColor = vec4(0.1, green, 0.1, 1.0);
        }
    `
});

const clock = new Clock();

const waterMaterial = new ShaderMaterial({
    uniforms: {
        time: { value: 0.0 },
    },
    vertexShader: `
        varying vec2 vUv;
        uniform float time;

        void main() {
            vUv = uv;

            vec3 pos = position;

            // Add some vertical sine wave distortion based on XZ and time

            // === Multiple Waves ===
            pos.y += sin(pos.x * 2.0 + time * 2.0) * 0.15; // Wave 1
            pos.y += cos(pos.z * 3.5 + time * 1.5) * 0.10; // Wave 2
            pos.y += sin((pos.x + pos.z) * 1.5 + time * 1.0) * 0.07; // Wave 3 (diagonal)
            pos.y += cos((pos.x - pos.z) * 2.5 + time * 1.8) * 0.05; // Wave 4 (opposite diagonal)

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform float time;

        void main() {
            // Color the water blueish
            vec3 deepWaterColor = vec3(0.0, 0.3, 0.5);
            vec3 shallowWaterColor = vec3(0.0, 0.5, 0.7);

            // UV distort for dynamic water shimmer
            float wave1 = sin((vUv.x + time * 0.1) * 10.0) * 0.03;
            float wave2 = cos((vUv.y + time * 0.15) * 10.0) * 0.03;
            float wave3 = sin((vUv.x + vUv.y + time * 0.07) * 15.0) * 0.02;

            vec2 distortedUV = vUv + vec2(wave1 + wave3, wave2 - wave3);

            float depthFade = distortedUV.y; // shallow near top, deep near bottom

            vec3 color = mix(shallowWaterColor, deepWaterColor, depthFade);

            gl_FragColor = vec4(color, 1.0);
        }
    `
});

function createGrassTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;

    const ctx = canvas.getContext('2d');

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const noise = Math.random() * 50;
            const r = 20 + noise;
            const g = 100 + noise * 2;
            const b = 20 + noise;
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
}

function createRoadTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const noise = Math.random() * 20;
            const base = 60 + noise;
            ctx.fillStyle = `rgb(${base},${base},${base})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
}

function createWaterTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const noise = Math.random() * 40;
            const r = 30 + noise * 0.2;
            const g = 60 + noise * 0.3;
            const b = 180 + noise;
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
}

function createSandTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const noise = Math.random() * 30;
            const r = 210 + noise;
            const g = 200 + noise;
            const b = 160 + noise;
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
}

function createDirtRoadTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    const noise = generatePerlinNoise(size, size, {
        octaveCount: 4,
        amplitude: 0.6,
        persistence: 0.5
    });

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const val = noise[y * size + x];

            // Map noise to brownish dirt colors
            const base = 120 + val * 80; // tweak brightness
            const r = base + Math.random() * 10; // slight color variation
            const g = base * 0.7 + Math.random() * 5;
            const b = base * 0.5 + Math.random() * 5;

            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(10, 10); // Make it tile nicely
    return texture;
}

function createGrassDirtComboTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grassColor = (n) => {
        const g = 100 + n * 50;
        return `rgb(${g * 0.4}, ${g}, ${g * 0.4})`;
    };

    const dirtColor = (n) => {
        const base = 120 + n * 80;
        const r = base + Math.random() * 10;
        const g = base * 0.7 + Math.random() * 5;
        const b = base * 0.5 + Math.random() * 5;
        return `rgb(${r},${g},${b})`;
    };

    const noise = generatePerlinNoise(size, size, {
        octaveCount: 5,
        amplitude: 0.5,
        persistence: 0.5
    });

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const n = noise[y * size + x]; // 0 to 1
            ctx.fillStyle = n < 0.5 ? grassColor(n) : dirtColor(n);
            ctx.fillRect(x, y, 1, 1);
        }
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
}

function drawWater(scene) {
    const waterGeometry = new PlaneGeometry(100, 100, 128, 128); // Higher segment count = smoother waves
    const water = new Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.1; // Slightly above ground
    water.receiveShadow = false; // Water usually doesn't cast/receive shadow

    scene.add(water);
}

function animateWater(renderer, timestamp, threejsDrawing, camera) {
    const deltaTime = clock.getDelta();
    waterMaterial.uniforms.time.value += deltaTime;

    renderer.render(threejsDrawing.data.scene, camera);
}

const groundLayout = [
    ['grass', 'grass', 'grass', 'grass', 'grass', 'dirt', 'grass', 'grass', 'grass', 'sand', 'water'],
    ['grass', 'grass', 'grass', 'grass', 'grass', 'dirt', 'grass', 'grass', 'grass', 'sand', 'sand'],
    ['grass', 'grass', 'grass', 'grass', 'grass', 'dirt', 'grass', 'grass', 'grass', 'grass', 'grass'],
    ['grass', 'grass', 'grass', 'grass', 'grass', 'dirt', 'grass', 'grass', 'grass', 'grass', 'grass'],
    ['dirt',  'dirt',  'dirt',  'dirt',  'dirt',  'dirt',  'dirt',  'dirt',  'dirt',  'dirt',  'dirt'],
    ['grass', 'grass', 'grass', 'grass', 'grass', 'dirt', 'grass', 'grass', 'grass', 'grass', 'grass'],
    ['grass', 'grass', 'grass', 'grass', 'grass', 'dirt', 'grass', 'grass', 'grass', 'grass', 'grass'],
    ['grass', 'grass', 'grass', 'grass', 'grass', 'dirt', 'grass', 'grass', 'grass', 'grass', 'grass'],
    ['grass', 'grass', 'grass', 'grass', 'grass', 'dirt', 'grass', 'grass', 'grass', 'road', 'road'],
];

function createGroundFromLayout(layout, tileSize = 10) {
    const group = new Group();

    const textures = {
        'grass': createGrassTexture(),
        'dirt': createDirtRoadTexture(),
        'sand': createSandTexture(),
        'road': createRoadTexture(),
        'water': createWaterTexture()
    };

    const numRows = layout.length;
    const numCols = layout[0].length;

    // Center offset calculations
    const offsetX = (numCols * tileSize) / 2;
    const offsetZ = (numRows * tileSize) / 2;

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const type = layout[row][col];
            const tex = textures[type];
            if (!tex) continue;

            const material = new MeshStandardMaterial({ map: tex });

            const tile = new Mesh(new PlaneGeometry(tileSize, tileSize), material);
            tile.rotation.x = -Math.PI / 2;

            // Subtract offset to center the grid around (0,0,0)
            tile.position.set(
                col * tileSize - offsetX + tileSize / 2,
                0,
                row * tileSize - offsetZ + tileSize / 2
            );

            tile.receiveShadow = true;

            group.add(tile);
        }
    }

    return group;
}

function tileToPosition(col, row, tileSize = 10, layout = groundLayout) {
    const numRows = layout.length;
    const numCols = layout[0].length;

    const offsetX = (numCols * tileSize) / 2;
    const offsetZ = (numRows * tileSize) / 2;

    return [
        col * tileSize - offsetX + tileSize / 2,
        0,
        row * tileSize - offsetZ + tileSize / 2
    ];
}

export {
    createPerlinGrassTexture, grassMaterial, createGrassTexture, createDirtRoadTexture, createGrassDirtComboTexture,
    groundLayout, createGroundFromLayout, drawWater, animateWater, tileToPosition
};
