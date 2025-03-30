console.log("Chart Manager Loaded");

let chart1 = null;
let chart2 = null;
let globalExtremes = {};

export function setupCharts() {
    const ctx1 = document.getElementById('plot1')?.getContext('2d');
    if (ctx1) {
        chart1 = new Chart(ctx1, {
            type: 'scatter',
            data: { datasets: [{ label: 'Y vs Z', data: [], backgroundColor: 'green' }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Z (m)' }, min: globalExtremes.zMin, max: globalExtremes.zMax },
                    y: { title: { display: true, text: 'Y (m)' }, min: globalExtremes.yMin, max: globalExtremes.yMax }
                },
                animation: false
            }
        });
    }

    const ctx2 = document.getElementById('plot2')?.getContext('2d');
    if (ctx2) {
        chart2 = new Chart(ctx2, {
            type: 'scatter',
            data: { datasets: [{ label: 'X vs Y', data: [], backgroundColor: 'blue' }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Y (m)' }, min: globalExtremes.yMin, max: globalExtremes.yMax },
                    y: { title: { display: true, text: 'X (m)' }, min: globalExtremes.xMin, max: globalExtremes.xMax }
                },
                animation: false
            }
        });
    }
}

export function updateCharts(points) {
    if (chart1) {
    chart1.data.datasets[0].data = points.map(p => ({ x: p.z, y: p.y }));
    chart1.update();
    }

    if (chart2) {
    chart2.data.datasets[0].data = points.map(p => ({ x: p.y, y: p.x }));
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