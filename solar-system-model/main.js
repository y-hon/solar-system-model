// main.js - Corrected and Reordered

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// 1. SCENE SETUP
const scene = new THREE.Scene();
const canvas = document.querySelector('#solarSystemCanvas');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 50000);
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

// 2. CONTROLS & CAMERA POSITION
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 100;
controls.maxDistance = 40000;
camera.position.set(0, 2000, 12000);
controls.update();

// Stop auto-zooming when user interacts with controls
controls.addEventListener('start', () => {
    isAutoZooming = false;
});

// 3. LIGHTS
const ambientLight = new THREE.AmbientLight(0x666666);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 5, 0);
scene.add(pointLight);

// 4. CONSTANTS & SCALE SETTINGS
const AU_SCALE = 1000;
const EARTH_RADIUS_SCALE = 20;
const EARTH_RADIUS_KM = 6371;
const RADIUS_KM_TO_SCENE_SCALE = EARTH_RADIUS_SCALE / EARTH_RADIUS_KM;

// Logarithmic time scale settings
const MIN_LOG_TIME_SCALE = -2; // Represents 10^-2 = 0.01
const MAX_LOG_TIME_SCALE = 4;  // Represents 10^4 = 10000
let TIME_SCALE; // Will be initialized at the end

// 5. DATA DEFINITIONS
const sunData = {
    name: 'Sun',
    japaneseName: '太陽',
    description: '太陽系の中心に位置する恒星。地球の約109倍の直径を持ち、その質量は太陽系全体の99.8%以上を占める。核融合反応により、光と熱を放出している。',
    radiusEarth: 109,
    isSun: true,
    axialTilt: 7.25,
    rotationPeriodHours: 609.12
};

const planetsData = [
    { name: 'Mercury', japaneseName: '水星', radiusEarth: 0.38, auDistance: 0.39, orbitalPeriodDays: 88, inclinationDegrees: 7.0, eccentricity: 0.205, axialTilt: 0.03, rotationPeriodHours: 1407.6, textureUrl: './textures/2k_mercury.jpg', description: '太陽に最も近い惑星。大気がほとんどなく、昼夜の寒暖差が非常に激しい。主に岩石と金属で構成されている。' },
    { name: 'Venus', japaneseName: '金星', radiusEarth: 0.95, auDistance: 0.72, orbitalPeriodDays: 225, inclinationDegrees: 3.4, eccentricity: 0.007, axialTilt: 177.4, rotationPeriodHours: -5832.5, textureUrl: './textures/2k_venus_surface.jpg', description: '厚い二酸化炭素の雲に覆われた灼熱の惑星。自転が非常に遅く、他の惑星とは逆向きに自転している。地表は岩石や金属からなる。' },
    { name: 'Earth', japaneseName: '地球', radiusEarth: 1.0, auDistance: 1.0, orbitalPeriodDays: 365.25, inclinationDegrees: 0.0, eccentricity: 0.017, axialTilt: 23.44, rotationPeriodHours: 23.93, textureUrl: './textures/2k_earth_daymap.jpg', moons: [{ name: 'Moon', radius: 1737, distance: 384400, orbitalPeriodDays: 27.3, textureUrl: null, color: 0x888888 }], description: '私たちが住む、生命あふれる水の惑星。適度な大気（主に窒素と酸素）と磁場が生命を育んでいる。'},
    { name: 'Mars', japaneseName: '火星', radiusEarth: 0.53, auDistance: 1.52, orbitalPeriodDays: 687, inclinationDegrees: 1.85, eccentricity: 0.093, axialTilt: 25.19, rotationPeriodHours: 24.62, textureUrl: './textures/2k_mars.jpg', description: '「赤い惑星」として知られる。かつては水が存在した痕跡があり、生命の可能性が探られている。大気は主に二酸化炭素で、地表は岩石と金属でできている。' },
    { name: 'Jupiter', japaneseName: '木星', radiusEarth: 11.2, auDistance: 5.2, orbitalPeriodDays: 4333, inclinationDegrees: 1.3, eccentricity: 0.048, axialTilt: 3.13, rotationPeriodHours: 9.93, textureUrl: './textures/2k_jupiter.jpg', moons: [{ name: 'Io', radius: 1821, distance: 421700, orbitalPeriodDays: 1.77, color: 0xf9d71c }, { name: 'Europa', radius: 1560, distance: 671034, orbitalPeriodDays: 3.55, color: 0xa9a9a9 }, { name: 'Ganymede', radius: 2634, distance: 1070412, orbitalPeriodDays: 7.15, color: 0x8b4513 }, { name: 'Callisto', radius: 2410, distance: 1882709, orbitalPeriodDays: 16.69, color: 0x4a4a4a }], description: '太陽系最大の惑星。巨大なガス惑星で、特徴的な大赤斑は巨大な嵐。主成分は水素とヘリウム。'},
    { name: 'Saturn', japaneseName: '土星', radiusEarth: 9.45, auDistance: 9.58, orbitalPeriodDays: 10759, inclinationDegrees: 2.5, eccentricity: 0.054, axialTilt: 26.73, rotationPeriodHours: 10.66, textureUrl: './textures/2k_saturn.jpg', rings: { innerRadius: 74500, outerRadius: 140180, textureUrl: null }, description: '美しい環を持つことで有名。環は主に氷の粒子からできている。主成分は木星と同じく水素とヘリウム。' },
    { name: 'Uranus', japaneseName: '天王星', radiusEarth: 4.0, auDistance: 19.2, orbitalPeriodDays: 30687, inclinationDegrees: 0.77, eccentricity: 0.047, axialTilt: 97.77, rotationPeriodHours: -17.24, textureUrl: './textures/2k_uranus.jpg', description: '横倒しになって自転する、氷の惑星。メタンの大気により青く見える。内部は水やメタン、アンモニアの氷が主成分。' },
    { name: 'Neptune', japaneseName: '海王星', radiusEarth: 3.88, auDistance: 30.1, orbitalPeriodDays: 60190, inclinationDegrees: 1.77, eccentricity: 0.009, axialTilt: 28.32, rotationPeriodHours: 16.11, textureUrl: './textures/2k_neptune.jpg', description: '太陽系で最も外側にある惑星。太陽系で最も速い風が吹いている。天王星と同様に、水やメタン、アンモニアの氷が主成分。' },
    { name: 'Pluto', japaneseName: '冥王星', radiusEarth: 0.18, auDistance: 39.5, orbitalPeriodDays: 90560, inclinationDegrees: 17.1, eccentricity: 0.248, axialTilt: 119.6, rotationPeriodHours: -153.3, color: 0xD3D3D3, description: '2006年に準惑星に分類された天体。窒素の氷で覆われている。' }
];

