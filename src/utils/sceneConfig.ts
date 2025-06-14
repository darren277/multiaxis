/*
if (queryOptions) {
        if (queryOptions.controls && queryOptions.controls === 'walking') {
            sceneConfig.controller = 'walking';
        }
        if (queryOptions.prev) {
            // TODO: use a detailed lookup map defined elsewhere...
            // override sceneConfig.startPosition
            if (queryOptions.prev === 'town') {
                sceneConfig.startPosition = { x: 0, y: 10, z: -80 };
            }
        }
    }
*/

export function buildSceneConfig(
    defaults: SceneConfig,
    drawingCfg: Partial<SceneConfig> | undefined,
    query: QueryOptions
): SceneConfig {
    let cfg = { ...defaults, ...(drawingCfg ?? {}) };

    if (query.controls === 'walking') cfg.controller = 'walking';
    if (query.prev === 'town') cfg.startPosition = { x: 0, y: 10, z: -80 };

    return cfg;
}
