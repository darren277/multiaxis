/* Adapted from https://github.com/mrdoob/three.js/blob/master/examples/physics_ammo_break.html */

import * as THREE from 'three'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import { ThreeJSDrawing } from '../threejsDrawing'

interface ConvexObjectBreaker {
    prepareBreakableObject: (
        object: THREE.Mesh,
        mass: number,
        velocity: THREE.Vector3,
        angularVelocity: THREE.Vector3,
        isStatic: boolean,
    ) => void
    subdivideByImpact: (
        object: THREE.Mesh,
        impactPoint: THREE.Vector3,
        impactNormal: THREE.Vector3,
        minSize: number,
        maxSize: number,
        maxMass: number,
    ) => THREE.Mesh[]
}

interface IAmmo {
    btDefaultMotionState: any
    (): Promise<any>
    btDefaultCollisionConfiguration: any
    btCollisionDispatcher: any
    btDbvtBroadphase: any
    btSequentialImpulseConstraintSolver: any
    btDiscreteDynamicsWorld: any
    btVector3: any
    btTransform: any
    btQuaternion: any
    btBoxShape: any
    btSphereShape: any
    btConvexHullShape: any
    btRigidBody: any
    btRigidBodyConstructionInfo: any
    btCollisionShape: any
    castObject: (object: any, type: any) => any
    btManifoldPoint: any
    btCollisionObject: any
}

let Ammo: IAmmo | null = null

//let Ammo: any; // Ammo.js will be loaded asynchronously
console.debug('Ammo.js loaded', Ammo)

const clock = new THREE.Clock()

const textureLoader = new THREE.TextureLoader()

const mouseCoords = new THREE.Vector2()
const raycaster = new THREE.Raycaster()
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 })

// Physics variables
const gravityConstant = 7.8
const margin = 0.05

// TODO: Replace this stub with a real implementation or import of ConvexObjectBreaker
const convexBreaker: ConvexObjectBreaker = {
    prepareBreakableObject: (
        object,
        mass,
        velocity,
        angularVelocity,
        isStatic,
    ) => {
        // Stub: Add your implementation here
        object.userData.mass = mass
        object.userData.velocity = velocity
        object.userData.angularVelocity = angularVelocity
        object.userData.breakable = true
    },
    subdivideByImpact: (
        object,
        impactPoint,
        impactNormal,
        minSize,
        maxSize,
        maxMass,
    ) => {
        // Stub: Add your implementation here
        // For now, just return an empty array to avoid runtime errors
        return []
    },
}

// Rigid bodies include all movable objects
const rigidBodies: THREE.Object3D[] = []

const pos = new THREE.Vector3()
const quat = new THREE.Quaternion()
let transformAux1: any
let tempBtVec3_1: any

const objectsToRemove: (THREE.Object3D | null)[] = []

const impactPoint = new THREE.Vector3()
const impactNormal = new THREE.Vector3()

function drawAmmo(scene: THREE.Scene, threejsDrawing: ThreeJSDrawing) {
    threejsDrawing.data.physicsWorld = null
    threejsDrawing.data.collisionConfiguration = null
    threejsDrawing.data.dispatcher = null
    threejsDrawing.data.broadphase = null
    threejsDrawing.data.solver = null

    for (let i = 0; i < 500; i++) {
        objectsToRemove[i] = null
    }

    if (Ammo) {
        Ammo().then(function (AmmoLib: any) {
            Ammo = AmmoLib

            initGraphics(scene)
            initPhysics(threejsDrawing)
            createObjects(scene, threejsDrawing.data.physicsWorld)
        })
    }
}

function initGraphics(scene: THREE.Scene) {
    const ambientLight = new THREE.AmbientLight(0xbbbbbb)
    scene.add(ambientLight)

    const light = new THREE.DirectionalLight(0xffffff, 3)
    light.position.set(-10, 18, 5)
    light.castShadow = true
    const d = 14
    light.shadow.camera.left = -d
    light.shadow.camera.right = d
    light.shadow.camera.top = d
    light.shadow.camera.bottom = -d

    light.shadow.camera.near = 2
    light.shadow.camera.far = 50

    light.shadow.mapSize.x = 1024
    light.shadow.mapSize.y = 1024

    scene.add(light)
}

