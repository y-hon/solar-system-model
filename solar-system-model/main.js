import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

const scene = new THREE.Scene();

// Add starry background
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1, sizeAttenuation: true });

const starVertices = [];
for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 20000;
    const y = (Math.random() - 0.5) * 20000;
    const z = (Math.random() - 0.5) * 20000;
    starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const controlsWidth = 250; // Must match CSS width
renderer.setSize(window.innerWidth - controlsWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x666666); // Brighter ambient light
scene.add(ambientLight);

// Add point light for the sun
const pointLight = new THREE.PointLight(0xffffff, 5, 0); // Increased intensity
scene.add(pointLight);

// Constants for scaling
const AU_SCALE = 1000; // 1 AU = 1000 Three.js units (distances are much larger)
const EARTH_RADIUS_SCALE = 20; // Earth's radius in Three.js units (planets are larger)
let TIME_SCALE = 0.101458333; // Earth orbits in ~1 minute

// Planets data with realistic relative values
const planetsData = [
    {
        name: 'Mercury',
        japaneseName: '水星',
        radiusEarth: 0.38,
        auDistance: 0.39, // Semi-major axis
        orbitalPeriodDays: 88,
        inclinationDegrees: 7.0,
        eccentricity: 0.205,
        color: 0x808080
    },
    {
        name: 'Venus',
        japaneseName: '金星',
        radiusEarth: 0.95,
        auDistance: 0.72,
        orbitalPeriodDays: 225,
        inclinationDegrees: 3.4,
        eccentricity: 0.007,
        color: 0xFFA500
    },
    {
        name: 'Earth',
        japaneseName: '地球',
        radiusEarth: 1.0,
        auDistance: 1.0,
        orbitalPeriodDays: 365.25,
        inclinationDegrees: 0.0, // Ecliptic reference
        eccentricity: 0.017,
        color: 0x0000FF
    },
    {
        name: 'Mars',
        japaneseName: '火星',
        radiusEarth: 0.53,
        auDistance: 1.52,
        orbitalPeriodDays: 687,
        inclinationDegrees: 1.85,
        eccentricity: 0.093,
        color: 0xFF0000
    },
    {
        name: 'Jupiter',
        japaneseName: '木星',
        radiusEarth: 11.2,
        auDistance: 5.2,
        orbitalPeriodDays: 4333, // ~11.86 Earth years
        inclinationDegrees: 1.3,
        eccentricity: 0.048,
        color: 0xA52A2A
    },
    {
        name: 'Saturn',
        japaneseName: '土星',
        radiusEarth: 9.45,
        auDistance: 9.58,
        orbitalPeriodDays: 10759, // ~29.46 Earth years
        inclinationDegrees: 2.5,
        eccentricity: 0.054,
        color: 0xB8860B
    },
    {
        name: 'Uranus',
        japaneseName: '天王星',
        radiusEarth: 4.0,
        auDistance: 19.2,
        orbitalPeriodDays: 30687, // ~84.01 Earth years
        inclinationDegrees: 0.77,
        eccentricity: 0.047,
        color: 0xADD8E6
    },
    {
        name: 'Neptune',
        japaneseName: '海王星',
        radiusEarth: 3.88,
        auDistance: 30.1,
        orbitalPeriodDays: 60190, // ~164.79 Earth years
        inclinationDegrees: 1.77,
        eccentricity: 0.009,
        color: 0x00008B
    },
    {
        name: 'Pluto',
        japaneseName: '冥王星',
        radiusEarth: 0.18,
        auDistance: 39.5,
        orbitalPeriodDays: 90560, // ~248 Earth years
        inclinationDegrees: 17.1,
        eccentricity: 0.248,
        color: 0xD3D3D3
    }
];

// Calculate scaled values and orbital speed
planetsData.forEach(data => {
    data.scaledRadius = data.radiusEarth * EARTH_RADIUS_SCALE;
    data.scaledDistance = data.auDistance * AU_SCALE; // This is now semi-major axis
    data.speed = (2 * Math.PI / data.orbitalPeriodDays) * TIME_SCALE;
    data.inclinationRadians = THREE.MathUtils.degToRad(data.inclinationDegrees);
});

// Sun size relative to planets
const sunRadius = EARTH_RADIUS_SCALE * 3; // Adjusted for visual balance with planets

// Sun
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planets
const planets = [];
const planetLabels = {}; // To store references to HTML label elements

