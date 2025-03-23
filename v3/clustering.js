console.log("Clustering.js laoded succesfully!");
export function runDBSCANOnFrame(frame, eps = 1.0, minPts = 3) {
    const dims = ['x', 'y', 'z'];
    const points = frame.points.map(pt => dims.map(d => pt[d]));

    const dbscan = new DBSCAN();
    const clusters = dbscan.run(points, eps, minPts);

    return {
        frameNum: frame.frameNum,
        clusters: clusters.map((indices, i) => ({
            id: i,
            points: indices.map(idx => points[idx])
        })),
        noise: dbscan.noise.map(idx => points[idx])
    };
}
