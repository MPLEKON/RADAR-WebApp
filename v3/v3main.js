import { parseCSV } from './v3_csv_giannis.js';
import { runDBSCANOnFrame } from './clustering.js';



console.log("main.js loaded");

let parsedData = [];
let globalExtremes = {};
let intervalId = null;
let paused = false;
let currentFrameIndex = 0;
let realtime = false;
let selectedValue = null;
let myChart = null;

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

// === Chart Setup ===
function setupChart() {
    const ctx = document.getElementById('myChart');
    myChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Scatter Plot',
                data: [],
                backgroundColor: 'blue'
            }]
        },
        options: {
            animation: false,
            scales: {
                x: { title: { display: true, text: '' } },
                y: { title: { display: true, text: '' } }
            },
            plugins: {
                title: { display: true, text: '' }
            }
        }
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
                updateChartScales(selectedValue);
                if (realtime) startRealTime(50, selectedValue);
                else mapStaticData(selectedValue);
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
            event.preventDefault(); // Prevent the default anchor behavior
            selectedValue = this.getAttribute('data-chart');
            updateChartScales(selectedValue);
            if (realtime) {
                startRealTime(50, selectedValue);
            } else {
                mapStaticData(selectedValue);
            }
        });  
    });

    document.getElementById('realTimeSwitch').addEventListener('change', function () {
        realtime = this.checked;
        paused = !this.checked;
        if (realtime) {
            startRealTime(50, selectedValue);
        } else {
            clearInterval(intervalId);
            mapStaticData(selectedValue);
        }
    });

    document.querySelector(".btn-success").addEventListener("click", () => {
        if (paused) {
            paused = false;
            console.log("▶️ Resuming playback");
        } else {
            console.log("▶️ Starting playback");
            startRealTime(50, selectedValue);
        }
    });

    document.querySelector(".btn-danger").addEventListener("click", () => {
        console.log("⏸ Pausing playback");
        paused = true;
    });
}

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
        zMax: Math.ceil(Math.max(...allZ)),
    };

    console.log("🌍 Global extremes updated:", globalExtremes);
}

function updateChartScales(chart) {
    if (!myChart) return;

    const maxFrames = parsedData.length - 1;
    const opts = myChart.options;
    const title = opts.plugins.title;
    const x = opts.scales.x;
    const y = opts.scales.y;

    switch (chart) {
        case "y_vs_frames":
            x.min = 0; x.max = maxFrames; x.title.text = "Frame";
            y.min = 0; y.max = globalExtremes.yMax + 10; y.title.text = "Y (m)";
            title.text = "Y vs Frames";
            break;

        case "z_vs_frames":
            x.min = 0; x.max = maxFrames; x.title.text = "Frame";
            y.min = globalExtremes.zMin; y.max = globalExtremes.zMax + 10; y.title.text = "Z (m)";
            title.text = "Z vs Frames";
            break;

        case "x_vs_frames":
            x.min = 0; x.max = maxFrames; x.title.text = "Frame";
            y.min = globalExtremes.xMin; y.max = globalExtremes.xMax; y.title.text = "X (m)";
            title.text = "X vs Frames";
            break;

        case "y_vs_z":
            x.min = globalExtremes.zMin; x.max = globalExtremes.zMax; x.title.text = "Z (m)";
            y.min = 0; y.max = globalExtremes.yMax + 10; y.title.text = "Y (m)";
            title.text = "Y vs Z";
            break;

        case "x_vs_y":
            x.min = 0; x.max = globalExtremes.yMax + 10; x.title.text = "Y (m)";
            y.min = globalExtremes.xMin; y.max = globalExtremes.xMax; y.title.text = "X (m)";
            title.text = "X vs Y";
            break;

        case "x_vs_z":
            x.min = globalExtremes.zMin; x.max = globalExtremes.zMax; x.title.text = "Z (m)";
            y.min = globalExtremes.xMin; y.max = globalExtremes.xMax; y.title.text = "X (m)";
            title.text = "X vs Z";
            break;

        default:
            console.warn("Unknown chart type selected.");
            return;
    }

    myChart.update();
}

function mapStaticData(chart) {
    if (!parsedData || parsedData.length === 0) return;

    let dataPoints = [];

    switch (chart) {
        case "y_vs_frames":
            dataPoints = parsedData.flatMap(frame =>
                frame.points.map(pt => ({ x: frame.frameNum, y: pt.y }))
            );
            break;

        case "z_vs_frames":
            dataPoints = parsedData.flatMap(frame =>
                frame.points.map(pt => ({ x: frame.frameNum, y: pt.z }))
            );
            break;

        case "x_vs_frames":
            dataPoints = parsedData.flatMap(frame =>
                frame.points.map(pt => ({ x: frame.frameNum, y: pt.x }))
            );
            break;

        case "y_vs_z":
            dataPoints = parsedData.flatMap(frame =>
                frame.points.map(pt => ({ x: pt.z, y: pt.y }))
            );
            break;

        case "x_vs_y":
            dataPoints = parsedData.flatMap(frame =>
                frame.points.map(pt => ({ x: pt.y, y: pt.x }))
            );
            break;

        case "x_vs_z":
            dataPoints = parsedData.flatMap(frame =>
                frame.points.map(pt => ({ x: pt.z, y: pt.x }))
            );
            break;
    }

    myChart.data.datasets[0].data = dataPoints;
    myChart.update();
}

function startRealTime(interval = 50, chart) {
    if (intervalId) clearInterval(intervalId);
    currentFrameIndex = 0;

    intervalId = setInterval(() => {
        if (paused || !parsedData[currentFrameIndex]) return;

        const frame = parsedData[currentFrameIndex];
        updateFrameCounter(currentFrameIndex + 1, parsedData.length);

        let dataPoints = [];

        switch (chart) {
            case "y_vs_frames":
                dataPoints = frame.points.map(pt => ({ x: frame.frameNum, y: pt.y }));
                break;

            case "z_vs_frames":
                dataPoints = frame.points.map(pt => ({ x: frame.frameNum, y: pt.z }));
                break;

            case "x_vs_frames":
                dataPoints = frame.points.map(pt => ({ x: frame.frameNum, y: pt.x }));
                break;

            case "y_vs_z":
                dataPoints = frame.points.map(pt => ({ x: pt.z, y: pt.y }));
                break;

            case "x_vs_y":
                dataPoints = frame.points.map(pt => ({ x: pt.y, y: pt.x }));
                break;

            case "x_vs_z":
                dataPoints = frame.points.map(pt => ({ x: pt.z, y: pt.x }));
                break;
        }

        myChart.data.datasets[0].data = dataPoints;
        myChart.update();

        currentFrameIndex++;
        if (currentFrameIndex >= parsedData.length) {
            currentFrameIndex = 0;
        }
    }, interval);
}

function updateFrameCounter(current, total) {
    const counter = document.getElementById('frameCounter');
    if (counter) {
        counter.textContent = `Frame: ${current} / ${total}`;
    }
}
