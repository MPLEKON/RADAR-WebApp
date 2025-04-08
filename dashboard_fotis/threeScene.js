// threeScene.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

let scene; // Declare at module scope
let pointMeshes = [];

export function init3DScene() {
    const container = document.getElementById('three-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(90, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 12, 30);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    animate();
}

export function renderAllPoints(parsedData) {
    //console.log('Rendering all points from first 10 frames...');

    // Remove existing spheres
    pointMeshes.forEach(mesh => scene.remove(mesh));
    pointMeshes = [];

    let totalPoints = 0;

    parsedData.forEach((frame, index) => {
        if (index >= 10) return; // Only first 10 frames
        if (Array.isArray(frame.points)) {
            frame.points.forEach(({ x, y, z }) => {
                const geometry = new THREE.SphereGeometry(0.1, 8, 8);
                const material = new THREE.MeshStandardMaterial({ color: 0x3399ff });
                const sphere = new THREE.Mesh(geometry, material);
                sphere.position.set(x, y, z);
                scene.add(sphere);
                pointMeshes.push(sphere);
                totalPoints++;
            });
        }
    });

    //console.log(`Rendered ${totalPoints} points from 10 frames.`);
}

export function renderBufferedFrames(frames) {
    //console.log(`Rendering buffer of ${frames.length} frames`);

    // Remove existing spheres
    pointMeshes.forEach(mesh => scene.remove(mesh));
    pointMeshes = [];
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0x33ffaa });
    
    let totalPoints = 0;

    frames.forEach(frame => {
        if (Array.isArray(frame.points)) {
            frame.points.forEach(({ x, y, z }) => {
                const sphere = new THREE.Mesh(geometry, material);
                sphere.position.set(z, y, x);
                scene.add(sphere);
                pointMeshes.push(sphere);
                totalPoints++;
            });
        }
    });

    //console.log(`Total points rendered: ${totalPoints}`);
}
