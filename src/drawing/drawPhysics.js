import { ArrowHelper, Vector3,  Mesh, MeshBasicMaterial, MeshStandardMaterial, BoxGeometry, SphereGeometry } from 'three';

import GUI from 'lil-gui';

const params = {
    mass: 2,
    friction: 0.5,
    forceX: 10,
    forceY: 0,
    forceZ: 0,
    restitution: 1.0,
    applyForce: () => {
        const f = new Ammo.btVector3(params.forceX, params.forceY, params.forceZ);
        box.body.applyCentralForce(f);
    }
};

const gui = new GUI();

gui.add(params, 'mass', 0.1, 10).onChange(updateMass);
gui.add(params, 'friction', 0, 1).onChange(updateFriction);
gui.add(params, 'forceX', -50, 50);
gui.add(params, 'forceY', -50, 50);
gui.add(params, 'forceZ', -50, 50);
gui.add(params, 'applyForce');
gui.add(params, 'restitution', 0, 1).onChange((val) => {
    box.body.setRestitution(val);
});




const arrowHelper = new ArrowHelper(
    new Vector3(1, 0, 0),
    new Vector3(0, 0, 0),
    1,
    0xffff00
);
scene.add(arrowHelper);


// Inside your animation loop
function updateVelocityArrow(obj) {
    const velocity = obj.body.getLinearVelocity();
    const vel = new Vector3(velocity.x(), velocity.y(), velocity.z());
    arrowHelper.setDirection(vel.clone().normalize());
    arrowHelper.setLength(vel.length());
    arrowHelper.position.copy(obj.mesh.position);
}



function initPhysics(threejsDrawing) {
    // Physics configuration
    threejsDrawing.data.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    threejsDrawing.data.dispatcher = new Ammo.btCollisionDispatcher(threejsDrawing.data.collisionConfiguration);
    threejsDrawing.data.broadphase = new Ammo.btDbvtBroadphase();
    threejsDrawing.data.solver = new Ammo.btSequentialImpulseConstraintSolver();
    threejsDrawing.data.physicsWorld = new Ammo.btDiscreteDynamicsWorld(threejsDrawing.data.dispatcher, threejsDrawing.data.broadphase, threejsDrawing.data.solver, threejsDrawing.data.collisionConfiguration);
    threejsDrawing.data.physicsWorld.setGravity(new Ammo.btVector3(0, - gravityConstant, 0));

    transformAux1 = new Ammo.btTransform();
    tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);
}



let trail = [];

function updateTrail(obj) {
    const pos = obj.mesh.position.clone();
    const dot = new Mesh(
        new SphereGeometry(0.05),
        new MeshBasicMaterial({ color: 0xff0000 })
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

function createRigidBody(shape, mass, position) {
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    const motionState = new Ammo.btDefaultMotionState(transform);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    if (mass > 0) shape.calculateLocalInertia(mass, localInertia);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);
    physicsWorld.addRigidBody(body);

    const mesh = new Mesh(
        new BoxGeometry(2, 2, 2), // visualize shape
        new MeshStandardMaterial({ color: 0xff4444 })
    );
    mesh.position.copy(position);
    scene.add(mesh);

    return { body, mesh };
}


function updateMass(newMass) {
    const body = box.body;
    const shape = body.getCollisionShape();
    const localInertia = new Ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(newMass, localInertia);
    body.setMassProps(newMass, localInertia);
    body.updateInertiaTensor();
}

function updateFriction(val) {
    box.body.setFriction(val);
}


function drawBasicNewtonianForces(scene) {
    // Basic setup
    const gravity = new Ammo.btVector3(0, -9.81, 0);
    const physicsWorld = new Ammo.btDiscreteDynamicsWorld(...);

    // Create ground
    const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 1, 50));
    const ground = createRigidBody(groundShape, 0, new Vector3(0, -1, 0));

    // Create a box
    const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));
    const mass = 2;
    const box = createRigidBody(boxShape, mass, new Vector3(0, 5, 0));

    // Apply a force
    box.body.applyCentralForce(new Ammo.btVector3(10, 0, 0));
}


function drawTorqueAndAngularMotion(scene) {
    // Create a tall cylinder
    const shape = new Ammo.btCylinderShape(new Ammo.btVector3(0.5, 2, 0.5));
    const cylinder = createRigidBody(shape, 3, new Vector3(0, 5, 0));

    // Apply force to the side
    const relPos = new Ammo.btVector3(1, 0, 0); // offset from center
    const force = new Ammo.btVector3(0, 0, 10);
    cylinder.body.applyForce(force, relPos);
}

function drawFriction(scene) {
    // Ground with default friction
    const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(10, 1, 10));
    const groundBody = createRigidBody(groundShape, 0, new THREE.Vector3(0, -1, 0));
    groundBody.body.setFriction(1.0); // high friction surface

    // A sliding box
    const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));
    const slidingBox = createRigidBody(boxShape, 2, new THREE.Vector3(-5, 1, 0));
    slidingBox.body.setFriction(0.5); // medium friction box

    // Give it a strong initial impulse
    slidingBox.body.setLinearVelocity(new Ammo.btVector3(10, 0, 0));
}


function drawElasticForce(scene) {
    // Two bodies connected by a virtual spring
    const mass = 1;
    const shape = new Ammo.btSphereShape(0.5);
    const pointA = createRigidBody(shape, mass, new Vector3(-2, 5, 0));
    const pointB = createRigidBody(shape, mass, new Vector3(2, 5, 0));

    // Hooke’s law simulated using a constraint
    const pivotA = new Ammo.btVector3(0, 0, 0);
    const pivotB = new Ammo.btVector3(0, 0, 0);
    const spring = new Ammo.btPoint2PointConstraint(pointA.body, pointB.body, pivotA, pivotB);

    // Optional: dampen motion
    spring.get_m_setting().set_m_damping(0.05);
    spring.get_m_setting().set_m_impulseClamp(1.0);
    spring.get_m_setting().set_m_tau(0.1);

    physicsWorld.addConstraint(spring, true);
}

function applyAirResistance(obj, dragCoeff = 0.5) {
    const vel = obj.body.getLinearVelocity();
    const v = new Vector3(vel.x(), vel.y(), vel.z());
    const drag = v.clone().multiplyScalar(-dragCoeff);

    const dragForce = new Ammo.btVector3(drag.x, drag.y, drag.z);
    obj.body.applyCentralForce(dragForce);
}


function drawPhysics(scene, threejsDrawing) {
    threejsDrawing.data.physicsWorld = null;
    threejsDrawing.data.collisionConfiguration = null;
    threejsDrawing.data.dispatcher = null;
    threejsDrawing.data.broadphase = null;
    threejsDrawing.data.solver = null;

    Ammo().then(function (AmmoLib) {
        Ammo = AmmoLib;

        initPhysics(threejsDrawing);
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
    'uiState': null,
    'eventListeners': {
    },
    'animationCallback': (renderer, timestamp, threejsDrawing, uiState, camera) => {
        const deltaTime = clock.getDelta();
        const physicsWorld = threejsDrawing.data.physicsWorld;
        const dispatcher = threejsDrawing.data.dispatcher;

        const scene = threejsDrawing.data.scene;

        if (!physicsWorld) {
            console.warn('Physics world not initialized');
            return;
        }
    },
    'data': {
    },
    'sceneConfig': {
    }
}

export { physicsDrawing };
