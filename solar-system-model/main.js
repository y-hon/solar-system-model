import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();

const canvas = document.querySelector('#solarSystemCanvas');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
const controlsWidth = 250; // Re-introduced

const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 50000);
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 100;
controls.maxDistance = 40000; // Adjusted max distance
camera.position.set(0, 2000, 12000); // Initial camera position
controls.update();

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x666666);
scene.add(ambientLight);

// Add point light for the sun
const pointLight = new THREE.PointLight(0xffffff, 5, 0);
scene.add(pointLight);

// Constants for scaling
const AU_SCALE = 1000;
const EARTH_RADIUS_SCALE = 20;
let TIME_SCALE = 0.101458333;

// Planets data
const planetsData = [
    { name: 'Mercury', japaneseName: '水星', radiusEarth: 0.38, auDistance: 0.39, orbitalPeriodDays: 88, inclinationDegrees: 7.0, eccentricity: 0.205, axialTilt: 0.03, rotationPeriodHours: 1407.6, textureUrl: './textures/2k_mercury.jpg' },
    { name: 'Venus', japaneseName: '金星', radiusEarth: 0.95, auDistance: 0.72, orbitalPeriodDays: 225, inclinationDegrees: 3.4, eccentricity: 0.007, axialTilt: 177.4, rotationPeriodHours: -5832.5, textureUrl: './textures/2k_venus_surface.jpg' },
    { name: 'Earth', japaneseName: '地球', radiusEarth: 1.0, auDistance: 1.0, orbitalPeriodDays: 365.25, inclinationDegrees: 0.0, eccentricity: 0.017, axialTilt: 23.44, rotationPeriodHours: 23.93, textureUrl: './textures/2k_earth_daymap.jpg', moons: [
        { name: 'Moon', radius: 1737, distance: 384400, orbitalPeriodDays: 27.3, textureUrl: null, color: 0x888888 }
    ]},
    { name: 'Mars', japaneseName: '火星', radiusEarth: 0.53, auDistance: 1.52, orbitalPeriodDays: 687, inclinationDegrees: 1.85, eccentricity: 0.093, axialTilt: 25.19, rotationPeriodHours: 24.62, textureUrl: './textures/2k_mars.jpg' },
    { name: 'Jupiter', japaneseName: '木星', radiusEarth: 11.2, auDistance: 5.2, orbitalPeriodDays: 4333, inclinationDegrees: 1.3, eccentricity: 0.048, axialTilt: 3.13, rotationPeriodHours: 9.93, textureUrl: './textures/2k_jupiter.jpg', moons: [
        { name: 'Io', radius: 1821, distance: 421700, orbitalPeriodDays: 1.77, color: 0xf9d71c },
        { name: 'Europa', radius: 1560, distance: 671034, orbitalPeriodDays: 3.55, color: 0xa9a9a9 },
        { name: 'Ganymede', radius: 2634, distance: 1070412, orbitalPeriodDays: 7.15, color: 0x8b4513 },
        { name: 'Callisto', radius: 2410, distance: 1882709, orbitalPeriodDays: 16.69, color: 0x4a4a4a },
    ]},
    { name: 'Saturn', japaneseName: '土星', radiusEarth: 9.45, auDistance: 9.58, orbitalPeriodDays: 10759, inclinationDegrees: 2.5, eccentricity: 0.054, axialTilt: 26.73, rotationPeriodHours: 10.66, textureUrl: './textures/2k_saturn.jpg', rings: { innerRadius: 74500, outerRadius: 140180, textureUrl: null } },
    { name: 'Uranus', japaneseName: '天王星', radiusEarth: 4.0, auDistance: 19.2, orbitalPeriodDays: 30687, inclinationDegrees: 0.77, eccentricity: 0.047, axialTilt: 97.77, rotationPeriodHours: -17.24, textureUrl: './textures/2k_uranus.jpg' },
    { name: 'Neptune', japaneseName: '海王星', radiusEarth: 3.88, auDistance: 30.1, orbitalPeriodDays: 60190, inclinationDegrees: 1.77, eccentricity: 0.009, axialTilt: 28.32, rotationPeriodHours: 16.11, textureUrl: './textures/2k_neptune.jpg' },
    { name: 'Pluto', japaneseName: '冥王星', radiusEarth: 0.18, auDistance: 39.5, orbitalPeriodDays: 90560, inclinationDegrees: 17.1, eccentricity: 0.248, axialTilt: 119.6, rotationPeriodHours: -153.3, color: 0xD3D3D3 }
];

