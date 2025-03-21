console.log("✅ v2_csv_giannis.js loaded!");
export function parseCSV(raw_csv) {
    return new Promise((resolve, reject) => {
        const configParser = {
            delimiter: ",",
            newline: "", 
            quoteChar: '"',
            escapeChar: '"',
            header: false, 
            dynamicTyping: true,  // ✅ Ensure numbers stay as numbers
            skipEmptyLines: true, 
            complete: function(results) {
                console.log("📊 Parsing complete:", results);
                let cleanedData = cleanParsedData(results.data);
                console.log("🧼 Cleaned Data:", cleanedData);
                resolve(cleanedData);
            },
            error: function(error) {
                console.error("❌ Parsing error:", error);
                reject(error);
            }
        };

        Papa.parse(raw_csv, configParser);
    });
}

function cleanParsedData(parsedData) {
    if (!parsedData.length || !Array.isArray(parsedData[0])) {
        console.error("❌ Invalid parsed data format!", parsedData);
        return [];
    }

    const firstFrameNum = Number(parsedData[0][0]); // ✅ Ensure it's a number
    if (isNaN(firstFrameNum)) {
        console.error("🚨 First frame number is NaN! Something is wrong with parsing.");
    }

    return parsedData.map(row => {
        let frameNum = Number(row[0]); // ✅ Explicitly convert to a number
        if (isNaN(frameNum)) {
            console.warn("⚠️ Skipping row with invalid frameNum:", row);
            return null;
        }

        return {
            frameNum: frameNum - firstFrameNum, // ✅ Ensures subtraction works
            timestamp: row[1], 
            detectedObjectsNum: row[2],
            points: parseNestedArray(row[3]),
        };
    }).filter(entry => entry !== null); // ✅ Remove any invalid rows
}

function parseNestedArray(dataString) {
    try {
        let rawArray = JSON.parse(`[${dataString}]`); // ✅ Ensure it's parsed as JSON
        return rawArray.map(obj => ({
            x: obj[0],
            y: obj[1],
            z: obj[2],
            radVel: obj[3],
            SNR: obj[4]
        }));
    } catch (error) {
        console.warn("🚨 JSON Parse Error:", error);
        return []; // ✅ Return an empty array instead of invalid data
    }
}