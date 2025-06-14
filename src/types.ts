import type { ThreeJSDrawing } from './threejsDrawing.d.ts';
import type { ALL_CUBE_DEFS } from './config/navigation.js';

type QueryOptions = {
    debug?: boolean;
    controls?: string;
    prev?: string;
    nav?: boolean;
    [key: string]: any;
};

type SceneConfig = {
    startPosition?: { x: number, y: number, z: number },
    lookAt?: { x: number, y: number, z: number },
    clippingPlane?: number,
    background?: number | string,
    controller?: 'none' | 'orbital' | 'walking' | 'pointerlock' | 'trackball',
    cssRendererEnabled?: boolean | '2D' | '3D' | 'DUAL',
    statsEnabled?: boolean,
    vrEnabled?: boolean
};

// TODO: Define a few of these more precisely.
// Some drawings share the same attributes while some other do not.
type DrawingData = {
    staticBoxes?: any[];
    movingMeshes?: any[];
    obstacleBoxes?: any[];
    worldMeshes?: any[];
    collision?: any;
    keyManager?: any;
    [key: string]: any;
};

export interface ThreeJSDrawingEventContext {
    camera: any;
    data: DrawingData;
    controls?: any;
    renderer: any;
    scene: any;
}

export interface ThreeJSDrawingsMap {
    [drawingName: string]: {
        drawing: ThreeJSDrawing;
        data: DrawingData;
        sceneConfig: SceneConfig;
    };
}

export {
    ThreeJSDrawing,
};

export type {
    QueryOptions,
    SceneConfig,
    DrawingData,
};

export type ALL_CUBE_DEFS = { [key: string]: any };
