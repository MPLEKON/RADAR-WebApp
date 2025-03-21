/******************************************************
 * Global Variables & Configuration
 ******************************************************/
const FRAME_BUFFER_SIZE = 10; // <--- Number of frames to keep in the buffer for smoothing

// Store the last N frames (in real-time mode).
// Each entry is the "frame" from parsedData
let frameBuffer = [];

// Global variables for parsed CSV data and chart instance
let parsedData = [];
let globalExtremes = {};
let currentChart = "y_vs_frames"; // default chart selection
let intervalId = null;
let paused = false;
let currentFrameIndex = 0;
window.realtime = false;
let myChart, ctx;

// Global variable to store cluster bounding boxes
window.clusterBoxes = [];

/******************************************************
 * Chart.js Initialization
 ******************************************************/
ctx = document.getElementById('myChart');
const chartConfig = {
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
      x: {},
      y: {}
    },
    plugins: {
      title: { display: true },
      clusterBoxes: {} // Our custom plugin for bounding boxes
    }
  }
};
myChart = new Chart(ctx, chartConfig);

/******************************************************
 * CSV Parsing (PapaParse)
 ******************************************************/
const configParser = {
  delimiter: ",",
  newline: "",
  quoteChar: '"',
  escapeChar: '"',
  header: true,  // Use header mode so rows become objects with keys
  dynamicTyping: true,
  complete: function(results) {
    console.log("Finished parsing CSV data");
    parsedData = results.data.map(row => ({
      frameNum: row["Frame Number"],
      timestamp: row["POSIX Timestamp"],
      detectedObjectsNum: row["Num Detected Objects"],
      points: parseNestedArray(row["Detected Objects"])
    }));
    updateGlobalExtremes();
  },
  error: function(err) {
    console.error("Error parsing CSV:", err);
  },
  skipEmptyLines: false,
  delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP]
};

document.getElementById('csvUpload').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, configParser);
  }
});

/******************************************************
 * Data Cleaning & Extrema
 ******************************************************/
function parseNestedArray(dataString) {
  if (!dataString || dataString.trim() === "" || dataString.trim() === "[]") return [];
  try {
    // Force the string into a valid JSON array-of-arrays
    const normalizedString = `[${dataString.trim()}]`;
    const jsonArray = JSON.parse(normalizedString);
    return jsonArray.map(item => {
      if (Array.isArray(item) && item.length >= 5) {
        return { x: item[0], y: item[1], z: item[2], radVel: item[3], SNR: item[4] };
      } else {
        console.warn("Item not in expected format:", item);
        return null;
      }
    }).filter(item => item !== null);
  } catch (error) {
    console.error("JSON Parse Error on string:", dataString, "\nError:", error);
    return [];
  }
}

function updateGlobalExtremes() {
  const allXValues = parsedData.flatMap(frame => frame.points ? frame.points.map(pt => pt.x) : []);
  const allYValues = parsedData.flatMap(frame => frame.points ? frame.points.map(pt => pt.y) : []);
  const allZValues = parsedData.flatMap(frame => frame.points ? frame.points.map(pt => pt.z) : []);
  globalExtremes = {
    xMin: Math.floor(Math.min(...allXValues)),
    xMax: Math.ceil(Math.max(...allXValues)),
    yMin: Math.floor(Math.min(...allYValues)),
    yMax: Math.ceil(Math.max(...allYValues)),
    zMin: Math.floor(Math.min(...allZValues)),
    zMax: Math.ceil(Math.max(...allZValues))
  };
  console.log("Global Extremes:", globalExtremes);
}

/******************************************************
 * UI Handlers
 ******************************************************/
document.getElementById('realTimeSwitch').addEventListener('change', function() {
  window.realtime = this.checked;
  console.log("Real time is:", window.realtime ? "ON" : "OFF");
});

