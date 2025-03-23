console.log("Chart Manager Loaded");

import { runDBSCANOnFrame } from './clustering.js';

let myChart = null;
let globalExtremes = {};
let intervalId = null;
let currentFrameIndex = 0;
let paused = false;

export function setupChart() {
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

export function computeGlobalExtremes(data) {
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

export function updateChartScales(chartType, parsedData) {
    if (!myChart) return;

    const maxFrames = parsedData.length - 1;
    const opts = myChart.options;
    const title = opts.plugins.title;
    const x = opts.scales.x;
    const y = opts.scales.y;

    switch (chartType) {
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

export function mapStaticData(chartType, parsedData) {
    if (!parsedData || parsedData.length === 0) return;

    let dataPoints = [];

    switch (chartType) {
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

export function startRealTime(parsedData, chartType, interval = 50, paused = false) {
    if (intervalId) clearInterval(intervalId);
    currentFrameIndex = 0;

    intervalId = setInterval(() => {
        if (paused || !parsedData[currentFrameIndex]) return;

        const frame = parsedData[currentFrameIndex];
        updateFrameCounter(currentFrameIndex + 1, parsedData.length);

        let dataPoints = [];

        switch (chartType) {
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

export function updateFrameCounter(current, total) {
    const counter = document.getElementById('frameCounter');
    if (counter) {
        counter.textContent = `Frame: ${current} / ${total}`;
    }
}

export function setPlaybackPaused(state) {
    paused = state;
}

export function stopRealTime() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}