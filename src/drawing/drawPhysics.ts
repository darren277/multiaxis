import * as THREE from 'three';

const clock = new THREE.Clock();

import GUI from 'lil-gui';
import { ThreeJSDrawing } from '../threejsDrawing';

const gravityConstant = 9.81;

const params = {
    mass: 2,
    friction: 0.5,
    forceX: 10,
    forceY: 0,
    forceZ: 0,
    restitution: 1.0,
    applyForce: (box: any) => {
        const f = new Ammo.btVector3(params.forceX, params.forceY, params.forceZ);
        box.body.applyCentralForce(f);
    }
};



// Inside your animation loop
function updateVelocityArrow(arrowHelper: any, obj: any) {
    const velocity = obj.body.getLinearVelocity();
    const vel = new THREE.Vector3(velocity.x(), velocity.y(), velocity.z());
    arrowHelper.setDirection(vel.clone().normalize());
    arrowHelper.setLength(vel.length());
    arrowHelper.position.copy(obj.mesh.position);
}



async function initPhysics(threejsDrawing: ThreeJSDrawing) {
    // Physics configuration
    threejsDrawing.data.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    threejsDrawing.data.dispatcher = new Ammo.btCollisionDispatcher(threejsDrawing.data.collisionConfiguration);
    threejsDrawing.data.broadphase = new Ammo.btDbvtBroadphase();
    threejsDrawing.data.solver = new Ammo.btSequentialImpulseConstraintSolver();
    threejsDrawing.data.physicsWorld = new Ammo.btDiscreteDynamicsWorld(threejsDrawing.data.dispatcher, threejsDrawing.data.broadphase, threejsDrawing.data.solver, threejsDrawing.data.collisionConfiguration);
    threejsDrawing.data.physicsWorld.setGravity(new Ammo.btVector3(0, - gravityConstant, 0));

    const transformAux1 = new Ammo.btTransform();
    const tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);

    threejsDrawing.data.transformAux1 = transformAux1;
    threejsDrawing.data.tempBtVec3_1 = tempBtVec3_1;

    return threejsDrawing.data.physicsWorld;
}



let trail: THREE.Mesh[] = [];

function updateTrail(scene: THREE.Scene, obj: any) {
    const pos = obj.mesh.position.clone();
    const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.05),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    dot.position.copy(pos);
    scene.add(dot);
    trail.push(dot);

    // Limit to last 100 frames
    if (trail.length > 100) {
        const old = trail.shift();
        scene.remove(old);
    }
}

function createRigidBody(name: string, physicsWorld: any, shape: any, mass: number, position: THREE.Vector3) {
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    const motionState = new Ammo.btDefaultMotionState(transform);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    if (mass > 0) shape.calculateLocalInertia(mass, localInertia);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);
    physicsWorld.addRigidBody(body);

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2), // visualize shape
        new THREE.MeshStandardMaterial({ color: 0xff4444 })
    );
    mesh.position.copy(position);

    return { name, body, mesh };
}


function updateMass(box: any, newMass: number) {
    const body = box.body;
    const shape = body.getCollisionShape();
    const localInertia = new Ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(newMass, localInertia);
    body.setMassProps(newMass, localInertia);
    body.updateInertiaTensor();
}

function updateFriction(box: any, val: number) {
    box.body.setFriction(val);
}


function drawBasicNewtonianForces(scene: THREE.Scene, physicsWorld: any) {
    // Basic setup
    const gravity = new Ammo.btVector3(0, -9.81, 0);

    // Create ground
    const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 1, 50));
    const ground = createRigidBody('Newtonian Ground', physicsWorld, groundShape, 0, new THREE.Vector3(0, -1, 0));
    const mesh = ground.mesh;
    scene.add(mesh);

    // Create a box
    const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));
    const mass = 2;
    const box = createRigidBody('Newtonian Box', physicsWorld, boxShape, mass, new THREE.Vector3(0, 5, 0));
    const boxMesh = box.mesh;
    scene.add(boxMesh);

    // Apply a force
    box.body.applyCentralForce(new Ammo.btVector3(10, 0, 0));

    return {
        groundRigidBody: ground,
        boxRigidBody: box,
    }
}


