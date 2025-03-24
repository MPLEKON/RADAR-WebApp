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
