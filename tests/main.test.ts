import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const myDrawingSpy = vi.fn().mockResolvedValue({ local: true });
const loadLocalSpy = vi.fn().mockResolvedValue({ myDrawing: myDrawingSpy });

vi.mock('../src/utils/loadLocal', () => ({
    loadLocalDrawings: loadLocalSpy
}));

vi.mock('../src/utils/contentLoadedCallback', () => ({
    // a spy for our callback
    contentLoadedCallback: vi.fn()
}));

vi.mock('../drawings_local', () => {
    // By throwing in the factory, we simulate a failed import.
    throw new Error('Simulated import failure');
});

import { loadDrawingName, onContentLoaded, Flags } from '../src/main';
import * as drawings from '../src/drawings';
import { contentLoadedCallback } from '../src/utils/contentLoadedCallback';

describe('loadDrawingName', () => {
    let metaElement: HTMLMetaElement;

    beforeEach(() => {
        metaElement = document.createElement('meta');
        metaElement.name = 'threejs_drawing_name';
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
        const mockCallback = vi.fn();

        beforeEach(() => {
        metaElement = document.createElement('meta');
        metaElement.name = 'threejs_drawing_name';
        metaElement.content = 'mockDrawing';
        document.head.appendChild(metaElement);

        // @ts-ignore
        global.THREEJS_DRAWINGS = {
            mockDrawing: vi.fn().mockResolvedValue({ drawing: 'example' }),
        };

        // @ts-ignore
        global.contentLoadedCallback = mockCallback;

        // @ts-ignore
        global.INCLUDE_LOCAL = false;
    });

    afterEach(() => {
        document.head.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('should call the drawing loader and invoke contentLoadedCallback', async () => {
        await onContentLoaded();
        expect(global.THREEJS_DRAWINGS.mockDrawing).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalledWith('mockDrawing', { drawing: 'example' });
    });

    it('should log and exit if no loader is found for drawingName', async () => {
        metaElement.content = 'nonexistent';
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        // @ts-ignore
        global.THREEJS_DRAWINGS = {};
        await onContentLoaded();
        expect(consoleError).toHaveBeenCalledWith('No drawing found for nonexistent');
    });

    it('should fall back to local drawing if INCLUDE_LOCAL is true and original fails', async () => {
        const fallbackDrawing = { drawing: 'local' };

        // @ts-ignore
        global.THREEJS_DRAWINGS = {
            mockDrawing: vi.fn().mockRejectedValue(new Error('fail')),
        };

        // @ts-ignore
        global.INCLUDE_LOCAL = true;

        vi.stubGlobal('import', vi.fn(() =>
            Promise.resolve({
                LOCAL_THREEJS_DRAWINGS: {
                    mockDrawing: () => Promise.resolve(fallbackDrawing),
                },
            })
        ));

        await onContentLoaded();
        expect(mockCallback).toHaveBeenCalledWith('mockDrawing', fallbackDrawing);
    });

    it('should log error if both global and local fail', async () => {
        // @ts-ignore
        global.THREEJS_DRAWINGS = {
            mockDrawing: vi.fn().mockRejectedValue(new Error('fail')),
        };

        // @ts-ignore
        global.INCLUDE_LOCAL = true;

        vi.stubGlobal('import', vi.fn(() => Promise.reject(new Error('import failed'))));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        await onContentLoaded();

        expect(consoleError).toHaveBeenCalledWith('Error loading local drawings:', expect.any(Error));
    });
});