function drawTorqueAndAngularMotion(scene: THREE.Scene, physicsWorld: any) {
    // Create a tall cylinder
    const shape = new Ammo.btCylinderShape(new Ammo.btVector3(0.5, 2, 0.5));
    const cylinder = createRigidBody('Cylinder', physicsWorld, shape, 3, new THREE.Vector3(0, 5, 0));
    const mesh = cylinder.mesh;
    scene.add(mesh);

    // Apply force to the side
    const relPos = new Ammo.btVector3(1, 0, 0); // offset from center
    const force = new Ammo.btVector3(0, 0, 10);
    cylinder.body.applyForce(force, relPos);

    return cylinder;
}

function drawFriction(scene: THREE.Scene, physicsWorld: any) {
    // Ground with default friction
    const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(10, 1, 10));
    const groundBody = createRigidBody('Friction Ground', physicsWorld, groundShape, 0, new THREE.Vector3(0, -1, 0));
    groundBody.body.setFriction(1.0); // high friction surface
    const groundMesh = groundBody.mesh;
    scene.add(groundMesh);

    // A sliding box
    const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));
    const slidingBox = createRigidBody('Sliding Box', physicsWorld, boxShape, 2, new THREE.Vector3(-5, 1, 0));
    slidingBox.body.setFriction(0.5); // medium friction box
    const slidingBoxMesh = slidingBox.mesh;
    scene.add(slidingBoxMesh);

    // Give it a strong initial impulse
    slidingBox.body.setLinearVelocity(new Ammo.btVector3(10, 0, 0));

    return {
        groundRigidBody: groundBody,
        slidingBoxRigidBody: slidingBox,
    }
}


function drawElasticForce(scene: THREE.Scene, physicsWorld: any) {
    // Two bodies connected by a virtual spring
    const mass = 1;
    const shape = new Ammo.btSphereShape(0.5);
    const pointA = createRigidBody('Elastic Point A', physicsWorld, shape, mass, new THREE.Vector3(-2, 5, 0));
    const pointB = createRigidBody('Elastic Point B', physicsWorld, shape, mass, new THREE.Vector3(2, 5, 0));

    const pointAMesh = pointA.mesh;
    const pointBMesh = pointB.mesh;
    scene.add(pointAMesh);
    scene.add(pointBMesh);

    // Hooke’s law simulated using a constraint
    const pivotA = new Ammo.btVector3(0, 0, 0);
    const pivotB = new Ammo.btVector3(0, 0, 0);
    const spring = new Ammo.btPoint2PointConstraint(pointA.body, pointB.body, pivotA, pivotB);

    // Optional: dampen motion
    spring.get_m_setting().set_m_damping(0.05);
    spring.get_m_setting().set_m_impulseClamp(1.0);
    spring.get_m_setting().set_m_tau(0.1);

    physicsWorld.addConstraint(spring, true);

    return {
        pointARigidBody: pointA,
        pointBRigidBody: pointB,
    }
}

function applyAirResistance(obj: any, dragCoeff = 0.5) {
    const vel = obj.body.getLinearVelocity();
    const v = new THREE.Vector3(vel.x(), vel.y(), vel.z());
    const drag = v.clone().multiplyScalar(-dragCoeff);

    const dragForce = new Ammo.btVector3(drag.x, drag.y, drag.z);
    obj.body.applyCentralForce(dragForce);
}


function drawLights(scene: THREE.Scene) {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7.5);
    scene.add(dir);
}

const gui = new GUI();

function drawGUI(box: any) {
    // Create a folder
    const physicsFolder = gui.addFolder(box.name);

    // Add controls inside that folder
    physicsFolder.add(params, 'mass', 0.1, 10).onChange((newMass: number) => updateMass(box, newMass));
    physicsFolder.add(params, 'friction', 0, 1).onChange((val: number) => updateFriction(box, val));
    physicsFolder.add(params, 'restitution', 0, 1).onChange((val: number) => box.body.setRestitution(val));

    // Apply force button separately if you like:
    physicsFolder.add(params, 'forceX', -50, 50);
    physicsFolder.add(params, 'forceY', -50, 50);
    physicsFolder.add(params, 'forceZ', -50, 50);
    physicsFolder.add(params, 'applyForce').name('Apply Force');
}

