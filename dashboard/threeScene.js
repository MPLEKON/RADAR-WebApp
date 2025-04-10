let scene, camera, renderer, controls;
let spheres = [];
let boundingBoxes = [];
let frameIndex = 0;
let parsedData = [];
let isPaused = false;
let mode = "realtime";
let yRange = { min: -10, max: 10 }; // Set appropriately before playback
import { getBoundingBoxes,getClusterCentroids } from './clustering.js';


export function createScene(container) {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const gridHelper = new THREE.GridHelper(260, 26);
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

    const pyramidGeometry = new THREE.ConeGeometry(2, 7, 4); 
    const pyramidMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        transparent: false,
        opacity: 0.8
    });
    const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);

    
    pyramid.position.set(0, 0, -3.5); 
    pyramid.rotation.y = Math.PI/4;
    pyramid.rotation.x = -Math.PI/2; 
    scene.add(pyramid);
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(90, width / height, 1, 100000);
    camera.position.set(0, 0, 0);
    camera.rotation.set(-3.1025, -1.17, -3.1414);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 30);
    controls.update();


    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });

    return { scene, camera, renderer, controls };
    
}

export function renderBufferedFrames(frames,yMin,yMax) {
    if (!scene) return;

    // ✅ Clear only spheres and bounding boxes
    spheres.forEach(s => scene.remove(s));
    boundingBoxes.forEach(b => scene.remove(b));
    spheres = [];
    boundingBoxes = [];

    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const allPoints = frames.flatMap(f => f.points);

    // Compute Y range for color interpolation
    const colorNear = new THREE.Color(0xff0000); // Red = close
    const colorFar = new THREE.Color(0x00ff00);  // Green = far

    for (const point of allPoints) {
        // Normalize Y to [0, 1] range
        const normY = (point.y - yMin) / (yMax - yMin || 1); // avoid /0
        const color = colorNear.clone().lerp(colorFar, normY);

        const material = new THREE.MeshBasicMaterial({ color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(point.z, point.x, point.y); // (z, x, y)
        scene.add(sphere);
        spheres.push(sphere);
    }

    const boxes = getBoundingBoxes(allPoints);
    for (const box of boxes) {
        const sizeX = box.xMax - box.xMin;
        const sizeY = box.yMax - box.yMin;
        const sizeZ = box.zMax - box.zMin;
        const centerX = (box.xMin + box.xMax) / 2;
        const centerY = (box.yMin + box.yMax) / 2;
        const centerZ = (box.zMin + box.zMax) / 2;

        const boxGeometry = new THREE.BoxGeometry(sizeZ, sizeX, sizeY);
        const edges = new THREE.EdgesGeometry(boxGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        wireframe.position.set(centerZ, centerX, centerY);
        scene.add(wireframe);
        boundingBoxes.push(wireframe);
    }

    // ⛴️ Create a rectangle (dock) at each centroid
const centroids = getClusterCentroids(allPoints);

for (const c of centroids) {
    if (c.y <= 12) continue; // only show dock if centroid is far enough

    const dockGeometry = new THREE.BoxGeometry(10, 2, 2); // Depth (Z), Width (X), Height (Y)
    const dockMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.6
    });

    const dock = new THREE.Mesh(dockGeometry, dockMaterial);

    // Place the dock so its upper-left-front corner is on the centroid
    // Remember: THREE.BoxGeometry is centered by default
    dock.position.set(
        c.z ,   // shift in z (depth) to match front face
        c.x ,   // shift in x (width) to match left edge
        c.y     // shift in y (height) to match top
    );

    scene.add(dock);
    boundingBoxes.push(dock); // so we can remove it on next render
}

    renderer.render(scene, camera);
}

export function setCameraMode(mode) {
    switch (mode) {
        case "fpv":
            camera.position.set(0, 9, 0);
            camera.rotation.set(-3.1025, 0, -3.1414);
            controls.target.set(0, 9, 30);
            break;

        case "side":
            camera.position.set(40, 9, 0);
            controls.target.set(0, 9, 0);
            break;

        case "top":
            camera.position.set(0, 40,0);
            camera.rotation.set(0, 0, 0);
            controls.target.set(0, 0, 0);
            break;

        default:
            console.warn(`Unknown camera mode: ${mode}`);
    }

    controls.update();
}
export function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}