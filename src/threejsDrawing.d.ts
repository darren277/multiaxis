import * as THREE from 'three';

export interface SceneElement {
    [key: string]: unknown;
}

export interface DrawFunc {
    func: (scene: THREE.Scene, data: any, threejsDrawing: ThreeJSDrawing) => void;
    dataSrc: string | null;
}

export interface DrawingEventMap {
    keydown?: (event: KeyboardEvent, stuff: { data: DrawingData }) => void;
    keyup?: (event: KeyboardEvent, stuff: { data: DrawingData }) => void;
    [eventType: string]: ((event: Event, stuff: { data: DrawingData }) => void) | undefined;
}

// animationCallback?: (renderer: any, timestamp: number, drawing: ThreeJSDrawing, camera: any) => void;
export interface AnimationCallback {
    (renderer: THREE.Renderer, timestamp: number, drawing: ThreeJSDrawing, camera: THREE.Camera): void;
}

export interface DrawingData {
    staticBoxes?: THREE.Object3D[];
    movingMeshes?: THREE.Object3D[];
    obstacleBoxes?: THREE.Object3D[];
    worldMeshes?: THREE.Object3D[];
    collision?: any;
    keyManager?: any;
    [key: string]: unknown;
}

export interface SceneConfig {
    startPosition?: { x: number; y: number; z: number };
    lookAt?: { x: number; y: number; z: number };
    [key: string]: unknown;
}

export interface ThreeJSDrawing {
    camera: any;
    sceneElements: SceneElement[];
    drawFuncs: DrawFunc[];
    //eventListeners: DrawingEventMap;
    animationCallback: AnimationCallback;
    data: DrawingData;
    sceneConfig?: SceneConfig;
    //drawFuncs: Array<{ func: Function, dataSrc?: string, dataType?: string }>;
    eventListeners?: { [eventName: string]: (e: Event, context: { data: DrawingData, controls?: any, renderer?: any, scene?: any }) => void };
}
