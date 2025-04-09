import { parseCSV } from './csv_parser.js';
import { setupCharts, updateCharts, computeGlobalExtremes, setBoundingBoxes } from './chartManager.js';
import { runDBSCAN, getBoundingBoxes, getClusterCentroids } from './clustering.js';
import { createScene, animate, renderBufferedFrames, setCameraMode } from './threeScene.js';
import { initMap, updateMap } from './map_plotter.js';

let scene, camera, renderer, controls;
let parsedData =[];
let currentFrame = 0;
const frameBuffer = [];
const BUFFER_SIZE = 10;
const palette = ['red', 'blue', 'green', 'orange', 'purple', 'cyan', 'magenta', 'teal'];
const colorMap = {};
let yMin = Infinity;
let yMax = -Infinity;
let isPaused = false;
let isStarted = false;
let intervalId = null;



window.addEventListener("DOMContentLoaded", async () => {
    initMap();
    window.setCameraMode = setCameraMode;

    const radioButtons = document.querySelectorAll('input[name="fileOption"]');
    
    // Set up listeners for radio buttons (Kos, Rhodes, Symi)
    radioButtons.forEach(radio => {
        radio.addEventListener('change', async () => {
            if (radio.checked) {
                const { csv, video } = getFilesForPort(radio.value);
                await initializeFromCSV(csv, video);
            }
        });
    });

    // Preload Symi as default (or set another if preferred)
    const defaultPort = 'symi';
    document.getElementById('radioSymi').checked = true;
    const { csv, video } = getFilesForPort(defaultPort);
    await initializeFromCSV(csv, video);

    // Start/pause button handlers
    document.getElementById("btnStart").addEventListener("click", () => {
        isStarted = true;
        isPaused = false;
    });

    document.getElementById("btnPause").addEventListener("click", () => {
        isPaused = true;
    });

    // Start animation loop
    startRealTimeLoop();
});


function getColor(clusterId) {
    if (clusterId === -1) return 'gray'; // noise
    if (!(clusterId in colorMap)) {
        colorMap[clusterId] = palette[Object.keys(colorMap).length % palette.length];
    }
    return colorMap[clusterId];
}

function startRealTimeLoop() {
    const frameRate = 50;
    const totalFrames = parsedData.length;
    const totalTime = (totalFrames * frameRate) / 1000;
    const video = document.getElementById('videoPlayback');

    setInterval(() => {
        if (isPaused) return;

        const frame = parsedData[currentFrame];
        if (!frame || !Array.isArray(frame.points)) return;

        updateMap(frame);

        // ➕ Buffer update
        frameBuffer.push(frame.points);
        if (frameBuffer.length > BUFFER_SIZE) frameBuffer.shift();

        // ➕ Clean + Cluster
        const bufferedPoints = frameBuffer.flat();
        const cleanPoints = bufferedPoints.filter(p => p && !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z));
        const input = cleanPoints.map(p => [p.x, p.y, p.z]);
        const labels = runDBSCAN(input, 3, 5);
        cleanPoints.forEach((pt, i) => pt.clusterId = labels[i]);

        // ➕ Bounding boxes for chart overlays
        const allBoundingBoxes = getBoundingBoxes(cleanPoints);
        const chart1Boxes = allBoundingBoxes.map(box => ({
            minX: box.zMin, maxX: box.zMax,
            minY: box.yMin, maxY: box.yMax,
            color: getColor(box.clusterId)
        }));
        const chart2Boxes = allBoundingBoxes.map(box => ({
            minX: box.yMin, maxX: box.yMax,
            minY: box.xMin, maxY: box.xMax,
            color: getColor(box.clusterId)
        }));

        // ➕ Render everything
        updateCharts(cleanPoints);
        renderBufferedFrames(frameBuffer.map(points => ({ points })), yMin, yMax);
        setBoundingBoxes(chart1Boxes, chart2Boxes);

        const centroids = getClusterCentroids(cleanPoints);
        if (centroids.length > 0) {
            const closest = centroids.reduce((min, c) => (c.y < min.y ? c : min), centroids[0]);
            const cpaValue = Math.abs(closest.y).toFixed(1);
            document.getElementById("cluster-distance").textContent = `${cpaValue}m`;
        } else {
            document.getElementById("cluster-distance").textContent = "—";
        }

        const progressPercent = (currentFrame / (totalFrames - 1)) * 100;
        const elapsedSec = (currentFrame * frameRate) / 1000;
        video.currentTime = elapsedSec;
        document.getElementById('frameProgress').style.width = `${progressPercent}%`;
        document.getElementById('elapsedTime').textContent = formatTime(elapsedSec);
        document.getElementById('totalDuration').textContent = formatTime(totalTime);

        currentFrame = (currentFrame + 1) % totalFrames;
    }, frameRate);
}



function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getFilesForPort(value) {
    switch (value) {
        case 'kos':
            document.getElementById("portName").textContent = "Kos";
            document.getElementById("portLink").href = "https://www.openstreetmap.org/?mlat=36.8972&mlon=27.2911&zoom=15";
            document.getElementById("arrivalTime").textContent = "05:40:10";
            return {
                csv: './Kos_radar_gps_sync_filtered.csv',
                video: './Kos_trimmed.mp4'
            };
        case 'symi':
            document.getElementById("portName").textContent = "Symi";
            document.getElementById("portLink").href = "https://www.openstreetmap.org/?mlat=36.620905&mlon=27.846576&zoom=19&marker=36.620905,27.846576#map=19/36.620905/27.846576&layers=H";
            document.getElementById("arrivalTime").textContent = "06:45:50";
            return {
                csv: './Symi_radar_gps_sync_filtered.csv',
                video: './Symi_trimmed.mp4'
            };
        default:
            document.getElementById("portName").textContent = "Symi";
            document.getElementById("portLink").href = "https://www.openstreetmap.org/?mlat=36.6152&mlon=27.8376&zoom=15";
            document.getElementById("arrivalTime").textContent = "06:45:50";
            return {
                csv: './Symi_radar_gps_sync_filtered.csv',
                video: './Symi_trimmed.mp4'
            };
    }
}

async function initializeFromCSV(csvPath, videoPath) {
    // Load and parse CSV
    const response = await fetch(csvPath);
    const rawCSV = await response.text();
    console.log("Loaded file:", csvPath);
    parsedData = await parseCSV(rawCSV);

    // Recalculate global Y-min and Y-max
    yMin = Infinity;
    yMax = -Infinity;
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

    // Chart setup
    await computeGlobalExtremes(parsedData);
    await setupCharts();

    // 3D setup
    const container = document.getElementById("three-container");
    ({ scene, camera, renderer, controls } = createScene(container));
    animate();

    // Set and reset video
    const video = document.getElementById('videoPlayback');
    video.pause();
    video.src = videoPath;
    video.load(); // force reload of new source
    video.currentTime = 0;
}
