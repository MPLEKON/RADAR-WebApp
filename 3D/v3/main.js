console.log("Main JS file loaded");

import { parseCSV } from './csv_parser.js';

let scene, camera, renderer, controls;
let parsedData = [];
let mode = "static";
let frameIndex = 0;
let spheres = [];
let playbackTimer = null;
let isPaused = false;

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById("canvas");
    const toggle = document.getElementById("modeToggle");
    const startBtn = document.getElementById("startBtn");
    const pauseBtn = document.getElementById("pauseBtn");

    await loadAndParseCSV();
    let yMin = Infinity;
    let yMax = -Infinity;
    
    parsedData.forEach(frame => {
        if (Array.isArray(frame.points)) {
            frame.points.forEach(point => {
                if (typeof point.y === 'number') {
                    yMin = Math.min(yMin, point.y);
                    yMax = Math.max(yMax, point.y);
                }
            });
        }
    });

window.yRange = { min: yMin, max: yMax }; // make it globally accessible
console.log("Y range:", yMin, yMax);

    ({ scene, camera, renderer, controls } = createScene(container));
    window.camera = camera; // for manual debugging
    toggle.checked = false;

    startStatic();

    toggle.addEventListener("change", () => {
        if (toggle.checked) {
            console.log("Switched to Real-Time mode");
            mode = "realtime";
            startPlayback();
        } else {
            console.log("Switched back to Static mode");
            mode = "static";
            startStatic();
        }
    });

    animate(); // Start the shared render loop

    startBtn.addEventListener("click", () => {
        if (mode === "realtime") {
            console.log("Resuming playback...");
            isPaused = false;
            plotNextBatch();
        }
    });

    pauseBtn.addEventListener("click", () => {
        if (mode === "realtime") {
            console.log("Pausing playback...");
            isPaused = true;
            if (playbackTimer) clearTimeout(playbackTimer);
        }
    });
});

async function loadAndParseCSV() {
    try {
        const response = await fetch('./clean_approach.csv');
        const rawCSV = await response.text();
        parsedData = await parseCSV(rawCSV);
        console.log("Parsed Data:", parsedData);
    } catch (err) {
        console.error("Error loading/parsing CSV:", err);
    }
}

function createScene(container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const gridHelper = new THREE.GridHelper(250, 50);
    scene.add(gridHelper);

    const planeGeo = new THREE.PlaneBufferGeometry(25000, 10000, 8, 8);
    const planeMat = new THREE.MeshBasicMaterial({
        color: 0x99ccff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotateX(-Math.PI / 2);
    scene.add(plane);

    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(90, width / height, 1, 100000);
    camera.position.set(0, 12, 0);
    camera.rotation.set(-3.1025, 0, -3.1414);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 12, 10);
    controls.update();




    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
    camera.rotation.set(-3.1025, 0, -3.1414);

    return { scene, camera, renderer, controls };
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function clearSpheres() {
    for (const s of spheres) {
        scene.remove(s);
    }
    spheres = [];
}

function startStatic() {
    clearSpheres();

    const geometry = new THREE.SphereGeometry(0.5, 32, 16);
    const yMin = yRange.min;
    const yMax = yRange.max;
    const colorLow = new THREE.Color(0xff0000); // Red
    const colorHigh = new THREE.Color(0x00ff00); // Green

    for (const frame of parsedData) {
        for (const point of frame.points) {
            // Normalize the Y value
            const normY = (point.y - yMin) / (yMax - yMin);
            const clampedY = Math.min(Math.max(normY, 0), 1); // clamp to [0, 1]

            // Create interpolated color
            const interpolatedColor = colorLow.clone().lerp(colorHigh, clampedY);
            const material = new THREE.MeshBasicMaterial({ color: interpolatedColor });

            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(point.z, point.x, point.y); // X/Y/Z order as you use it
            scene.add(sphere);
            spheres.push(sphere);
        }
    }
}

function startPlayback() {
    clearSpheres();
    frameIndex = 0;
    plotNextBatch();
}

function plotNextBatch() {
    if (mode !== "realtime" || isPaused) return;

    clearSpheres();

    const geometry = new THREE.SphereGeometry(0.5, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xf0ff00 });
    const colorLow = new THREE.Color(0x0000ff); // Blue (low Y)
    const colorHigh = new THREE.Color(0xff0000); // Red (high Y)

    const batch = parsedData.slice(frameIndex, frameIndex + 10);

    for (const frame of batch) {
        for (const point of frame.points) {
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(point.z, point.x, point.y);
            scene.add(sphere);
            spheres.push(sphere);
        }
    }

    frameIndex += 1;

    if (frameIndex < parsedData.length) {
        setTimeout(plotNextBatch, 50); // 10 FPS
    } else {
        console.log("Playback finished");
    }
}
