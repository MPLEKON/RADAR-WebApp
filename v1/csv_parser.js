// Global variables for parsed CSV data and chart instance
let parsedData = [];
let globalExtremes = {};
let currentChart = "y_vs_frames"; // default chart selection
let intervalId = null;
let paused = false;
let currentFrameIndex = 0;
window.realtime = false;
let myChart, ctx;

// Initialize Chart.js
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
    plugins: {}
  }
};
myChart = new Chart(ctx, chartConfig);

// Papa Parse configuration for the CSV file
const configParser = {
    delimiter: ",",
    newline: "",
    quoteChar: '"',
    escapeChar: '"',
    header: true,  // Use header mode
    dynamicTyping: true,
    complete: function(results) {
      console.log("Finished parsing CSV data");
      // Now each row is an object with keys matching the header names.
      parsedData = results.data.map(row => {
        return {
          frameNum: row["Frame Number"],
          timestamp: row["POSIX Timestamp"],
          detectedObjectsNum: row["Num Detected Objects"],
          points: parseNestedArray(row["Detected Objects"])
        };
      });
      updateGlobalExtremes();
    },
    error: function(err) {
      console.error("Error parsing CSV:", err);
    },
    skipEmptyLines: false,
    delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP]
  };
  
  

// Data cleaning functions
function cleanParsedData(parsedData) {
  if (!parsedData || !parsedData.length) return [];
  const firstFrameNum = parsedData[0][0];
  return parsedData.map(row => {
    return {
      frameNum: row[0] - firstFrameNum,
      timestamp: row[1],
      detectedObjectsNum: row[2],
      points: parseNestedArray(row[3])
    };
  });
}
function parseNestedArray(dataString) {
    if (!dataString || dataString.trim() === "" || dataString.trim() === "[]") {
      return [];
    }
    try {
      // Wrap the string in an extra pair of brackets to force it into a JSON array-of-arrays.
      const normalizedString = `[${dataString.trim()}]`;
      const jsonArray = JSON.parse(normalizedString);
      return jsonArray.map(item => {
        if (Array.isArray(item) && item.length >= 5) {
          return {
            x: item[0],
            y: item[1],
            z: item[2],
            radVel: item[3],
            SNR: item[4]
          };
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
  const allXValues = parsedData.flatMap(frame => {
    if (!frame.points || !Array.isArray(frame.points)) {
      console.error("Error: Frame has no `points` field:", frame);
      return [];
    }
    return frame.points.map(pt => pt.x);
  });
  const allYValues = parsedData.flatMap(frame => {
    if (!frame.points || !Array.isArray(frame.points)) return [];
    return frame.points.map(pt => pt.y);
  });
  const allZValues = parsedData.flatMap(frame => {
    if (!frame.points || !Array.isArray(frame.points)) return [];
    return frame.points.map(pt => pt.z);
  });
  const validXValues = allXValues.filter(v => !isNaN(v));
  const validYValues = allYValues.filter(v => !isNaN(v));
  const validZValues = allZValues.filter(v => !isNaN(v));
  globalExtremes = {
    xMin: Math.floor(Math.min(...validXValues)),
    xMax: Math.ceil(Math.max(...validXValues)),
    yMin: Math.floor(Math.min(...validYValues)),
    yMax: Math.ceil(Math.max(...validYValues)),
    zMin: Math.floor(Math.min(...validZValues)),
    zMax: Math.ceil(Math.max(...validZValues))
  };
  console.log("Global Extremes:", globalExtremes);
}

// File upload event listener: when a user selects a CSV file, parse it.
document.getElementById('csvUpload').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, configParser);
  }
});

// Real-Time switch handler
document.getElementById('realTimeSwitch').addEventListener('change', function() {
  window.realtime = this.checked;
  console.log("Real time is:", window.realtime ? "ON" : "OFF");
});

// Data selection dropdown: update chart scales and data based on selection.
document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', function() {
      currentChart = this.getAttribute('data-chart');
      updateChartScales(currentChart);
      if (window.realtime) {
        startRealTime(50, currentChart);
      } else {
        // Clear any existing interval timer to avoid delayed updates.
        clearInterval(intervalId);
        mapStaticData(currentChart);
      }
    });
  });

// Dark Mode switch handling and persistence
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

// Update chart scales based on the selected chart type.
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

// Map static data onto the chart (non-real-time)
function mapStaticData(selectedChart) {
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
  myChart.update();
}

// Real-time playback function
function startRealTime(interval = 50, selectedChart) {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    if (paused) return;
    if (currentFrameIndex >= parsedData.length) {
      console.log("Looping back to first frame...");
      currentFrameIndex = 0;
    }
    const frame = parsedData[currentFrameIndex];
    let dataPoints = [];
    switch (selectedChart) {
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
      default:
        console.error("Unknown chart selection.");
        clearInterval(intervalId);
        return;
    }
    console.log(`Displaying frame: ${currentFrameIndex}, Chart: ${selectedChart}`);
    myChart.data.datasets[0].data = dataPoints;
    myChart.update();
    currentFrameIndex++;
  }, interval);
}

// Pause functionality for real-time playback
function pauseRealTime() {
  console.log("Pausing playback...");
  paused = true;
  clearInterval(intervalId);
}

// Start button handler
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
    currentFrameIndex = 0;
    startRealTime(50, currentChart);
  }
});

// Stop button handler
document.getElementById('stopBtn').addEventListener("click", function() {
  console.log("Pausing real-time playback...");
  paused = true;
  clearInterval(intervalId);
});