planetsData.forEach(data => {
    data.scaledRadius = data.radiusEarth * EARTH_RADIUS_SCALE;
    data.scaledDistance = data.auDistance * AU_SCALE;
    data.speed = (2 * Math.PI / data.orbitalPeriodDays) * TIME_SCALE;
    data.inclinationRadians = THREE.MathUtils.degToRad(data.inclinationDegrees);
    data.axialTiltRadians = THREE.MathUtils.degToRad(data.axialTilt);
    data.rotationSpeed = (2 * Math.PI / (data.rotationPeriodHours / 24)) * TIME_SCALE;
});

// Sun
const sunRadius = EARTH_RADIUS_SCALE * 3;
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const textureLoader = new THREE.TextureLoader();
const sunTexture = textureLoader.load('./textures/2k_sun.jpg');
const sunMaterial = new THREE.MeshPhongMaterial({ map: sunTexture, emissive: 0xffff00, emissiveMap: sunTexture, emissiveIntensity: 1.2 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planets, Moons, and Rings
const planets = [];
const planetLabels = {};
const EARTH_RADIUS_KM = 6371;
const RADIUS_KM_TO_SCENE_SCALE = EARTH_RADIUS_SCALE / EARTH_RADIUS_KM;

planetsData.forEach(data => {
    const planetGroup = new THREE.Group();
    scene.add(planetGroup);

    const geometry = new THREE.SphereGeometry(data.scaledRadius, 32, 32);
    const materialOptions = {};
    if (data.textureUrl) {
        materialOptions.map = textureLoader.load(data.textureUrl);
    } else if (data.color) {
        materialOptions.color = data.color;
    }
    const material = new THREE.MeshStandardMaterial(materialOptions);
    const planet = new THREE.Mesh(geometry, material);
    planet.rotation.x = data.axialTiltRadians;
    planetGroup.add(planet);

    planet.userData = { ...data, angle: Math.random() * Math.PI * 2, isPlanet: true };
    planets.push(planet);

    if (data.rings) {
        const ringGeometry = new THREE.RingGeometry(
            data.rings.innerRadius * RADIUS_KM_TO_SCENE_SCALE,
            data.rings.outerRadius * RADIUS_KM_TO_SCENE_SCALE,
            64
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaaaaa,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        // The ring is a child of the planet, so it will inherit the planet's axial tilt.
        // We just need to rotate it to lie flat on the planet's equatorial plane.
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
    }

    if (data.moons) {
        data.moons.forEach(moonData => {
            const moonScaledRadius = moonData.radius * RADIUS_KM_TO_SCENE_SCALE;
            const moonScaledDistance = moonData.distance / 10000; // Using a smaller scale for moon orbits for better visualization
            const moonGeometry = new THREE.SphereGeometry(moonScaledRadius, 16, 16);
            const moonMaterial = new THREE.MeshStandardMaterial({ color: moonData.color });
            const moon = new THREE.Mesh(moonGeometry, moonMaterial);
            moon.userData = { ...moonData, angle: Math.random() * Math.PI * 2, speed: (2 * Math.PI / moonData.orbitalPeriodDays) * TIME_SCALE, scaledDistance: moonScaledDistance };
            planet.add(moon); // Add moon to the planet
        });
    }

    const labelDiv = document.createElement('div');
    labelDiv.className = 'planet-label';
    if (data.name === 'Pluto') {
        labelDiv.classList.add('pluto-label-always-visible');
    }
    labelDiv.innerHTML = `${data.name}<br>(${data.japaneseName})`;
    document.getElementById('labels').appendChild(labelDiv);
    planetLabels[data.name] = labelDiv;

    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    const segments = 256;
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const r = data.scaledDistance * (1 - data.eccentricity * data.eccentricity) / (1 + data.eccentricity * Math.cos(angle));
        const x_ecliptic = r * Math.cos(angle);
        const z_ecliptic = r * Math.sin(angle);
        const y_inclined = -z_ecliptic * Math.sin(data.inclinationRadians);
        const z_inclined = z_ecliptic * Math.cos(data.inclinationRadians);
        orbitPoints.push(new THREE.Vector3(x_ecliptic, y_inclined, z_inclined));
    }
    orbitGeometry.setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbit);
});

// Asteroid Belt
const asteroidCount = 1500;
const asteroidBelt = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: 0x888888 }),
    asteroidCount
);

