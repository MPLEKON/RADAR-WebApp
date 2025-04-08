console.log("✅ map_plotter.js loaded!");

let map = null;
let marker = null;
let lastCoords = null;

export function initMap() {
    // Create map centered at (0,0) - will update when first data arrives
    map = L.map('map-container').setView([0, 0], 18);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

export function updateMap(frame) {
    if (!frame || !frame.latitude || !frame.longitude) return;
    
    // Check if coordinates changed (6 decimal places ≈ 10cm precision)
    const currentCoords = `${frame.latitude.toFixed(6)},${frame.longitude.toFixed(6)}`;
    if (lastCoords === currentCoords) return;
    lastCoords = currentCoords;

    const newPos = [frame.latitude, frame.longitude];
    
    if (!marker) {
        // Create marker and center map
        marker = L.marker(newPos).addTo(map);
        map.setView(newPos, 18); // Centers the map on the marker
    } else {
        // Move marker and keep it centered
        marker.setLatLng(newPos);
        map.panTo(newPos, {
            animate: true,
            duration: 1, 
            easeLinearity: 0.25
        });
    }
}