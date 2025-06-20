import * as THREE from "three";

/**
 * Each section of this config can be swapped with a different config if you want a different "look" or different geometry types, fonts, etc.
 */
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShaderAlt = `
    uniform sampler2D map;
    varying vec2 vUv;

    void main() {
        vec4 texColor = texture2D(map, vUv);

        // If the texture is mostly transparent, discard it to avoid black boxes
        if (texColor.a < 0.1) {
            discard;
        }

        // Sharpen the alpha channel using smoothstep
        // This creates a crisp edge, effectively a "better" alphaTest
        float sharpAlpha = smoothstep(0.1, 0.2, texColor.a);

        gl_FragColor = vec4(texColor.rgb, sharpAlpha);
    }
`;

const fragmentShader = `
    uniform sampler2D map;
    uniform vec3 backgroundColor;
    uniform float backgroundAlpha;
    varying vec2 vUv;

    void main() {
        vec4 texColor = texture2D(map, vUv);

        // Check if the pixel from the texture is transparent
        if (texColor.a < 0.1) {
            // If so, draw our custom background color and alpha instead.
            gl_FragColor = vec4(backgroundColor, backgroundAlpha);
        } else {
            // Otherwise, draw the pixel from the icon texture as normal.
            gl_FragColor = texColor;
        }
    }
`;

export default {
    fontUrl: '/threejs/drawing/helvetiker_regular.typeface.json',

    surroundingBox: {
        geometry: (xSize: number | undefined, ySize: number | undefined, zSize: number | undefined) => new THREE.BoxGeometry(xSize, ySize, zSize),
        material: () => new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.1,
        }),
    },

    axis: {
        // Optionally store geometry “factory” functions by axis label
        geometry: (axisLabel: string, axisLength: number | undefined) => {
            if (axisLabel === 'x') {
                return new THREE.BoxGeometry(axisLength, 0.1, 0.1);
            } else if (axisLabel === 'y') {
                return new THREE.BoxGeometry(0.1, axisLength, 0.1);
            } else {
                return new THREE.BoxGeometry(0.1, 0.1, axisLength);
            }
        },
        material: () => new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
    },

    axisLabels: {
        // For textual labels on the axes
        size: 1,
        depth: 0.01,
        material: (label: any) => new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
        // If you wanted different colors for x, y, z labels, you might define a function
        // material: (axisLabel) => new MeshBasicMaterial({
        //   color: (axisLabel === 'x' ? 0xff0000 : 0x00ff00)
        // }),
    },

    axisTicks: {
        geometry: () => new THREE.BoxGeometry(0.1, 0.1, 0.1),
        material: () => new THREE.MeshBasicMaterial({ color: 0x00ffff }),
    },

    points: {
        geometry: (pointData: { size: number; icon: string }[]) => {
            const size = pointData[4]?.size ?? 0.1;
            const icon = pointData[4]?.icon;

            if (icon) {
                // You may need to rotate it if you want it oriented differently.
                // For example: geometry.rotateX(Math.PI / 2) to make it lie flat.
                const thickness = 0.01;
                return new THREE.BoxGeometry(size, size, thickness);
            }

            return new THREE.SphereGeometry(size);
        },
        material: (pointData: any[]) => {
            const icon = pointData[4]?.icon;
            if (icon) {
                const textureLoader = new THREE.TextureLoader();
                const texture = textureLoader.load(icon);

                // Use MeshBasicMaterial, which is compatible with PlaneGeometry and Mesh.
                // Add `transparent: true` to allow for transparency in your PNG file.
                // return new MeshBasicMaterial({
                //     map: texture,
                //     //transparent: true,
                //     side: DoubleSide,
                //     //alphaTest: 0.5,
                //     //depthWrite: false
                // });

                // return new ShaderMaterial({
                //     uniforms: {
                //         map: { value: texture },
                //     },
                //     vertexShader,
                //     fragmentShader,
                //     transparent: true,
                //     side: DoubleSide,
                // });

                const customBackgroundColor = new THREE.Color(0x0d204d); // A nice dark blue
                const customBackgroundAlpha = 0.75; // 75% opacity

                return new THREE.ShaderMaterial({
                    uniforms: {
                        map: { value: texture },
                        backgroundColor: { value: customBackgroundColor },
                        backgroundAlpha: { value: customBackgroundAlpha },
                    },
                    vertexShader,
                    fragmentShader,
                    transparent: true,
                    side: THREE.DoubleSide,
                });
            }

            const color = pointData[3];
            return new THREE.MeshBasicMaterial({ color });
        },
    },

    pointLabels: {
        size: (pointData: { size: any; }[]) => (pointData[4]?.size ?? 1), // maybe the label text size depends on the point size
        depth: 0.01,
        material: (pointData: any[]) => {
            // Reuse the point’s color or pick something else
            return new THREE.MeshBasicMaterial({ color: pointData[3] });
        },
    },
};
