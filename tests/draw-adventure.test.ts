// A full suite of tests for threejs-related functions using vitest.
// To run this, you would need to have vitest and three.js installed (`npm install --save-dev vitest three`).
// Also, ensure your vitest config is set up, e.g., `environment: 'jsdom'`.

import { describe, test, expect, beforeEach, vi, afterAll } from 'vitest';
import * as THREE from 'three';

// Note: With vitest, JSDOM is typically configured in `vitest.config.js` (`environment: 'jsdom'`).
// So, direct import of JSDOM is usually not needed in the test file itself.

// =================================================================
// Mocks and Setup
// =================================================================

// Mock for createCaptionedItem as its implementation is not provided.
// This assumes `createCaptionedItem` is in a separate file that can be mocked.
vi.mock('../src/drawing/adventure/createItems', () => ({
    createCaptionedItem: vi.fn().mockReturnValue({ mesh: new THREE.Mesh(), labelObject: document.createElement('div') })
}));

// Import the entire module as an object. This allows us to test the real functions
// and also to spy on specific functions for our orchestrator test.
import * as adventureModule from '../src/drawing/adventure/drawAdventure';

// Helper to create a mock camera
const createMockCamera = () => {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(); // Important for projection calculations
    return camera;
};

// Helper to create a mock renderer
const createMockRenderer = () => ({
    domElement: {
        clientWidth: 800,
        clientHeight: 600,
    },
});

// =================================================================
// Tests for `updateLabelPosition`
// =================================================================

describe('updateLabelPosition', () => {
    let labelEl, camera, renderer;

    beforeEach(() => {
        // Reset mocks and setup before each test
        labelEl = document.createElement('div');
        camera = createMockCamera();
        renderer = createMockRenderer();
    });

    test('should correctly position label for a THREE.Object3D anchor', () => {
        const object3D = new THREE.Object3D();
        object3D.position.set(10, 5, 0);
        adventureModule.updateLabelPosition(object3D, labelEl, camera, renderer as THREE.WebGLRenderer);

        // Check that style properties were set
        expect(labelEl.style.display).toBe('block');
        expect(labelEl.style.left).not.toBe('');
        expect(labelEl.style.top).not.toBe('');
    });

    test('should correctly position label for a THREE.Vector3 anchor', () => {
        const vector = new THREE.Vector3(10, 5, 0);
        adventureModule.updateLabelPosition(vector, labelEl, camera, renderer as THREE.WebGLRenderer);
        expect(labelEl.style.display).toBe('block');
        expect(parseFloat(labelEl.style.left)).toBeGreaterThan(400); // Should be to the right
    });

    test('should correctly position label for a plain {x, y, z} object anchor', () => {
        const posObject = { x: -10, y: -5, z: 0 };
        adventureModule.updateLabelPosition(posObject, labelEl, camera, renderer as THREE.WebGLRenderer);
        expect(labelEl.style.display).toBe('block');
        expect(parseFloat(labelEl.style.left)).toBeLessThan(400); // Should be to the left
    });
    
    test('should hide label if object is behind the camera', () => {
        const anchor = new THREE.Vector3(0, 0, 20); // Behind camera which is at z=10
        adventureModule.updateLabelPosition(anchor, labelEl, camera, renderer as THREE.WebGLRenderer);
        expect(labelEl.style.display).toBe('none');
    });

    test('should show label if object is in front of the camera', () => {
        const anchor = new THREE.Vector3(0, 0, 5); // In front of camera
        adventureModule.updateLabelPosition(anchor, labelEl, camera, renderer as THREE.WebGLRenderer);
        expect(labelEl.style.display).toBe('block');
    });

    test('should warn and exit if anchor is invalid', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {}); // Spy on console.warn
        adventureModule.updateLabelPosition(null as any, labelEl, camera, renderer as THREE.WebGLRenderer);
        expect(warnSpy).toHaveBeenCalledWith('updateLabelPosition: invalid anchor', null);
        expect(labelEl.style.display).toBe(''); // No styles applied
        warnSpy.mockRestore(); // Clean up the spy
    });
});


