/* Adapted from https://github.com/henryjeff/portfolio-website/blob/master/src/Application/World/MonitorScreen.ts */

import {
    Vector2, Vector3, Euler, MathUtils, Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry, DoubleSide, RGBFormat, DirectionalLight,
    Texture, VideoTexture, NoBlending, NormalBlending, AdditiveBlending, Scene, TextureLoader, CubeTextureLoader, AudioLoader,
} from 'three';
import { GLTFLoader } from 'gltfloader';
import { CSS3DObject } from 'css3drenderer';

let instance = null;

const sources = [
    {name: 'computerSetupModel', type: 'gltfModel', path: 'imagery/computer_setup.glb'},
    {name: 'computerSetupTexture', type: 'texture', path: 'textures/monitor/baked_computer.jpg'},
    {name: 'monitorSmudgeTexture', type: 'texture', path: 'textures/monitor/smudges.jpg'},
    {name: 'monitorShadowTexture', type: 'texture', path: 'textures/monitor/shadow-compressed.png'},
];



/* EVENT EMITTER */

class EventEmitter {
    //callbacks: { [key in string]: { [key in string]: (() => any)[] } };

    constructor() {
        this.callbacks = {};
        this.callbacks.base = {};
    }

    //on(_names: string, callback: (...args: any[]) => any) {
    on(_names, callback) {
        // Errors
        if (typeof _names === 'undefined' || _names === '') {
            console.warn('wrong names');
            return false;
        }

        if (typeof callback === 'undefined') {
            console.warn('wrong callback');
            return false;
        }

        // Resolve names
        const names = this.resolveNames(_names);

        // Each name
        names.forEach((_name) => {
            // Resolve name
            const name = this.resolveName(_name);

            // Create namespace if not exist
            if (!(this.callbacks[name.namespace] instanceof Object))
                this.callbacks[name.namespace] = {};

            // Create callback if not exist
            if (!(this.callbacks[name.namespace][name.value] instanceof Array))
                this.callbacks[name.namespace][name.value] = [];

            // Add callback
            this.callbacks[name.namespace][name.value].push(callback);
        });

        return this;
    }

    off(_names) {
        // Errors
        if (typeof _names === 'undefined' || _names === '') {
            console.warn('wrong name');
            return false;
        }

        // Resolve names
        const names = this.resolveNames(_names);

        // Each name
        names.forEach((_name) => {
            // Resolve name
            const name = this.resolveName(_name);

            // Remove namespace
            if (name.namespace !== 'base' && name.value === '') {
                delete this.callbacks[name.namespace];
            }

            // Remove specific callback in namespace
            else {
                // Default
                if (name.namespace === 'base') {
                    // Try to remove from each namespace
                    for (const namespace in this.callbacks) {
                        if (this.callbacks[namespace] instanceof Object && this.callbacks[namespace][name.value] instanceof Array) {
                            delete this.callbacks[namespace][name.value];

                            // Remove namespace if empty
                            if (Object.keys(this.callbacks[namespace]).length === 0)
                                delete this.callbacks[namespace];
                        }
                    }
                }

                // Specified namespace
                else if (
                    this.callbacks[name.namespace] instanceof Object &&
                    this.callbacks[name.namespace][name.value] instanceof Array
                ) {
                    delete this.callbacks[name.namespace][name.value];

                    // Remove namespace if empty
                    if (
                        Object.keys(this.callbacks[name.namespace]).length === 0
                    )
                        delete this.callbacks[name.namespace];
                }
            }
        });

        return this;
    }

