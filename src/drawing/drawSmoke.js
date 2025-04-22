import { Vector2, ShaderMaterial, TextureLoader, DataTexture, FloatType, RepeatWrapping, RGBAFormat, PlaneGeometry, Mesh } from 'three';

import noiseModule from 'noisejs';

const Noise = noiseModule.Noise;
const noise = new Noise(Math.random());


const smokeFragmentShaderOld = `
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;

vec2 perlin(vec2 p) {
    vec2 a = texture(iChannel1, vec2(floor(p.x), ceil (p.y))/64.).xy;
    vec2 b = texture(iChannel1, vec2(ceil (p.x), ceil (p.y))/64.).xy;
    vec2 c = texture(iChannel1, vec2(floor(p.x), floor(p.y))/64.).xy;
    vec2 d = texture(iChannel1, vec2(ceil (p.x), floor(p.y))/64.).xy;

    vec2 m = smoothstep(0.,1.,fract(p));
    return mix(mix(c, a, m.y), mix(d, b, m.y), m.x) - .5;
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 t = fragCoord / iResolution.xy;
    vec2 p = fragCoord / iResolution.y;
    vec2 m = iMouse / iResolution.y;

    float b = smoothstep(.1 + sin(iTime * 5.) / 100., 0., length(m - p));

    vec2 off = vec2(0.0);
    vec2 noff = vec2(sin(iTime / 2.0), cos(iTime / 3.0));
    float freq = 15.0;
    float amp = 2.0;

    for(int i = 0; i <= 5; i++) {
        p += noff / 15.0;
        off += perlin(p * freq) * amp;
        freq *= 1.45;
        amp *= 0.5;
        p = (p - 10.0) * mat2(cos(0.25), -sin(0.25), sin(0.25), cos(0.25)) + 10.0;
    }

    off += vec2(-0.2, 0.5);
    t -= off / iResolution.xy;
    b = min(texture(iChannel0, t, 1.5).x * 0.997 + b * 0.1, 1.0);

    gl_FragColor = vec4(vec3(b), 1.0);
}
`;


const smokeFragmentShader = `
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform int mode;

// Reuse your perlin sampler from iChannel1
vec2 perlin(vec2 p) {
    vec2 a = texture(iChannel1, vec2(floor(p.x), ceil(p.y)) / 64.).xy;
    vec2 b = texture(iChannel1, vec2(ceil(p.x), ceil(p.y)) / 64.).xy;
    vec2 c = texture(iChannel1, vec2(floor(p.x), floor(p.y)) / 64.).xy;
    vec2 d = texture(iChannel1, vec2(ceil(p.x), floor(p.y)) / 64.).xy;
    vec2 m = smoothstep(0.0, 1.0, fract(p));
    return mix(mix(c, a, m.y), mix(d, b, m.y), m.x) - 0.5;
}

// Fractal Brownian Motion (fbm) with Perlin noise
float fbm(vec2 p) {
    float total = 0.0;
    float amp = 1.0;
    float freq = 1.0;

    for (int i = 0; i < 5; i++) {
        total += length(perlin(p * freq)) * amp;
        freq *= 2.0;
        amp *= 0.5;
    }
    return total;
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 t = fragCoord / iResolution.xy;
    vec2 p = fragCoord / iResolution.y;
    vec2 m = iMouse / iResolution.y;

    float b = smoothstep(0.1 + sin(iTime * 5.0) / 100.0, 0.0, length(m - p));

    vec2 off = vec2(0.0);
    vec2 noff = vec2(sin(iTime / 2.0), cos(iTime / 3.0));
    float freq = 15.0;
    float amp = 2.0;

    for (int i = 0; i <= 5; i++) {
        p += noff / 15.0;
        off += perlin(p * freq) * amp;
        freq *= 1.45;
        amp *= 0.5;
        p = (p - 10.0) * mat2(cos(0.25), -sin(0.25), sin(0.25), cos(0.25)) + 10.0;
    }

    off += vec2(-0.2, 0.5);
    t -= off / iResolution.xy;

    float base = 0.0;

    if (mode == 0) {
        base = length(gl_FragCoord.xy / iResolution.xy - 0.5);
    } else if (mode == 1) {
        base = length(perlin(p * 3.0));
    } else if (mode == 2) {
        base = fbm(p);
    }

    b = min(base * 0.997 + b * 0.1, 1.0);
    gl_FragColor = vec4(vec3(b), 1.0);
}
`;

function generatePerlinData(width, height, scale = 0.1) {
    const size = width * height;
    const data = new Float32Array(4 * size); // RGBA float data

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const value = noise.perlin2(x * scale, y * scale); // [-1, 1]
            const idx = (y * width + x) * 4;

            const normalized = (value + 1) / 2; // [0, 1]
            data[idx] = normalized;     // R
            data[idx + 1] = normalized; // G
            data[idx + 2] = normalized; // B
            data[idx + 3] = 1.0;        // A
        }
    }

    return data;
}

const loader = new TextureLoader();

const width = 64;
const height = 64;
const perlinData = generatePerlinData(width, height);

const noiseTexture = new DataTexture(
    perlinData,
    width,
    height,
    RGBAFormat,
    FloatType
);
noiseTexture.needsUpdate = true;
noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping;
//const noiseTexture = loader.load('perlin_noise.png');
//const baseTexture = loader.load('smoke_base.jpg');
//baseTexture.wrapS = baseTexture.wrapT = RepeatWrapping;

const uniforms = {
    iResolution: { value: new Vector2(window.innerWidth, window.innerHeight) },
    iTime: { value: 0 },
    iMouse: { value: new Vector2(0, 0) },
    //iChannel0: { value: baseTexture },
    mode: { value: 0 }, // start with radial
    iChannel1: { value: noiseTexture }
};


// smokeFragmentShader
const smokeMaterial = new ShaderMaterial({
    uniforms,
    fragmentShader: smokeFragmentShader,
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `
});

/*
Optional: Animate the Noise Dynamically

If you want animated Perlin noise:

    Add a z dimension (perlin3) or time offset in x or y like:
const value = noise.perlin3(x * scale, y * scale, time * 0.1);

You’d then regenerate the Float32Array each frame and call:
noiseTexture.needsUpdate = true;
*/

function drawSmoke(scene) {
    const geometry = new PlaneGeometry(10, 10);
    const smokePlane = new Mesh(geometry, smokeMaterial);
    scene.add(smokePlane);

    // Radial
    //uniforms.mode.value = 0;
    // Perlin distortion
    //uniforms.mode.value = 1;
    // FBM
    uniforms.mode.value = 2;
}

const smokeDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawSmoke, 'dataSrc': null}
    ],
    'uiState': null,
    'eventListeners': null,
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
        const uniforms = threejsDrawing.data.uniforms;
        uniforms.iTime.value += 0.01;

        // const value = noise.perlin3(x * scale, y * scale, time * 0.1);
    },
    'data': {
        'uniforms': uniforms,
    },
    'sceneConfig': {
    }
}

export { smokeDrawing };