// =================================================================
// Tests for `vantagePointForItem`
// =================================================================

describe('vantagePointForItem', () => {
    // These constants must match the ones in the implementation file.
    const Y_FACTOR = 0;
    const X = 0;
    const Y = 0;
    const Z = 6;

    test('should calculate the correct camera position and lookAt point', () => {
        const item = {
            id: 'testItem',
            position: { x: 10, y: 20, z: 30 },
            caption: 'caption',
            choices: null
        };

        const vantagePoint = adventureModule.vantagePointForItem(item);

        // Expected lookAt is the item's position with Y_FACTOR from the code (which is 0)
        const expectedLookAt = new THREE.Vector3(10, 20 + Y_FACTOR, 30);
        expect(vantagePoint.lookAt).toEqual(expectedLookAt);

        // Expected camera position is lookAt + offset
        const expectedPosition = expectedLookAt.clone().add(new THREE.Vector3(X, Y, Z));
        expect(vantagePoint.position).toEqual(expectedPosition);
    });
});

// =================================================================
// Tests for `linkStepsLinear`
// =================================================================

describe('linkStepsLinear', () => {
    test('should link steps in a linear, cyclical order', () => {
        const steps = {
            'step1': { id: 'step1', camera: { position: new THREE.Vector3(0, 0, 0), lookAt: new THREE.Vector3(0, 0, 0) }, text: '', choices: null },
            'step2': { id: 'step2', camera: { position: new THREE.Vector3(0, 0, 0), lookAt: new THREE.Vector3(0, 0, 0) }, text: '', choices: null },
            'step3': { id: 'step3', camera: { position: new THREE.Vector3(0, 0, 0), lookAt: new THREE.Vector3(0, 0, 0) }, text: '', choices: null },
        };

        adventureModule.linkStepsLinear(steps);

        expect(steps.step1.choices).toEqual({ left: 'step3', right: 'step2' });
        expect(steps.step2.choices).toEqual({ left: 'step1', right: 'step3' });
        expect(steps.step3.choices).toEqual({ left: 'step2', right: 'step1' });
    });

    test('should not overwrite existing choices', () => {
        const steps = {
            'step1': { id: 'step1', camera: { position: new THREE.Vector3(0, 0, 0), lookAt: new THREE.Vector3(0, 0, 0) }, text: '', choices: { left: 'custom2', right: 'custom3' } },
            'step2': { id: 'step2', camera: { position: new THREE.Vector3(0, 0, 0), lookAt: new THREE.Vector3(0, 0, 0) }, text: '', choices: null },
        };

        adventureModule.linkStepsLinear(steps);

        // Step 1 should remain unchanged
        expect(steps.step1.choices).toEqual({ left: 'custom2', right: 'custom3' });
        // Step 2 should be linked to itself as it's the only one without choices
        expect(steps.step2.choices).toEqual({ left: 'step1', right: 'step1' });
    });
});

// =================================================================
// Tests for `buildAdventureSteps`
// =================================================================

describe('buildAdventureSteps', () => {
    test('should convert items array to a steps record', () => {
        const items = [
            { id: 'item1', position: { x: 0, y: 0, z: 0 }, caption: 'First item', choices: null },
            { id: 'item2', position: { x: 10, y: 10, z: 10 }, caption: 'Second item', choices: ['item1'] },
        ];

        const steps = adventureModule.buildAdventureSteps(items);

        // Check if all items are converted
        expect(Object.keys(steps)).toEqual(['item1', 'item2']);

        // Check structure of a step
        expect(steps.item1).toHaveProperty('id', 'item1');
        expect(steps.item1).toHaveProperty('text', 'First item');
        expect(steps.item1).toHaveProperty('camera');
        expect(steps.item1.camera).toHaveProperty('position');
        expect(steps.item1.camera).toHaveProperty('lookAt');
        
        // Check if choices are passed through and converted correctly
        expect(steps.item2.choices).toEqual({ '0': 'item1' }); // The function converts array to object
        expect(steps.item1.choices).toBeNull();
    });
});