    trigger(_name, _args) {
        // Errors
        if (typeof _name === 'undefined' || _name === '') {
            console.warn('wrong name');
            return false;
        }

        const that = this;
        let finalResult = null;
        let result = null;

        // Default args
        const args = [];

        // Resolve names (should on have one event)
        let _names = this.resolveNames(_name);

        // Resolve name
        const name = this.resolveName(_names[0]);

        // Default namespace
        if (name.namespace === 'base') {
            // Try to find callback in each namespace
            for (const namespace in this.callbacks) {
                if (
                    this.callbacks[namespace] instanceof Object &&
                    this.callbacks[namespace][name.value] instanceof Array
                ) {
                    this.callbacks[namespace][name.value].forEach(function (
                        callback
                    ) {
                        result = callback.apply(that, args);

                        if (typeof finalResult === 'undefined') {
                            finalResult = result;
                        }
                    });
                }
            }
        }

        // Specified namespace
        else if (this.callbacks[name.namespace] instanceof Object) {
            if (name.value === '') {
                console.warn('wrong name');
                return this;
            }

            this.callbacks[name.namespace][name.value].forEach(function (
                callback
            ) {
                result = callback.apply(that, args);

                if (typeof finalResult === 'undefined') finalResult = result;
            });
        }

        return finalResult;
    }

    resolveNames(_names) {
        let names = _names;
        names = names.replace(/[^a-zA-Z0-9 ,/.]/g, '');
        names = names.replace(/[,/]+/g, ' ');
        return names.split(' ');
    }

    resolveName(name) {
        const parts = name.split('.');
        // : { original: string; value: string; namespace: string }
        const newName =
            {
                original: name,
                value: parts[0],
                namespace: 'base',
            };

        // Specified namespace
        if (parts.length > 1 && parts[1] !== '') {
            newName.namespace = parts[1];
        }

        return newName;
    }
}

class Time extends EventEmitter {
//    start: number;
//    current: number;
//    elapsed: number;
//    delta: number;

    constructor() {
        super();

        // Setup
        this.start = Date.now();
        this.current = this.start;
        this.elapsed = 0;
        this.delta = 16;

        window.requestAnimationFrame(() => {
            this.tick();
        });

        UIEventBus.on('loadingScreenDone', () => {
            this.start = Date.now();
        });
    }

    tick() {
        const currentTime = Date.now();
        this.delta = currentTime - this.current;
        this.current = currentTime;
        this.elapsed = this.current - this.start;

        this.trigger('tick');

        window.requestAnimationFrame(() => {
            this.tick();
        });
    }
}

const UIEventBus = {
    //on(event: string, callback: (...args: any[]) => any) {
    on(event, callback) {
        document.addEventListener(event, (e) => callback(e.detail));
    },
    //dispatch(event: string, data: any) {
    dispatch(event, data) {
        document.dispatchEvent(new CustomEvent(event, { detail: data }));
    },
    //remove(event: string, callback: (...args: any[]) => any) {
    remove(event, callback) {
        document.removeEventListener(event, callback);
    },
};


function destroy(scene, renderer) {
    //this.sizes.off('resize');
    //this.time.off('tick');

    // Traverse the whole scene
    scene.traverse((child) => {
        // Test if it's a mesh
        if (child instanceof Mesh) {
            child.geometry.dispose();

            // Loop through the material properties
            for (const key in child.material) {
                const value = child.material[key];

                // Test if there is a dispose function
                if (value && typeof value.dispose === 'function') {
                    value.dispose();
                }
            }
        }
    });

    renderer.instance.dispose();
}

export class Mouse extends EventEmitter {
//    x: number;
//    y: number;
//    inComputer: boolean;
//    application: Application;

    constructor() {
        super();

        // Setup
        this.x = 0;
        this.y = 0;
        this.inComputer = false;
        // this.audio = this.application.world.audio;

        // Resize event
        this.on('mousemove', (event) => {
            if (event && event.clientX && event.clientY) {
                this.x = event.clientX;
                this.y = event.clientY;

                this.inComputer = event.inComputer ? true : false;
            }
        });
    }
}

const SCREEN_SIZE = { w: 1280, h: 1024 };
const IFRAME_PADDING = 32;
const IFRAME_SIZE = {
    w: SCREEN_SIZE.w - IFRAME_PADDING,
    h: SCREEN_SIZE.h - IFRAME_PADDING,
};

