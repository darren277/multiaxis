import { Mesh, MeshBasicMaterial, BoxGeometry, AxesHelper } from 'three';

console.debug('Ammo.js loaded', Ammo);


function drawChassis() {
    const chassisShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 0.5, 2));
    const chassisTransform = new Ammo.btTransform();
    chassisTransform.setIdentity();
    chassisTransform.setOrigin(new Ammo.btVector3(0, 4, 0)); // start position

    const mass = 800;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    chassisShape.calculateLocalInertia(mass, localInertia);

    const motionState = new Ammo.btDefaultMotionState(chassisTransform);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, chassisShape, localInertia);
    const chassisBody = new Ammo.btRigidBody(rbInfo);

    chassisBody.setActivationState(4); // DISABLE_DEACTIVATION

    return {
        shape: chassisShape,
        transform: chassisTransform,
        mass: mass,
        localInertia: localInertia,
        motionState: motionState,
        rbInfo: rbInfo,
        chassisBody
    };
}

function drawWheels(vehicle) {
    const wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
    const wheelAxleCS = new Ammo.btVector3(-1, 0, 0);
    const suspensionRestLength = 0.6;
    const wheelRadius = 0.4;
    const tuning = new Ammo.btVehicleTuning();

    // Front Left
    vehicle.addWheel(new Ammo.btVector3(-1, 0.5, 1.5), wheelDirectionCS0, wheelAxleCS, suspensionRestLength, wheelRadius, tuning, true);
    // Front Right
    vehicle.addWheel(new Ammo.btVector3(1, 0.5, 1.5), wheelDirectionCS0, wheelAxleCS, suspensionRestLength, wheelRadius, tuning, true);
    // Rear Left
    vehicle.addWheel(new Ammo.btVector3(-1, 0.5, -1.5), wheelDirectionCS0, wheelAxleCS, suspensionRestLength, wheelRadius, tuning, false);
    // Rear Right
    vehicle.addWheel(new Ammo.btVector3(1, 0.5, -1.5), wheelDirectionCS0, wheelAxleCS, suspensionRestLength, wheelRadius, tuning, false);
}

function updateVehicleGraphics(vehicle, carMesh) {
    console.log('Transform:', vehicle.getChassisWorldTransform());

    const tm = vehicle.getChassisWorldTransform();
    const p = tm.getOrigin();
    console.log('Physics Pos:', p.x(), p.y(), p.z());
    const q = tm.getRotation();
    carMesh.position.set(p.x(), p.y(), p.z());
    carMesh.quaternion.set(q.x(), q.y(), q.z(), q.w());

    console.log('Car Pos:', carMesh.position);
}


/* Keyboard Controls */
let engineForce = 0;
let steering = 0;
const maxEngineForce = 2000;
const maxSteering = 0.3;


function animateCar(physicsWorld, carMesh, vehicle) {
    engineForce = 500;
    steering    = 0;

    const deltaTime = 1 / 60; // Assuming 60 FPS

    const g = physicsWorld.getGravity();
    console.log('Gravity', g.x(), g.y(), g.z());

    const chassisBody = vehicle.getRigidBody();
    const vel = chassisBody.getLinearVelocity();
    console.log('Chassis linVel', vel.x(), vel.y(), vel.z());

    const comTrans = chassisBody.getCenterOfMassTransform().getOrigin();
    console.log('Chassis CoM Pos', comTrans.x(), comTrans.y(), comTrans.z());

    const nW = vehicle.getNumWheels();
    for (let i = 0; i < nW; i++) {
        const wi = vehicle.getWheelInfo(i);
        const ray = wi.get_m_raycastInfo();
        console.log(`Wheel ${i}: inContact=${!!ray.get_m_isInContact()}`);
        console.log(`  suspensionRest=${wi.get_m_suspensionRestLength1()}`);
        console.log(`  frictionSlip=${wi.get_m_frictionSlip()}`);
        console.log(`  suspensionForce=${wi.get_m_wheelsSuspensionForce()}`);
    }

    const disp = physicsWorld.getDispatcher();
    const numM = disp.getNumManifolds();
    console.log('Contact manifolds:', numM);
    for (let m = 0; m < numM; m++) {
        const man = disp.getManifoldByIndexInternal(m);
        console.log('Manifold', man);
        const b0 = man.getBody0(), b1 = man.getBody1();
        console.log(`  Manifold ${m}:`, b0.ptr, '↔', b1.ptr, '– pts:', man.getNumContacts());
    }

    vehicle.applyEngineForce(engineForce, 2); // Rear Left
    vehicle.applyEngineForce(engineForce, 3); // Rear Right

    vehicle.setSteeringValue(steering, 0); // Front Left
    vehicle.setSteeringValue(steering, 1); // Front Right

    physicsWorld.stepSimulation(deltaTime, 10);

    console.log('Input → engineForce:', engineForce, 'steering:', steering);

    // Update wheel transforms to apply physics and suspension forces
    const numWheels = vehicle.getNumWheels();
    for (let i = 0; i < numWheels; i++) {
        vehicle.updateWheelTransform(i, true); // true = interpolated
    }
    updateVehicleGraphics(vehicle, carMesh);
}


