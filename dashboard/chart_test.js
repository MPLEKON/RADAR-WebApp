window.addEventListener("DOMContentLoaded", () => {
    // Y vs Z
    const ctx1 = document.getElementById('plot1')?.getContext('2d');
    if (ctx1) {
    new Chart(ctx1, {
        type: 'scatter',
        data: {
        datasets: [{
            label: 'Y vs Z',
            data: [{ x: 3, y: 8 }, { x: 5, y: 10 }],
            backgroundColor: 'green'
        }]
        },
        options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: 'Z (m)' } },
            y: { title: { display: true, text: 'Y (m)' } }
        }
        }
    });
    }

    // X vs Y
    const ctx2 = document.getElementById('plot2')?.getContext('2d');
    if (ctx2) {
    new Chart(ctx2, {
        type: 'scatter',
        data: {
        datasets: [{
            label: 'X vs Y',
            data: [{ x: 7, y: 12 }, { x: 10, y: 15 }],
            backgroundColor: 'blue'
        }]
        },
        options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: 'X (m)' } },
            y: { title: { display: true, text: 'Y (m)' } }
        }
        }
    });
    }
});
