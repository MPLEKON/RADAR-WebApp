console.log("Chart Manager Loaded");

let chart1 = null;
let chart2 = null;
export let globalExtremes = {};


const boundingBoxPlugin = {
    id: 'boundingBoxes',
    afterDraw(chart) {
        const boxes = chart.options.plugins.boundingBoxes?.boxes || [];
        const ctx = chart.ctx;
        ctx.save();
        ctx.lineWidth = 2;

        boxes.forEach(({ minX, maxX, minY, maxY, color }) => {
            if ([minX, maxX, minY, maxY].some(v => isNaN(v)) || typeof color !== 'string') return;

            const xMinPx = chart.scales.x.getPixelForValue(minX);
            const xMaxPx = chart.scales.x.getPixelForValue(maxX);
            const yMinPx = chart.scales.y.getPixelForValue(minY);
            const yMaxPx = chart.scales.y.getPixelForValue(maxY);

            ctx.strokeStyle = color;
            ctx.strokeRect(xMinPx, yMaxPx, xMaxPx - xMinPx, yMinPx - yMaxPx);
        });

        ctx.restore();
    }
};

Chart.register(boundingBoxPlugin); // ✅ Register plugin


const palette = ['red', 'blue', 'green', 'orange', 'purple', 'cyan', 'magenta', 'teal'];
const colorMap = {};

function getColor(clusterId) {
    if (clusterId === -1) return 'gray'; // noise
    if (!(clusterId in colorMap)) {
        colorMap[clusterId] = palette[Object.keys(colorMap).length % palette.length];
    }
    return colorMap[clusterId];
}


export function setupCharts() {
    if (chart1) {
        chart1.destroy();
        chart1 = null;
    }
    if (chart2) {
        chart2.destroy();
        chart2 = null;
    }

    const ctx1 = document.getElementById('plot1')?.getContext('2d');
    if (ctx1) {
        chart1 = new Chart(ctx1, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Y vs Z',
                    data: [],
                    backgroundColor: []
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: { title: { display: true, text: 'Z (m)' }, min: globalExtremes.zMin, max: globalExtremes.zMax },
                    y: { title: { display: true, text: 'Y (m)' }, min: globalExtremes.yMin, max: globalExtremes.yMax }
                },
                plugins: {
                    boundingBoxes: { boxes: [] }
                }
            }
        });
    }

    const ctx2 = document.getElementById('plot2')?.getContext('2d');
    if (ctx2) {
        chart2 = new Chart(ctx2, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'X vs Y',
                    data: [],
                    backgroundColor: []
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: { title: { display: true, text: 'Y (m)' }, min: globalExtremes.yMin, max: globalExtremes.yMax },
                    y: { title: { display: true, text: 'X (m)' }, min: globalExtremes.xMin, max: globalExtremes.xMax }
                },
                plugins: {
                    boundingBoxes: { boxes: []}
                }
            }
        });
    }
}


export function updateCharts(points) {
    if (chart1) {
        chart1.data.datasets[0].data = points.map(p => ({ x: p.z, y: p.y }));
        chart1.data.datasets[0].backgroundColor = points.map(p => getColor(p.clusterId));
        chart1.update();
    }

    if (chart2) {
        chart2.data.datasets[0].data = points.map(p => ({ x: p.y, y: p.x }));
        chart2.data.datasets[0].backgroundColor = points.map(p => getColor(p.clusterId));
        chart2.update();
    }
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


export function setBoundingBoxes(boxes1 = [], boxes2 = []) {
    if (chart1?.options?.plugins?.boundingBoxes) {
        chart1.options.plugins.boundingBoxes.boxes = boxes1;
        chart1.update();
    }

    if (chart2?.options?.plugins?.boundingBoxes) {
        chart2.options.plugins.boundingBoxes.boxes = boxes2;
        chart2.update();
    }
}