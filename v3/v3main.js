import { parseCSV } from './v3_csv_giannis.js';
import {
    setupChart,
    computeGlobalExtremes,
    updateChartScales,
    mapStaticData,
    startRealTime,
    updateFrameCounter,
    setPlaybackPaused,
    stopRealTime
} from './chartManager.js';

//import { runDBSCANOnFrame } from './clustering.js';



console.log("main.js loaded");

let parsedData = [];
//let globalExtremes = {};
//let intervalId = null;
//let paused = false;
//let currentFrameIndex = 0;
let realtime = false;
let selectedValue = null;
//let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    setupThemeSwitch();
    setupChart();
    setupEventHandlers();
});

// === Dark Mode Toggle ===
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


document.getElementById('csvFileInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
        alert("No file selected.");
        return;
    }

    if (!file.name.endsWith(".csv")) {
        alert("Please upload a CSV (.csv) file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const rawCSV = e.target.result;
        try {
            console.log("Loaded CSV file content:", rawCSV);

            parsedData = await parseCSV(rawCSV);
            computeGlobalExtremes(parsedData);

            if (selectedValue) {
                updateChartScales(selectedValue , parsedData);
                if (realtime) startRealTime(parsedData, selectedValue, 50, paused);
                else mapStaticData(selectedValue, parsedData);
            }

        } catch (error) {
            console.error("Error parsing CSV file:", error);
            alert("Error parsing CSV file.");
        }
    };
    reader.onerror = () => {
        console.error("File reading error:", reader.error);
        alert("Error reading CSV file.");
    };

    reader.readAsText(file);
});


function setupEventHandlers() {
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function (event) {
            event.preventDefault();
            selectedValue = this.getAttribute('data-chart');
            updateChartScales(selectedValue, parsedData);
            if (realtime) {
                startRealTime(parsedData, selectedValue, 50, paused);
            } else {
                mapStaticData(selectedValue);
            }
        });
    });

    document.getElementById('realTimeSwitch').addEventListener('change', function () {
        realtime = this.checked;
        if (realtime) {
            setPlaybackPaused(false);
            startRealTime(parsedData, selectedValue, 50);
        } else {
            stopRealTime();
            mapStaticData(selectedValue , parsedData);
        }
    });

    document.querySelector(".btn-success").addEventListener("click", () => {
        setPlaybackPaused(false);
        console.log("▶️ Resuming playback");
    });
    
    document.querySelector(".btn-danger").addEventListener("click", () => {
        setPlaybackPaused(true);
        console.log("⏸ Pausing playback");
    });
    
}