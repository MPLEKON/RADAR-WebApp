// threeScene.js
//import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

let scene; 
let pointMeshes = [];

export function init3DScene() {
    const container = document.getElementById('three-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const gridHelper = new THREE.GridHelper(250, 50);
    gridHelper.position.y = -9;
    scene.add(gridHelper);

    const planeGeo = new THREE.PlaneBufferGeometry(25000, 10000, 8, 8);
    const planeMat = new THREE.MeshBasicMaterial({
        color: 0x99ccff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });

    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotateX(-Math.PI / 2);
    plane.position.y = -9;
    scene.add(plane);

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(90, width / height, 1, 100000);
    camera.position.set(0, 0, 0);
    camera.rotation.set(-3.1025, -1.17, -3.1414);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 30);
    controls.update();


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
    const geometry = new THREE.SphereGeometry(0.5, 32, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x33ffaa });
    
    let totalPoints = 0;

    frames.forEach(frame => {
        if (Array.isArray(frame.points)) {
            frame.points.forEach(({ x, y, z }) => {
                const sphere = new THREE.Mesh(geometry, material);
                sphere.position.set(z, x, y);
                scene.add(sphere);
                pointMeshes.push(sphere);
                totalPoints++;
            });
        }
    });

    //console.log(`Total points rendered: ${totalPoints}`);
}