export default class MonitorScreen extends EventEmitter {
    /*
    application: Application;
    scene: Scene;
    cssScene: Scene;
    resources: Resources;
    debug: Debug;
    sizes: Sizes;
    debugFolder: GUI;
    screenSize: Vector2;
    position: Vector3;
    rotation: Euler;
    camera: Camera;
    prevInComputer: boolean;
    shouldLeaveMonitor: boolean;
    inComputer: boolean;
    mouseClickInProgress: boolean;
    dimmingPlane: Mesh;
    videoTextures: { [key in string]: VideoTexture };
    */

    constructor(url) {
        super();
        this.url = url;

        this.scene = null;
        this.cssScene = null;
        this.sizes = null;
        this.items = { texture: {}, cubeTexture: {}, gltfModel: {}, audio: {} };
        this.sources = [];
        this.screenSize = new Vector2(SCREEN_SIZE.w, SCREEN_SIZE.h);
        this.camera = null;
        this.position = new Vector3(0, 950, 255);
        this.rotation = new Euler(-3 * MathUtils.DEG2RAD, 0, 0);
        this.videoTextures = {};
        this.mouseClickInProgress = false;
        this.shouldLeaveMonitor = false;

        // Create screen
        // moved to a separate function...
    }

    createScreen() {
        this.initializeScreenEvents();
        this.createIframe(this.url);
        const maxOffset = this.createTextureLayers();
        this.createEnclosingPlanes(maxOffset);
        this.createPerspectiveDimmer(maxOffset);
    }

    loadItems(sources) {
        const gltfLoader = new GLTFLoader();
        const textureLoader = new TextureLoader();
        const cubeTextureLoader = new CubeTextureLoader();
        const audioLoader = new AudioLoader();

        for (const source of sources) {
            if (source.type === 'gltfModel') {
                gltfLoader.load(source.path, (file) => {
                    this.sourceLoaded(source, file);
                });
            } else if (source.type === 'texture') {
                textureLoader.load(source.path, (file) => {
                    file.encoding = RGBFormat;
                    this.sourceLoaded(source, file);
                });
            } else if (source.type === 'cubeTexture') {
                cubeTextureLoader.load(source.path, (file) => {
                    this.sourceLoaded(source, file);
                });
            } else if (source.type === 'audio') {
                audioLoader.load(source.path, (buffer) => {
                    this.sourceLoaded(source, buffer);
                });
            }
        }
    }

    sourceLoaded(source, file) {
        this.items[source.type][source.name] = file;

        //this.loading.trigger('loadedSource', [source.name, this.loaded, this.toLoad]);
        //if (this.loaded === this.toLoad) {this.trigger('ready');}
    }

    initializeScreenEvents() {
        document.addEventListener(
            'mousemove',
            (event) => {
                const id = event.target.id;
                if (id === 'computer-screen') {
                    event.inComputer = true;
                }

                this.inComputer = event.inComputer;

                if (this.inComputer && !this.prevInComputer) {
                    // TODO: this.camera.trigger('enterMonitor');
                }

                if (
                    !this.inComputer &&
                    this.prevInComputer &&
                    !this.mouseClickInProgress
                ) {
                    // TODO: this.camera.trigger('leftMonitor');
                }

                if (
                    !this.inComputer &&
                    this.mouseClickInProgress &&
                    this.prevInComputer
                ) {
                    this.shouldLeaveMonitor = true;
                } else {
                    this.shouldLeaveMonitor = false;
                }

                this.mouse.trigger('mousemove', [event]);

                this.prevInComputer = this.inComputer;
            },
            false
        );
        document.addEventListener(
            'mousedown',
            (event) => {
                this.inComputer = event.inComputer;
                this.mouse.trigger('mousedown', [event]);

                this.mouseClickInProgress = true;
                this.prevInComputer = this.inComputer;
            },
            false
        );
        document.addEventListener(
            'mouseup',
            (event) => {
                this.inComputer = event.inComputer;
                this.mouse.trigger('mouseup', [event]);

                if (this.shouldLeaveMonitor) {
                    this.camera.trigger('leftMonitor');
                    this.shouldLeaveMonitor = false;
                }

                this.mouseClickInProgress = false;
                this.prevInComputer = this.inComputer;
            },
            false
        );
    }

