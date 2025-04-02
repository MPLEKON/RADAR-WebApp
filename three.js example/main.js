import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/controls/OrbitControls.js';

// CSV file path (same folder as index.html)
const CSV_URL = './Super_short_detected_objects.csv';

// Global variables for frame data
let frames = [];
let currentFrameIndex = 0;
let maxFrames = 0;

// Create the scene
const scene = new THREE.Scene();

// Camera setup: 60° FOV, placed at (0,37,40) looking at (0,37,0)
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  1,
  1000
);
camera.position.set(0, 37, 40);
camera.lookAt(0, 37, 0);

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls for interactive zoom/pan/orbit
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 37, 0);
controls.update();

// ArrowHelper: shows camera's forward direction, 50 units long
const cameraDirection = new THREE.Vector3();
camera.getWorldDirection(cameraDirection); // normalized direction vector
const depthArrow = new THREE.ArrowHelper(
  cameraDirection,
  camera.position,
  50,
  0xffff00, // yellow
  2,
  1
);
scene.add(depthArrow);

// AxesHelper at (0,37,0) to match your data's center
const axesHelper = new THREE.AxesHelper(10);
axesHelper.position.set(0, 37, 0);
scene.add(axesHelper);

// Create up to four cubes (one per object in a frame)
const geometry = new THREE.BoxGeometry(1, 1, 1);
const cubes = [];
for (let i = 0; i < 4; i++) {
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  cubes.push(cube);
}

// Load and parse the CSV using Papa Parse
fetch(CSV_URL)
  .then((response) => response.text())
  .then((csvText) => {
    const results = Papa.parse(csvText.trim(), {
      header: true,
      skipEmptyLines: true,
    });
    console.log('Raw parse results:', results.data);

    // Group rows by frame number
    const frameMap = new Map();
    results.data.forEach((row) => {
      const frameNum = parseInt(row['Frame Number'], 10);
      const timestamp = parseFloat(row['POSIX Timestamp']);
      const numDetected = parseInt(row['Num Detected Objects'], 10);
      const rawObjects = row['Detected Objects'];

      let objectsArray = [];
      if (rawObjects && rawObjects.trim() !== '[]') {
        try {
          // Convert the "Detected Objects" string to a valid JSON array
          const asJson = `[${rawObjects}]`;
          const parsed = JSON.parse(asJson);
          objectsArray = parsed.map((arr) => ({
            x: parseFloat(arr[0]),
            y: parseFloat(arr[1]),
            z: parseFloat(arr[2]),
            radialSpeed: parseFloat(arr[3]),
            snr: parseFloat(arr[4]),
          }));
        } catch (err) {
          console.error('Failed to parse Detected Objects for frame', frameNum, err);
        }
      }

      frameMap.set(frameNum, {
        frameNum,
        timestamp,
        numDetected,
        objects: objectsArray,
      });
    });

    // Sort frames by frameNum
    const sortedFrameNums = Array.from(frameMap.keys()).sort((a, b) => a - b);
    frames = sortedFrameNums.map((fn) => frameMap.get(fn));
    maxFrames = frames.length;
    console.log('Parsed frames:', frames);
  })
  .catch((err) => console.error('Error loading CSV:', err));

// Update frames at 50ms intervals
let lastFrameTime = 0;
const frameDelay = 50; // 50ms per frame

function animate(time) {
  requestAnimationFrame(animate);

  // If we have frames, update the cubes
  if (frames.length > 0) {
    if (time - lastFrameTime > frameDelay) {
      lastFrameTime = time;
      currentFrameIndex = (currentFrameIndex + 1) % maxFrames;
    }

    const frameData = frames[currentFrameIndex].objects;
    for (let i = 0; i < cubes.length; i++) {
      if (i < frameData.length) {
        cubes[i].position.x = frameData[i].x;
        cubes[i].position.y = frameData[i].y;
        cubes[i].position.z = frameData[i].z;
        cubes[i].visible = true;
      } else {
        cubes[i].visible = false;
      }
    }
  }

  // Update controls and render
  controls.update();
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