function initPhysics(threejsDrawing: ThreeJSDrawing) {
    if (!Ammo) {
        console.error('Ammo.js not loaded')
        return
    }
    // Physics configuration
    threejsDrawing.data.collisionConfiguration =
        new Ammo.btDefaultCollisionConfiguration()
    threejsDrawing.data.dispatcher = new Ammo.btCollisionDispatcher(
        threejsDrawing.data.collisionConfiguration,
    )
    threejsDrawing.data.broadphase = new Ammo.btDbvtBroadphase()
    threejsDrawing.data.solver = new Ammo.btSequentialImpulseConstraintSolver()
    threejsDrawing.data.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
        threejsDrawing.data.dispatcher,
        threejsDrawing.data.broadphase,
        threejsDrawing.data.solver,
        threejsDrawing.data.collisionConfiguration,
    )
    ;(
        threejsDrawing.data.physicsWorld as IAmmo['btDiscreteDynamicsWorld']
    ).setGravity(new Ammo.btVector3(0, -gravityConstant, 0))

    transformAux1 = new Ammo.btTransform()
    tempBtVec3_1 = new Ammo.btVector3(0, 0, 0)
}

function createObject(
    scene: THREE.Scene,
    physicsWorld: any,
    mass: number,
    halfExtents: THREE.Vector3,
    pos: THREE.Vector3,
    quat: THREE.Quaternion,
    material: THREE.Material,
) {
    const object = new THREE.Mesh(
        new THREE.BoxGeometry(
            halfExtents.x * 2,
            halfExtents.y * 2,
            halfExtents.z * 2,
        ),
        material,
    )
    object.position.copy(pos)
    object.quaternion.copy(quat)
    convexBreaker.prepareBreakableObject(
        object,
        mass,
        new THREE.Vector3(),
        new THREE.Vector3(),
        true,
    )
    createDebrisFromBreakableObject(scene, physicsWorld, object)
}

function createObjects(scene: THREE.Scene, physicsWorld: any) {
    // Ground
    pos.set(0, -0.5, 0)
    quat.set(0, 0, 0, 1)
    const ground = createParalellepipedWithPhysics(
        scene,
        physicsWorld,
        40,
        1,
        40,
        0,
        pos,
        quat,
        new THREE.MeshPhongMaterial({ color: 0xffffff }),
    )
    ground.receiveShadow = true
    textureLoader.load('textures/grid.png', function (texture) {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(40, 40)
        ;(ground.material as THREE.MeshPhongMaterial).map = texture
        ;(ground.material as THREE.MeshPhongMaterial).needsUpdate = true
    })

    // Tower 1
    const towerMass = 1000
    const towerHalfExtents = new THREE.Vector3(2, 5, 2)
    pos.set(-8, 5, 0)
    quat.set(0, 0, 0, 1)
    createObject(
        scene,
        physicsWorld,
        towerMass,
        towerHalfExtents,
        pos,
        quat,
        createMaterial(0xb03014),
    )

    // Tower 2
    pos.set(8, 5, 0)
    quat.set(0, 0, 0, 1)
    createObject(
        scene,
        physicsWorld,
        towerMass,
        towerHalfExtents,
        pos,
        quat,
        createMaterial(0xb03214),
    )

    //Bridge
    const bridgeMass = 100
    const bridgeHalfExtents = new THREE.Vector3(7, 0.2, 1.5)
    pos.set(0, 10.2, 0)
    quat.set(0, 0, 0, 1)
    createObject(
        scene,
        physicsWorld,
        bridgeMass,
        bridgeHalfExtents,
        pos,
        quat,
        createMaterial(0xb3b865),
    )

    // Stones
    const stoneMass = 120
    const stoneHalfExtents = new THREE.Vector3(1, 2, 0.15)
    const numStones = 8
    quat.set(0, 0, 0, 1)
    for (let i = 0; i < numStones; i++) {
        pos.set(0, 2, 15 * (0.5 - i / (numStones + 1)))

        createObject(
            scene,
            physicsWorld,
            stoneMass,
            stoneHalfExtents,
            pos,
            quat,
            createMaterial(0xb0b0b0),
        )
    }

    // Mountain
    const mountainMass = 860
    const mountainHalfExtents = new THREE.Vector3(4, 5, 4)
    pos.set(5, mountainHalfExtents.y * 0.5, -7)
    quat.set(0, 0, 0, 1)
    const mountainPoints = []
    mountainPoints.push(
        new THREE.Vector3(
            mountainHalfExtents.x,
            -mountainHalfExtents.y,
            mountainHalfExtents.z,
        ),
    )
    mountainPoints.push(
        new THREE.Vector3(
            -mountainHalfExtents.x,
            -mountainHalfExtents.y,
            mountainHalfExtents.z,
        ),
    )
    mountainPoints.push(
        new THREE.Vector3(
            mountainHalfExtents.x,
            -mountainHalfExtents.y,
            -mountainHalfExtents.z,
        ),
    )
    mountainPoints.push(
        new THREE.Vector3(
            -mountainHalfExtents.x,
            -mountainHalfExtents.y,
            -mountainHalfExtents.z,
        ),
    )
    mountainPoints.push(new THREE.Vector3(0, mountainHalfExtents.y, 0))
    const mountain = new THREE.Mesh(
        new ConvexGeometry(mountainPoints),
        createMaterial(0xb03814),
    )
    mountain.position.copy(pos)
    mountain.quaternion.copy(quat)
    convexBreaker.prepareBreakableObject(
        mountain,
        mountainMass,
        new THREE.Vector3(),
        new THREE.Vector3(),
        true,
    )
    createDebrisFromBreakableObject(scene, physicsWorld, mountain)
}

