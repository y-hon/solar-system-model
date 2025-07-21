import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();



const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const controlsWidth = 250; // Must match CSS width
renderer.setSize(window.innerWidth - controlsWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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
    { name: 'Mercury', japaneseName: '水星', radiusEarth: 0.38, auDistance: 0.39, orbitalPeriodDays: 88, inclinationDegrees: 7.0, eccentricity: 0.205, color: 0x808080 },
    { name: 'Venus', japaneseName: '金星', radiusEarth: 0.95, auDistance: 0.72, orbitalPeriodDays: 225, inclinationDegrees: 3.4, eccentricity: 0.007, color: 0xFFA500 },
    { name: 'Earth', japaneseName: '地球', radiusEarth: 1.0, auDistance: 1.0, orbitalPeriodDays: 365.25, inclinationDegrees: 0.0, eccentricity: 0.017, color: 0x0000FF },
    { name: 'Mars', japaneseName: '火星', radiusEarth: 0.53, auDistance: 1.52, orbitalPeriodDays: 687, inclinationDegrees: 1.85, eccentricity: 0.093, color: 0xFF0000 },
    { name: 'Jupiter', japaneseName: '木星', radiusEarth: 11.2, auDistance: 5.2, orbitalPeriodDays: 4333, inclinationDegrees: 1.3, eccentricity: 0.048, color: 0xA52A2A },
    { name: 'Saturn', japaneseName: '土星', radiusEarth: 9.45, auDistance: 9.58, orbitalPeriodDays: 10759, inclinationDegrees: 2.5, eccentricity: 0.054, color: 0xB8860B },
    { name: 'Uranus', japaneseName: '天王星', radiusEarth: 4.0, auDistance: 19.2, orbitalPeriodDays: 30687, inclinationDegrees: 0.77, eccentricity: 0.047, color: 0xADD8E6 },
    { name: 'Neptune', japaneseName: '海王星', radiusEarth: 3.88, auDistance: 30.1, orbitalPeriodDays: 60190, inclinationDegrees: 1.77, eccentricity: 0.009, color: 0x00008B },
    { name: 'Pluto', japaneseName: '冥王星', radiusEarth: 0.18, auDistance: 39.5, orbitalPeriodDays: 90560, inclinationDegrees: 17.1, eccentricity: 0.248, color: 0xD3D3D3 }
];

planetsData.forEach(data => {
    data.scaledRadius = data.radiusEarth * EARTH_RADIUS_SCALE;
    data.scaledDistance = data.auDistance * AU_SCALE;
    data.speed = (2 * Math.PI / data.orbitalPeriodDays) * TIME_SCALE;
    data.inclinationRadians = THREE.MathUtils.degToRad(data.inclinationDegrees);
});

// Sun
const sunRadius = EARTH_RADIUS_SCALE * 3;
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planets
const planets = [];
const planetLabels = {};

planetsData.forEach(data => {
    const geometry = new THREE.SphereGeometry(data.scaledRadius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: data.color, emissive: data.color, emissiveIntensity: 0.5 });
    const planet = new THREE.Mesh(geometry, material);
    planet.userData = { ...data, angle: Math.random() * Math.PI * 2 }; // Store all data and add random angle
    scene.add(planet);
    planets.push(planet);

    const labelDiv = document.createElement('div');
    labelDiv.className = 'planet-label';
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

const timeScaleSlider = document.getElementById('timeScaleSlider');
timeScaleSlider.addEventListener('input', (event) => {
    TIME_SCALE = parseFloat(event.target.value);
    planets.forEach((planet, index) => {
        planet.userData.speed = (2 * Math.PI / planetsData[index].orbitalPeriodDays) * TIME_SCALE;
    });
});

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
    const canvasBounds = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - canvasBounds.left) / (window.innerWidth - controlsWidth)) * 2 - 1;
    mouse.y = -((event.clientY - canvasBounds.top) / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);

    if (hoveredPlanet && (!intersects.length || hoveredPlanet !== intersects[0].object)) {
        const oldLabel = planetLabels[hoveredPlanet.userData.name];
        if (oldLabel && !oldLabel.classList.contains('focused')) {
            oldLabel.classList.remove('visible');
        }
        hoveredPlanet = null;
    }

    if (intersects.length > 0 && hoveredPlanet !== intersects[0].object) {
        hoveredPlanet = intersects[0].object;
        const newLabel = planetLabels[hoveredPlanet.userData.name];
        if (newLabel) {
            newLabel.classList.add('visible');
        }
    }
}

function handleClick(event) {
    const canvasBounds = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - canvasBounds.left) / (window.innerWidth - controlsWidth)) * 2 - 1;
    mouse.y = -((event.clientY - canvasBounds.top) / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);

    if (focusedPlanet) {
        const oldLabel = planetLabels[focusedPlanet.userData.name];
        if (oldLabel) oldLabel.classList.remove('focused', 'visible');
    }

    if (intersects.length > 0) {
        focusedPlanet = intersects[0].object;
        const newLabel = planetLabels[focusedPlanet.userData.name];
        if (newLabel) newLabel.classList.add('visible', 'focused');
        updateInfoPanel(focusedPlanet.userData);
    } else {
        focusedPlanet = null;
        clearInfoPanel();
    }
}

window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('click', handleClick);

function animate() {
    requestAnimationFrame(animate);

    planets.forEach(planet => {
        planet.userData.angle += planet.userData.speed;
        const r = planet.userData.scaledDistance * (1 - planet.userData.eccentricity * planet.userData.eccentricity) / (1 + planet.userData.eccentricity * Math.cos(planet.userData.angle));
        const x_ecliptic = r * Math.cos(planet.userData.angle);
        const z_ecliptic = r * Math.sin(planet.userData.angle);
        planet.position.x = x_ecliptic;
        planet.position.y = -z_ecliptic * Math.sin(planet.userData.inclinationRadians);
        planet.position.z = z_ecliptic * Math.cos(planet.userData.inclinationRadians);
    });

    if (focusedPlanet) {
        const targetPosition = new THREE.Vector3();
        focusedPlanet.getWorldPosition(targetPosition);
        controls.target.lerp(targetPosition, 0.1);
    } else {
        controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.1);
    }

    controls.update();
    renderer.render(scene, camera);

    planets.forEach(planet => {
        const vector = new THREE.Vector3();
        planet.getWorldPosition(vector);
        vector.project(camera);
        const x = (vector.x * 0.5 + 0.5) * (window.innerWidth - controlsWidth);
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
        const label = planetLabels[planet.userData.name];
        if (label) {
            label.style.left = `${x}px`;
            label.style.top = `${y + 50}px`;
        }
    });
}

animate();

window.addEventListener('resize', () => {
    const controlsWidth = 250;
    camera.aspect = (window.innerWidth - controlsWidth) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth - controlsWidth, window.innerHeight);
});