// 6. OBJECT CREATION
const textureLoader = new THREE.TextureLoader();

// Sun
const sunRadius = EARTH_RADIUS_SCALE * 3;
sunData.scaledRadius = sunRadius; // Add scaledRadius to sunData
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunTexture = textureLoader.load('./textures/2k_sun.jpg');
const sunMaterial = new THREE.MeshPhongMaterial({ map: sunTexture, emissive: 0xffff00, emissiveMap: sunTexture, emissiveIntensity: 1.2 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.userData = sunData;
sun.rotation.x = THREE.MathUtils.degToRad(sunData.axialTilt);
scene.add(sun);
const sunAxisGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -sunRadius * 1.5, 0), new THREE.Vector3(0, sunRadius * 1.5, 0)]);
const sunAxisMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
const sunAxis = new THREE.Line(sunAxisGeometry, sunAxisMaterial);
sun.add(sunAxis);

// Planets, Moons, Rings, and Labels
const planets = [];
const planetLabels = {};

// Add Sun's label first
const sunLabelDiv = document.createElement('div');
sunLabelDiv.className = 'planet-label';
sunLabelDiv.innerHTML = `${sunData.name}<br>(${sunData.japaneseName})`;
document.getElementById('labels').appendChild(sunLabelDiv);
planetLabels[sunData.name] = sunLabelDiv;