function createParalellepipedWithPhysics(
    scene: THREE.Scene,
    physicsWorld: IAmmo['btDiscreteDynamicsWorld'],
    sx: number,
    sy: number,
    sz: number,
    mass: number,
    pos: THREE.Vector3,
    quat: THREE.Quaternion,
    material: THREE.Material,
) {
    const object = new THREE.Mesh(
        new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1),
        material,
    )

    if (!Ammo) {
        throw new Error('Ammo.js is not loaded.')
    }

    const shape = new Ammo.btBoxShape(
        new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5),
    )
    shape.setMargin(margin)

    // createRigidBody(scene, physicsWorld, object, physicsShape, mass, pos, quat, vel, angVel)
    createRigidBody(
        scene,
        physicsWorld,
        object,
        shape,
        mass,
        pos,
        quat,
        null,
        null,
    )

    return object
}

function createDebrisFromBreakableObject(
    scene: THREE.Scene,
    physicsWorld: IAmmo['btDiscreteDynamicsWorld'],
    object: THREE.Mesh,
) {
    if (!Ammo) {
        throw new Error('Ammo.js is not loaded.')
    }

    object.castShadow = true
    object.receiveShadow = true

    const shape = createConvexHullPhysicsShape(
        object.geometry.attributes.position.array as Float32Array,
    )
    shape.setMargin(margin)

    // createRigidBody(scene, physicsWorld, object, physicsShape, mass, pos, quat, vel, angVel)
    const body = createRigidBody(
        scene,
        physicsWorld,
        object,
        shape,
        object.userData.mass,
        object.position,
        object.quaternion,
        object.userData.velocity,
        object.userData.angularVelocity,
    )

    // Set pointer back to the three object only in the debris objects
    const btVecUserData = new Ammo.btVector3(0, 0, 0)
    btVecUserData.threeObject = object
    body.setUserPointer(btVecUserData)
}

function removeDebris(
    scene: THREE.Scene,
    physicsWorld: IAmmo['btDiscreteDynamicsWorld'],
    object: THREE.Mesh,
) {
    scene.remove(object)
    physicsWorld.removeRigidBody(object.userData.physicsBody)
}

function createConvexHullPhysicsShape(
    coords: Float32Array,
): IAmmo['btConvexHullShape'] {
    if (!Ammo) {
        throw new Error('Ammo.js is not loaded.')
    }

    const shape = new Ammo.btConvexHullShape()
    for (let i = 0, il = coords.length; i < il; i += 3) {
        tempBtVec3_1.setValue(coords[i], coords[i + 1], coords[i + 2])
        const lastOne = i >= il - 3
        shape.addPoint(tempBtVec3_1, lastOne)
    }
    return shape
}