    /**
     * Creates the iframe for the computer screen
     */
    createIframe(url) {
        // Create container
        const container = document.createElement('div');
        container.style.width = this.screenSize.width + 'px';
        container.style.height = this.screenSize.height + 'px';
        container.style.opacity = '1';
        container.style.background = '#1d2e2f';

        // Create iframe
        const iframe = document.createElement('iframe');

        // Bubble mouse move events to the main application, so we can affect the camera
        iframe.onload = () => {
            if (iframe.contentWindow) {
                window.addEventListener('message', (event) => {
                    var evt = new CustomEvent(event.data.type, {
                        bubbles: true,
                        cancelable: false,
                    });

                    evt.inComputer = true;
                    if (event.data.type === 'mousemove') {
                        var clRect = iframe.getBoundingClientRect();
                        const { top, left, width, height } = clRect;
                        const widthRatio = width / IFRAME_SIZE.w;
                        const heightRatio = height / IFRAME_SIZE.h;

                        evt.clientX = Math.round(event.data.clientX * widthRatio + left);
                        evt.clientY = Math.round(event.data.clientY * heightRatio + top);
                    } else if (event.data.type === 'keydown') {
                        evt.key = event.data.key;
                    } else if (event.data.type === 'keyup') {
                        evt.key = event.data.key;
                    }

                    iframe.dispatchEvent(evt);
                });
            }
        };

        iframe.src = url;
        /**
         * Use dev server is query params are present
         *
         * Warning: This will not work unless the dev server is running on localhost:3000
         * Also running the dev server causes browsers to freak out over unsecure connections
         * in the iframe, so it will flag a ton of issues.
         */
        iframe.style.width = this.screenSize.width + 'px';
        iframe.style.height = this.screenSize.height + 'px';
        iframe.style.padding = IFRAME_PADDING + 'px';
        iframe.style.boxSizing = 'border-box';
        iframe.style.opacity = '1';
        iframe.className = 'jitter';
        iframe.id = 'computer-screen';
        iframe.frameBorder = '0';
        iframe.title = 'HeffernanOS';

        // Add iframe to container
        container.appendChild(iframe);

        // Create CSS plane
        this.createCssPlane(container);
    }

    /**
     * Creates a CSS plane and GL plane to properly occlude the CSS plane
     * @param element the element to create the css plane for
     */
    //createCssPlane(element: HTMLElement) {
    createCssPlane(element) {
        // Create CSS3D object
        const object = new CSS3DObject(element);

        // copy monitor position and rotation
        object.position.copy(this.position);
        object.rotation.copy(this.rotation);

        // Add to CSS scene
        this.cssScene.add(object);

        // Create GL plane
        const material = new MeshLambertMaterial();
        material.side = DoubleSide;
        material.opacity = 0;
        material.transparent = true;
        // NoBlending allows the GL plane to occlude the CSS plane
        material.blending = NoBlending;

        // Create plane geometry
        const geometry = new PlaneGeometry(this.screenSize.width, this.screenSize.height);

        // Create the GL plane mesh
        const mesh = new Mesh(geometry, material);

        // Copy the position, rotation and scale of the CSS plane to the GL plane
        mesh.position.copy(object.position);
        mesh.rotation.copy(object.rotation);
        mesh.scale.copy(object.scale);

        // Add to gl scene
        this.scene.add(mesh);
    }

    /**
     * Creates the texture layers for the computer screen
     * @returns the maximum offset of the texture layers
     */
    createTextureLayers() {
        const textures = this.items.texture;

        this.getVideoTextures('video-1');
        this.getVideoTextures('video-2');

        // Scale factor to multiply depth offset by
        const scaleFactor = 4;

        // Construct the texture layers
        const layers = {
            smudge: {
                texture: textures.monitorSmudgeTexture,
                blending: AdditiveBlending,
                opacity: 0.12,
                offset: 24,
            },
            innerShadow: {
                texture: textures.monitorShadowTexture,
                blending: NormalBlending,
                opacity: 1,
                offset: 5,
            },
            video: {
                texture: this.videoTextures['video-1'],
                blending: AdditiveBlending,
                opacity: 0.5,
                offset: 10,
            },
            video2: {
                texture: this.videoTextures['video-2'],
                blending: AdditiveBlending,
                opacity: 0.1,
                offset: 15,
            },
        };

        // Declare max offset
        let maxOffset = -1;

        // Add the texture layers to the screen
        for (const [_, layer] of Object.entries(layers)) {
            const offset = layer.offset * scaleFactor;
            this.addTextureLayer(layer.texture, layer.blending, layer.opacity, offset);
            // Calculate the max offset
            if (offset > maxOffset) maxOffset = offset;
        }

        // Return the max offset
        return maxOffset;
    }

