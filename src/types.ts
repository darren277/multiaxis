import type { ThreeJSDrawing } from './threejsDrawing.d.ts';

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

export {
    ThreeJSDrawing
};

export type {
    QueryOptions,
    SceneConfig
};