function createRigidBody(
    scene: THREE.Scene,
    physicsWorld: IAmmo['btDiscreteDynamicsWorld'],
    object: THREE.Mesh,
    physicsShape: IAmmo['btCollisionShape'],
    mass: number,
    pos: THREE.Vector3,
    quat: THREE.Quaternion,
    vel: THREE.Vector3 | null,
    angVel: THREE.Vector3 | null,
) {
    if (!Ammo) {
        throw new Error('Ammo.js is not loaded.')
    }

    if (pos) {
        object.position.copy(pos)
    } else {
        pos = object.position
    }

    if (quat) {
        object.quaternion.copy(quat)
    } else {
        quat = object.quaternion
    }

    const transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z))
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))
    const motionState = new Ammo.btDefaultMotionState(transform)

    const localInertia = new Ammo.btVector3(0, 0, 0)
    physicsShape.calculateLocalInertia(mass, localInertia)

    const rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        physicsShape,
        localInertia,
    )
    const body = new Ammo.btRigidBody(rbInfo)

    body.setFriction(0.5)

    if (vel) {
        body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z))
    }

    if (angVel) {
        body.setAngularVelocity(
            new Ammo.btVector3(angVel.x, angVel.y, angVel.z),
        )
    }

    object.userData.physicsBody = body
    object.userData.collided = false

    scene.add(object)

    if (mass > 0) {
        rigidBodies.push(object)
        // Disable deactivation
        body.setActivationState(4)
    }

    physicsWorld.addRigidBody(body)

    return body
}

function createRandomColor() {
    return Math.floor(Math.random() * (1 << 24))
}

function createMaterial(color: number) {
    color = color || createRandomColor()
    return new THREE.MeshPhongMaterial({ color: color })
}

function updatePhysics(
    scene: THREE.Scene,
    physicsWorld: IAmmo['btDiscreteDynamicsWorld'],
    dispatcher: IAmmo['btCollisionDispatcher'],
    deltaTime: number,
    numObjectsToRemove: number,
) {
    if (!Ammo) {
        console.error('Ammo.js not loaded')
        return
    }

    // Step world
    physicsWorld.stepSimulation(deltaTime, 10)

    // Update rigid bodies
    for (let i = 0, il = rigidBodies.length; i < il; i++) {
        const objThree = rigidBodies[i]
        const objPhys = objThree.userData.physicsBody
        const ms = objPhys.getMotionState()

        if (ms) {
            ms.getWorldTransform(transformAux1)
            const p = transformAux1.getOrigin()
            const q = transformAux1.getRotation()
            objThree.position.set(p.x(), p.y(), p.z())
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w())

            objThree.userData.collided = false
        }
    }

    for (let i = 0, il = dispatcher.getNumManifolds(); i < il; i++) {
        const contactManifold = dispatcher.getManifoldByIndexInternal(i)
        const rb0 = Ammo.castObject(
            contactManifold.getBody0(),
            Ammo.btRigidBody,
        )
        const rb1 = Ammo.castObject(
            contactManifold.getBody1(),
            Ammo.btRigidBody,
        )

        const threeObject0 = Ammo.castObject(
            rb0.getUserPointer(),
            Ammo.btVector3,
        ).threeObject
        const threeObject1 = Ammo.castObject(
            rb1.getUserPointer(),
            Ammo.btVector3,
        ).threeObject

        if (!threeObject0 && !threeObject1) {
            continue
        }

        const userData0 = threeObject0 ? threeObject0.userData : null
        const userData1 = threeObject1 ? threeObject1.userData : null

        const breakable0 = userData0 ? userData0.breakable : false
        const breakable1 = userData1 ? userData1.breakable : false

        const collided0 = userData0 ? userData0.collided : false
        const collided1 = userData1 ? userData1.collided : false

        if ((!breakable0 && !breakable1) || (collided0 && collided1)) {
            continue
        }

        let contact = false
        let maxImpulse = 0
        for (let j = 0, jl = contactManifold.getNumContacts(); j < jl; j++) {
            const contactPoint = contactManifold.getContactPoint(j)
            if (contactPoint.getDistance() < 0) {
                contact = true
                const impulse = contactPoint.getAppliedImpulse()

                if (impulse > maxImpulse) {
                    maxImpulse = impulse
                    const pos = contactPoint.get_m_positionWorldOnB()
                    const normal = contactPoint.get_m_normalWorldOnB()
                    impactPoint.set(pos.x(), pos.y(), pos.z())
                    impactNormal.set(normal.x(), normal.y(), normal.z())
                }
                break
            }
        }

        // If no point has contact, abort
        if (!contact) continue

        // Subdivision
        const fractureImpulse = 250

        if (breakable0 && !collided0 && maxImpulse > fractureImpulse) {
            const debris = convexBreaker.subdivideByImpact(
                threeObject0,
                impactPoint,
                impactNormal,
                1,
                2,
                1.5,
            )

            const numObjects = debris.length
            for (let j = 0; j < numObjects; j++) {
                const vel = rb0.getLinearVelocity()
                const angVel = rb0.getAngularVelocity()
                const fragment = debris[j]
                fragment.userData.velocity.set(vel.x(), vel.y(), vel.z())
                fragment.userData.angularVelocity.set(
                    angVel.x(),
                    angVel.y(),
                    angVel.z(),
                )

                createDebrisFromBreakableObject(scene, physicsWorld, fragment)
            }

            objectsToRemove[numObjectsToRemove++] = threeObject0
            userData0.collided = true
        }

        if (breakable1 && !collided1 && maxImpulse > fractureImpulse) {
            const debris = convexBreaker.subdivideByImpact(
                threeObject1,
                impactPoint,
                impactNormal,
                1,
                2,
                1.5,
            )

            const numObjects = debris.length
            for (let j = 0; j < numObjects; j++) {
                const vel = rb1.getLinearVelocity()
                const angVel = rb1.getAngularVelocity()
                const fragment = debris[j]
                fragment.userData.velocity.set(vel.x(), vel.y(), vel.z())
                fragment.userData.angularVelocity.set(
                    angVel.x(),
                    angVel.y(),
                    angVel.z(),
                )

                createDebrisFromBreakableObject(scene, physicsWorld, fragment)
            }
            objectsToRemove[numObjectsToRemove++] = threeObject1
            userData1.collided = true
        }
    }

    for (let i = 0; i < numObjectsToRemove; i++) {
        if (objectsToRemove[i]) {
            removeDebris(scene, physicsWorld, objectsToRemove[i] as THREE.Mesh)
        }
    }

    numObjectsToRemove = 0
}

