export function toOverlayElements(raw: any[] = []): OverlayElement[] {
    return raw.map(el => ({
        tagName: el.tagName ?? 'div',
        className: el.className,
        id: el.id,
        attrs: el.attrs,
    }));
}