    getVideoTextures(videoId) {
        const video = document.getElementById(videoId);
        if (!video) {
            setTimeout(() => {this.getVideoTextures(videoId);}, 100);
        } else {
            // video as HTMLVideoElement
            this.videoTextures[videoId] = new VideoTexture(video);
        }
    }

    /**
     * Adds a texture layer to the screen
     * @param texture the texture to add [Texture]
     * @param blending the blending mode [Blending]
     * @param opacity the opacity of the texture [number]
     * @param offset the offset of the texture, higher values are further from the screen [number]
     */
    addTextureLayer(texture, blendingMode, opacity, offset) {
        // Create material
        const material = new MeshBasicMaterial({map: texture, blending: blendingMode, side: DoubleSide, opacity, transparent: true});

        // Create geometry
        const geometry = new PlaneGeometry(this.screenSize.width, this.screenSize.height);

        // Create mesh
        const mesh = new Mesh(geometry, material);

        // Copy position and apply the depth offset
        mesh.position.copy(this.offsetPosition(this.position, new Vector3(0, 0, offset)));

        // Copy rotation
        mesh.rotation.copy(this.rotation);

        this.scene.add(mesh);
    }

    /**
     * Creates enclosing planes for the computer screen
     * @param maxOffset the maximum offset of the texture layers
     */
    createEnclosingPlanes(maxOffset) {
        // Create planes, lots of boiler plate code here because I'm lazy
        const planes = {
            left: {
                size: new Vector2(maxOffset, this.screenSize.height),
                position: this.offsetPosition(this.position, new Vector3(-this.screenSize.width / 2, 0, maxOffset / 2)),
                rotation: new Euler(0, 90 * MathUtils.DEG2RAD, 0),
            },
            right: {
                size: new Vector2(maxOffset, this.screenSize.height),
                position: this.offsetPosition(this.position, new Vector3(this.screenSize.width / 2, 0, maxOffset / 2)),
                rotation: new Euler(0, 90 * MathUtils.DEG2RAD, 0),
            },
            top: {
                size: new Vector2(this.screenSize.width, maxOffset),
                position: this.offsetPosition(this.position, new Vector3(0, this.screenSize.height / 2, maxOffset / 2)),
                rotation: new Euler(90 * MathUtils.DEG2RAD, 0, 0),
            },
            bottom: {
                size: new Vector2(this.screenSize.width, maxOffset),
                position: this.offsetPosition(this.position, new Vector3(0, -this.screenSize.height / 2, maxOffset / 2)),
                rotation: new Euler(90 * MathUtils.DEG2RAD, 0, 0),
            },
        };

        // Add each of the planes
        for (const [_, plane] of Object.entries(planes)) {
            this.createEnclosingPlane(plane);
        }
    }

    /**
     * Creates a plane for the enclosing planes
     * @param plane the plane to create
     */
    //createEnclosingPlane(plane: EnclosingPlane) {
    createEnclosingPlane(plane) {
        const material = new MeshBasicMaterial({side: DoubleSide, color: 0x48493f});

        const geometry = new PlaneGeometry(plane.size.x, plane.size.y);
        const mesh = new Mesh(geometry, material);

        mesh.position.copy(plane.position);
        mesh.rotation.copy(plane.rotation);

        this.scene.add(mesh);
    }

