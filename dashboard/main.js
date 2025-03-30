import { parseCSV } from './csv_parser.js';
/* other imports*/
import { setupCharts, updateCharts, computeGlobalExtremes } from './chartManager.js';

let parsedData =[];
let currentFrame = 0;


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

function startRealTimeLoop(){
    const frameRate = 50; // 1/20fps
    const totalFrames = parsedData.length;
    const totalTime = (totalFrames*frameRate)/1000;
    setInterval(() => {
        const frame = parsedData[currentFrame];
        const points = frame.points;
        const elapsedSec = (currentFrame * frameRate) / 1000;

        updateCharts(points);
        //renderFrame3D(frameData);
        const progressPercent = (currentFrame / (totalFrames - 1)) * 100;
        document.getElementById('frameProgress').style.width = `${progressPercent}%`;
        document.getElementById('elapsedTime').textContent = formatTime(elapsedSec);
        document.getElementById('totalDuration').textContent = `${formatTime(totalTime)}`;

        currentFrame = (currentFrame + 1) % parsedData.length;
    }, frameRate);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

