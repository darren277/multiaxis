import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We will import the real module but mock pieces of THREE that talk to the network / DOM.

// --- Mock THREE ------------------------------------------------------------
// We only need a handful of classes for these tests.  Everything else can stay as-is.
import * as THREE from 'three';

declare module 'three' {
    // Patch minimal typings for our mock so TS is happy.
    interface FileLoader {
        loadAsync(path: string): Promise<string | ArrayBuffer>;
    }
}

// Mock WebGLRenderer to avoid DOM dependencies
class WebGLRenderer {
    setSize(width: number, height: number): void {}
    render(scene: Scene, camera: THREE.Camera): void {}
}

// Keep reference so we can restore later
const OriginalFileLoader = THREE.FileLoader;

// --- System under test ------------------------------------------------------
import {
    determineLabelCoordinates,
    pixelToWorldUnits,
    parseQueryParams,
    prepareDrawingContext,
    loadDataSource,
    drawTestCube,
} from '../src/config/utils';
import { Scene } from 'three/src/Three.WebGPU.Nodes.js';

// ---------------------------------------------------------------------------

describe('utils.ts', () => {
    // ===== determineLabelCoordinates ========================================
    it('determineLabelCoordinates offsets X by 2×radius', () => {
        const result = determineLabelCoordinates(1, 2, 3, 0.5);
        expect(result).toEqual([1 + 1 /*2*0.5*/, 2, 3]);
    });

    // ===== pixelToWorldUnits ==================================================
    it('pixelToWorldUnits converts pixel size into world units using camera FOV', () => {
        // Mock innerHeight so test is deterministic
        const originalInnerHeight = globalThis.innerHeight;
        (globalThis as any).innerHeight = 1000;

        const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
        const distance = 10;
        const pixelSize = 100;

        const expectedScreenHeight = 2 * Math.tan((60 * Math.PI) / 180 / 2) * distance;
        const expectedPixelHeight = expectedScreenHeight / 1000;

        const result = pixelToWorldUnits(pixelSize, distance, camera);
        expect(result).toBeCloseTo(pixelSize * expectedPixelHeight, 6);

        // restore
        (globalThis as any).innerHeight = originalInnerHeight;
    });

    // ===== parseQueryParams ===================================================
    it('parseQueryParams parses nav, controls, debug, and prev correctly', () => {
        const qs = '?nav=true&controls=walking&debug=false&prev=town';
        const parsed = parseQueryParams(qs);
        expect(parsed).toEqual({ nav: true, controls: 'walking', debug: false, prev: 'town' });
    });

    // ===== prepareDrawingContext =============================================
    it('prepareDrawingContext populates threejsDrawing.data with scene references', async () => {
        const dummyScene = new THREE.Scene();
        const dummyCamera = new THREE.PerspectiveCamera();
        const dummyRenderer = new WebGLRenderer();

        const threejsDrawing: any = {
            name: 'testDrawing',
            data: {},
        };

        await prepareDrawingContext(
            threejsDrawing,
            dummyScene,
            dummyCamera,
            dummyRenderer as THREE.WebGLRenderer,
            { dummyControl: true }
        );

        expect(threejsDrawing.data.scene).toBe(dummyScene);
        expect(threejsDrawing.data.camera).toBe(dummyCamera);
        expect(threejsDrawing.data.renderer).toBe(dummyRenderer);
    });

    // ===== loadDataSource =====================================================
    describe('loadDataSource', () => {
        const mockJSON = { hello: 'world' };
        const encoded = JSON.stringify(mockJSON);

        let loadAsyncSpy: any;

        beforeEach(() => {
            // Spy on THREE.FileLoader.prototype.loadAsync for deterministic IO‑less tests
            loadAsyncSpy = vi.spyOn(THREE.FileLoader.prototype, 'loadAsync').mockImplementation((path: string) => {
                if (!path.endsWith('.json')) {
                    return Promise.reject(new Error('invalid path'));
                }
                return Promise.resolve(encoded);
            });
        });

        afterEach(() => {
            // restore original method
            loadAsyncSpy.mockRestore();
        });

    it('loadDataSource returns parsed JSON from mock loader', async () => {
        const data = await loadDataSource('example');
        expect(data).toEqual(mockJSON);
    });

    it('loadDataSource throws when given invalid src', async () => {
        await expect(loadDataSource('')).rejects.toThrow();
    });
    });

    // ===== drawTestCube =======================================================
    it('drawTestCube adds a cube mesh to the scene', () => {
        const scene = new THREE.Scene();
        expect(scene.children.length).toBe(0);
        drawTestCube(scene);
        expect(scene.children.length).toBe(1);
        expect(scene.children[0]).toBeInstanceOf(THREE.Mesh);
    });
});
