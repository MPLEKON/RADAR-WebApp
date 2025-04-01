import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create cube geometry and material
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// Create and add cube1 (the one we'll control)
const cube1 = new THREE.Mesh(geometry, material);
scene.add(cube1);

// Optionally add more cubes if desired
const cube2 = new THREE.Mesh(geometry, material);
cube2.position.x = 2;
scene.add(cube2);

const cube3 = new THREE.Mesh(geometry, material);
cube3.position.x = -2;
scene.add(cube3);

const cube4 = new THREE.Mesh(geometry, material);
cube4.position.y = 2;
scene.add(cube4);

const fov = 45;
const aspect = window.innerWidth / window.innerHeight;
const near = 1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 5;

function animate() {
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

const slider = document.getElementById('cubeXSlider');
slider.addEventListener('input', (event) => {
  cube1.position.x = parseFloat(event.target.value);
});
