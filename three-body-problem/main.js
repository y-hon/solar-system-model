
let scene, camera, renderer, bodies = [], animationId;
let simulationSpeed = 1.0; // Default simulation speed
let gridHelper; // Declare gridHelper here

const controlsContainer = document.getElementById('bodies-controls');
const startButton = document.getElementById('start-simulation');
const simulationContainer = document.getElementById('simulation-container');
const speedSlider = document.getElementById('speed-slider');
const speedValueDisplay = document.getElementById('speed-value');

// Get preset buttons
const presetFigureEightBtn = document.getElementById('preset-figure-eight');
const presetMiniSolarSystemBtn = document.getElementById('preset-mini-solar-system');
const presetChaoticDanceBtn = document.getElementById('preset-chaotic-dance');
const presetCollapsingFigureEightBtn = document.getElementById('preset-collapsing-figure-eight');

// Preset data
const presets = {
    figureEight: [
        { mass: 1, position: { x: 0.970, y: -0.243, z: 0 }, velocity: { x: 0.466, y: 0.432, z: 0 }, color: 0xffa500 },
        { mass: 1, position: { x: -0.970, y: 0.243, z: 0 }, velocity: { x: 0.466, y: 0.432, z: 0 }, color: 0x00bfff },
        { mass: 1, position: { x: 0, y: 0, z: 0 }, velocity: { x: -0.932, y: -0.864, z: 0 }, color: 0xffffff }
    ],
    miniSolarSystem: [
        { mass: 1000, position: { x: 0, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, color: 0xFFD700 },
        { mass: 10, position: { x: 8, y: 0, z: 0 }, velocity: { x: 0, y: 3, z: 0 }, color: 0x00FF00 },
        { mass: 1, position: { x: -12, y: 0, z: 0 }, velocity: { x: 0, y: -2, z: 0 }, color: 0x87CEEB }
    ],
    chaoticDance: [
        { mass: 10, position: { x: 5, y: 0, z: 0 }, velocity: { x: 0, y: 1, z: 0 }, color: 0xffa500 },
        { mass: 10, position: { x: -5, y: 0, z: 0 }, velocity: { x: 0, y: -1, z: 0 }, color: 0x00bfff },
        { mass: 10, position: { x: 0, y: 5, z: 0 }, velocity: { x: -1, y: 0, z: 0 }, color: 0xffffff }
    ],
    collapsingFigureEight: [
        { mass: 1, position: { x: 0.970, y: -0.243, z: 0 }, velocity: { x: 0.466, y: 0.432, z: 0 }, color: 0xffa500 },
        { mass: 1, position: { x: -0.970, y: 0.243, z: 0 }, velocity: { x: 0.466, y: 0.432, z: 0 }, color: 0x00bfff },
        { mass: 1, position: { x: 0, y: 0, z: 0 }, velocity: { x: -0.95, y: -0.864, z: 0 }, color: 0xffffff }
    ]
};

// Set the initial default bodies to the stable figure-eight
const defaultBodies = presets.figureEight;

function applyPreset(presetData) {
    for (let i = 0; i < 3; i++) {
        const body = presetData[i];
        document.getElementById(`mass-${i}`).value = body.mass;
        document.getElementById(`posX-${i}`).value = body.position.x;
        document.getElementById(`posY-${i}`).value = body.position.y;
        document.getElementById(`posZ-${i}`).value = body.position.z;
        document.getElementById(`velX-${i}`).value = body.velocity.x;
        document.getElementById(`velY-${i}`).value = body.velocity.y;
        document.getElementById(`velZ-${i}`).value = body.velocity.z;
    }
    initSimulation(); // Restart simulation with new values
}

function createControls() {
    controlsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const body = defaultBodies[i];
        const colorString = `#${new THREE.Color(body.color).getHexString()}`;

        const controlDiv = document.createElement('div');
        controlDiv.classList.add('body-controls');
        controlDiv.innerHTML = `
            <h4 style="color: ${colorString};">Body ${i + 1} (天体 ${i + 1})</h4>
            <div class="input-group">
                <label for="mass-${i}">Mass (質量)</label>
                <input type="number" id="mass-${i}" value="${body.mass}" step="0.01">
            </div>
            <div class="input-grid">
                <div class="input-group">
                    <label for="posX-${i}">Position X (位置 X)</label>
                    <input type="number" id="posX-${i}" value="${body.position.x}" step="0.001">
                </div>
                <div class="input-group">
                    <label for="posY-${i}">Position Y (位置 Y)</label>
                    <input type="number" id="posY-${i}" value="${body.position.y}" step="0.001">
                </div>
                <div class="input-group">
                    <label for="posZ-${i}">Position Z (位置 Z)</label>
                    <input type="number" id="posZ-${i}" value="${body.position.z}" step="0.001">
                </div>
                <div class="input-group">
                    <label for="velX-${i}">Velocity X (速度 X)</label>
                    <input type="number" id="velX-${i}" value="${body.velocity.x}" step="0.001">
                </div>
                <div class="input-group">
                    <label for="velY-${i}">Velocity Y (速度 Y)</label>
                    <input type="number" id="velY-${i}" value="${body.velocity.y}" step="0.001">
                </div>
                <div class="input-group">
                    <label for="velZ-${i}">Velocity Z (速度 Z)</label>
                    <input type="number" id="velZ-${i}" value="${body.velocity.z}" step="0.001">
                </div>
            </div>
        `;
        controlsContainer.appendChild(controlDiv);
    }
}

