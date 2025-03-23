console.log("Chart Manager Loaded");

import { runDBSCAN } from './clustering.js';

let myChart = null;
let globalExtremes = {};
let intervalId = null;
let currentFrameIndex = 0;
let paused = false;
const FRAME_BUFFER_SIZE = 20;
let frameBuffer = [];

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
            plugins: {
                title: { display: true, text: '' },
                boundingBoxes: {
                    boxes: []
                }
            }
        },
        plugins: [boundingBoxPlugin]
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

const boundingBoxPlugin = {
    id: 'boundingBoxes',
    afterDraw(chart) {
        const boxes = chart.options.plugins.boundingBoxes?.boxes || [];
        const ctx = chart.ctx;
        ctx.save();
        ctx.lineWidth = 2;

        boxes.forEach(({ minX, maxX, minY, maxY, color }) => {
            if (
                [minX, maxX, minY, maxY].some(v => isNaN(v)) ||
                typeof color !== 'string'
            ) return;
        
        const xMinPx = chart.scales.x.getPixelForValue(minX);
        const xMaxPx = chart.scales.x.getPixelForValue(maxX);
        const yMinPx = chart.scales.y.getPixelForValue(minY);
        const yMaxPx = chart.scales.y.getPixelForValue(maxY);
        
        ctx.strokeStyle = color;
        ctx.strokeRect(
            xMinPx,
            yMaxPx,
            xMaxPx - xMinPx,
            yMinPx - yMaxPx
            );
        });

        ctx.restore();
    }
};  
Chart.register(boundingBoxPlugin); // ✅ This line is important


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
    myChart.data.datasets[0].backgroundColor = 'blue';
    myChart.update();
}

export function startRealTime(parsedData, chartType, interval = 50) {
    if (intervalId) clearInterval(intervalId);
    currentFrameIndex = 0;
    frameBuffer = [];

    intervalId = setInterval(() => {
        const frame = parsedData[currentFrameIndex];
        currentFrameIndex = (currentFrameIndex + 1) % parsedData.length;

        if (paused || !frame || !frame.points || frame.points.length === 0) return;

        // ⬇️ Add valid frames only
        frameBuffer.push(frame);
        if (frameBuffer.length > FRAME_BUFFER_SIZE) {
            frameBuffer.shift();
        }

        const bufferedPoints = frameBuffer.flatMap(f => f.points ?? []);
        const cleanPoints = bufferedPoints.filter(p => p && !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z));
        if (cleanPoints.length === 0) return;

        // ⬇️ Apply DBSCAN clustering
        const labels = runDBSCAN(
            cleanPoints.map(p => [p.x, p.y, p.z]),
            5, 2
        );
        cleanPoints.forEach((pt, i) => pt.clusterId = labels[i]);

        // ⬇️ Map to chart points
        const chartPoints = cleanPoints.map(pt => {
            let x, y;
            switch (chartType) {
                case "y_vs_frames": x = frame.frameNum; y = pt.y; break;
                case "z_vs_frames": x = frame.frameNum; y = pt.z; break;
                case "x_vs_frames": x = frame.frameNum; y = pt.x; break;
                case "y_vs_z": x = pt.z; y = pt.y; break;
                case "x_vs_y": x = pt.y; y = pt.x; break;
                case "x_vs_z": x = pt.z; y = pt.x; break;
                default: x = 0; y = 0;
            }
            return { x, y, backgroundColor: clusterColor(pt.clusterId) };
        });

        myChart.data.datasets[0].data = chartPoints;
        myChart.data.datasets[0].backgroundColor = chartPoints.map(p => p.backgroundColor);

        // ⬇️ Only compute bounding boxes if clusters exist
        myChart.options.plugins.boundingBoxes = {
            boxes: computeBoundingBoxes(cleanPoints, chartType)
        };

        myChart.update();

        updateFrameCounter(currentFrameIndex, parsedData.length);
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



function clusterColor(id) {
    if (id === -1) return 'gray'; // noise
    const palette = ['red', 'blue', 'green', 'orange', 'purple', 'cyan', 'magenta'];
    return palette[id % palette.length];
}



function computeBoundingBoxes(points, chartType) {
    const clusters = new Map();
  
    points.forEach(pt => {
        if (pt.clusterId === -1) return;
        if (!clusters.has(pt.clusterId)) {
            clusters.set(pt.clusterId, []);
            }
        clusters.get(pt.clusterId).push(pt);
    });
  
    return Array.from(clusters.entries()).map(([id, clusterPoints]) => {
        let getX, getY;
    switch (chartType) {
        case "x_vs_y":
            getX = p => p.y;
            getY = p => p.x;
            break;
        case "y_vs_z":
            getX = p => p.z;
            getY = p => p.y;
            break;
        case "x_vs_z":
            getX = p => p.z;
            getY = p => p.x;
            break;
        default:
            getX = p => p.x;
            getY = p => p.y;
    }

    return {
        minX: Math.min(...clusterPoints.map(getX)),
        maxX: Math.max(...clusterPoints.map(getX)),
        minY: Math.min(...clusterPoints.map(getY)),
        maxY: Math.max(...clusterPoints.map(getY)),
        color: clusterColor(id)
    };
});
}
