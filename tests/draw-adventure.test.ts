// A full suite of tests for threejs-related functions using vitest.
// To run this, you would need to have vitest and three.js installed (`npm install --save-dev vitest three`).
// Also, ensure your vitest config is set up, e.g., `environment: 'jsdom'`.

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';

// Note: With vitest, JSDOM is typically configured in `vitest.config.js` (`environment: 'jsdom'`).
// So, direct import of JSDOM is usually not needed in the test file itself.

// =================================================================
// Mocks and Setup
// =================================================================

// Mock for createCaptionedItem as its implementation is not provided.
// This assumes `createCaptionedItem` is in a separate file that can be mocked.
// e.g., vi.mock('./path/to/createCaptionedItem', () => ({ createCaptionedItem: vi.fn() }));
const createCaptionedItem = vi.fn(); 

// Let's assume the functions from the prompt are in `./your-module.js`
// We will mock this module for the orchestrator test later.
import { updateLabelPosition, vantagePointForItem, buildAdventureSteps, linkStepsLinear, buildSceneItems } from '../src/drawing/adventure/drawAdventure';

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
        updateLabelPosition(object3D, labelEl, camera, renderer);

        // Check that style properties were set
        expect(labelEl.style.display).toBe('block');
        expect(labelEl.style.left).not.toBe('');
        expect(labelEl.style.top).not.toBe('');
    });

    test('should correctly position label for a THREE.Vector3 anchor', () => {
        const vector = new THREE.Vector3(10, 5, 0);
        updateLabelPosition(vector, labelEl, camera, renderer);
        expect(labelEl.style.display).toBe('block');
        expect(parseFloat(labelEl.style.left)).toBeGreaterThan(400); // Should be to the right
    });

    test('should correctly position label for a plain {x, y, z} object anchor', () => {
        const posObject = { x: -10, y: -5, z: 0 };
        updateLabelPosition(posObject, labelEl, camera, renderer);
        expect(labelEl.style.display).toBe('block');
        expect(parseFloat(labelEl.style.left)).toBeLessThan(400); // Should be to the left
    });
    
    test('should hide label if object is behind the camera', () => {
        const anchor = new THREE.Vector3(0, 0, 20); // Behind camera which is at z=10
        updateLabelPosition(anchor, labelEl, camera, renderer);
        expect(labelEl.style.display).toBe('none');
    });

    test('should show label if object is in front of the camera', () => {
        const anchor = new THREE.Vector3(0, 0, 5); // In front of camera
        updateLabelPosition(anchor, labelEl, camera, renderer);
        expect(labelEl.style.display).toBe('block');
    });

    test('should warn and exit if anchor is invalid', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {}); // Spy on console.warn
        updateLabelPosition(null, labelEl, camera, renderer);
        expect(warnSpy).toHaveBeenCalledWith('updateLabelPosition: invalid anchor', null);
        expect(labelEl.style.display).toBe(''); // No styles applied
        warnSpy.mockRestore(); // Clean up the spy
    });
});


// =================================================================
// Tests for `vantagePointForItem`
// =================================================================

// Define constants used by the function from the original file
const Y_FACTOR = 1.0;
const X = 0;
const Y = 0;
const Z = 6; // Offset

describe('vantagePointForItem', () => {
    test('should calculate the correct camera position and lookAt point', () => {
        const item = {
            id: 'testItem',
            position: { x: 10, y: 20, z: 30 },
            caption: 'caption'
        };

        const vantagePoint = vantagePointForItem(item);

        // Expected lookAt is the item's position with Y_FACTOR
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
            'step1': { id: 'step1' },
            'step2': { id: 'step2' },
            'step3': { id: 'step3' },
        };

        linkStepsLinear(steps);

        expect(steps.step1.choices).toEqual({ left: 'step3', right: 'step2' });
        expect(steps.step2.choices).toEqual({ left: 'step1', right: 'step3' });
        expect(steps.step3.choices).toEqual({ left: 'step2', right: 'step1' });
    });

    test('should not overwrite existing choices', () => {
        const steps = {
            'step1': { id: 'step1', choices: { left: 'custom2', right: 'custom3' } },
            'step2': { id: 'step2' },
        };

        linkStepsLinear(steps);

        // Step 1 should remain unchanged
        expect(steps.step1.choices).toEqual({ left: 'custom2', right: 'custom3' });
        // Step 2 should be linked to itself as it's the only one without choices
        expect(steps.step2.choices).toEqual({ left: 'step2', right: 'step2' });
    });
});

