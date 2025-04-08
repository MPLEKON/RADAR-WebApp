// map_plotter.js
console.log("✅ map_plotter.js loaded!");

let lastCoords = null;
let mapIframe = null;

export function updateMap(frame) {
    if (!frame || !frame.latitude || !frame.longitude) return;
    
    // Check if coordinates actually changed
    const currentCoords = `${frame.latitude.toFixed(6)},${frame.longitude.toFixed(6)}`;
    if (lastCoords === currentCoords) return;
    lastCoords = currentCoords;

    const mapContainer = document.getElementById('map-container');
    
    // Create iframe if it doesn't exist
    if (!mapIframe) {
        mapIframe = document.createElement('iframe');
        mapIframe.width = "100%";
        mapIframe.height = "100%";
        mapIframe.frameBorder = "0";
        mapContainer.appendChild(mapIframe);
    }
    
    // Update the map
    mapIframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${
        frame.longitude-0.002},${frame.latitude-0.002},${
        frame.longitude+0.002},${frame.latitude+0.002
    }&layer=mapnik&marker=${frame.latitude},${frame.longitude}`;
}