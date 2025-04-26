import {
    Mesh, MeshBasicMaterial, BoxGeometry, ImageLoader, Texture, BackSide, LinearFilter, LinearMipmapLinearFilter,
    DataTexture, RGBFormat, UnsignedByteType, CubeTextureLoader
} from "three";


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 1) Photo-based panoramic cube background
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function usePanoramicCubeBackground(scene, img_url) {
    // Load textures from the strip
    const textures = getTexturesFromAtlasFile(img_url, 6);

    const materials = [];
    for (let i = 0; i < 6; i++) {
        materials.push(new MeshBasicMaterial({map: textures[i]}));
    }

    const skyBox = new Mesh(new BoxGeometry(1, 1, 1), materials);

    skyBox.scale.set(500, 500, 500);
    skyBox.position.set(0, 0, 0);

    // Invert the box so we see it from the inside
    skyBox.geometry.scale(1, 1, -1);

    scene.add(skyBox);
}

function getTexturesFromAtlasFile(atlasImgUrl, tilesNum) {
    const textures = [];
    for (let i = 0; i < tilesNum; i++) {
        textures[i] = new Texture();
    }

    new ImageLoader().load(atlasImgUrl, (image) => {
        const tileWidth = image.height;
        let canvas, context;

        for (let i = 0; i < textures.length; i++) {
            canvas = document.createElement('canvas');
            context = canvas.getContext('2d');
            canvas.height = tileWidth;
            canvas.width = tileWidth;

            context.drawImage(
                image,
                tileWidth * i, 0,            // source x,y
                tileWidth, tileWidth,        // source width/height
                0, 0,                        // target x,y
                tileWidth, tileWidth         // target width/height
            );

            textures[i].image = canvas;
            textures[i].needsUpdate = true;

            // If using Three.js r152+, use:
            // textures[i].colorSpace = SRGBColorSpace;
            // or for older versions, set encoding:
            // textures[i].encoding = sRGBEncoding;
        }
    });

    return textures;
}

function usePanoramicCubeBackgroundSixFaces(scene, img_url) {
    // textures/exr/golden_gate_hills_1k => textures/exr/golden_gate_hills_1k_cube_px.jpg, etc...
    const urls = [];

    for (let i = 0; i < 6; i++) {
        urls.push(img_url + '_cube_' + ['px', 'nx', 'py', 'ny', 'pz', 'nz'][i] + '.png');
    }

    const loader = new CubeTextureLoader();
    const cubeTexture = loader.load(urls, (cubeTexture) => {
        console.log('Cube texture loaded', cubeTexture);
        scene.background = cubeTexture;
    });

    scene.background = cubeTexture;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 2) Simple procedural background (noise)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function useProceduralBackground(scene) {
    // TODO: Does not work yet. Needs some troubleshooting.

    // Create a large inward-facing cube (or sphere) for the background
    const geometry = new BoxGeometry(500, 500, 500);
    // If you want a sphere, use: new SphereGeometry( 250, 32, 32 ) and then material.side=THREE.BackSide.

    const texture = createNoiseTexture(128);

    const material = new MeshBasicMaterial({map: texture, side: BackSide});

    const skyBox = new Mesh(geometry, material);
    scene.add(skyBox);
}

function createNoiseTexture(size = 128) {
    // Now we have 4 bytes per pixel: R, G, B, A
    const data = new Uint8Array(4 * size * size);

    for (let i = 0; i < size * size; i++) {
        const stride = i * 4;
        const val = Math.floor(Math.random() * 256);  // random 0..255

        data[stride + 0] = val;   // R
        data[stride + 1] = val;   // G
        data[stride + 2] = val;   // B
        data[stride + 3] = 255;   // A (fully opaque)
    }

    const texture = new DataTexture(data, size, size, RGBFormat, UnsignedByteType);

    // Optionally specify some filtering
    texture.generateMipmaps = true;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;

    texture.needsUpdate = true;

    return texture;
}


export { usePanoramicCubeBackground, useProceduralBackground, usePanoramicCubeBackgroundSixFaces };
