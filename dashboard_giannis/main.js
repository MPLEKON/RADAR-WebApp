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
    const response = await fetch('./Symi_radar_gps_sync_filtered.csv');
    const rawCSV = await response.text();
    //console.log(rawCSV);
    console.log("Loaded preloaded CSV file content:", rawCSV);
    initMap();
    parsedData = await parseCSV(rawCSV); 
    console.log("parsedData length:", parsedData.length);

    
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
    
    await computeGlobalExtremes(parsedData);
    await setupCharts();
    const container = document.getElementById("three-container");
    await ({ scene, camera, renderer, controls } = createScene(container));
    animate();
    //renderAllPoints(parsedData);
    window.setCameraMode = setCameraMode;
    
    document.getElementById("btnStart").addEventListener("click", () => {
        isStarted = true;
        isPaused = false;
    });
    
    document.getElementById("btnPause").addEventListener("click", () => {
        isPaused = true;
    });
    startRealTimeLoop()
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

