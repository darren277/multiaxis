import { contentLoadedCallback } from './utils/contentLoadedCallbackV1';

import { ThreeJSDrawing } from './types';
import { REVISION } from 'three';
console.log('Three.js version (main):', REVISION);
import { THREEJS_DRAWINGS } from './drawings';
import type { ThreeJSDrawingsMap } from './types';

// TODO: Make these both env vars...
const DEBUG = false;
const INCLUDE_LOCAL = false;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("👀 Available drawings in THREEJS_DRAWINGS:", THREEJS_DRAWINGS);

    const drawingNameMeta = document.querySelector('meta[name="threejs_drawing_name"]');
    if (!drawingNameMeta) {
        console.error('Meta tag "threejs_drawing_name" not found.');
        return;
    }
    const drawingName = (drawingNameMeta as HTMLMetaElement).content;

    try {
        // ignore for now
        const drawingLoader = (THREEJS_DRAWINGS as unknown as ThreeJSDrawingsMap)[drawingName];
        if (!drawingLoader) {
            console.error(`No drawing found for ${drawingName}`);
            return;
        }
        console.log(`Loading drawing: ${drawingName}`, drawingLoader);
        
        if (typeof drawingLoader !== 'function') {
            console.error(`Drawing loader for ${drawingName} is not a function.`);
            return;
        }
        // @ts-ignore-next-line
        const drawing = await drawingLoader();
        contentLoadedCallback(drawingName, drawing as unknown as ThreeJSDrawing);
    } catch (error) {
        console.warn(`Error loading drawing ${drawingName}:`, error);
        if (INCLUDE_LOCAL) {
            console.log('Trying local drawings...');
            import('./drawings_local.js').then(({ LOCAL_THREEJS_DRAWINGS }) => {
                const localDrawing: (() => Promise<ThreeJSDrawing>) | undefined = (LOCAL_THREEJS_DRAWINGS as unknown as Record<string, () => Promise<ThreeJSDrawing>>)[drawingName];
                if (!localDrawing) {
                    console.error(`No local drawing found for ${drawingName}`);
                    return;
                }
                if (localDrawing) {
                    localDrawing().then((threejsDrawing: ThreeJSDrawing) => {
                        contentLoadedCallback(drawingName, threejsDrawing);
                    });
                } else {
                    console.error(`No drawing found for ${drawingName}`);
                }
            }).catch(error => {
                console.error('Error loading local drawings:', error);
            });
        } else {
            console.error(`No drawing found for ${drawingName} and INCLUDE_LOCAL is false.`);
        }
    }
})