// =================================================================
// Tests for `buildAdventureSteps`
// =================================================================

describe('buildAdventureSteps', () => {
    test('should convert items array to a steps record', () => {
        const items = [
            { id: 'item1', position: { x: 0, y: 0, z: 0 }, caption: 'First item' },
            { id: 'item2', position: { x: 10, y: 10, z: 10 }, caption: 'Second item', choices: { left: 'item1' } },
        ];

        const steps = buildAdventureSteps(items);

        // Check if all items are converted
        expect(Object.keys(steps)).toEqual(['item1', 'item2']);

        // Check structure of a step
        expect(steps.item1).toHaveProperty('id', 'item1');
        expect(steps.item1).toHaveProperty('text', 'First item');
        expect(steps.item1).toHaveProperty('camera');
        expect(steps.item1.camera).toHaveProperty('position');
        expect(steps.item1.camera).toHaveProperty('lookAt');
        
        // Check if choices are passed through
        expect(steps.item2.choices).toEqual({ left: 'item1' });
        expect(steps.item1.choices).toBeNull();
    });
});

// =================================================================
// Tests for Orchestrator `buildSceneItems`
// =================================================================

// Mock the dependencies for the orchestrator function.
// Note: The path './your-module' should point to the actual file.
vi.mock('./your-module', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual, // Import and retain default behavior for other functions
        buildPhotoEntries: vi.fn(),
        buildAdventureSteps: vi.fn(),
        linkStepsLinear: vi.fn(),
    };
});

describe('buildSceneItems', () => {
    beforeEach(() => {
        // Clear mock history before each test
        vi.clearAllMocks();
    });

    test('should orchestrate the building process correctly', async () => {
        // We need to re-import the mocked functions inside the test
        // or at the top level after the mock definition.
        const { buildPhotoEntries, buildAdventureSteps, linkStepsLinear, buildSceneItems } = await import('./your-module');
        
        const mockScene = new THREE.Scene();
        const mockItems = [{id: '1'}, {id: '2'}];
        
        // Mock return values
        const mockPhotoEntries = [{mesh: 'mesh1'}];
        const mockAdventureSteps = { '1': {}, '2': {} };
        
        buildPhotoEntries.mockReturnValue(mockPhotoEntries);
        buildAdventureSteps.mockReturnValue(mockAdventureSteps);

        const result = buildSceneItems(mockScene, mockItems);

        // 1. Verify buildPhotoEntries was called
        expect(buildPhotoEntries).toHaveBeenCalledWith(mockScene, mockItems, 4, 3, null, undefined);
        expect(buildPhotoEntries).toHaveBeenCalledTimes(1);

        // 2. Verify buildAdventureSteps was called
        expect(buildAdventureSteps).toHaveBeenCalledWith(mockItems);
        expect(buildAdventureSteps).toHaveBeenCalledTimes(1);
        
        // 3. Verify linkStepsLinear was called
        expect(linkStepsLinear).toHaveBeenCalledWith(mockAdventureSteps);
        expect(linkStepsLinear).toHaveBeenCalledTimes(1);

        // 4. Verify the final returned object
        expect(result).toEqual({
            allPhotoEntries: mockPhotoEntries,
            adventureSteps: mockAdventureSteps,
        });
    });
});
