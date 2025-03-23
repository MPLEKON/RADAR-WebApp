export function runDBSCANOnFrame(frame, eps = 1.0, minPts = 3) {
    const dims = ['x', 'y', 'z'];
    const points = frame.points.map(pt => dims.map(d => pt[d]));

    const dbscan = new mlClusterdensity.DBSCAN();
    const clusters = dbscan.run(points, eps, minPts);

    // Tag each point with cluster ID
    const clusteredPoints = frame.points.map((pt, i) => {
        const clusterId = clusters.findIndex(indices => indices.includes(i));
        return {
            ...pt,
            clusterId: clusterId >= 0 ? clusterId : -1  // -1 means noise
        };
    });

    return {
        frameNum: frame.frameNum,
        points: clusteredPoints
    };
}