const dummy = new THREE.Object3D();
for (let i = 0; i < asteroidCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = THREE.MathUtils.randFloat(2.2 * AU_SCALE, 3.2 * AU_SCALE);
    const height = THREE.MathUtils.randFloat(-50, 50);
    dummy.position.set(Math.cos(angle) * distance, height, Math.sin(angle) * distance);
    dummy.scale.setScalar(Math.random() * 5 + 2);
    dummy.updateMatrix();
    asteroidBelt.setMatrixAt(i, dummy.matrix);
}
scene.add(asteroidBelt);

const timeScaleSlider = document.getElementById('timeScaleSlider');
timeScaleSlider.addEventListener('input', (event) => {
    TIME_SCALE = parseFloat(event.target.value);
    planets.forEach((planet, index) => {
        planet.userData.speed = (2 * Math.PI / planetsData[index].orbitalPeriodDays) * TIME_SCALE;
        planet.userData.rotationSpeed = (2 * Math.PI / (planetsData[index].rotationPeriodHours / 24)) * TIME_SCALE;
        if (planet.children) {
            planet.children.forEach(child => {
                if (child.userData.speed) { // Moons
                    child.userData.speed = (2 * Math.PI / child.userData.orbitalPeriodDays) * TIME_SCALE;
                }
            });
        }
    });
});

const planetButtonsContainer = document.getElementById('planet-buttons');

function setFocus(planetToFocus) {
    if (focusedPlanet) {
        const oldLabel = planetLabels[focusedPlanet.userData.name];
        if (oldLabel && !oldLabel.classList.contains('pluto-label-always-visible')) {
            oldLabel.classList.remove('focused', 'visible');
        }
    }

    focusedPlanet = planetToFocus;

    if (focusedPlanet) {
        const newLabel = planetLabels[focusedPlanet.userData.name];
        if (newLabel) {
            newLabel.classList.add('visible', 'focused');
        }
        updateInfoPanel(focusedPlanet.userData);
    } else {
        clearInfoPanel();
    }
}

planetsData.forEach((data, index) => {
    const button = document.createElement('button');
    button.textContent = data.japaneseName;
    button.addEventListener('click', () => {
        setFocus(planets[index]);
    });
    planetButtonsContainer.appendChild(button);
});

const sunButton = document.createElement('button');
sunButton.textContent = '太陽';
sunButton.addEventListener('click', () => {
    setFocus(null);
});
planetButtonsContainer.appendChild(sunButton);

// Tour
let tourActive = false;
let tourIndex = -1;
let tourTimeout;
const tourStops = [null, ...planets]; // null for Sun
let tourState = 'idle'; // 'idle', 'moving', 'waiting'

const tourButton = document.getElementById('tourButton');
tourButton.addEventListener('click', () => {
    tourActive = !tourActive;
    if (tourActive) {
        tourButton.textContent = 'ツアー停止';
        controls.enabled = false;
        // Skip the sun and go directly to the first planet (Mercury)
        tourIndex = 1; // Mercury is at index 1 of tourStops
        const target = tourStops[tourIndex];
        setFocus(target);
        tourState = 'moving';
    } else {
        tourButton.textContent = 'ツアー開始';
        controls.enabled = true;
        tourState = 'idle';
        clearTimeout(tourTimeout);
    }
});

function advanceTour() {
    tourIndex = (tourIndex + 1) % tourStops.length;
    const target = tourStops[tourIndex];
    setFocus(target);
    tourState = 'moving';
}

let focusedPlanet = null;
let hoveredPlanet = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const infoPanel = document.getElementById('info-panel');

function updateInfoPanel(data) {
    infoPanel.innerHTML = `
        <h3>${data.name} (${data.japaneseName})</h3>
        <p><strong>分類:</strong> ${data.name === 'Pluto' ? '準惑星' : '惑星'}</p>
        <p><strong>太陽からの平均距離:</strong> ${data.auDistance} AU</p>
        <p><strong>公転周期:</strong> ${data.orbitalPeriodDays} 日</p>
        <p><strong>半径 (地球比):</strong> ${data.radiusEarth}</p>
        <p><strong>軌道離心率:</strong> ${data.eccentricity}</p>
        <p><strong>軌道傾斜角:</strong> ${data.inclinationDegrees}°</p>
    `;
}

function clearInfoPanel() {
    infoPanel.innerHTML = '';
}