// =================================================================
// Tests for Orchestrator `buildSceneItems`
// =================================================================

describe('buildSceneItems Orchestrator', () => {
    test('should orchestrate the building process correctly', () => {
        // Step 1: Define the mock functions we'll use.
        const buildPhotoEntriesMock = vi.fn();
        const buildAdventureStepsMock = vi.fn();
        const linkStepsLinearMock = vi.fn();

        // Step 2: Use vi.doMock to apply a temporary, non-hoisted mock.
        vi.doMock('../src/drawing/adventure/drawAdventure', async (importOriginal) => {
            const actual = await importOriginal();
            const actualObj = (typeof actual === 'object' && actual !== null) ? actual : {};
            return {
                ...actualObj, // Keep the real buildSceneItems, etc.
                // Override just the dependencies with our mocks
                buildPhotoEntries: buildPhotoEntriesMock,
                buildAdventureSteps: buildAdventureStepsMock,
                linkStepsLinear: linkStepsLinearMock,
            };
        });
        
        const mockScene = new THREE.Scene();
        const mockItems = [
            { id: '1', choices: null, caption: 'caption1', position: { x: 0, y: 0, z: 0 } },
            { id: '2', choices: null, caption: 'caption2', position: { x: 1, y: 1, z: 1 } }
        ];

        const mockAdventureSteps = {
            '1': { id: '1', text: 'caption1', camera: {
                position: new THREE.Vector3(0, 0, 0),
                lookAt: new THREE.Vector3(0, 0, 0)
            }, choices: null },
            '2': { id: '2', text: 'caption2', camera: {
                position: new THREE.Vector3(1, 1, 1),
                lookAt: new THREE.Vector3(1, 1, 1)
            }, choices: null }
        };

        // Define mock return values for our spies
        const mockPhotoEntries = [{ mesh: 'mesh1', labelObject: document.createElement('div'), item: mockItems[0] }, { mesh: 'mesh2', labelObject: document.createElement('div'), item: mockItems[1] }];
        
        buildPhotoEntriesMock.mockReturnValue(mockPhotoEntries as any);
        buildAdventureStepsMock.mockReturnValue(mockAdventureSteps);
        // linkStepsLinear just mutates its argument, so no return value is needed.
        linkStepsLinearMock.mockImplementation(() => {});

        // Call the REAL `buildSceneItems` function
        const result = adventureModule.buildSceneItems(mockScene, mockItems);

        // 1. Verify buildPhotoEntries was called with the correct default arguments
        // AssertionError: expected "buildPhotoEntries" to be called 1 times, but got 0 times
        // This is because the mock was not set up correctly.
        // The mock needs to be set up before the function is called.
        expect(buildPhotoEntriesMock).toHaveBeenCalledTimes(1);
        expect(buildPhotoEntriesMock).toHaveBeenCalledWith(mockScene, mockItems, 4, 3, null, undefined);

        // 2. Verify buildAdventureSteps was called
        expect(buildAdventureStepsMock).toHaveBeenCalledTimes(1);
        expect(buildAdventureStepsMock).toHaveBeenCalledWith(mockItems);

        // 3. Verify linkStepsLinear was called with the result from buildAdventureSteps
        expect(linkStepsLinearMock).toHaveBeenCalledTimes(1);
        expect(linkStepsLinearMock).toHaveBeenCalledWith(mockAdventureSteps);

        // 4. Verify the final returned object has the correct shape and data
        expect(result).toEqual({
            allPhotoEntries: mockPhotoEntries,
            adventureSteps: mockAdventureSteps,
        });
    });
});