planetsData.forEach(data => {
    // Pre-calculate scaled values
    data.scaledRadius = data.radiusEarth * EARTH_RADIUS_SCALE;
    data.scaledDistance = data.auDistance * AU_SCALE;
    data.inclinationRadians = THREE.MathUtils.degToRad(data.inclinationDegrees);
    data.axialTiltRadians = THREE.MathUtils.degToRad(data.axialTilt);

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

    const axisGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -data.scaledRadius * 1.5, 0), new THREE.Vector3(0, data.scaledRadius * 1.5, 0)]);
    const axisMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const axis = new THREE.Line(axisGeometry, axisMaterial);
    planet.add(axis);

    planet.userData = { ...data, angle: Math.random() * Math.PI * 2, isPlanet: true };
    planets.push(planet);

    if (data.rings) {
        const ringGeometry = new THREE.RingGeometry(data.rings.innerRadius * RADIUS_KM_TO_SCENE_SCALE, data.rings.outerRadius * RADIUS_KM_TO_SCENE_SCALE, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
    }

    if (data.moons) {
        data.moons.forEach(moonData => {
            const moonScaledRadius = moonData.radius * RADIUS_KM_TO_SCENE_SCALE;
            const moonScaledDistance = moonData.distance / 10000;
            const moonGeometry = new THREE.SphereGeometry(moonScaledRadius, 16, 16);
            const moonMaterial = new THREE.MeshStandardMaterial({ color: moonData.color });
            const moon = new THREE.Mesh(moonGeometry, moonMaterial);
            moon.userData = { ...moonData, angle: Math.random() * Math.PI * 2, scaledDistance: moonScaledDistance };
            planet.add(moon);
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

    // Add click listener to the label, specifically for Earth
    if (data.name === 'Earth') {
        labelDiv.addEventListener('click', () => {
            // Only trigger if Earth is currently focused
            if (focusedPlanet && focusedPlanet.userData.name === 'Earth') {
                window.open('https://earth.google.com/web/search/日本/@8.54729791,143.34085334,-2588.96230031a,22526662.60063648d,35y,0h,0t,0r/data=CiwiJgokCQ-jz3suyzxAEdcgkz8F1zvAGV2EDLczyBNAIcHKyXETr1rAQgIIAToDCgEwQgIIAEoNCP___________wEQAA', '_blank');
            }
        });
    }

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
const asteroidBelt = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x888888 }), asteroidCount);
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

// 7. UI & EVENT HANDLERS
// State variables
let focusedPlanet = null;
let hoveredPlanet = null;
let isAutoZooming = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// DOM Elements
const infoPanel = document.getElementById('info-panel');
const planetButtonsContainer = document.getElementById('planet-buttons');
const tourButton = document.getElementById('tourButton');
const timeScaleSlider = document.getElementById('timeScaleSlider');
const earthMarkerLabel = document.getElementById('earth-marker-label');

// UI Update Functions
function updateInfoPanel(data) {
    let htmlContent;
    if (data.isSun) {
        htmlContent = `<h3>${data.name} (${data.japaneseName})</h3><p><strong>分類:</strong> 恒星</p><p><strong>直径 (地球比):</strong> ${data.radiusEarth.toLocaleString()}</p><p style="margin-top: 15px;"><strong>概要:</strong> ${data.description}</p>`;
    } else {
        const rotationDirection = data.rotationPeriodHours > 0 ? '順行' : '逆行';
        const rotationDays = Math.abs(data.rotationPeriodHours / 24).toFixed(2);
        htmlContent = `<h3>${data.name} (${data.japaneseName})</h3><p><strong>分類:</strong> ${data.name === 'Pluto' ? '準惑星' : '惑星'}</p><p><strong>太陽からの平均距離:</strong> ${data.auDistance} AU</p><p><strong>公転周期:</strong> ${data.orbitalPeriodDays.toLocaleString()} 日</p><p><strong>自転周期:</strong> ${rotationDays} 日 (${rotationDirection})</p><p><strong>地軸の傾き:</strong> ${data.axialTilt}°</p><p><strong>半径 (地球比):</strong> ${data.radiusEarth}</p><p><strong>軌道離心率:</strong> ${data.eccentricity}</p><p><strong>軌道傾斜角:</strong> ${data.inclinationDegrees}°</p><p style="margin-top: 15px;"><strong>概要:</strong> ${data.description}</p>`;
    }

    if (data.name === 'Earth') {
        htmlContent += `<button id="googleEarthButton">Google Earthで詳しく見る</button>`;
    }

    infoPanel.innerHTML = htmlContent;

    if (data.name === 'Earth') {
        document.getElementById('googleEarthButton').addEventListener('click', () => {
            window.open('https://earth.google.com/web/search/日本/@8.54729791,143.34085334,-2588.96230031a,22526662.60063648d,35y,0h,0t,0r/data=CiwiJgokCQ-jz3suyzxAEdcgkz8F1zvAGV2EDLczyBNAIcHKyXETr1rAQgIIAToDCgEwQgIIAEoNCP___________wEQAA', '_blank');
        });
    }
}

function clearInfoPanel() {
    infoPanel.innerHTML = '';
}

function setFocus(celestialObject, initiatedByButton = false) {
    // If the focus is changed, stop any ongoing tour
    if (tourActive) {
        tourActive = false;
        tourButton.textContent = 'ツアー開始';
        controls.enabled = true;
        clearTimeout(tourTimeout);
    }

    // Reset the label and class of the previously focused planet if it was Earth
    if (focusedPlanet && focusedPlanet.userData.name === 'Earth') {
        const oldEarthLabel = planetLabels['Earth'];
        oldEarthLabel.innerHTML = `${focusedPlanet.userData.name}<br>(${focusedPlanet.userData.japaneseName})`;
        oldEarthLabel.classList.remove('earth-focused');
    }

    if (focusedPlanet) {
        const oldLabel = planetLabels[focusedPlanet.userData.name];
        if (oldLabel && !oldLabel.classList.contains('pluto-label-always-visible')) {
            oldLabel.classList.remove('focused', 'visible');
        }
    }

    focusedPlanet = celestialObject;
    isAutoZooming = initiatedByButton;

    if (focusedPlanet) {
        const newLabel = planetLabels[focusedPlanet.userData.name];
        if (newLabel) {
            newLabel.classList.add('visible', 'focused');
            // If the new focused planet is Earth, change its label and add a class
            if (focusedPlanet.userData.name === 'Earth') {
                newLabel.innerHTML = `地球 (クリックで拡大)`;
                newLabel.classList.add('earth-focused');
            }
        }
        updateInfoPanel(focusedPlanet.userData);
    } else {
        clearInfoPanel();
    }
}

// Button Creation
const sunButton = document.createElement('button');
sunButton.textContent = '太陽';
sunButton.addEventListener('click', () => setFocus(sun));
planetButtonsContainer.appendChild(sunButton);

planetsData.forEach((data, index) => {
    const button = document.createElement('button');
    button.textContent = data.japaneseName;
    button.addEventListener('click', () => setFocus(planets[index], true));
    planetButtonsContainer.appendChild(button);
});

// Tour Logic
let tourActive = false;
let tourIndex = 0;
let tourTimeout;
const tourStops = [sun, ...planets];
let tourState = 'idle';

function advanceTour() {
    tourIndex = (tourIndex + 1) % tourStops.length;
    setFocus(tourStops[tourIndex]);
    tourState = 'moving';
}

tourButton.addEventListener('click', () => {
    tourActive = !tourActive;
    if (tourActive) {
        tourButton.textContent = 'ツアー停止';
        controls.enabled = false;
        tourIndex = 0;
        setFocus(tourStops[tourIndex]);
        tourState = 'moving';
    } else {
        tourButton.textContent = 'ツアー開始';
        controls.enabled = true;
        tourState = 'idle';
        clearTimeout(tourTimeout);
        setFocus(null);
    }
});

// Mouse Event Handlers
function handleMouseMove(event) {
    const canvasBounds = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([sun, ...planets]);
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
    // Check if the click was on a label. If so, do nothing here as it's handled by the label's own listener.
    if (event.target.classList.contains('planet-label')) {
        return;
    }

    const canvasBounds = canvas.getBoundingClientRect();
    if (event.clientX < canvasBounds.left || event.clientX > canvasBounds.right || event.clientY < canvasBounds.top || event.clientY > canvasBounds.bottom) return;

    mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([sun, ...planets]);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        setFocus(clickedObject);
    } else {
        // Clicked on empty space, unfocus
        setFocus(null);
    }
}

