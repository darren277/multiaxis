export async function loadLocalDrawings() {
    return import('../drawings_local.js')
        .then((m) => m.LOCAL_THREEJS_DRAWINGS)
        .catch((err) => {
            console.error('Error loading local drawings:', err)
            return null
        })
}