function drawGround(scene, physicsWorld) {
    const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 0.5, 50));
    const groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -0.5, 0));
    const groundMotionState = new Ammo.btDefaultMotionState(groundTransform);
    const groundBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
        0, groundMotionState, groundShape, new Ammo.btVector3(0, 0, 0)
    ));
    physicsWorld.addRigidBody(groundBody);

    const groundGeo = new BoxGeometry(100, 1, 100);
    const groundMat = new MeshBasicMaterial({ color: 0x999999 });
    const groundMesh = new Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.5;
    scene.add(groundMesh);
}


function drawCar(physicsWorld, scene) {
    const chassis = drawChassis();
    const { chassisBody } = chassis;

    console.log('Added chassisBody:', chassisBody);
    console.log('Is active?', chassisBody.isActive());

    physicsWorld.addRigidBody(chassisBody);

    const tuning = new Ammo.btVehicleTuning();
    const vehicleRayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
    const vehicle = new Ammo.btRaycastVehicle(tuning, chassisBody, vehicleRayCaster);
    vehicle.setCoordinateSystem(0, 1, 2); // right, up, forward

    physicsWorld.addAction(vehicle);
    console.log('Vehicle wheels 1:', vehicle.getNumWheels());

    drawWheels(vehicle);
    console.log('Vehicle wheels 2:', vehicle.getNumWheels());

    const numWheels = vehicle.getNumWheels();
    for (let i = 0; i < numWheels; i++) {
        vehicle.updateWheelTransform(i, true); // true = interpolated transform
        const wi = vehicle.getWheelInfo(i);
        wi.set_m_frictionSlip(1.0);                // tyres “stickier”
        wi.set_m_suspensionStiffness(20.0);        // stiffer spring
        wi.set_m_wheelsDampingRelaxation(2.3);     // damping (relaxation)
        wi.set_m_wheelsDampingCompression(4.4);    // compression
    }

    return vehicle;
}


function drawDrive(scene, threejsDrawing) {
    threejsDrawing.data.physicsWorld = null;

    Ammo().then(function (AmmoLib) {
        Ammo = AmmoLib;

        threejsDrawing.data.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        threejsDrawing.data.dispatcher = new Ammo.btCollisionDispatcher(threejsDrawing.data.collisionConfiguration);
        threejsDrawing.data.broadphase = new Ammo.btDbvtBroadphase();
        threejsDrawing.data.solver = new Ammo.btSequentialImpulseConstraintSolver();
        threejsDrawing.data.physicsWorld = new Ammo.btDiscreteDynamicsWorld(threejsDrawing.data.dispatcher, threejsDrawing.data.broadphase, threejsDrawing.data.solver, threejsDrawing.data.collisionConfiguration);

        /* add this line before you drop any rigid bodies/wheels in */
        threejsDrawing.data.physicsWorld.setGravity(
            new Ammo.btVector3( 0, -9.81, 0 )      // Bullet units = metres‑per‑second²
        );

        // Draw ground...
        drawGround(scene, threejsDrawing.data.physicsWorld);

        // Draw car...
        const vehicle = drawCar(threejsDrawing.data.physicsWorld, scene);
        threejsDrawing.data.vehicle = vehicle;

        const carGeo = new BoxGeometry(2, 1, 4);
        const carMat = new MeshBasicMaterial({ color: 0x00ff00 });
        const carMesh = new Mesh(carGeo, carMat);

        carMesh.position.set(0, 4, 0);
        carMesh.rotation.set(0, 0, 0);
        carMesh.castShadow = true;
        carMesh.receiveShadow = true;
        carMesh.scale.set(1, 1, 1);
        scene.add(carMesh);

        threejsDrawing.data.carMesh = carMesh;

        scene.add(new AxesHelper(5));
    });
}



const driveDrawing = {
    sceneElements: [],
    drawFuncs: [ { func: drawDrive, 'dataSrc': null } ],
    eventListeners: {
//        click: (e, data) => {
//            onClick(e, data.scene, data.camera, data.renderer, data.data);
//        }
        'keydown': (e, data) => {
            console.log('keydown', e.key);
            // Prevent default action for certain keys
            if (e.key === 'w' || e.key === 's' || e.key === 'a' || e.key === 'd' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
            }
            switch (e.key) {
                case 'w':
                case 'ArrowUp':
                    engineForce = maxEngineForce; break;
                case 's':
                case 'ArrowDown':
                    engineForce = -maxEngineForce; break;
                case 'a':
                case 'ArrowLeft':
                    steering = maxSteering; break;
                case 'd':
                case 'ArrowRight':
                    steering = -maxSteering; break;
            }
        },
        'keyup': (e, data) => {
            console.log('keyup', e.key);
            if (e.key === 'w' || e.key === 's' || e.key === 'ArrowUp' || e.key === 'ArrowDown') engineForce = 0;
            if (e.key === 'a' || e.key === 'd' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') steering    = 0;
            console.log(`key ${e.type} ${e.key} → engine=${engineForce} steer=${steering}`);
        }
    },
    animationCallback: (renderer, timestamp, threejsDrawing, camera) => {
        const data = threejsDrawing.data;
        if (data) {
            const physicsWorld = data.physicsWorld;
            if (!physicsWorld) {
                console.warn('No physics world available');
                return;
            }
            animateCar(physicsWorld, data.carMesh, data.vehicle);
        }
    },
    data: {},
    sceneConfig: {
        'startingPosition': { x: 0, y: 1.5, z: 5 },
    }
}

export { driveDrawing };
