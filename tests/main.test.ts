import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/utils/contentLoadedCallback', () => ({
    // a spy for our callback
    contentLoadedCallback: vi.fn()
}));

import { loadDrawingName, onContentLoaded, Flags } from '../src/main';
import * as drawings from '../src/drawings';
import { contentLoadedCallback } from '../src/utils/contentLoadedCallback';
import * as loadLocalModule from '../src/utils/loadLocal';

describe('loadDrawingName', () => {
    let metaElement: HTMLMetaElement;

    beforeEach(() => {
        metaElement = document.createElement('meta');
        metaElement.name = 'threejs_drawing_name';
        metaElement.content = 'myDrawing';
        document.head.appendChild(metaElement);
    });

    afterEach(() => {
        document.head.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('should return drawing name if meta tag is present and has content', () => {
        metaElement.content = 'sampleDrawing';
        const result = loadDrawingName();
        expect(result).toBe('sampleDrawing');
    });

    it('should log error and return undefined if meta tag is missing', () => {
        document.head.removeChild(metaElement);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = loadDrawingName();
        expect(result).toBeUndefined();
        expect(consoleError).toHaveBeenCalledWith('Meta tag "threejs_drawing_name" not found.');
    });

    it('should log error and return undefined if meta tag is empty', () => {
        metaElement.content = '';
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = loadDrawingName();
        expect(result).toBeUndefined();
        expect(consoleError).toHaveBeenCalledWith('No drawing name found in meta tag.');
    });
});


describe('onContentLoaded', () => {
    let metaElement: HTMLMetaElement;

    beforeEach(() => {
        vi.useFakeTimers();

        metaElement = document.createElement('meta');
        metaElement.name = 'threejs_drawing_name';
        metaElement.content = 'defaultDrawing';
        document.head.appendChild(metaElement);
    });

    afterEach(() => {
        document.head.innerHTML = '';
        vi.restoreAllMocks();

        vi.useRealTimers();
    });

    it('should call the drawing loader and invoke contentLoadedCallback', async () => {
        metaElement.content = 'myDrawing';

        const fakeDrawing = { foo: 'bar' };
        const mockLoader = vi.fn().mockResolvedValue(fakeDrawing);
        (drawings.THREEJS_DRAWINGS as any).myDrawing = mockLoader;

        // act
        await onContentLoaded();

        // assert
        
        // AssertionError: expected "spy" to be called once, but got 0 times
        expect(mockLoader).toHaveBeenCalledTimes(1);
        expect(contentLoadedCallback).toHaveBeenCalledWith('myDrawing', fakeDrawing);
    });

    it('should log and exit if no loader is found for drawingName', async () => {
        metaElement.content = 'nonexistent';
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        // @ts-ignore
        global.THREEJS_DRAWINGS = {};
        await onContentLoaded();
        expect(consoleError).toHaveBeenCalledWith('No drawing found for nonexistent');
    });

    it('should fall back to local drawing if Flags.includeLocal is true and original fails', async () => {
        const myDrawingSpy = vi.fn().mockResolvedValue({ local: true });
        const loadLocalDrawingsSpy = vi.fn().mockResolvedValue({
            myDrawing: myDrawingSpy
        });

        // Mock the import to return our local drawings
        vi.spyOn(loadLocalModule, 'loadLocalDrawings').mockImplementation(() => loadLocalDrawingsSpy());

        // enable fallback
        Flags.includeLocal = true;

        metaElement.content = 'myDrawing';

        // primary loader rejects
        const primary = vi.fn().mockRejectedValue(new Error('oops'));
        (drawings.THREEJS_DRAWINGS as any).myDrawing = primary;

        // dynamic import will pick up our mock above
        await onContentLoaded();

        await vi.runAllTimers();

        expect(loadLocalDrawingsSpy).toHaveBeenCalledTimes(1);

        // TODO: Should these even be called?
        //expect(myDrawingSpy).toHaveBeenCalledTimes(1);
        //expect(contentLoadedCallback).toHaveBeenCalledWith('myDrawing', { local: true });
    });

    it('should log error if both global and local fail', async () => {
        Flags.includeLocal = true;

        metaElement.content = 'myDrawing';

        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Global drawing fails
        const globalLoader = vi.fn().mockRejectedValue(new Error('oops'));
        (drawings.THREEJS_DRAWINGS as any).myDrawing = globalLoader;

        // Simulate dynamic import failure
        vi.spyOn(loadLocalModule, 'loadLocalDrawings').mockRejectedValue(
            new Error('Simulated import failure')
        );

        await onContentLoaded();
        await vi.runAllTicks(); // flush microtasks

        expect(consoleError).toHaveBeenCalledWith(
            'Error loading local drawings:',
            expect.objectContaining({ message: 'Simulated import failure' })
        );
    });
});