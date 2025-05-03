import {
    LinearFilter, RGBFormat, VideoTexture, Mesh, MeshBasicMaterial, PlaneGeometry, DirectionalLight, AmbientLight,
    ClampToEdgeWrapping, Box3, Vector2, Vector3, DoubleSide, FrontSide, Raycaster
} from 'three';

function renderVideoTexture(video, texture) {
    // This function will be called to render the video texture
    if (video.readyState >= 2) {
        texture.needsUpdate = true;
        video.play();
    }
}

function onVideoLoadedOld(screenMesh, video, gltfScene) {
    const videoAspect = video.videoWidth / video.videoHeight;
    console.log('Video aspect ratio:', videoAspect);
    // 1.7777 = 16:9

    const box = new Box3().setFromObject(screenMesh);
    const size = new Vector3();
    box.getSize(size);
    const screenAspect = size.x / size.y;

    console.log('Screen aspect ratio:', screenAspect);
    // 1.222 = 16:13

    const texture = new VideoTexture(video);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.format = RGBFormat;

    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;

    //texture.repeat.set(1, 1);
    //texture.offset.set(0, 0);

    ///texture.repeat.set(0.5, 1);       // only show 50% of width
    //texture.offset.set(0.25, 0);      // center horizontally

    //texture.repeat.set(1.2, 1);       // crop some width
    //texture.offset.set(-0.1, 0);

    if (videoAspect > screenAspect) {
        // Video is wider than screen → pillarbox (black bars on sides)
        //const scaleX = screenAspect / videoAspect;
        //texture.repeat.set(scaleX, 1);
        //texture.offset.set((1 - scaleX) / 2, 0);
    } else {
        // Video is taller than screen → letterbox (black bars top/bottom)
        //const scaleY = videoAspect / screenAspect;
        //texture.repeat.set(1, scaleY);
        //texture.offset.set(0, (1 - scaleY) / 2);
    }

    video.play();

    const material = new MeshBasicMaterial({ map: texture });
    const height = 0.5;  // Adjust based on how big the screen is
    const width = height * videoAspect;

    const screenPlane = new Mesh(new PlaneGeometry(width, height), material);

    if (screenMesh) {
        //screenMesh.material = material;
        //screenMesh.material.needsUpdate = true;

        // Optional: hide original screen material
        ///screenMesh.visible = false;

        // Position plane to overlap screen
        const box = new Box3().setFromObject(screenMesh);
        const center = new Vector3();
        box.getCenter(center);
        screenPlane.position.copy(center);

        // Orient plane the same way (assumes front-facing z)
        screenPlane.lookAt(screenPlane.position.clone().add(new Vector3(0, 0, -1)));
        scene.add(screenPlane);
    }

    threejsDrawing.data = { video, texture, material, screenMesh, videoPlaying: true };

    //threejsDrawing.data.camera.lookAt(0, 1, 0);
}

function onVideoLoadedOld2(screenMesh, video, gltfScene) {
    const padding = 0.60; // 95% of bounding box

    const videoAR   = video.videoWidth / video.videoHeight;   // 1.777…

    // ---------- 3.  screen’s true width/height ----------
    const box  = new Box3().setFromObject(screenMesh);
    const size = new Vector3();
    box.getSize(size);                       // world‑space extent of the mesh
    const screenAR = size.x / size.y;        // 1.22 in your model

    const maxW = size.x * padding;
    const maxH = size.y * padding;

    // ---------- 4.  choose plane size that FITS ----------

    // Fit video plane *entirely within* screen bounds, preserving aspect ratio
    let w = maxW;
    let h = w / videoAR;

    if (h > maxH) {                // pillar‑box
        h = maxH;
        w = h * videoAR;
    } else {                                 // letter‑box
        //h = size.y;
        //w = h * videoAR;
        h = maxH;
        w = h * videoAR;
    }

    const texture = new VideoTexture(video);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.format    = RGBFormat;
    texture.wrapS = texture.wrapT = ClampToEdgeWrapping;

    const material = new MeshBasicMaterial({map : texture, side: DoubleSide});

    const plane = new Mesh(new PlaneGeometry(w, h), material);

    // ---------- 5.  copy pose from real screen ----------
    screenMesh.getWorldPosition(plane.position);
    screenMesh.getWorldQuaternion(plane.quaternion);

    // ---------- 6.  push it a hair forward (0.5 mm) ----------
    const normal = new Vector3(0, 0, 1).applyQuaternion(plane.quaternion);
    plane.position.add(normal.multiplyScalar(0.0005));

    // If the TV was modelled “inside‑out”, flip once:
    // plane.rotateY(Math.PI);

    return {texture, plane, material};
}

function onVideoLoaded(screenMesh, video, gltfScene) {
    // In this version, we modify the UVs directly...

    const texture = new VideoTexture(video);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.format = RGBFormat;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;

    const material = new MeshBasicMaterial({
    map: texture,
        side: FrontSide // Default; change to DoubleSide only if needed
    });

    screenMesh.material = material;
    screenMesh.material.needsUpdate = true;

    // Slight aspect ratio squishing to match screen shape?
    // Optional: modify UVs to shift/crop the video mapping
    const uvs = screenMesh.geometry.attributes.uv;

    // First, compute current UV bounds
    let uMin = Infinity, uMax = -Infinity;
    let vMin = Infinity, vMax = -Infinity;

    for (let i = 0; i < uvs.count; i++) {
        const u = uvs.getX(i);
        const v = uvs.getY(i);
        if (u < uMin) uMin = u;
        if (u > uMax) uMax = u;
        if (v < vMin) vMin = v;
        if (v > vMax) vMax = v;
    }

    const uRange = uMax - uMin;
    const vRange = vMax - vMin;

    // Then normalize UVs to fit [0,1] range
    for (let i = 0; i < uvs.count; i++) {
        const u = uvs.getX(i);
        const v = uvs.getY(i);
        const uNorm = (u - uMin) / uRange;
        const vNorm = (v - vMin) / vRange;
        uvs.setXY(i, uNorm, vNorm);
    }

    uvs.needsUpdate = true;

    return {texture, material};
}

