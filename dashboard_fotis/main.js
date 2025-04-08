import { parseCSV } from './csv_parser.js';
import { setupCharts, updateCharts, computeGlobalExtremes, setBoundingBoxes } from './chartManager.js';
import { runDBSCAN, getBoundingBoxes, getClusterCentroids } from './clustering.js';
import { init3DScene, renderBufferedFrames } from './threeScene.js';
import { initMap, updateMap } from './map_plotter.js';

let parsedData =[];
let currentFrame = 0;
const frameBuffer = [];
const BUFFER_SIZE = 10;
const palette = ['red', 'blue', 'green', 'orange', 'purple', 'cyan', 'magenta', 'teal'];
const colorMap = {};


window.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch('./Symi_radar_gps_sync_filtered.csv');
    const rawCSV = await response.text();
    //console.log(rawCSV);
    console.log("Loaded preloaded CSV file content:", rawCSV);

    initMap();
    parsedData = await parseCSV(rawCSV); 
    console.log("parsedData length:", parsedData.length);

    await computeGlobalExtremes(parsedData);
    await setupCharts();
    await init3DScene();
    //renderAllPoints(parsedData);
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
    const frameRate = 50; // ms per frame (20 FPS)
    const totalFrames = parsedData.length;
    const totalTime = (totalFrames * frameRate) / 1000;
    const video = document.getElementById('videoPlayback');

    setInterval(() => {
        const frame = parsedData[currentFrame];
        //console.log(frame)
        //if (!frame || !frame.points) return;

        
        frameBuffer.push(frame.points);
        //console.log("frameBuffer",frameBuffer)
        if (frameBuffer.length > BUFFER_SIZE) frameBuffer.shift();
        updateMap(frame);

        const bufferedPoints = frameBuffer.flat();
        //console.log("bufferdPoints",bufferedPoints)
        const cleanPoints = bufferedPoints.filter(p => p && !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z));
        
        const input = cleanPoints.map(p => [p.x, p.y, p.z]);
        
        const labels = runDBSCAN(input, 3, 5); // or your preferred eps/minPts

        cleanPoints.forEach((pt, i) => pt.clusterId = labels[i]);
        const allBoundingBoxes = getBoundingBoxes(cleanPoints);

        const chart1Boxes = allBoundingBoxes.map(box => ({
            minX: box.zMin,
            maxX: box.zMax,
            minY: box.yMin,
            maxY: box.yMax,
            color: getColor(box.clusterId)
        }));

        const chart2Boxes = allBoundingBoxes.map(box => ({
            minX: box.yMin,
            maxX: box.yMax,
            minY: box.xMin,
            maxY: box.xMax,
            color: getColor(box.clusterId)
        }));
        

        updateCharts(cleanPoints);
        renderBufferedFrames(frameBuffer.map(points => ({ points })));

        const centroids = getClusterCentroids(cleanPoints);
        //console.log("Cluster centroids:", centroids);
        if (centroids.length > 0) {
            const closest = centroids.reduce((min, c) => (c.y < min.y ? c : min), centroids[0]);
            const cpaValue = Math.abs(closest.y).toFixed(1); // optional abs() if Y can be negative
            document.getElementById("cluster-distance").textContent = `${cpaValue}m`;
        } else {
            document.getElementById("cluster-distance").textContent = "—";
        }
        setBoundingBoxes(chart1Boxes, chart2Boxes);

        // 📊 Update progress bar and time display
        const progressPercent = (currentFrame / (totalFrames - 1)) * 100;
        const elapsedSec = (currentFrame * frameRate) / 1000;

        video.currentTime = elapsedSec;
        document.getElementById('frameProgress').style.width = `${progressPercent}%`;
        document.getElementById('elapsedTime').textContent = formatTime(elapsedSec);
        document.getElementById('totalDuration').textContent = formatTime(totalTime);

        // 🔄 Advance frame
        currentFrame = (currentFrame + 1) % totalFrames;
    }, frameRate);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

