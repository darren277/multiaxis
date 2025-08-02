import { Action } from './anatomyActions'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type ActionType = {
    [key: string]: Action | Action[]
}

// keymap – use `event.code`, not `key`, so layout is stable
export const KEYMAP: Record<
    string,
    Action | Action[] | ActionType | ActionType[]
> = {
    // NUM-pad cameras
    Numpad1: Action.viewFront,
    Numpad3: Action.viewRight,
    Numpad7: Action.viewTop,
    // with Ctrl = opposite side
    'ControlLeft+Numpad1': Action.viewBack,
    'ControlLeft+Numpad3': Action.viewLeft,
    'ControlLeft+Numpad7': Action.viewBottom,

    // Orbit (Blender’s 4/6/8/2)
    Numpad4: Action.orbitLeft,
    Numpad6: Action.orbitRight,
    Numpad8: Action.orbitUp,
    Numpad2: Action.orbitDown,

    // Zoom (+/–) & mouse wheel fall straight through OrbitControls
    NumpadAdd: Action.zoomIn,
    NumpadSubtract: Action.zoomOut,

    // Slash ⇒ local view in Blender → we’ll “isolate”
    NumpadDivide: Action.isolate,
    Slash: Action.isolate,

    // Z cycles shading in Blender; here we give two quick toggles
    KeyZ: [Action.toggleWire, Action.toggleXray], // press once/twice

    // Home = frame all
    Home: Action.frameAll,
    // Period (.) = frame selection
    NumpadDecimal: Action.frameSelection,

    // Your own anatomy-system toggles (1–9)
    Digit1: Action.toggleSystem,
    Digit2: Action.toggleSystem,
    // ...
}

export function initAnatomyControls(
    scene: THREE.Scene,
    raycastFromMouse: () => THREE.Intersection | null,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    systems: THREE.Object3D[], // skeletal, muscular, …
) {
    const controls = new OrbitControls(camera, renderer.domElement)
    const target = new THREE.Vector3() // shared temp

    let wireframe = false
    let xray = false
    let isolatedObj: THREE.Object3D | null = null

    function execute(action: Action, keyEvt?: KeyboardEvent) {
        switch (action) {
            /* ───── Camera presets ───── */
            case 'viewFront':
                camera.position.set(0, 0, +5)
                break
            case 'viewBack':
                camera.position.set(0, 0, -5)
                break
            case 'viewRight':
                camera.position.set(+5, 0, 0)
                break
            case 'viewLeft':
                camera.position.set(-5, 0, 0)
                break
            case 'viewTop':
                camera.position.set(0, +5, 0)
                break
            case 'viewBottom':
                camera.position.set(0, -5, 0)
                break

            /* ───── Orbit & pan fall back to OrbitControls keys
             * We only need to override if we want num-pad duplication ── */
            case 'orbitLeft':
                ;(controls as any).rotateLeft(Math.PI / 12)
                break
            case 'orbitRight':
                ;(controls as any).rotateLeft(-Math.PI / 12)
                break
            case 'orbitUp':
                ;(controls as any).rotateUp(Math.PI / 12)
                break
            case 'orbitDown':
                ;(controls as any).rotateUp(-Math.PI / 12)
                break

            case 'zoomIn':
                ;(controls as any).dollyIn(1.2)
                break
            case 'zoomOut':
                ;(controls as any).dollyOut(1.2)
                break

            /* ───── Framing ───── */
            case 'frameAll':
                controls.target.set(0, 0, 0)
                camera.lookAt(controls.target)
                break
            case 'frameSelection':
                // If you keep track of a selected object, compute its bounding box → target
                break

            /* ───── Visibility helpers ───── */
            case 'toggleWire':
                wireframe = !wireframe
                scene.traverse((obj) => {
                    if ((obj as THREE.Mesh).isMesh) {
                        const m = (obj as THREE.Mesh).material as THREE.Material
                        if ('wireframe' in m) (m as any).wireframe = wireframe
                    }
                })
                break

            case 'toggleXray':
                xray = !xray
                scene.traverse((obj) => {
                    if ((obj as THREE.Mesh).isMesh) {
                        const material = (obj as THREE.Mesh).material
                        if (material instanceof THREE.Material) {
                            material.transparent = xray
                            material.opacity = xray ? 0.3 : 1.0
                        } else if (Array.isArray(material)) {
                            material.forEach((mat) => {
                                if (mat instanceof THREE.Material) {
                                    mat.transparent = xray
                                    mat.opacity = xray ? 0.3 : 1.0
                                }
                            })
                        }
                    }
                })
                break

            case 'isolate':
                if (!isolatedObj && keyEvt?.shiftKey) return // maybe shift-slash == un-isolate
                if (isolatedObj) {
                    systems.forEach((s) => (s.visible = true))
                    isolatedObj = null
                } else {
                    const pick = raycastFromMouse() // your own ray-picker
                    isolatedObj = pick?.object ?? null
                    systems.forEach((s) => (s.visible = s === isolatedObj))
                }
                break

            case 'toggleSystem': {
                // Map digit to system index
                const idx = parseInt(keyEvt!.code.slice(-1)) - 1
                if (systems[idx]) systems[idx].visible = !systems[idx].visible
                break
            }
        }
        controls.update()
    }

    /* ───── Key dispatcher ───── */
    window.addEventListener('keydown', (evt) => {
        const combo =
            (evt.ctrlKey ? 'ControlLeft+' : '') +
            (evt.shiftKey ? 'ShiftLeft+' : '') +
            evt.code
        const act = KEYMAP[combo] ?? KEYMAP[evt.code]
        if (!act) return
        ;(Array.isArray(act) ? act : [act]).forEach((a) =>
            execute(a as Action, evt),
        )
        evt.preventDefault()
    })

    return controls
}