function initSimulation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    if (!renderer) {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, simulationContainer.clientWidth / simulationContainer.clientHeight, 0.1, 10000);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(simulationContainer.clientWidth, simulationContainer.clientHeight);
        simulationContainer.appendChild(renderer.domElement);
        // The camera's target for smooth lookAt transitions
        camera.target = new THREE.Vector3();

        // Add Grid Helper
        gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x888888);
        scene.add(gridHelper);
    }

    // Remove old grid if it exists and is not the initial one
    if (gridHelper && scene.children.includes(gridHelper)) {
        scene.remove(gridHelper);
    }
    // Re-add grid to ensure it's always present after re-initialization
    gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x888888);
    scene.add(gridHelper);

    bodies.forEach(body => scene.remove(body.mesh));
    bodies = [];

    for (let i = 0; i < 3; i++) {
        const mass = parseFloat(document.getElementById(`mass-${i}`).value) || 1;
        const posX = parseFloat(document.getElementById(`posX-${i}`).value) || 0;
        const posY = parseFloat(document.getElementById(`posY-${i}`).value) || 0;
        const posZ = parseFloat(document.getElementById(`posZ-${i}`).value) || 0;
        const velX = parseFloat(document.getElementById(`velX-${i}`).value) || 0;
        const velY = parseFloat(document.getElementById(`velY-${i}`).value) || 0;
        const velZ = parseFloat(document.getElementById(`velZ-${i}`).value) || 0;

        const sphereRadius = Math.max(0.05, Math.pow(mass, 1/3) * 0.2);

        const body = {
            mass: mass,
            mesh: new THREE.Mesh(
                new THREE.SphereGeometry(sphereRadius, 32, 32),
                new THREE.MeshBasicMaterial({ color: defaultBodies[i].color })
            ),
            position: new THREE.Vector3(posX, posY, posZ),
            velocity: new THREE.Vector3(velX, velY, velZ)
        };
        bodies.push(body);
        scene.add(body.mesh);
        body.mesh.position.copy(body.position);
    }

    // Run the first frame of animation, or restart it
    animate();
}

const G = 1; // Gravitational constant for this specific problem
const BASE_TIME_STEP = 0.004; // Base time step for stability

function getCenterOfMass() {
    const centerOfMass = new THREE.Vector3();
    let totalMass = 0;
    if (bodies.length === 0) return centerOfMass;

    for (const body of bodies) {
        centerOfMass.add(body.position.clone().multiplyScalar(body.mass));
        totalMass += body.mass;
    }
    if (totalMass > 0) {
        centerOfMass.divideScalar(totalMass);
    }
    return centerOfMass;
}

function updateCamera() {
    if (!bodies || bodies.length === 0) return;

    const center = getCenterOfMass();

    const boundingBox = new THREE.Box3();
    for (const body of bodies) {
        boundingBox.expandByPoint(body.position);
    }

    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    const maxDim = Math.max(size.x, size.y);
    const fov = camera.fov * (Math.PI / 180);
    const cameraDistance = Math.abs((maxDim / 2) / Math.tan(fov / 2));
    
    const padding = 1.5;
    // Calculate camera position for a 45-degree angle from above
    const angle = Math.PI / 4; // 45 degrees in radians
    const cameraOffset = Math.max(5, cameraDistance * padding); // Ensure a minimum distance
    const targetY = center.y + cameraOffset * Math.sin(angle);
    const targetZ = center.z + cameraOffset * Math.cos(angle);

    // Smoothly move the look-at target
    camera.target.lerp(center, 0.05);

    // Smoothly move the camera position
    const targetPosition = new THREE.Vector3(center.x, targetY, targetZ);
    camera.position.lerp(targetPosition, 0.05);

    // Always look at the interpolated target
    camera.lookAt(camera.target);
}

function animate() {
    animationId = requestAnimationFrame(animate);

    const timeStep = BASE_TIME_STEP * simulationSpeed; // Apply simulation speed

    for (let i = 0; i < bodies.length; i++) {
        const bodyA = bodies[i];
        let totalForce = new THREE.Vector3();

        for (let j = 0; j < bodies.length; j++) {
            if (i === j) continue;
            const bodyB = bodies[j];

            const distanceVec = bodyB.position.clone().sub(bodyA.position);
            const distanceSq = distanceVec.lengthSq();

            if (distanceSq < 0.01) continue; // Prevent extreme forces at close range

            const forceMagnitude = (G * bodyA.mass * bodyB.mass) / distanceSq;
            const forceVec = distanceVec.normalize().multiplyScalar(forceMagnitude);
            totalForce.add(forceVec);
        }

        const acceleration = totalForce.clone().divideScalar(bodyA.mass);
        bodyA.velocity.add(acceleration.multiplyScalar(timeStep));
        bodyA.position.add(bodyA.velocity.clone().multiplyScalar(timeStep));
    }

    // Update mesh positions after all calculations are done for the step
    for (const body of bodies) {
        body.mesh.position.copy(body.position);
    }

    updateCamera();

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    if (renderer && camera && simulationContainer) {
        const width = simulationContainer.clientWidth;
        const height = simulationContainer.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
}, false);

// Initial setup
createControls();
startButton.addEventListener('click', initSimulation);

// Speed slider event listener
speedSlider.addEventListener('input', (event) => {
    simulationSpeed = parseFloat(event.target.value);
    speedValueDisplay.textContent = `${simulationSpeed.toFixed(1)}x`;
});

// Preset button event listeners
presetFigureEightBtn.addEventListener('click', () => applyPreset(presets.figureEight));
presetMiniSolarSystemBtn.addEventListener('click', () => applyPreset(presets.miniSolarSystem));
presetChaoticDanceBtn.addEventListener('click', () => applyPreset(presets.chaoticDance));
presetCollapsingFigureEightBtn.addEventListener('click', () => applyPreset(presets.collapsingFigureEight));

// Start with default values on page load
initSimulation();
