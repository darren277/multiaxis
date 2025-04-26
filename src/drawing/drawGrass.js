import { CanvasTexture, RepeatWrapping, ShaderMaterial } from 'three';
import perlin from 'perlin-noise';

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

export { createPerlinGrassTexture, grassMaterial, createGrassTexture };
