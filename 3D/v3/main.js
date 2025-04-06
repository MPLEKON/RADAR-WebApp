console.log("Main JS file loaded");

import { parseCSV } from './csv_parser.js';
import { runDBSCAN, getBoundingBoxes, getClusterCentroids } from './clustering.js';

let scene, camera, renderer, controls;
let parsedData = [];
let mode = "static";
let frameIndex = 0;
let spheres = [];
let playbackTimer = null;
let isPaused = false;
let boundingBoxes = [];


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
    //Listener for the camera selection buttons
    document.querySelectorAll("#cameraButtons button").forEach(button => {
        button.addEventListener("click", () => {
            const mode = button.getAttribute("data-mode");
            setCameraMode(mode);
        });
    });
    
    window.yRange = { min: yMin, max: yMax }; 
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

    animate(); // Start the common render loop

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
        const response = await fetch('./Symi_radar_gps_sync.csv');
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
    gridHelper.position.y = -9;
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
    plane.position.y = -9;
    scene.add(plane);

    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(90, width / height, 1, 100000);
    camera.position.set(0, 0, 0);
    camera.rotation.set(-3.1025, -1.17, -3.1414);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 30);
    controls.update();


    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });

    return { scene, camera, renderer, controls };
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function clearSpheres() {
    for (const s of spheres) scene.remove(s);
    for (const b of boundingBoxes) scene.remove(b);
    spheres = [];
    boundingBoxes = [];
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
            sphere.position.set(point.z, point.x, point.y); 
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
    const colorLow = new THREE.Color(0xff0000); // Red
    const colorHigh = new THREE.Color(0x00ff00); // Green
    const yMin = yRange.min;
    const yMax = yRange.max;

    const batch = parsedData.slice(frameIndex, frameIndex + 10);
    const allPoints = batch.flatMap(f => f.points); //This is a step to put all points from these frames together
    const dbscanInput = allPoints.map(p => [p.x, p.y, p.z]); //Mapping points for DBSCAN use by converting them to array

    const labels = runDBSCAN(dbscanInput, 2, 3); // eps = 2, minPts = 3

    allPoints.forEach((point, i) => {
        point.clusterId = labels[i];
    });

    for (const point of allPoints) {
        const normY = (point.y - yMin) / (yMax - yMin);
        const clampedY = Math.min(Math.max(normY, 0), 1);
        const color = colorLow.clone().lerp(colorHigh, clampedY);

        const material = new THREE.MeshBasicMaterial({ color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(point.z, point.x, point.y); // (z, x, y) as per your convention
        scene.add(sphere);
        spheres.push(sphere);
    }
    const boxes = getBoundingBoxes(allPoints);

    for (const box of boxes) {
        const sizeX = box.xMax - box.xMin;
        const sizeY = box.yMax - box.yMin;
        const sizeZ = box.zMax - box.zMin;

        const centerX = (box.xMin + box.xMax) / 2;
        const centerY = (box.yMin + box.yMax) / 2;
        const centerZ = (box.zMin + box.zMax) / 2;

        const boxGeometry = new THREE.BoxGeometry(sizeZ,sizeX ,sizeY );
        const edges = new THREE.EdgesGeometry(boxGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        wireframe.position.set(centerZ,centerX ,centerY );

        scene.add(wireframe);
        boundingBoxes.push(wireframe);
    }

    frameIndex += 1;

    if (frameIndex < parsedData.length) {
        setTimeout(plotNextBatch, 50); 
    } else {
        console.log("Playback finished");
    }
}

function setCameraMode(mode) {
    switch (mode) {
        case "fpv":
            camera.position.set(0, 9, 0);
            camera.rotation.set(-3.1025, 0.22, -3.1414);
            break;
        case "side":
            camera.position.set(50, 9, 0);
            camera.lookAt(0, 0, 0);
            break;
        case "top":
            camera.position.set(0, 70, 30);
            camera.rotation.set(0,0,0)
            //camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 30);                 // Looking at the center
            controls.update();
            camera.rotation.y = 3.14;
            break;
    }
    controls.update();
}