window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('click', handleClick);
window.addEventListener('resize', () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
});

// 8. ANIMATION LOOP
function animate() {
    requestAnimationFrame(animate);

    // Rotations
    sun.rotation.y += sun.userData.rotationSpeed;
    planets.forEach(planet => {
        planet.rotation.y += planet.userData.rotationSpeed;
    });

    // Orbits
    planets.forEach(planet => {
        const planetGroup = planet.parent;
        planet.userData.angle += planet.userData.speed;
        const r = planet.userData.scaledDistance * (1 - planet.userData.eccentricity * planet.userData.eccentricity) / (1 + planet.userData.eccentricity * Math.cos(planet.userData.angle));
        const x_ecliptic = r * Math.cos(planet.userData.angle);
        const z_ecliptic = r * Math.sin(planet.userData.angle);
        planetGroup.position.x = x_ecliptic;
        planetGroup.position.y = -z_ecliptic * Math.sin(planet.userData.inclinationRadians);
        planetGroup.position.z = z_ecliptic * Math.cos(planet.userData.inclinationRadians);

        planet.children.forEach(child => {
            if (child.userData.isPlanet || !child.userData.orbitalPeriodDays) return;
            child.userData.angle += child.userData.speed;
            child.position.x = Math.cos(child.userData.angle) * child.userData.scaledDistance;
            child.position.z = Math.sin(child.userData.angle) * child.userData.scaledDistance;
        });
    });

    // Camera Control
    if (tourActive) {
        controls.enabled = false; // Disable controls during tour
        if (focusedPlanet) {
            const targetPosition = new THREE.Vector3();
            focusedPlanet.getWorldPosition(targetPosition);
            const distance = focusedPlanet.userData.scaledRadius * 4;
            const offset = new THREE.Vector3(0, distance * 0.5, distance);
            const desiredPosition = targetPosition.clone().add(offset);

            if (tourState === 'moving') {
                camera.position.lerp(desiredPosition, 0.05);
                controls.target.lerp(targetPosition, 0.05);
                if (camera.position.distanceTo(desiredPosition) < 100) {
                    tourState = 'waiting';
                    const waitTime = focusedPlanet.userData.isSun ? 2000 : 5000;
                    tourTimeout = setTimeout(advanceTour, waitTime);
                }
            } else if (tourState === 'waiting') {
                // Hold position and target during wait time
                camera.position.copy(desiredPosition);
                controls.target.copy(targetPosition);
            }
        }
    } else {
        controls.enabled = true; // Ensure controls are enabled when not on tour
        if (focusedPlanet) {
            const targetPosition = new THREE.Vector3();
            focusedPlanet.getWorldPosition(targetPosition);
            controls.target.lerp(targetPosition, 0.1);

            if (isAutoZooming) {
                const distance = focusedPlanet.userData.scaledRadius * 4;
                const offset = new THREE.Vector3(0, distance * 0.5, distance);
                const desiredPosition = targetPosition.clone().add(offset);
                
                camera.position.lerp(desiredPosition, 0.08);

                // Stop auto-zooming when close enough
                if (camera.position.distanceTo(desiredPosition) < 10) {
                    isAutoZooming = false;
                }
            }
        } else {
            controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.1);
        }
    }

    controls.update();
    renderer.render(scene, camera);

    // Label Updates
    const canvasRect = canvas.getBoundingClientRect();
    const allCelestialObjects = [sun, ...planets];
    allCelestialObjects.forEach(celestialObject => {
        const vector = new THREE.Vector3();
        celestialObject.getWorldPosition(vector);
        vector.project(camera);
        const x = (vector.x * 0.5 + 0.5) * canvas.clientWidth;
        const y = (-vector.y * 0.5 + 0.5) * canvas.clientHeight;
        const label = planetLabels[celestialObject.userData.name];
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

// 9. INITIALIZATION
function logSlider(position) {
    const minp = 0;
    const maxp = 1000;
    const minv = MIN_LOG_TIME_SCALE;
    const maxv = MAX_LOG_TIME_SCALE;
    const scale = (maxv - minv) / (maxp - minp);
    return Math.pow(10, minv + scale * (position - minp));
}

function setTimeScale(value) {
    TIME_SCALE = value;
    // Update speeds for all objects
    sun.userData.rotationSpeed = (2 * Math.PI / (sunData.rotationPeriodHours / 24)) * TIME_SCALE;
    planets.forEach((planet, index) => {
        const data = planetsData[index];
        planet.userData.speed = (2 * Math.PI / data.orbitalPeriodDays) * TIME_SCALE;
        planet.userData.rotationSpeed = (2 * Math.PI / (data.rotationPeriodHours / 24)) * TIME_SCALE;
        if (data.moons) {
            planet.children.forEach(child => {
                const moonData = data.moons.find(m => m.name === child.userData.name);
                if (moonData) {
                    child.userData.speed = (2 * Math.PI / moonData.orbitalPeriodDays) * TIME_SCALE;
                }
            });
        }
    });
}

function updateSliderPosition(timeScaleValue) {
    // Inverse function of logSlider to find the slider position for a given time scale
    const minp = 0;
    const maxp = 1000;
    const minv = MIN_LOG_TIME_SCALE;
    const maxv = MAX_LOG_TIME_SCALE;
    const scale = (maxv - minv) / (maxp - minp);
    const position = (Math.log10(timeScaleValue) - minv) / scale + minp;
    timeScaleSlider.value = position;
}

// Set initial state
setTimeScale(logSlider(parseFloat(timeScaleSlider.value)));

// Event Listeners
timeScaleSlider.addEventListener('input', (event) => {
    const newTimeScale = logSlider(parseFloat(event.target.value));
    setTimeScale(newTimeScale);
});

earthMarkerLabel.addEventListener('click', () => {
    const earthData = planetsData.find(p => p.name === 'Earth');
    const targetTimeScale = earthData.orbitalPeriodDays / 3600;
    setTimeScale(targetTimeScale);
    updateSliderPosition(targetTimeScale);
});

animate(); // START THE RENDER LOOP