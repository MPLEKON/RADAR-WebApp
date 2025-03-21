import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

let scene, camera, renderer;
let spheresGroup = null;
console.log("🚀 three_scene.js is loaded!");
export function initThreeScene(containerId = 'three-container') {
    console.log("🛠 Initializing Three.js Scene...");
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error("❌ ERROR: No container found for Three.js!");
        return;
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 100); // Move the camera back
    console.log("📷 Camera positioned at:", camera.position);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = ''; // Clear old canvas
    container.appendChild(renderer.domElement);

    const testCube = new THREE.Mesh(
        new THREE.BoxGeometry(10, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    scene.add(testCube);
    console.log("🟩 Added test cube at (0,0,0)");
    
    
    // Add ambient and point lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.0)); // Increase brightness
    const pointLight = new THREE.PointLight(0xffffff, 2);
    pointLight.position.set(20, 20, 20);
    scene.add(pointLight);

    console.log("✅ Three.js Scene Initialized!");
    animate();
}


function animate() {
  requestAnimationFrame(animate);
  scene.rotation.y += 0.0015;
  renderer.render(scene, camera);
}

function createSphere(pt) {
    const geometry = new THREE.SphereGeometry(2, 16, 16);  // 🔴 Larger spheres
    const color = new THREE.Color(0xff0000);  // 🔴 Red for visibility
    const material = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.5 });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(pt.x * 10, pt.y * 10, pt.z * 10);  // 🔥 Scale up positions
    return sphere;
}


export function renderAllFrames(data) {
    clearPrevious();
    spheresGroup = new THREE.Group();

    console.log("🔄 Rendering 3D Data:", data);
    let frameCount = 0;
    let sphereCount = 0;

    data.forEach(frame => {
        frameCount++;
        frame.points.forEach(pt => {
            console.log(`🟢 Attempting to place sphere in Frame ${frameCount} at:`, pt.x, pt.y, pt.z);
            if (!isNaN(pt.x) && !isNaN(pt.y) && !isNaN(pt.z)) {
                const sphere = createSphere(pt);
                spheresGroup.add(sphere);
                sphereCount++;
            } else {
                console.warn("⚠️ Skipping invalid point:", pt);
            }
        });
    });

    console.log(`🎯 Total spheres added: ${sphereCount}`);
    scene.add(spheresGroup);
}



  

export function renderSingleFrame(frame) {
  clearPrevious();
  spheresGroup = new THREE.Group();

  frame.points.forEach(pt => {
    const sphere = createSphere(pt);
    spheresGroup.add(sphere);
  });

  scene.add(spheresGroup);
}

function clearPrevious() {
  if (spheresGroup) {
    scene.remove(spheresGroup);
    spheresGroup.children.forEach(obj => obj.geometry.dispose());
    spheresGroup = null;
  }
}
