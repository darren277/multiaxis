import * as THREE from 'three';
import { Logger } from './config/logger';

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

export interface TVData {
    rotated?: boolean;
    rotation: {
        set: (x: number, y: number, z: number) => void;
    };
    // add other properties as needed
}
export interface ComplexData {
    tv?: TVData;
    tvX?: number;
    tvY?: number;
    tvZ?: number;
    tvScale?: number;
    movingMeshes?: THREE.Object3D[];
    staticBoxes?: THREE.Object3D[];
    worldMeshes?: THREE.Object3D[];
    obstacleBoxes?: THREE.Object3D[];
    screenMesh?: THREE.Object3D;
    screenCss?: any; // Replace with actual type if available
    css3DRenderer?: any; // Replace with actual type if available
    pickPlane?: any; // Replace with actual type if available
}

export interface CollisionData {
    movingMeshes: THREE.Object3D[];
    staticBoxes: THREE.Object3D[];
    worldMeshes: THREE.Object3D[];
    obstacleBoxes: THREE.Object3D[];
    player: THREE.Object3D;
    playerSize: number;
    stepDown: number;
    gravity: number;
    speed: number;
    jumpVelocity: number;
    checkCollisionFunc: (
        playerSize: number,
        position: THREE.Vector3,
        obstacleBoxes?: THREE.Box3[],
        ignore?: THREE.Box3 | null
    ) => boolean;
}

export interface DrawingDataWithCollision extends CollisionData {
    collision?: any;
    keyManager?: any;
    [key: string]: unknown;
    tv?: TVData; // For complex drawings
}

export interface SceneConfig {
    startPosition?: { x: number; y: number; z: number };
    lookAt?: { x: number; y: number; z: number };
    [key: string]: unknown;
}

export interface ThreeJSDrawing {
    name: string;
    log?: Logger;
    dataSources: any;
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