    createPerspectiveDimmer(maxOffset) {
        const material = new MeshBasicMaterial({side: DoubleSide, color: 0x000000, transparent: true, blending: AdditiveBlending});

        const plane = new PlaneGeometry(this.screenSize.width, this.screenSize.height);

        const mesh = new Mesh(plane, material);

        mesh.position.copy(this.offsetPosition(this.position, new Vector3(0, 0, maxOffset - 5)));

        mesh.rotation.copy(this.rotation);

        this.dimmingPlane = mesh;

        this.scene.add(mesh);
    }

    /**
     * Offsets a position vector by another vector
     * @param position the position to offset
     * @param offset the offset to apply
     * @returns the new offset position
     */
    //offsetPosition(position: Vector3, offset: Vector3) {
    offsetPosition(position, offset) {
        const newPosition = new Vector3();
        newPosition.copy(position);
        newPosition.add(offset);
        return newPosition;
    }

    update() {
        if (this.dimmingPlane) {
            const planeNormal = new Vector3(0, 0, 1);
            const viewVector = new Vector3();
            viewVector.copy(this.camera.instance.position);
            viewVector.sub(this.position);
            viewVector.normalize();

            const dot = viewVector.dot(planeNormal);

            // calculate the distance from the camera vector to the plane vector
            const dimPos = this.dimmingPlane.position;
            const camPos = this.camera.instance.position;

            const distance = Math.sqrt((camPos.x - dimPos.x) ** 2 + (camPos.y - dimPos.y) ** 2 + (camPos.z - dimPos.z) ** 2);

            const opacity = 1 / (distance / 10000);

            const DIM_FACTOR = 0.7;

            this.dimmingPlane.material.opacity = (1 - opacity) * DIM_FACTOR + (1 - dot) * DIM_FACTOR;
        }
    }
}


async function attachSceneComponentsToMonitor(monitor, threejsDrawing, cssScene) {
    Object.assign(monitor, {
        scene: threejsDrawing.data.scene,
        cssScene: cssScene,
        camera: threejsDrawing.data.camera
    })
}

async function drawMonitor(scene, threejsDrawing) {
    const cssScene = new Scene();
    threejsDrawing.data.cssScene = cssScene;

    // Provide a data bucket if not present
    if (!threejsDrawing.data) threejsDrawing.data = {};
    const data = threejsDrawing.data;

    // Create the monitor screen
    data.monitorScreen = new MonitorScreen(data.url);

    // Attach the scene components to the monitor
    await attachSceneComponentsToMonitor(data.monitorScreen, threejsDrawing, cssScene);

    data.monitorScreen.loadItems(sources);

    // Create the screen
    data.monitorScreen.mouse = new Mouse();
    data.monitorScreen.createScreen();

    //scene.add(data.monitorScreen.scene);
    //data.cssScene.add(data.monitorScreen.cssScene);

    // Add the dimming plane to the CSS scene
    data.monitorScreen.cssScene.add(data.monitorScreen.dimmingPlane);

    // Set the camera to look at the monitor screen
    data.monitorScreen.camera.lookAt(data.monitorScreen.position);

    // Set the camera to look at the monitor screen
    data.monitorScreen.camera.position.copy(data.monitorScreen.position);
    data.monitorScreen.camera.rotation.copy(data.monitorScreen.rotation);

    // Add some lights...
    const light = new DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 0);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
}

function animationCallback(renderer, timestamp, threejsDrawing, uiState, camera) {
    const cssScene = threejsDrawing.data.cssScene;
    const cssRenderer = threejsDrawing.data.cssRenderer;

    if (!cssRenderer) {
        console.warn('CSS Renderer not found');
        return;
    }
    if (!cssScene) {
        console.warn('CSS Scene not found');
        return;
    }
    cssRenderer.render(cssScene, camera);
}

const monitorDrawing = {
    sceneElements: [],
    drawFuncs: [ { func: drawMonitor, dataSrc: null } ],
    uiState: null,
    eventListeners: null,
    animationCallback,
    data: {
        'url': 'http://localhost:3000/',
    },
    sceneConfig: {
        //startPosition: { x: TILE*1.5, y: 2, z: TILE*1.5 },
        //controller: 'pointerlock'
        'cssRenderer': '3D'
    }
};

export { monitorDrawing };
