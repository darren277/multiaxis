/*
// Convert sceneElements to OverlayElement[] if necessary
const overlayElements = (threejsDrawing.sceneElements ?? []).map((el: any) => ({
    tagName: el.tagName ?? 'div',
    className: el.className,
    id: el.id,
    attrs: el.attrs
}));
*/

import { OverlayElement } from '../config/sceneSetup'

export function toOverlayElements(raw: any[] = []): OverlayElement[] {
    return raw.map((el) => ({
        tagName: el.tagName ?? 'div',
        className: el.className,
        id: el.id,
        attrs: el.attrs,
    }))
}
