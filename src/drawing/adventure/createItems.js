import { TextureLoader, PlaneGeometry, Mesh, MeshBasicMaterial, DoubleSide, VideoTexture, LinearFilter, Vector3 } from 'three'; // for any references you still need
import { CSS3DObject } from 'css3drenderer';


function createPhotoMesh(item) {
    // Use TextureLoader to load the image
    const textureLoader = new TextureLoader();
    const texture = textureLoader.load(item.image);

    // Adjust geometry size as you like (width, height)
    const geometry = new PlaneGeometry(4, 3);
    const material = new MeshBasicMaterial({ map: texture, side: DoubleSide });
    const mesh = new Mesh(geometry, material);

    // Position in 3D from item data
    mesh.position.set(item.position.x, item.position.y, item.position.z);

    // Optionally face the camera by default if you want (billboard effect):
    // mesh.lookAt(camera.position);

    mesh.name = item.id; // store ID

    return mesh;
}

function createVideoMesh(item, worldWidth, worldHeight) {
    // 1) Create an HTML video element
    const video = document.createElement('video');
    //video.src = 'path-to-video-file.mp4';
    video.src = 'textures/CleanSocialVideoSalesLetter.mp4';
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.play();

    // 2) Create a texture from the video
    const videoTexture = new VideoTexture(video);
    videoTexture.minFilter = LinearFilter;
    videoTexture.magFilter = LinearFilter;

    // 3) Use that texture in a MeshBasicMaterial
    const geometry = new PlaneGeometry(4, 3);
    const material = new MeshBasicMaterial({ map: videoTexture, side: DoubleSide });
    const mesh = new Mesh(geometry, material);

    const x = item.position.x;
    const y = item.position.y;
    const z = item.position.z;

    mesh.position.set(x, y, z);

    // 🔑 Store the video element for later
    mesh.userData.videoElement = video;

    return mesh;
}

function createVideoMeshOLD(item, worldWidth, worldHeight) {
    var div = document.createElement( 'div' );
    div.style.width = `${worldWidth}px`;
    div.style.height = `${worldHeight}px`;
    //div.style.backgroundColor = '#000';
    div.style.backgroundColor = 'lime';
    var iframe = document.createElement( 'iframe' );
    iframe.style.width = `${worldWidth}px`;
    iframe.style.height = `${worldHeight}px`;
    iframe.style.border = '0px';
    iframe.src = item.video;
    //iframe.src = 'https://www.darrenmackenzie.com'

    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;

    iframe.style.pointerEvents = 'auto';

    div.appendChild( iframe );
    var object = new CSS3DObject( div );

    object.position.set( item.position.x, item.position.y, item.position.z );
    //object.rotation.set( 0, Math.PI, 0 );

    object.name = item.id; // store ID

    window.debugObject = object;

    return object;
}

function create3DLabelWithAnimation(captionText, className, dataAttributes = {}) {
    // Outer DIV that CSS3DRenderer will transform in 3D space
    const outerDiv = document.createElement('div');
    // No special styles here; let Three.js apply its inline transform

    // Inner DIV that we animate with our bounce/pulse classes
    const labelEl = document.createElement('div');
    //labelEl.className = 'caption-label-3d bounce'; // for example
    labelEl.className = 'caption-label-3d ' + className; // for example
    //labelEl.textContent = captionText;
    labelEl.innerHTML = captionText;

    // traverse tree and add `label-child` class to each child element
    const children = labelEl.querySelectorAll('*');
    children.forEach(child => {
        child.classList.add('label-child');
    });

    for (const [key, value] of Object.entries(dataAttributes)) {
        labelEl.setAttribute(key, value);
    }

    // Put the animated label inside the outer container
    outerDiv.appendChild(labelEl);

    // Now create the CSS3DObject from the outer container
    const labelObject = new CSS3DObject(outerDiv);

    // Optionally scale the entire label if it’s too big
    labelObject.scale.set(0.01, 0.01, 0.01);

    return labelObject;
}


function createCaptionedItem(scene, item, isVideo, worldWidth = null, worldHeight = null, use3dRenderer = false) {
    let mesh = null;

    // 1. Create Mesh
    if ((item.image || item.video) && item.image !== 'NO_IMAGE') {
        if (isVideo) {
            mesh = createVideoMesh(item, worldWidth, worldHeight);
        } else {
            mesh = createPhotoMesh(item);
        }
        scene.add(mesh);
    } else {
        console.warn('No image or video provided for item:', item);
    }

    // 2) Build the caption
    const captionText = item.caption;
    const customClasses = item.customClasses || ''; // e.g. "bounce" or "pulse"

    // 2. Create label element
    const labelEl = document.createElement('div');

    labelEl.innerHTML = item.caption;
    labelEl.style.color = 'black';
    labelEl.style.padding = '4px 8px';
    labelEl.style.background = 'white';
    labelEl.style.fontFamily = 'sans-serif';

    const dataAttributes = item.dataAttributes || {};

     if (use3dRenderer) {
        // -- 3D Caption with CSS3DRenderer --

        // Use the nested approach so animations don't conflict
        const labelObject = create3DLabelWithAnimation(captionText, customClasses, dataAttributes);

        // 1) figure out the mesh center in world‐space
        const basePos = mesh ? mesh.position.clone() : new Vector3(item.position.x, item.position.y, item.position.z);

        // 2) compute half the mesh height + a small margin (world‐units)
        let halfHeight = 0;
        if (mesh && mesh.geometry?.parameters?.height) {
            halfHeight = mesh.geometry.parameters.height / 2;
        }
        const margin = 0.2;                // tweak this if you want more/less gap
        const offsetY = -(halfHeight + margin);

        // 3) position the labelObject under the mesh
        labelObject.position.copy(basePos).add(new Vector3(0, offsetY, 0));

        // Alternatively, if you want it to follow the mesh exactly:
        // labelObject.position.copy(mesh.position).add(new Vector3(0, offsetY, 0));

        return { mesh, labelObject, item }; // return the CSS3DObject
    } else {
        // -- 2D DOM Overlay --
        if (dataAttributes.length > 0) {
            labelEl.setAttribute('data-direction', value);
        }

        const labelEl = document.createElement('div');
        labelEl.className = 'caption-label ' + customClasses;
        labelEl.innerHTML = captionText;

        labelEl.style.position = 'absolute';
        labelEl.style.transform = 'translate(-50%, 0)';
        labelEl.style.pointerEvents = 'none';

        // You probably have a container for 2D overlays
        document.getElementById('labelContainer2d').appendChild(labelEl);

        return { mesh, labelObject: labelEl, item }; // return the DOM element
    }
}


export {
    createPhotoMesh,
    createVideoMesh,
    createVideoMeshOLD,
    create3DLabelWithAnimation,
    createCaptionedItem
}