planetsData.forEach(data => {
    const geometry = new THREE.SphereGeometry(data.scaledRadius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: data.color, emissive: data.color, emissiveIntensity: 0.5 });
    const planet = new THREE.Mesh(geometry, material);
    planet.userData = {
        semiMajorAxis: data.scaledDistance,
        eccentricity: data.eccentricity,
        speed: data.speed,
        inclination: data.inclinationRadians,
        angle: Math.random() * Math.PI * 2, // Start at random angle
        name: data.name, // Store name for label
        japaneseName: data.japaneseName // Store Japanese name for label
    };
    scene.add(planet);
    planets.push(planet);

    // Create HTML label element
    const labelDiv = document.createElement('div');
    labelDiv.className = 'planet-label';
    labelDiv.innerHTML = `${data.name}<br>(${data.japaneseName})`;
    document.getElementById('labels').appendChild(labelDiv);
    planetLabels[data.name] = labelDiv;

    // Draw orbit
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    const segments = 256; // More segments for smoother ellipse
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const r = data.scaledDistance * (1 - data.eccentricity * data.eccentricity) / (1 + data.eccentricity * Math.cos(angle));

        const x_ecliptic = r * Math.cos(angle);
        const z_ecliptic = r * Math.sin(angle);

        // Apply inclination
        const y_inclined = -z_ecliptic * Math.sin(data.inclinationRadians);
        const z_inclined = z_ecliptic * Math.cos(data.inclinationRadians);

        orbitPoints.push(new THREE.Vector3(x_ecliptic, y_inclined, z_inclined));
    }
    orbitGeometry.setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff }); // White orbit line
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbit);
});

// Adjust camera position to see all planets
const initialZoomZ = parseFloat(document.getElementById('zoomSlider').value);
camera.position.set(0, initialZoomZ * 0.24, initialZoomZ); // Initial camera position, y is proportional to z
camera.lookAt(0, 0, 0); // Look at the origin (Sun)

const zoomSlider = document.getElementById('zoomSlider');
zoomSlider.addEventListener('input', (event) => {
    const newZ = parseFloat(event.target.value);
    camera.position.z = newZ;
    camera.position.y = newZ * 0.24; // Maintain proportionality
});

const xSlider = document.getElementById('xSlider');
xSlider.addEventListener('input', (event) => {
    camera.position.x = parseFloat(event.target.value);
});

const ySlider = document.getElementById('ySlider');
ySlider.addEventListener('input', (event) => {
    camera.position.y = parseFloat(event.target.value);
});

const timeScaleSlider = document.getElementById('timeScaleSlider');
timeScaleSlider.addEventListener('input', (event) => {
    TIME_SCALE = parseFloat(event.target.value);
    // Recalculate planet speeds based on new TIME_SCALE
    planets.forEach((planet, index) => {
        planet.userData.speed = (2 * Math.PI / planetsData[index].orbitalPeriodDays) * TIME_SCALE;
    });
});

function animate() {
    requestAnimationFrame(animate);

    planets.forEach(planet => {
        planet.userData.angle += planet.userData.speed;

        // Calculate position on elliptical orbit
        const r = planet.userData.semiMajorAxis * (1 - planet.userData.eccentricity * planet.userData.eccentricity) / (1 + planet.userData.eccentricity * Math.cos(planet.userData.angle));

        const x_ecliptic = r * Math.cos(planet.userData.angle);
        const z_ecliptic = r * Math.sin(planet.userData.angle);

        // Apply inclination (rotate around X-axis)
        planet.position.x = x_ecliptic;
        planet.position.y = -z_ecliptic * Math.sin(planet.userData.inclination);
        planet.position.z = z_ecliptic * Math.cos(planet.userData.inclination);
    });

    renderer.render(scene, camera);

    // Update HTML labels position
    planets.forEach(planet => {
        const vector = new THREE.Vector3();
        planet.getWorldPosition(vector); // Get planet's 3D world position

        // Project 3D position to 2D screen coordinates
        vector.project(camera);

        const x = (vector.x * 0.5 + 0.5) * (window.innerWidth - controlsWidth);
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

        const label = planetLabels[planet.userData.name];
        if (label) {
            label.style.left = `${x}px`;
            label.style.top = `${y + 50}px`; // Position below the planet with a fixed offset
        }
    });
}

animate();

window.addEventListener('resize', () => {
    const controlsWidth = 250; // Must match CSS width
    camera.aspect = (window.innerWidth - controlsWidth) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth - controlsWidth, window.innerHeight);
});