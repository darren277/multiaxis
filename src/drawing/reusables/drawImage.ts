import * as THREE from 'three'

const SCREEN_WIDTH = window.innerWidth
const SCREEN_HEIGHT = window.innerHeight

let container

//imgPath = 'textures/758px-Canestra_di_frutta_(Caravaggio).jpg'
function drawImage(scene: THREE.Scene, imgPath: string) {
    //scene.background = new THREE.Color( 0x000000 );
    //scene.fog = new THREE.Fog( 0x000000, 1500, 4000 );

    // GROUND

    const imageCanvas = document.createElement('canvas')
    const context = imageCanvas.getContext('2d')

    imageCanvas.width = imageCanvas.height = 128

    if (context) {
        context.fillStyle = '#444'
        context.fillRect(0, 0, 128, 128)

        context.fillStyle = '#fff'
        context.fillRect(0, 0, 64, 64)
        context.fillRect(64, 64, 64, 64)
    }

    const textureCanvas = new THREE.CanvasTexture(imageCanvas)
    textureCanvas.colorSpace = THREE.SRGBColorSpace
    textureCanvas.repeat.set(1000, 1000)
    textureCanvas.wrapS = THREE.RepeatWrapping
    textureCanvas.wrapT = THREE.RepeatWrapping

    const materialCanvas = new THREE.MeshBasicMaterial({ map: textureCanvas })

    const geometry = new THREE.PlaneGeometry(100, 100)

    const meshCanvas = new THREE.Mesh(geometry, materialCanvas)
    meshCanvas.rotation.x = -Math.PI / 2
    meshCanvas.scale.set(1000, 1000, 1000)

    // PAINTING

    const callbackPainting = function () {
        const image = texturePainting.image

        scene.add(meshCanvas)

        const geometry = new THREE.PlaneGeometry(100, 100)
        const mesh = new THREE.Mesh(geometry, materialPainting)

        addPainting(scene, mesh)

        function addPainting(zscene: THREE.Scene, zmesh: THREE.Mesh) {
            zmesh.scale.x = image.width / 100
            zmesh.scale.y = image.height / 100

            zscene.add(zmesh)

            const meshFrame = new THREE.Mesh(
                geometry,
                new THREE.MeshBasicMaterial({ color: 0x000000 }),
            )
            meshFrame.position.z = -10.0
            meshFrame.scale.x = (1.1 * image.width) / 100
            meshFrame.scale.y = (1.1 * image.height) / 100
            zscene.add(meshFrame)

            const meshShadow = new THREE.Mesh(
                geometry,
                new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    opacity: 0.75,
                    transparent: true,
                }),
            )
            meshShadow.position.y = (-1.1 * image.height) / 2
            meshShadow.position.z = (-1.1 * image.height) / 2
            meshShadow.rotation.x = -Math.PI / 2
            meshShadow.scale.x = (1.1 * image.width) / 100
            meshShadow.scale.y = (1.1 * image.height) / 100
            zscene.add(meshShadow)

            const floorHeight = (-1.117 * image.height) / 2
            //meshCanvas.position.y = meshCanvas2.position.y = floorHeight;
        }
    }

    const texturePainting = new THREE.TextureLoader().load(
        imgPath,
        callbackPainting,
    )

    const materialPainting = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: texturePainting,
    })

    texturePainting.colorSpace = THREE.SRGBColorSpace
    texturePainting.minFilter = texturePainting.magFilter = THREE.LinearFilter
    texturePainting.mapping = THREE.UVMapping
}

export { drawImage }
