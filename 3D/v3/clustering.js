console.log("Clustering.js loaded!");
export function runDBSCAN(points, eps = 1.0, minPts = 3) {
    const labels = new Array(points.length).fill(undefined);
    let clusterId = 0;

    for (let i = 0; i < points.length; i++) {
        if (labels[i] !== undefined) continue;

        const neighbors = regionQuery(points, i, eps);
        if (neighbors.length < minPts) {
            labels[i] = -1; // noise
            continue;
        }

        expandCluster(points, labels, i, neighbors, clusterId, eps, minPts);
        clusterId++;
    }

    return labels;
}

function expandCluster(points, labels, pointIdx, neighbors, clusterId, eps, minPts) {
    labels[pointIdx] = clusterId;

    let i = 0;
    while (i < neighbors.length) {
        const neighborIdx = neighbors[i];

        if (labels[neighborIdx] === -1) {
            labels[neighborIdx] = clusterId;
        }

        if (labels[neighborIdx] === undefined) {
            labels[neighborIdx] = clusterId;
            const neighborNeighbors = regionQuery(points, neighborIdx, eps);
            if (neighborNeighbors.length >= minPts) {
                neighbors.push(...neighborNeighbors);
            }
        }

        i++;
    }
}

function regionQuery(points, idx, eps) {
    const neighbors = [];
    for (let i = 0; i < points.length; i++) {
        if (i === idx) continue;
        if (euclidean(points[idx], points[i]) <= eps) {
            neighbors.push(i);
        }
    }
    return neighbors;
}

function euclidean(p1, p2) {
    return Math.sqrt(p1.reduce((sum, val, i) => sum + (val - p2[i]) ** 2, 0));
}

export function getBoundingBoxes(points) {
    const clusters = new Map();

    // Group points by clusterId
    for (const p of points) {
        if (p.clusterId === -1) continue; // skip noise
        if (!clusters.has(p.clusterId)) clusters.set(p.clusterId, []);
        clusters.get(p.clusterId).push(p);
    }

    const boundingBoxes = [];

    for (const [clusterId, clusterPoints] of clusters.entries()) {
        const minX = Math.min(...clusterPoints.map(p => p.x));
        const maxX = Math.max(...clusterPoints.map(p => p.x));
        const minY = Math.min(...clusterPoints.map(p => p.y));
        const maxY = Math.max(...clusterPoints.map(p => p.y));
        const minZ = Math.min(...clusterPoints.map(p => p.z));
        const maxZ = Math.max(...clusterPoints.map(p => p.z));

        boundingBoxes.push({
            clusterId,
            xMin: minX,
            xMax: maxX,
            yMin: minY,
            yMax: maxY,
            zMin: minZ,
            zMax: maxZ
        });
    }

    return boundingBoxes;
}

export function getClusterCentroids(points) {
    const clusters = new Map();

    for (const p of points) {
        if (p.clusterId === -1) continue; // skip noise
        if (!clusters.has(p.clusterId)) clusters.set(p.clusterId, []);
        clusters.get(p.clusterId).push(p);
    }

    const centroids = [];

    for (const [clusterId, clusterPoints] of clusters.entries()) {
        const sum = clusterPoints.reduce((acc, p) => ({
            x: acc.x + p.x,
            y: acc.y + p.y,
            z: acc.z + p.z
        }), { x: 0, y: 0, z: 0 });

        const count = clusterPoints.length;
        centroids.push({
            clusterId,
            x: sum.x / count,
            y: sum.y / count,
            z: sum.z / count
        });
    }

    return centroids;
}