function handleMouseMove(event) {
    const canvasBounds = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);

    if (hoveredPlanet && (!intersects.length || hoveredPlanet !== intersects[0].object)) {
        const oldLabel = planetLabels[hoveredPlanet.userData.name];
        if (oldLabel && !oldLabel.classList.contains('focused') && !oldLabel.classList.contains('pluto-label-always-visible')) {
            oldLabel.classList.remove('visible');
        }
        hoveredPlanet = null;
    }

    if (intersects.length > 0 && hoveredPlanet !== intersects[0].object) {
        hoveredPlanet = intersects[0].object;
        const newLabel = planetLabels[hoveredPlanet.userData.name];
        if (newLabel && !newLabel.classList.contains('pluto-label-always-visible')) {
            newLabel.classList.add('visible');
        }
    }
}

function handleClick(event) {
    // Check if the click is inside the canvas
    const canvasBounds = canvas.getBoundingClientRect();
    if (event.clientX < canvasBounds.left || event.clientX > canvasBounds.right ||
        event.clientY < canvasBounds.top || event.clientY > canvasBounds.bottom) {
        return; // Click was outside the canvas
    }

    mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);

    if (intersects.length > 0) {
        setFocus(intersects[0].object);
    } else {
        setFocus(null);
    }
}

window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('click', handleClick);

function animate() {
    requestAnimationFrame(animate);

    planets.forEach(planet => {
        // Planet Rotation
        planet.rotation.y += planet.userData.rotationSpeed;

        // Planet Orbit
        const planetGroup = planet.parent;
        planet.userData.angle += planet.userData.speed;
        const r = planet.userData.scaledDistance * (1 - planet.userData.eccentricity * planet.userData.eccentricity) / (1 + planet.userData.eccentricity * Math.cos(planet.userData.angle));
        const x_ecliptic = r * Math.cos(planet.userData.angle);
        const z_ecliptic = r * Math.sin(planet.userData.angle);
        planetGroup.position.x = x_ecliptic;
        planetGroup.position.y = -z_ecliptic * Math.sin(planet.userData.inclinationRadians);
        planetGroup.position.z = z_ecliptic * Math.cos(planet.userData.inclinationRadians);

        // Moon Orbit
        planet.children.forEach(child => {
            if (child.userData.speed) { // Moons
                child.userData.angle += child.userData.speed;
                child.position.x = Math.cos(child.userData.angle) * child.userData.scaledDistance;
                child.position.z = Math.sin(child.userData.angle) * child.userData.scaledDistance;
            }
        });
    });

    if (tourActive) {
        let targetPosition;
        let desiredPosition;

        if (focusedPlanet) {
            targetPosition = new THREE.Vector3();
            focusedPlanet.getWorldPosition(targetPosition);
            const distance = focusedPlanet.userData.scaledRadius * 4;
            const offset = new THREE.Vector3(0, distance * 0.5, distance);
            desiredPosition = targetPosition.clone().add(offset);
        } else {
            targetPosition = new THREE.Vector3(0, 0, 0);
            desiredPosition = new THREE.Vector3(0, 2000, 12000);
        }

        if (tourState === 'moving') {
            camera.position.lerp(desiredPosition, 0.05);
            controls.target.lerp(targetPosition, 0.05);

            if (camera.position.distanceTo(desiredPosition) < 100) {
                tourState = 'waiting';
                tourTimeout = setTimeout(advanceTour, 5000);
            }
        } else if (tourState === 'waiting') {
            // Lock camera to the desired position relative to the moving planet
            camera.position.copy(desiredPosition);
            controls.target.copy(targetPosition);
        }

    } else {
        if (focusedPlanet) {
            const targetPosition = new THREE.Vector3();
            focusedPlanet.getWorldPosition(targetPosition);
            controls.target.lerp(targetPosition, 0.1);
        } else {
            controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.1);
        }
    }

    controls.update();
    renderer.render(scene, camera);

    // Update labels
    const canvasRect = canvas.getBoundingClientRect();
    planets.forEach(planet => {
        const vector = new THREE.Vector3();
        planet.getWorldPosition(vector);
        vector.project(camera);

        const x = (vector.x * 0.5 + 0.5) * canvas.clientWidth;
        const y = (-vector.y * 0.5 + 0.5) * canvas.clientHeight;

        const label = planetLabels[planet.userData.name];
        if (label) {
            if (vector.z > 1) {
                label.style.display = 'none';
            } else {
                label.style.display = 'block';
                label.style.left = `${canvasRect.left + x}px`;
                label.style.top = `${canvasRect.top + y}px`;
            }
        }
    });
}

animate();

window.addEventListener('resize', () => {
    // We need to get the new size of the canvas from the layout
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Important: false as the third argument to prevent Three.js from setting the canvas style.
    renderer.setSize(width, height, false);
});
