import { parseCSV } from './v2_csv_giannis.js';
import { initThreeScene, renderAllFrames, renderSingleFrame } from './three_scene.js';

console.log("✅ main.js loaded");

let parsedData = [];
let globalExtremes = {};
let intervalId = null;
let paused = false;
let currentFrameIndex = 0;
let realtime = false;

document.addEventListener('DOMContentLoaded', () => {
    setupThemeSwitch();
    setupEventHandlers();
});

// === Theme Switch (Dark/Light Mode) ===
function setupThemeSwitch() {
    const htmlElement = document.documentElement;
    const switchElement = document.getElementById('darkModeSwitch');
    const currentTheme = localStorage.getItem('bsTheme') || 'dark';
    htmlElement.setAttribute('data-bs-theme', currentTheme);
    switchElement.checked = currentTheme === 'dark';

    switchElement.addEventListener('change', function () {
        const newTheme = this.checked ? 'dark' : 'light';
        htmlElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('bsTheme', newTheme);
    });
}

// === File Upload Handler for JS file containing csvData ===
document.getElementById('csvFileInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
        alert("No file selected.");
        return;
    }

    if (!file.name.endsWith(".js")) {
        alert("Please upload a JavaScript (.js) file that exports `csvData`.");
        return;
    }

    const moduleURL = URL.createObjectURL(file);
    try {
        const module = await import(moduleURL);
        if (!module.csvData) {
            throw new Error("No `csvData` export found in uploaded file.");
        }

        console.log("📄 Loaded csvData:", module.csvData);
        parsedData = await parseCSV(module.csvData);
        computeGlobalExtremes(parsedData);

        // Ready for visualization
        initThreeScene(); // 🔥 Initialize the Three.js scene
        renderAllFrames(parsedData); // Or startRealTime3D() if you want animation

    } catch (error) {
        console.error("❌ Error loading JS file:", error);
        alert("Could not load JS file. Make sure it exports `csvData`.");
    } finally {
        URL.revokeObjectURL(moduleURL);
    }
});

// === Global Extremes Calculation ===
function computeGlobalExtremes(data) {
    const allX = data.flatMap(f => f.points.map(p => p.x)).filter(v => !isNaN(v));
    const allY = data.flatMap(f => f.points.map(p => p.y)).filter(v => !isNaN(v));
    const allZ = data.flatMap(f => f.points.map(p => p.z)).filter(v => !isNaN(v));

    globalExtremes = {
        xMin: Math.floor(Math.min(...allX)),
        xMax: Math.ceil(Math.max(...allX)),
        yMin: Math.floor(Math.min(...allY)),
        yMax: Math.ceil(Math.max(...allY)),
        zMin: Math.floor(Math.min(...allZ)),
        zMax: Math.ceil(Math.max(...allZ))
    };

    console.log("📐 Global Extremes:", globalExtremes);
}

// === Event Handlers ===
function setupEventHandlers() {
    document.getElementById('realTimeSwitch').addEventListener('change', function () {
        realtime = this.checked;
        paused = !this.checked;

        if (realtime) {
            console.log("📡 Real-time ON");
            startRealTime3D();
        } else {
            console.log("📡 Real-time OFF");
            paused = true;
            clearInterval(intervalId);
            renderStatic3D(parsedData);
        }
    });

    document.querySelector(".btn-success").addEventListener("click", () => {
        paused = false;
        console.log("▶️ Resuming real-time playback");
    });

    document.querySelector(".btn-danger").addEventListener("click", () => {
        paused = true;
        console.log("⏸ Paused real-time playback");
    });
}

// === 3D Visualization Stubs ===
function renderStatic3D(data) {
    console.log("🖼 Rendering all frames (static)");
    // Loop through all points and render them using Three.js
    // You’ll implement your Three.js render logic here
}

function startRealTime3D(interval = 50) {
    if (intervalId) clearInterval(intervalId);
    currentFrameIndex = 0;

    intervalId = setInterval(() => {
        if (paused || !parsedData[currentFrameIndex]) return;

        const frame = parsedData[currentFrameIndex];
        renderFrame3D(frame);
        currentFrameIndex++;

        if (currentFrameIndex >= parsedData.length) {
            currentFrameIndex = 0;
        }
    }, interval);
}

function renderFrame3D(frame) {
    console.log(`🌀 Rendering frame ${frame.frameNum}`);
    // Clear scene and render only the current frame’s points
    // You’ll use Three.js here to display the frame
}
