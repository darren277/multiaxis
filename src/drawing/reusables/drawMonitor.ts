/* Adapted from https://github.com/henryjeff/portfolio-website/blob/master/src/Application/World/MonitorScreen.ts */

import * as THREE from "three";
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { ThreeJSDrawing } from "../../types";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let instance = null;

const sources = [
    {name: 'computerSetupModel', type: 'gltfModel', path: 'imagery/computer_setup.glb'},
    {name: 'computerSetupTexture', type: 'texture', path: 'textures/monitor/baked_computer.jpg'},
    {name: 'monitorSmudgeTexture', type: 'texture', path: 'textures/monitor/smudges.jpg'},
    {name: 'monitorShadowTexture', type: 'texture', path: 'textures/monitor/shadow-compressed.png'},
];



/* EVENT EMITTER */

class EventEmitter {
    callbacks: {[namespace: string]: {[eventName: string]: ((...args: any[]) => any)[];};};

    constructor() {
        this.callbacks = {};
        this.callbacks.base = {};
    }

    on(_names: string, callback: (...args: any[]) => any) {
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
        names.forEach((_name: string) => {
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

    off(_names: string) {
        // Errors
        if (typeof _names === 'undefined' || _names === '') {
            console.warn('wrong name');
            return false;
        }

        // Resolve names
        const names = this.resolveNames(_names);

        // Each name
        names.forEach((_name: string) => {
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

    trigger(_name: string, ..._args: any[]) {
        // Errors
        if (typeof _name === 'undefined' || _name === '') {
            console.warn('wrong name');
            return false;
        }

        const that = this;
        let finalResult: any = null;
        let result = null;

        // Default args
        const args: any[] = _args;

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

    resolveNames(_names: string) {
        let names = _names;
        names = names.replace(/[^a-zA-Z0-9 ,/.]/g, '');
        names = names.replace(/[,/]+/g, ' ');
        return names.split(' ');
    }

    resolveName(name: string) {
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
   start: number;
   current: number;
   elapsed: number;
   delta: number;

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

        this.trigger('tick', []);

        window.requestAnimationFrame(() => {
            this.tick();
        });
    }
}

const UIEventBus = {
    on(event: string, callback: (...args: any[]) => any) {
        document.addEventListener(event, (e) => callback((e as CustomEvent).detail));
    },
    dispatch(event: string, data: any) {
        document.dispatchEvent(new CustomEvent(event, { detail: data }));
    },
    remove(event: string, callback: (...args: any[]) => any) {
        document.removeEventListener(event, callback);
    },
};


function destroy(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    //this.sizes.off('resize');
    //this.time.off('tick');

    // Traverse the whole scene
    scene.traverse((child: THREE.Object3D) => {
        // Test if it's a mesh
        if (child instanceof THREE.Mesh) {
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

    renderer.dispose();
}

export class Mouse extends EventEmitter {
   x: number;
   y: number;
   inComputer: boolean;
   application: Application | undefined;

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

type Sizes = {
    width: number;
    height: number;
    pixelRatio: number;
};

type Debug = {
    active: boolean;
    ui: any; // GUI instance
    folder: any; // GUI folder
};

type Application = {
    world: {
        scene: THREE.Scene;
        cssScene: THREE.Scene;
        renderer: THREE.WebGLRenderer;
        camera: THREE.Camera;
        resources: Resources;
        debug: Debug;
        sizes: Sizes;
    };
};

type Resources = {
    items: { [key in string]: any };
    toLoad: number;
    loaded: number;
    loadItems: (sources: Array<{ type: string; name: string; path: string }>) => Promise<void>;
    sourceLoaded: (source: { type: string; name: string }, file: any) => void;
};

type GUI = {
    active: boolean;
    ui: any; // GUI instance
    folder: any; // GUI folder
};

export default class MonitorScreen extends EventEmitter {
    application: Application | undefined;
    scene: THREE.Scene;
    cssScene: THREE.Scene;
    resources: Resources | undefined;
    debug: Debug | undefined;
    sizes: Sizes | undefined;
    debugFolder: GUI | undefined;
    screenSize: THREE.Vector2 | undefined;
    position: THREE.Vector3 | undefined;
    rotation: THREE.Euler | undefined;
    camera: THREE.Camera | undefined;
    prevInComputer: boolean | undefined;
    shouldLeaveMonitor: boolean | undefined;
    inComputer: boolean | undefined;
    mouseClickInProgress: boolean | undefined;
    dimmingPlane: THREE.Mesh | undefined;
    videoTextures: { [key in string]: THREE.VideoTexture | undefined } = {};
    mouse: Mouse | undefined;
    items: any;
    url: string;
    sources: Array<{ type: string; name: string; path: string }> | undefined;

    constructor(url: string) {
        super();
        this.url = url;

        this.scene = new THREE.Scene();
        this.cssScene = new THREE.Scene();
        this.sizes = {
            width: SCREEN_SIZE.w,
            height: SCREEN_SIZE.h,
            pixelRatio: window.devicePixelRatio
        };
        this.items = { texture: {}, cubeTexture: {}, gltfModel: {}, audio: {} };
        this.sources = [];
        this.screenSize = new THREE.Vector2(SCREEN_SIZE.w, SCREEN_SIZE.h);
        this.camera = new THREE.Camera();
        this.position = new THREE.Vector3(0, 950, 255);
        this.rotation = new THREE.Euler(-3 * THREE.MathUtils.DEG2RAD, 0, 0);
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

    /**
     * Load all assets listed in `sources`.
     * Returns a Promise that resolves when every asset is ready.
     */
    async loadItems (sources: Array<{ type: string; name: string; path: string }>) {

        const gltfLoader       = new GLTFLoader();
        const textureLoader    = new THREE.TextureLoader();
        const cubeTextureLoader= new THREE.CubeTextureLoader();
        const audioLoader      = new THREE.AudioLoader();

        // build one promise per source
        const jobs = sources.map(src => {

            switch (src.type) {

                case 'gltfModel':
                    return gltfLoader.loadAsync(src.path)
                        .then((file: GLTF) => this.items.gltfModel[src.name] = file);

                case 'texture':
                    return textureLoader.loadAsync(src.path)
                        .then((file: THREE.Texture) => {
                            file.colorSpace = THREE.SRGBColorSpace;
                            this.items.texture[src.name] = file;
                        });

                case 'cubeTexture':
                    // Ensure src.path is an array of strings for cube textures
                    return cubeTextureLoader.loadAsync(Array.isArray(src.path) ? src.path : [src.path])
                        .then((file: THREE.CubeTexture) => this.items.cubeTexture[src.name] = file);

                case 'audio':
                    return audioLoader.loadAsync(src.path)
                        .then((buffer: AudioBuffer) => this.items.audio[src.name] = buffer);

                default:
                    return Promise.reject(
                        new Error(`Unknown source type: ${src.type}`)
                    );
            }
        });

        // wait for *all* jobs to finish (or fail fast on first error)
        await Promise.all(jobs);

        // Everything is ready at this point
        console.log('All monitor assets loaded ✅');
    }

    sourceLoaded(source: { type: string; name: string }, file: any) {
        this.items[source.type][source.name] = file;

        //this.loading.trigger('loadedSource', [source.name, this.loaded, this.toLoad]);
        //if (this.loaded === this.toLoad) {this.trigger('ready');}
    }

    initializeScreenEvents() {
        document.addEventListener(
            'mousemove',
            (event: MouseEvent) => {
                const id = event.target && 'id' in event.target ? (event.target as HTMLElement).id : null;
                if (id === 'computer-screen') {
                    (event as MouseEvent & { inComputer?: boolean }).inComputer = true;
                }

                this.inComputer = (event as MouseEvent & { inComputer?: boolean }).inComputer ?? false;

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

                if (this.mouse) {
                    this.mouse.trigger('mousemove', [event]);
                }

                this.prevInComputer = this.inComputer;
            },
            false
        );
        document.addEventListener(
            'mousedown',
            (event: MouseEvent) => {
                this.inComputer = (event as MouseEvent & { inComputer?: boolean }).inComputer;
                if (this.mouse) {
                    this.mouse.trigger('mousedown', [event]);
                }

                this.mouseClickInProgress = true;
                this.prevInComputer = this.inComputer;
            },
            false
        );
        document.addEventListener(
            'mouseup',
            (event: MouseEvent) => {
                this.inComputer = (event as MouseEvent & { inComputer?: boolean }).inComputer;
                if (this.mouse) {
                    this.mouse.trigger('mouseup', [event]);
                }

                if (this.shouldLeaveMonitor) {
                    // TODO: Handle 'leftMonitor' event here if needed
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
    createIframe(url: string) {
        // Create container
        const container = document.createElement('div');
        if (!this.screenSize) {
            throw new Error("screenSize is undefined");
        }
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
                    }) as CustomEvent & { inComputer?: boolean; clientX?: number; clientY?: number; key?: string };

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
    createCssPlane(element: HTMLElement) {
        // Create CSS3D object
        const object = new CSS3DObject(element);

        // copy monitor position and rotation
        if (this.position) {
            object.position.copy(this.position);
        }
        if (this.rotation) {
            object.rotation.copy(this.rotation);
        }

        // Add to CSS scene
        this.cssScene.add(object);

        // Create GL plane
        const material = new THREE.MeshLambertMaterial();
        material.side = THREE.DoubleSide;
        material.opacity = 0;
        material.transparent = true;
        // NoBlending allows the GL plane to occlude the CSS plane
        material.blending = THREE.NoBlending;

        // Create plane geometry
        if (!this.screenSize) {
            throw new Error("screenSize is undefined");
        }
        const geometry = new THREE.PlaneGeometry(this.screenSize.width, this.screenSize.height);

        // Create the GL plane mesh
        const mesh = new THREE.Mesh(geometry, material);

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
                blending: THREE.AdditiveBlending,
                opacity: 0.12,
                offset: 24,
            },
            innerShadow: {
                texture: textures.monitorShadowTexture,
                blending: THREE.NormalBlending,
                opacity: 1,
                offset: 5,
            },
            video: {
                texture: this.videoTextures['video-1'],
                blending: THREE.AdditiveBlending,
                opacity: 0.5,
                offset: 10,
            },
            video2: {
                texture: this.videoTextures['video-2'],
                blending: THREE.AdditiveBlending,
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

    getVideoTextures(videoId: string) {
        const video = document.getElementById(videoId) as HTMLVideoElement | null;
        if (!video) {
            setTimeout(() => {this.getVideoTextures(videoId);}, 100);
        } else {
            // video as HTMLVideoElement
            this.videoTextures[videoId] = new THREE.VideoTexture(video);
        }
    }

    /**
     * Adds a texture layer to the screen
     * @param texture the texture to add [Texture]
     * @param blending the blending mode [Blending]
     * @param opacity the opacity of the texture [number]
     * @param offset the offset of the texture, higher values are further from the screen [number]
     */
    addTextureLayer(texture: THREE.Texture, blendingMode: THREE.Blending, opacity: number, offset: number) {
        // Create material
        const material = new THREE.MeshBasicMaterial({map: texture, blending: blendingMode, side: THREE.DoubleSide, opacity, transparent: true});

        // Create geometry
        if (!this.screenSize) {
            throw new Error("screenSize is undefined");
        }
        const geometry = new THREE.PlaneGeometry(this.screenSize.width, this.screenSize.height);

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);

        // Copy position and apply the depth offset
        if (!this.position) {
            throw new Error("position is undefined");
        }
        mesh.position.copy(this.offsetPosition(this.position, new THREE.Vector3(0, 0, offset)));

        // Copy rotation
        if (!this.rotation) {
            throw new Error("rotation is undefined");
        }
        mesh.rotation.copy(this.rotation);

        this.scene.add(mesh);
    }

    /**
     * Creates enclosing planes for the computer screen
     * @param maxOffset the maximum offset of the texture layers
     */
    createEnclosingPlanes(maxOffset: number) {
        // Create planes, lots of boiler plate code here because I'm lazy
        if (!this.screenSize) {
            throw new Error("screenSize is undefined");
        }
        if (!this.position) {
            throw new Error("position is undefined");
        }
        const planes = {
            left: {
                size: new THREE.Vector2(maxOffset, this.screenSize.height),
                position: this.offsetPosition(this.position, new THREE.Vector3(-this.screenSize.width / 2, 0, maxOffset / 2)),
                rotation: new THREE.Euler(0, 90 * THREE.MathUtils.DEG2RAD, 0),
            },
            right: {
                size: new THREE.Vector2(maxOffset, this.screenSize.height),
                position: this.offsetPosition(this.position, new THREE.Vector3(this.screenSize.width / 2, 0, maxOffset / 2)),
                rotation: new THREE.Euler(0, 90 * THREE.MathUtils.DEG2RAD, 0),
            },
            top: {
                size: new THREE.Vector2(this.screenSize.width, maxOffset),
                position: this.offsetPosition(this.position, new THREE.Vector3(0, this.screenSize.height / 2, maxOffset / 2)),
                rotation: new THREE.Euler(90 * THREE.MathUtils.DEG2RAD, 0, 0),
            },
            bottom: {
                size: new THREE.Vector2(this.screenSize.width, maxOffset),
                position: this.offsetPosition(this.position, new THREE.Vector3(0, -this.screenSize.height / 2, maxOffset / 2)),
                rotation: new THREE.Euler(90 * THREE.MathUtils.DEG2RAD, 0, 0),
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
    createEnclosingPlane(plane: any) {
        const material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, color: 0x48493f});

        const geometry = new THREE.PlaneGeometry(plane.size.x, plane.size.y);
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.copy(plane.position);
        mesh.rotation.copy(plane.rotation);

        this.scene.add(mesh);
    }

    createPerspectiveDimmer(maxOffset: number) {
        if (!this.position) {
            throw new Error("position is undefined");
        }
        if (!this.rotation) {
            throw new Error("rotation is undefined");
        }
        if (!this.screenSize) {
            throw new Error("screenSize is undefined");
        }
        const material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, color: 0x000000, transparent: true, blending: THREE.AdditiveBlending});

        const plane = new THREE.PlaneGeometry(this.screenSize.width, this.screenSize.height);

        const mesh = new THREE.Mesh(plane, material);

        mesh.position.copy(this.offsetPosition(this.position, new THREE.Vector3(0, 0, maxOffset - 5)));

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
    offsetPosition(position: THREE.Vector3, offset: THREE.Vector3) {
        const newPosition = new THREE.Vector3();
        newPosition.copy(position);
        newPosition.add(offset);
        return newPosition;
    }

    update() {
        if (this.dimmingPlane && this.camera && this.position) {
            const planeNormal = new THREE.Vector3(0, 0, 1);
            const viewVector = new THREE.Vector3();
            viewVector.copy(this.camera.position);
            viewVector.sub(this.position);
            viewVector.normalize();

            const dot = viewVector.dot(planeNormal);

            // calculate the distance from the camera vector to the plane vector
            const dimPos = this.dimmingPlane.position;
            const camPos = this.camera.position;

            const distance = Math.sqrt((camPos.x - dimPos.x) ** 2 + (camPos.y - dimPos.y) ** 2 + (camPos.z - dimPos.z) ** 2);

            const opacity = 1 / (distance / 10000);

            const DIM_FACTOR = 0.7;

            (this.dimmingPlane.material as THREE.MeshBasicMaterial).opacity = (1 - opacity) * DIM_FACTOR + (1 - dot) * DIM_FACTOR;
        }
    }
}

class BakedModel {
    model: any;
    texture: any;
    material: THREE.MeshBasicMaterial;

    constructor(model: any, texture: any, scale: number) {
        this.model = model;
        this.texture = texture;

        this.texture.flipY = false;
        this.texture.colorSpace = THREE.SRGBColorSpace;

        this.material = new THREE.MeshBasicMaterial({
            map: this.texture,
        });

        this.model.scene.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
                if (scale) child.scale.set(scale, scale, scale);
                child.material.map = this.texture;
                child.material = this.material;
            }
        });

        return this;
    }

    getModel() {
        // Group
        return this.model.scene;
    }
}

class Computer {
    scene: THREE.Scene;
    gltfModel: any;
    texture: any;
    bakedModel!: BakedModel;

    constructor(scene: THREE.Scene, gltfModel: any, texture: any) {
        this.scene = scene;
        this.gltfModel = gltfModel;
        this.texture = texture;
        this.bakeModel();
        this.setModel();
    }

    bakeModel() {
        this.bakedModel = new BakedModel(
            this.gltfModel.computerSetupModel,
            this.texture.computerSetupTexture,
            900
        );
    }

    setModel() {
        const root = this.bakedModel.getModel();
        root.position.set(0, 0, 0);        // tweak as needed
        root.scale.set(1, 1, 1);           // global scale instead of per-mesh 900?
        //root.scale.setScalar(9);   // maybe 9 instead of 900
        this.scene.add(root);
    }
}

async function attachSceneComponentsToMonitor(monitor: any, threejsDrawing: ThreeJSDrawing, cssScene: THREE.Scene) {
    Object.assign(monitor, {
        scene: threejsDrawing.data.scene,
        cssScene: cssScene,
        camera: threejsDrawing.data.camera
    })
}

async function drawMonitor(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing) {
    // Provide a data bucket if not present
    if (!threejsDrawing.data) threejsDrawing.data = {};

    // Ensure cssScene is a THREE.Scene
    if (!threejsDrawing.data.cssScene || !(threejsDrawing.data.cssScene instanceof THREE.Scene)) {
        threejsDrawing.data.cssScene = new THREE.Scene();
    }
    const cssScene = threejsDrawing.data.cssScene as THREE.Scene;

    const data = threejsDrawing.data as {
        monitorScreen?: MonitorScreen;
        url?: string;
        cssScene?: THREE.Scene;
        camera?: THREE.Camera;
        controls?: {
            target: THREE.Vector3;
            update: () => void;
            minDistance: number;
            maxDistance: number;
        };
        [key: string]: any;
    };

    // Create the monitor screen
    data.monitorScreen = new MonitorScreen(data.url ?? '');

    // Attach the scene components to the monitor
    await attachSceneComponentsToMonitor(data.monitorScreen, threejsDrawing, cssScene);

    await data.monitorScreen.loadItems(sources);

    console.log('Loaded GLTF models:', data.monitorScreen.items.gltfModel);

    const computer = new Computer(scene, data.monitorScreen.items.gltfModel, data.monitorScreen.items.texture);

    // after you add the computer to the scene
    const root      = computer.bakedModel.getModel();      // the Group you added
    const box       = new THREE.Box3().setFromObject(root);
    const center    = new THREE.Vector3();
    const sphere = new THREE.Sphere();
    const radius    = box.getBoundingSphere(sphere).radius;

    // Type assertion for controls (assuming OrbitControls)
    const controls = threejsDrawing.data.controls as {
        target: THREE.Vector3;
        update: () => void;
        minDistance: number;
        maxDistance: number;
    };

    // put target in the logical centre of the computer setup
    controls.target.copy(sphere.center);
    controls.update();

    controls.minDistance = sphere.radius * 0.5;
    controls.maxDistance = sphere.radius * 5;

    (threejsDrawing.data.camera as THREE.PerspectiveCamera).near = 0.1;
    (threejsDrawing.data.camera as THREE.PerspectiveCamera).far  = 100;

    // Create the screen
    data.monitorScreen.mouse = new Mouse();
    data.monitorScreen.createScreen();

    //scene.add(data.monitorScreen.scene);
    //data.cssScene.add(data.monitorScreen.cssScene);

    // Add the dimming plane to the CSS scene
    if (data.monitorScreen.dimmingPlane) {
        data.monitorScreen.cssScene.add(data.monitorScreen.dimmingPlane);
    }

    // Set the camera to look at the monitor screen
    if (data.monitorScreen.camera && data.monitorScreen.position && data.monitorScreen.rotation) {
        data.monitorScreen.camera.lookAt(data.monitorScreen.position);

        // Set the camera to look at the monitor screen
        data.monitorScreen.camera.position.copy(data.monitorScreen.position);
        data.monitorScreen.camera.rotation.copy(data.monitorScreen.rotation);
    }

    // Add some lights...
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 0);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
}

function animationCallback(renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: ThreeJSDrawing, camera: THREE.Camera) {
    let cssScene = threejsDrawing.data.cssScene;
    const cssRenderer = threejsDrawing.data.cssRenderer as import('three/examples/jsm/renderers/CSS3DRenderer').CSS3DRenderer;

    if (!cssRenderer) {
        console.warn('CSS Renderer not found');
        return;
    }
    // Ensure cssScene is a THREE.Scene
    if (!cssScene || !(cssScene instanceof THREE.Scene)) {
        console.warn('CSS Scene not found or not a THREE.Scene, creating a new THREE.Scene.');
        cssScene = new THREE.Scene();
        threejsDrawing.data.cssScene = cssScene;
    }
    cssRenderer.render(cssScene as THREE.Scene, camera);
}

const monitorDrawing = {
    sceneElements: [],
    drawFuncs: [ { func: drawMonitor, dataSrc: null } ],
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