function drawTV(scene, data, threejsDrawing) {
    const gltfScene = data.scene; // assuming you store it like this

    // Add the loaded TV model to the scene
    scene.add(gltfScene);

    gltfScene.traverse(child => {
        if (child.isMesh && child.name.startsWith('Screen_')) {
            console.log('Found screen mesh:', child.name);
            // Screen_1_low_Material001_0
            // Screen_2_low_Material001_0
            // Screen_3_low_Material001_0
            // Screen_4_low_Material001_0
        } else {
            console.log('Found other mesh:', child.name);
            // Found other mesh: TV_Front_Button_2_low
            // Found other mesh: TV_Front_Button_2_low_Material001_0
        }
    });

    const video = document.createElement('video');
    video.src = 'textures/monitor/real.mp4';
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;

    video.addEventListener('loadedmetadata', () => {
        const screenMesh = gltfScene.getObjectByName('Screen_1_low_Material001_0');
        if (!screenMesh) return;

        //const {texture, plane, material} = onVideoLoaded(screenMesh, video, gltfScene);
        const {texture, material} = onVideoLoaded(screenMesh, video, gltfScene);
        video.play();
        //threejsDrawing.data = { video, texture, plane, material };
        if (!threejsDrawing.data || !threejsDrawing.data.videoPlaylist) {
            threejsDrawing.data = {...threejsDrawing.data,
                video,
                texture,
                material,
                screenMesh,
                videoPlaying: true,
                videoIndex: 0,
                videoPlaylist: videos           // ← set once
            };
        } else {
            // 3. on later metadata events, just keep pointers up‑to‑date
            threejsDrawing.data.texture = texture;
        }
    });

    // draw basic lights...
    const light = new DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);

    const ambientLight = new AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);
}

function animationCallback(data) {
    const video = data.video;
    const texture = data.texture;

    if (video && video.readyState >= 2) {
        texture.needsUpdate = true;
    }
}

const raycaster = new Raycaster();
const mouse = new Vector2();

const videos = [
    'textures/monitor/real.mp4',
    'textures/BigBuckBunny_320x180.mp4',
    'textures/monitor/real.mp4',
    'textures/sunrise.mp4',
    'textures/monitor/real.mp4',
    'textures/CleanSocialVideoSalesLetter.mp4',
    'textures/monitor/real.mp4',
    'textures/monitor/real.mp4',
    'textures/turtle.mp4',
    'textures/monitor/real.mp4',
    'textures/winnie-the-pooh-ariel.mp4',
    'textures/monitor/real.mp4',
    'textures/monitor/real.mp4',
    'textures/seagull.mp4',
    'textures/monitor/real.mp4',
    'textures/seagulls.mp4',
];


function handleVideoChange(data) {
    console.log('handleVideoChange', data.videoIndex, data.videoPlaylist, data.video, data.texture);
    if (!data.video || !data.videoPlaylist || data.videoPlaylist.length === 0) return;

    // Compute next index
    data.videoIndex = (data.videoIndex + 1) % data.videoPlaylist.length;
    const nextURL = data.videoPlaylist[data.videoIndex];

    // Pause and load new video
    data.video.pause();
    data.video.src = nextURL;
    data.video.load();

    data.video.addEventListener('loadedmetadata', () => {
        data.texture.needsUpdate = true;
        data.video.play();
    }, { once: true });
}


function onClick(event, scene, camera, renderer, data) {
    // Convert mouse click position to normalized device coordinates (-1 to +1)
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Intersect all objects in the scene (or filter if needed)
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (let i = 0; i < intersects.length; i++) {
        const intersected = intersects[i].object;

        console.log('Intersected object:', intersected.name);

        if (intersected.name === 'TV_Front_Switch_1_low_Material001_0') {
            console.log('Button pressed! Changing video...');
            handleVideoChange(data);
            break;
        }
        if (intersected.name === 'TV_Front_Switch_8_low_Material001_0') {
            if (data.video) {
                data.video.muted = !data.video.muted;
                console.log(`Video is now ${data.video.muted ? 'muted' : 'unmuted'}`);
            } else {
                console.warn('No video element found to toggle mute');
            }
            break;
        }
    }
}

const tvDrawing = {
    sceneElements: [],
    drawFuncs: [ { func: drawTV, 'dataSrc': 'tv_sony_trinitron', 'dataType': 'gltf' } ],
//    eventListeners: {
//        keydown: (e, data) => onKey(e, data),
//        keyup:   (e, data) => onKey(e, data)
//    },
    eventListeners: {
        click: (e, data) => {
            onClick(e, data.scene, data.camera, data.renderer, data.data);
        }
    },
    animationCallback: (renderer, timestamp, threejsDrawing, camera) => {
        const data = threejsDrawing.data;
        if (data) {
            animationCallback(data);
        }
    },
    data: {},
    sceneConfig: {
        'startingPosition': { x: 0, y: 1.5, z: 5 },
    }
}

export { tvDrawing };
