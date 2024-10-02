import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/UnrealBloomPass.js';

// planets variables
let sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune;
let scene, composer, camera, renderer;

// distance between the planets
const distances = {
    sun: 0,
    mercury: 20,
    venus: 50,
    earth: 70,
    mars: 85,
    jupiter: 150,
    saturn: 180,
    uranus: 230,
    neptune: 250,
};

// Revolution speeds (Orbital periods) in Earth years
const revolutionSpeeds = {
    sun: 0,
    mercury: 2,
    venus: 1.5,
    earth: 1,
    mars: 0.8,
    jupiter: 0.7,
    saturn: 0.6,
    uranus: 0.5,
    neptune: 0.4
};

// Rotation speeds (Rotation periods) in Earth days
const rotationSpeeds = {
    sun: 25,
    mercury: 59,
    venus: 243,
    earth: 24,
    mars: 25,
    jupiter: 10,
    saturn: 11,
    uranus: 17,
    neptune: 16,
};

// Scales (Relative to Earth's radius)
const scales = {
    sun: 10,
    mercury: 1,
    venus: 2,
    earth: 2,
    mars: 1.4,
    jupiter: 6,
    saturn: 5,
    uranus: 4,
    neptune: 4
};

function loadPlanetTexture(texture, scale, widthSegments, heightSegments, meshType) {
    const geometry = new THREE.SphereGeometry(scale, widthSegments, heightSegments);
    const loader = new THREE.TextureLoader();
    const planetTexture = loader.load(texture);
    const material = meshType == 'standard' ? new THREE.MeshStandardMaterial({ map: planetTexture }) : new THREE.MeshBasicMaterial({ map: planetTexture });
    const planet = new THREE.Mesh(geometry, material);
    return planet
}

function addPlanets() {
    sun = loadPlanetTexture('./images/sun_hd.jpg', scales.sun, 128, 128, 'basic');
    mercury = loadPlanetTexture('./images/mercury_hd.jpg', scales.mercury, 128, 128, 'standard');
    venus = loadPlanetTexture('./images/venus_hd.jpg', scales.venus, 128, 128, 'standard');
    earth = loadPlanetTexture('./images/earth_hd.jpg', scales.earth, 128, 128, 'standard');
    mars = loadPlanetTexture('./images/mars_hd.jpg', scales.mars, 128, 128, 'standard');
    jupiter = loadPlanetTexture('./images/jupiter_hd.jpg', scales.jupiter, 128, 128, 'standard');
    saturn = loadPlanetTexture('./images/saturn_hd.jpg', scales.saturn, 128, 128, 'standard');
    uranus = loadPlanetTexture('./images/uranus_hd.jpg', scales.uranus, 128, 128, 'standard');
    neptune = loadPlanetTexture('./images/neptune_hd.jpg', scales.neptune, 128, 128, 'standard');

    scene.add(sun);
    scene.add(mercury);
    scene.add(venus);
    scene.add(earth);
    scene.add(mars);
    scene.add(jupiter);
    scene.add(saturn);
    scene.add(uranus);
    scene.add(neptune);
}

function addPlanetRotation() {
    mercury.rotation.y += rotationSpeeds.mercury / 2000;
    venus.rotation.y += rotationSpeeds.venus / 2000;
    earth.rotation.y += rotationSpeeds.earth / 2000;
    mars.rotation.y += rotationSpeeds.mars / 2000;
    jupiter.rotation.y += rotationSpeeds.jupiter / 2000;
    saturn.rotation.y += rotationSpeeds.saturn / 2000;
    uranus.rotation.y += rotationSpeeds.uranus / 2000;
    neptune.rotation.y += rotationSpeeds.neptune / 2000;
}

function planetRevolver(planet, speed, time, orbitRadius) {

    let orbitSpeedMultiplier = 0.001;
    const planetAngle = time * orbitSpeedMultiplier * speed;
    planet.position.x = sun.position.x + orbitRadius * Math.cos(planetAngle);
    planet.position.z = sun.position.z + orbitRadius * Math.sin(planetAngle);

}

function createRings(outerRadius) {
    let innerRadius = outerRadius - 0.3;
    let thetaSegments = 1000;
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments);
    const material = new THREE.MeshBasicMaterial({ antialias:true, color: 'gray', side: THREE.DoubleSide });
    const ring = new THREE.Mesh(geometry, material);
    scene.add(ring);
    ring.rotation.x = Math.PI / 2;
    return ring;
}

function createSunGlow() {
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            'c': { type: 'f', value: 0.3 },
            'p': { type: 'f', value: 3.0 },
            glowColor: { type: 'c', value: new THREE.Color(0xffff00) }, // yellowish glow
            viewVector: { type: 'v3', value: camera.position }
        },
        vertexShader: `
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize( normalMatrix * normal );
                vec3 vNormel = normalize( normalMatrix * viewVector );
                intensity = pow( 0.9 - dot(vNormal, vNormel), 6.0 );
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }`,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                gl_FragColor = vec4( glowColor * intensity, 1.0 );
            }`,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    const geometry = new THREE.SphereGeometry(scales.sun + 2, 128, 128);
    const glowMesh = new THREE.Mesh(geometry, glowMaterial);
    scene.add(glowMesh);
    return glowMesh;
}

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.z = 300;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.id = 'c';

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 20;

    addPlanets();

    createRings(distances.mercury);
    createRings(distances.venus);
    createRings(distances.earth);
    createRings(distances.mars);
    createRings(distances.jupiter);
    createRings(distances.saturn);
    createRings(distances.uranus);
    createRings(distances.neptune);

    const sunLight = new THREE.PointLight(0xffffff, 1, 0); // White light, intensity 1, no distance attenuation
    sunLight.position.copy(sun.position); // Position the light at the Sun's position
    scene.add(sunLight);

    // Add sun glow
    const sunGlow = createSunGlow();

    // Post-processing bloom effect
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0;
    bloomPass.strength = 1; // Bloom intensity
    bloomPass.radius = 1;
    composer.addPass(bloomPass);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", onWindowResize, false);

    function animate(time) {
        requestAnimationFrame(animate);

        addPlanetRotation();

        // adding revolution to the planets 
        planetRevolver(mercury, revolutionSpeeds.mercury, time, distances.mercury);
        planetRevolver(venus, revolutionSpeeds.venus, time, distances.venus);
        planetRevolver(earth, revolutionSpeeds.earth, time, distances.earth);
        planetRevolver(mars, revolutionSpeeds.mars, time, distances.mars);
        planetRevolver(jupiter, revolutionSpeeds.jupiter, time, distances.jupiter);
        planetRevolver(saturn, revolutionSpeeds.saturn, time, distances.saturn);
        planetRevolver(uranus, revolutionSpeeds.uranus, time, distances.uranus);
        planetRevolver(neptune, revolutionSpeeds.neptune, time, distances.neptune);

        composer.render();
    }

    animate();
}

init();