function onPointerDown(event: PointerEvent, data: any) {
    if (!Ammo) {
        console.error('Ammo.js not loaded')
        return
    }

    const scene = data.scene
    const camera = data.camera
    const physicsWorld = data.physicsWorld

    mouseCoords.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
    )
    raycaster.setFromCamera(mouseCoords, camera)

    // Creates a ball and throws it
    const ballMass = 35
    const ballRadius = 0.4

    const ball = new THREE.Mesh(
        new THREE.SphereGeometry(ballRadius, 14, 10),
        ballMaterial,
    )
    ball.castShadow = true
    ball.receiveShadow = true
    const ballShape = new Ammo.btSphereShape(ballRadius)
    ballShape.setMargin(margin)
    pos.copy(raycaster.ray.direction)
    pos.add(raycaster.ray.origin)
    quat.set(0, 0, 0, 1)
    // createRigidBody(scene, physicsWorld, object, physicsShape, mass, pos, quat, vel, angVel)
    const ballBody = createRigidBody(
        scene,
        physicsWorld,
        ball,
        ballShape,
        ballMass,
        pos,
        quat,
        null,
        null,
    )

    pos.copy(raycaster.ray.direction)
    pos.multiplyScalar(24)
    ballBody.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z))
}

// camera.position.set(- 14, 8, 16);
// scene.background = new Color(0xbfd1e5);

const ammoDrawing = {
    sceneElements: [],
    drawFuncs: [{ func: drawAmmo, dataSrc: null }],
    eventListeners: {
        // window.addEventListener('pointerdown', function (event) {});
        pointerdown: (event: PointerEvent, other: any) => {
            const { data } = other
            onPointerDown(event, data)
        },
    },
    animationCallback: (
        renderer: THREE.WebGLRenderer,
        timestamp: number,
        threejsDrawing: any,
        camera: THREE.Camera,
    ) => {
        const deltaTime = clock.getDelta()
        const physicsWorld = threejsDrawing.data.physicsWorld
        const dispatcher = threejsDrawing.data.dispatcher
        let numObjectsToRemove = 0

        const scene = threejsDrawing.data.scene

        if (!physicsWorld) {
            console.warn('Physics world not initialized')
            return
        }
        updatePhysics(
            scene,
            physicsWorld,
            dispatcher,
            deltaTime,
            numObjectsToRemove,
        )
    },
    data: {},
    sceneConfig: {
        css2dRenderer: true,
    },
}

export { ammoDrawing }
