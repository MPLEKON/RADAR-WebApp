import { parseCSV } from './csv_parser.js';
/* other imports*/
import { setupCharts, updateCharts, computeGlobalExtremes, setBoundingBoxes } from './chartManager.js';
import { runDBSCAN, getBoundingBoxes } from './clustering.js';

let parsedData =[];
let currentFrame = 0;
const frameBuffer = [];
const BUFFER_SIZE = 10;
const palette = ['red', 'blue', 'green', 'orange', 'purple', 'cyan', 'magenta', 'teal'];
const colorMap = {};


window.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch('./Super_short_detected_objects.csv');
    const rawCSV = await response.text();
    console.log(rawCSV);
    console.log("Loaded preloaded CSV file content:", rawCSV);
    parsedData = await parseCSV(rawCSV); 
    console.log("parsedData length:", parsedData.length);
    await computeGlobalExtremes(parsedData);
    setupCharts();
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
    const frameRate = 50; // ms per frame (20 FPS)
    const totalFrames = parsedData.length;
    const totalTime = (totalFrames * frameRate) / 1000;

    setInterval(() => {
        const frame = parsedData[currentFrame];
        console.log(frame)
        //if (!frame || !frame.points) return;


        frameBuffer.push(frame.points);
        console.log("frameBuffer",frameBuffer)
        if (frameBuffer.length > BUFFER_SIZE) frameBuffer.shift();


        const bufferedPoints = frameBuffer.flat();
        console.log("bufferdPoints",bufferedPoints)
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
        setBoundingBoxes(chart1Boxes, chart2Boxes);

        // 📊 Update progress bar and time display
        const progressPercent = (currentFrame / (totalFrames - 1)) * 100;
        const elapsedSec = (currentFrame * frameRate) / 1000;

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

