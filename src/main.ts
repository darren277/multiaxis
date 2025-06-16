import { contentLoadedCallback } from './utils/contentLoadedCallback';

import { ThreeJSDrawing } from './types';
import { REVISION } from 'three';
console.log('Three.js version (main):', REVISION);
import { THREEJS_DRAWINGS } from './drawings';
import type { ThreeJSDrawingsMap } from './types';

// TODO: Make these both env vars...
export const DEBUG = false;
export const Flags = { includeLocal: false };

export function loadDrawingName() {
    const drawingNameMeta = document.querySelector('meta[name="threejs_drawing_name"]');
    if (!drawingNameMeta) {
        console.error('Meta tag "threejs_drawing_name" not found.');
        return;
    }
    const drawingName = (drawingNameMeta as HTMLMetaElement).content;
    if (!drawingName) {
        console.error('No drawing name found in meta tag.');
        return;
    }

    console.log(`Drawing name loaded from meta tag: ${drawingName}`);

    return drawingName;
};

export async function onContentLoaded() {
    console.log("👀 Available drawings in THREEJS_DRAWINGS:", THREEJS_DRAWINGS);

    const drawingName = loadDrawingName();

    if (!drawingName) {
        // Error already logged in loadDrawingName
        return;
    }

    try {
        const drawingLoader = (THREEJS_DRAWINGS as unknown as ThreeJSDrawingsMap)[drawingName] as unknown as (() => Promise<ThreeJSDrawing>);
        if (!drawingLoader) {
            console.error(`No drawing found for ${drawingName}`);
            return;
        }
        console.log(`Loading drawing: ${drawingName}`, drawingLoader);

        if (typeof drawingLoader !== 'function') {
            console.error(`Drawing loader for ${drawingName} is not a function.`);
            return;
        }
        
        const drawing = await drawingLoader();
        contentLoadedCallback(drawingName, drawing as ThreeJSDrawing);
    } catch (error) {
        console.warn(`Error loading drawing ${drawingName}:`, error);
        if (Flags.includeLocal) {
            console.log('Trying local drawings...');
            const { loadLocalDrawings } = await import('./utils/loadLocal');
            const localMap = await loadLocalDrawings();
            if (!localMap) return;
            const localDrawing: (() => Promise<ThreeJSDrawing>) | undefined = (localMap as unknown as Record<string, () => Promise<ThreeJSDrawing>>)[drawingName];
            if (!localDrawing) {
                console.error(`No local drawing found for ${drawingName}`);
                return;
            }
            localDrawing().then((threejsDrawing: ThreeJSDrawing) => {
                contentLoadedCallback(drawingName, threejsDrawing);
            });
        } else {
            console.error(`No drawing found for ${drawingName} and INCLUDE_LOCAL is false.`);
        }
    }
}

document.addEventListener('DOMContentLoaded', onContentLoaded, false);