document.querySelectorAll('.dropdown-item').forEach(item => {
  item.addEventListener('click', function() {
    currentChart = this.getAttribute('data-chart');
    updateChartScales(currentChart);
    if (window.realtime) {
      startRealTime(50, currentChart);
    } else {
      clearInterval(intervalId);
      mapStaticData(currentChart);
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const htmlElement = document.documentElement;
  const switchElement = document.getElementById('darkModeSwitch');
  const currentTheme = localStorage.getItem('bsTheme') || 'dark';
  htmlElement.setAttribute('data-bs-theme', currentTheme);
  switchElement.checked = currentTheme === 'dark';
  switchElement.addEventListener('change', function () {
    if (this.checked) {
      htmlElement.setAttribute('data-bs-theme', 'dark');
      localStorage.setItem('bsTheme', 'dark');
    } else {
      htmlElement.setAttribute('data-bs-theme', 'light');
      localStorage.setItem('bsTheme', 'light');
    }
  });
});

/******************************************************
 * Chart Scale Updates
 ******************************************************/
function updateChartScales(selectedChart) {
  const maxFrames = parsedData.length ? parsedData[parsedData.length - 1].frameNum : 0;
  console.log("Updating chart scales for:", selectedChart);
  switch (selectedChart) {
    case "y_vs_frames":
      myChart.options.scales.x = { min: 0, max: maxFrames, title: { display: true, text: "Frame" } };
      myChart.options.scales.y = { min: 0, max: globalExtremes.yMax + 10, title: { display: true, text: "Y (m)" } };
      myChart.options.plugins.title = { display: true, text: "Y vs Frames" };
      break;
    case "z_vs_frames":
      myChart.options.scales.x = { min: 0, max: maxFrames, title: { display: true, text: "Frame" } };
      myChart.options.scales.y = { min: globalExtremes.zMin, max: globalExtremes.zMax + 10, title: { display: true, text: "Z (m)" } };
      myChart.options.plugins.title = { display: true, text: "Z vs Frames" };
      break;
    case "x_vs_frames":
      myChart.options.scales.x = { min: 0, max: maxFrames, title: { display: true, text: "Frame" } };
      myChart.options.scales.y = { min: globalExtremes.xMin, max: globalExtremes.xMax, title: { display: true, text: "X (m)" } };
      myChart.options.plugins.title = { display: true, text: "X vs Frames" };
      break;
    case "y_vs_z":
      myChart.options.scales.x = { min: globalExtremes.zMin, max: globalExtremes.zMax, title: { display: true, text: "Z (m)" } };
      myChart.options.scales.y = { min: 0, max: globalExtremes.yMax + 10, title: { display: true, text: "Y (m)" } };
      myChart.options.plugins.title = { display: true, text: "Y vs Z" };
      break;
    case "x_vs_y":
      myChart.options.scales.x = { min: 0, max: globalExtremes.yMax + 10, title: { display: true, text: "Y (m)" } };
      myChart.options.scales.y = { min: globalExtremes.xMin, max: globalExtremes.xMax, title: { display: true, text: "X (m)" } };
      myChart.options.plugins.title = { display: true, text: "X vs Y" };
      break;
    case "x_vs_z":
      myChart.options.scales.x = { min: globalExtremes.zMin, max: globalExtremes.zMax, title: { display: true, text: "Z (m)" } };
      myChart.options.scales.y = { min: globalExtremes.xMin, max: globalExtremes.xMax, title: { display: true, text: "X (m)" } };
      myChart.options.plugins.title = { display: true, text: "X vs Z" };
      break;
    default:
      console.log("Unknown chart selection.");
      return;
  }
  myChart.update();
}

/******************************************************
 * Static Data Mapping
 ******************************************************/
function mapStaticData(selectedChart) {
  // Clear the frame buffer (not used in static mode)
  frameBuffer = [];

  let dataPoints = [];
  switch (selectedChart) {
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
    default:
      console.error("Unknown chart selection.");
      return;
  }
  console.log("Mapped Data Points:", dataPoints);

  myChart.data.datasets[0].data = dataPoints;
  updateClusters(); // recalc clusters
  myChart.update();
}

/******************************************************
 * Real-Time Playback with Frame Buffer
 ******************************************************/
function startRealTime(interval = 50, selectedChart) {
  if (intervalId) clearInterval(intervalId);
  // Clear the buffer at the start
  frameBuffer = [];
  currentFrameIndex = 0;
  paused = false;

  intervalId = setInterval(() => {
    if (paused) return;
    if (currentFrameIndex >= parsedData.length) {
      console.log("Looping back to first frame...");
      currentFrameIndex = 0;
      frameBuffer = [];
    }

    // Add the current frame to the buffer
    const frame = parsedData[currentFrameIndex];
    frameBuffer.push(frame);
    // If buffer is bigger than FRAME_BUFFER_SIZE, remove the oldest
    if (frameBuffer.length > FRAME_BUFFER_SIZE) {
      frameBuffer.shift();
    }

    // Flatten the points from all frames in the buffer
    let dataPoints = [];
    switch (selectedChart) {
      case "y_vs_frames":
        dataPoints = frameBuffer.flatMap(f =>
          f.points.map(pt => ({ x: f.frameNum, y: pt.y }))
        );
        break;
      case "z_vs_frames":
        dataPoints = frameBuffer.flatMap(f =>
          f.points.map(pt => ({ x: f.frameNum, y: pt.z }))
        );
        break;
      case "x_vs_frames":
        dataPoints = frameBuffer.flatMap(f =>
          f.points.map(pt => ({ x: f.frameNum, y: pt.x }))
        );
        break;
      case "y_vs_z":
        dataPoints = frameBuffer.flatMap(f =>
          f.points.map(pt => ({ x: pt.z, y: pt.y }))
        );
        break;
      case "x_vs_y":
        dataPoints = frameBuffer.flatMap(f =>
          f.points.map(pt => ({ x: pt.y, y: pt.x }))
        );
        break;
      case "x_vs_z":
        dataPoints = frameBuffer.flatMap(f =>
          f.points.map(pt => ({ x: pt.z, y: pt.x }))
        );
        break;
      default:
        console.error("Unknown chart selection.");
        clearInterval(intervalId);
        return;
    }

    console.log(`Displaying frames [${currentFrameIndex - frameBuffer.length + 1}..${currentFrameIndex}], Chart: ${selectedChart}, #points=${dataPoints.length}`);
    myChart.data.datasets[0].data = dataPoints;
    updateClusters(); // recalc clusters for the buffered points
    myChart.update();

    currentFrameIndex++;
  }, interval);
}

function pauseRealTime() {
  console.log("Pausing playback...");
  paused = true;
  clearInterval(intervalId);
}

// Start/Stop Buttons
document.getElementById('startBtn').addEventListener("click", function() {
  if (!parsedData.length) {
    console.warn("No CSV data loaded.");
    return;
  }
  if (paused) {
    console.log("Resuming real-time playback...");
    paused = false;
  } else {
    console.log("Starting real-time playback...");
    startRealTime(50, currentChart);
  }
});

document.getElementById('stopBtn').addEventListener("click", function() {
  console.log("Pausing real-time playback...");
  pauseRealTime();
});

/******************************************************
 * DBSCAN & Clustering
 ******************************************************/
function dbscan(points, eps, minPts) {
  let clusters = [];
  let visited = new Array(points.length).fill(false);
  for (let i = 0; i < points.length; i++) {
    if (visited[i]) continue;
    visited[i] = true;
    let neighbors = regionQuery(points, i, eps);
    // Debug:
    // console.log(`Point ${i} has ${neighbors.length} neighbors.`);
    if (neighbors.length < minPts) {
      // noise
    } else {
      let cluster = [];
      expandCluster(points, i, neighbors, cluster, visited, eps, minPts);
      clusters.push(cluster);
    }
  }
  // console.log("DBSCAN clusters:", clusters);
  return clusters;
}
function regionQuery(points, idx, eps) {
  let neighbors = [];
  for (let j = 0; j < points.length; j++) {
    if (distance(points[idx], points[j]) <= eps) {
      neighbors.push(j);
    }
  }
  return neighbors;
}
function distance(p1, p2) {
  return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
}
function expandCluster(points, idx, neighbors, cluster, visited, eps, minPts) {
  cluster.push(idx);
  for (let k = 0; k < neighbors.length; k++) {
    let nIdx = neighbors[k];
    if (!visited[nIdx]) {
      visited[nIdx] = true;
      let neighbors2 = regionQuery(points, nIdx, eps);
      if (neighbors2.length >= minPts) {
        neighbors = neighbors.concat(neighbors2.filter(n => !neighbors.includes(n)));
      }
    }
    if (!cluster.includes(nIdx)) {
      cluster.push(nIdx);
    }
  }
}
function computeBoundingBox(points, cluster) {
  let xs = cluster.map(i => points[i].x);
  let ys = cluster.map(i => points[i].y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}

// Expose DBSCAN globally (for console testing)
window.dbscan = dbscan;

/******************************************************
 * Update Clusters
 ******************************************************/
function updateClusters() {
  const points = myChart.data.datasets[0].data;
  if (!points || points.length === 0) {
    window.clusterBoxes = [];
    return;
  }
  // Adjust eps and minPts as needed. Try eps=5 or 10 if data is large scale
  const clusters = dbscan(points, 5, 2);
  window.clusterBoxes = clusters.map(cluster => computeBoundingBox(points, cluster));
  // console.log("Updated cluster bounding boxes:", window.clusterBoxes);
}

/******************************************************
 * Chart.js Plugin to Draw Bounding Boxes
 ******************************************************/
Chart.register({
  id: 'clusterBoxes',
  afterDatasetsDraw(chart, args, options) {
    const { ctx } = chart;
    ctx.save();
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    if (window.clusterBoxes && window.clusterBoxes.length) {
      window.clusterBoxes.forEach(bbox => {
        const xMinPixel = chart.scales.x.getPixelForValue(bbox.minX);
        const xMaxPixel = chart.scales.x.getPixelForValue(bbox.maxX);
        const yMinPixel = chart.scales.y.getPixelForValue(bbox.minY);
        const yMaxPixel = chart.scales.y.getPixelForValue(bbox.maxY);
        ctx.strokeRect(
          Math.min(xMinPixel, xMaxPixel),
          Math.min(yMinPixel, yMaxPixel),
          Math.abs(xMaxPixel - xMinPixel),
          Math.abs(yMaxPixel - yMinPixel)
        );
      });
    }
    ctx.restore();
  }
});

/******************************************************
 * "Show Clusters" Button (optional manual trigger)
 ******************************************************/
document.getElementById('clusterBtn').addEventListener('click', () => {
  const points = myChart.data.datasets[0].data;
  if (!points || points.length === 0) {
    console.warn("No data points to cluster.");
    return;
  }
  const clusters = dbscan(points, 5, 2);
  window.clusterBoxes = clusters.map(cluster => computeBoundingBox(points, cluster));
  console.log("Cluster bounding boxes:", window.clusterBoxes);
  myChart.update();
});