function drawPhysics(scene: THREE.Scene, threejsDrawing: any) {
    threejsDrawing.data.physicsWorld = null;
    threejsDrawing.data.collisionConfiguration = null;
    threejsDrawing.data.dispatcher = null;
    threejsDrawing.data.broadphase = null;
    threejsDrawing.data.solver = null;

    threejsDrawing.data.rigidBodies = [];

    Ammo().then(function (AmmoLib) {
        Ammo = AmmoLib;

        // Initializes the physics world and attaches it to `threejsDrawing.data`.
        initPhysics(threejsDrawing).then((physicsWorld) => {
            console.log('Physics world initialized', physicsWorld);
            // Draw basic Newtonian forces
            const rigidNewtonianBodies = drawBasicNewtonianForces(scene, physicsWorld);
            const ground = rigidNewtonianBodies.groundRigidBody;
            const box = rigidNewtonianBodies.boxRigidBody;
            threejsDrawing.data.box = box;
            threejsDrawing.data.rigidBodies.push(box);
            threejsDrawing.data.rigidBodies.push(ground);

            // Draw torque and angular motion
            const cylinder = drawTorqueAndAngularMotion(scene, physicsWorld);
            threejsDrawing.data.rigidBodies.push(cylinder);

            // Draw friction
            const rigidFrictionBodies = drawFriction(scene, physicsWorld);
            const groundFriction = rigidFrictionBodies.groundRigidBody;
            const slidingBox = rigidFrictionBodies.slidingBoxRigidBody;
            threejsDrawing.data.rigidBodies.push(groundFriction);
            threejsDrawing.data.rigidBodies.push(slidingBox);

            // Draw elastic force
            const elasticRigidBodies = drawElasticForce(scene, physicsWorld);
            const pointA = elasticRigidBodies.pointARigidBody;
            const pointB = elasticRigidBodies.pointBRigidBody;
            threejsDrawing.data.rigidBodies.push(pointA);
            threejsDrawing.data.rigidBodies.push(pointB);

            const arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xffff00);
            scene.add(arrowHelper);

            threejsDrawing.data.arrowHelper = arrowHelper;

            // Add event listeners or any other setup needed
            window.addEventListener('click', () => {
                const box = threejsDrawing.data.box;

                params.applyForce(box);
                updateVelocityArrow(threejsDrawing.data.arrowHelper, box);
                updateTrail(scene, box);
                applyAirResistance(box, 0.2); // Tune coefficient as needed
            });

            // Draw lights
            drawLights(scene);

            for (const obj of threejsDrawing.data.rigidBodies) {
                drawGUI(obj);
            }
        });
    });
}


/*
Bouncy Collisions (Restitution)

Restitution determines how much energy is preserved in a bounce.
Value	Meaning
0	No bounce (perfectly inelastic)
1	Fully bouncy (perfectly elastic)
*/

// Note: It’s best to set this immediately after creation, before the simulation begins.
// box.body.setRestitution(1.0); // fully bouncy
// ground.body.setRestitution(0.5); // moderately bouncy



// updateVelocityArrow(slidingBox);
// updateTrail(slidingBox);
// applyAirResistance(slidingBox, 0.2); // Tune coefficient as needed


const physicsDrawing = {
    'sceneElements': [],
    'drawFuncs': [
        {'func': drawPhysics, 'dataSrc': null}
    ],
    'eventListeners': {
    },
    'animationCallback': (renderer: THREE.WebGLRenderer, timestamp: number, threejsDrawing: any, camera: THREE.PerspectiveCamera) => {
        const deltaTime = clock.getDelta();
        const physicsWorld = threejsDrawing.data.physicsWorld;
        const dispatcher = threejsDrawing.data.dispatcher;

        const scene = threejsDrawing.data.scene;

        if (!physicsWorld) {
            console.warn('Physics world not initialized');
            return;
        }

        const rigidBodies = threejsDrawing.data.rigidBodies;
        if (!rigidBodies) {
            console.warn('No rigid bodies found');
            return;
        }

        threejsDrawing.data.physicsWorld.stepSimulation(deltaTime, 10);

        const transformAux1 = threejsDrawing.data.transformAux1;

        // ----- copy physics → graphics -----
        for (const obj of rigidBodies) {
            const ms = obj.body.getMotionState();
            if (ms) {
                ms.getWorldTransform(transformAux1);
                const p = transformAux1.getOrigin();
                const q = transformAux1.getRotation();
                obj.mesh.position.set(p.x(), p.y(), p.z());
                obj.mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
            }
        }

        // update teaching helpers (arrow & trail)
        const box = threejsDrawing.data.box;
        updateVelocityArrow(threejsDrawing.data.arrowHelper, box);
        updateTrail(scene, box);
    },
    'data': {
    },
    'sceneConfig': {
    }
}

export { physicsDrawing };
