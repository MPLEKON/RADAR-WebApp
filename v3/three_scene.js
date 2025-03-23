import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

let scene, camera, renderer;
let spheresGroup = null;
console.log("🚀 three_scene.js is loaded!");
export function initThreeScene() {
    console.log("🛠 Initializing Three.js Scene...");
    scene = new THREE.Scene();

    // 🔥 Move the camera back so objects are visible
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 100, 500);  // 🔥 Move camera up and back
    console.log("📷 Camera positioned at:", camera.position);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // ✅ Ambient Light (General Scene Light)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);  // 🔥 Increase brightness
    scene.add(ambientLight);

    // ✅ Directional Light (Simulates the Sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(100, 100, 100);
    scene.add(dirLight);

    // ✅ Point Light (Bright Local Light)
    const pointLight = new THREE.PointLight(0xffffff, 2, 500);
    pointLight.position.set(0, 100, 200);
    scene.add(pointLight);

    console.log("💡 Lighting added: Ambient, Directional, and Point Light");

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // ✅ Expose variables globally for debugging
    window.scene = scene;
    window.camera = camera;
    window.renderer = renderer;
}

function createSphere(pt) {
    const geometry = new THREE.SphereGeometry(2, 16, 16); // 🔴 Larger spheres
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // 🔴 Red color

    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(pt.x, pt.y, pt.z);  // 🔥 Scale up positions

    console.log("✅ Created sphere at:", sphere.position);
    return sphere;
}



export function renderAllFrames(data) {
    clearPrevious();  // Ensure old objects are removed
    spheresGroup = new THREE.Group();

    console.log("🔄 Rendering 3D Data:", data);
    let frameCount = 0;
    let sphereCount = 0;

    data.forEach((frame, frameIndex) => {
        frameCount++;
        console.log(`📌 Processing Frame ${frameIndex + 1}, Objects: ${frame.points.length}`);

        frame.points.forEach(pt => {
            console.log(`🟢 Attempting to place sphere at:`, pt.x, pt.y, pt.z);
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
