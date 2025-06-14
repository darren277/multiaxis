// Is this one more optimal than the other one?
export function readDataSelected(): string | undefined {
    const el = document.querySelector<HTMLMetaElement>('meta[name="data_selected"]');
    return el?.content;
}

export function readDataSelectedOrDefault(defaultValue: string): string {
    const dataSelectedMeta = document.querySelector('meta[name="data_selected"]');
    if (!dataSelectedMeta) {
        console.error('Meta tag "data_selected" not found.');
        return;
    }

    const dataSelected = (dataSelectedMeta as HTMLMetaElement).content;
    if (!dataSelected) {
        console.warn('No data selected, using default data.');
    }
    return dataSelected || defaultValue;
}

export function parseDebugFlag(query: QueryOptions, buildFlag: boolean): boolean {
    return buildFlag || query.debug === true;
}
