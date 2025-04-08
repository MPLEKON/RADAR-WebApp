console.log("✅ csvParser loaded!");

export function parseCSV(raw_csv) {
    return new Promise((resolve, reject) => {
        const configParser = {
            delimiter: ",",
            newline: "", 
            quoteChar: '"',
            escapeChar: '"',
            header: true, //We read the headers but later rename them
            dynamicTyping: true,
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
    if (!parsedData.length || typeof parsedData[0] !== 'object') {
        console.error("❌ Invalid parsed data format!", parsedData);
        return [];
    }

    const firstFrameNum = Number(parsedData[0]["Frame Number"]);
    if (isNaN(firstFrameNum)) {
        console.error("🚨 First frame number is NaN! Something is wrong with parsing.");
    }

    return parsedData.map(row => {
        const frameNum = Number(row["Frame Number"]);
        const timestamp = row["POSIX Timestamp"];
        const latitude = parseFloat(row["Latitude"]) / 1e6;
        const longitude = parseFloat(row["Longitude"]) / 1e6;
        const pointsRaw = row["Detected Objects"];

        if (isNaN(frameNum)) {
            console.warn("⚠️ Skipping row with invalid Frame Number:", row);
            return null;
        }

        return {
            frameNum: frameNum - firstFrameNum,
            timestamp,
            latitude,
            longitude,
            points: parseNestedArray(pointsRaw),
        };
    }).filter(entry => entry !== null);
}


function parseNestedArray(dataString) {
    try {
        if (!dataString || dataString.trim() === "") return [];
        let cleaned = dataString.trim();
        if (!cleaned.startsWith("[")) {
            return [];
        }
        if (!cleaned.startsWith("[[")) {
            cleaned = `[${cleaned}]`;
        }
        cleaned = cleaned.replace(/]\s*\[/g, "],[");
        let rawArray = JSON.parse(cleaned);
        return rawArray.map(obj => ({
            x: obj[0],
            y: obj[1],
            z: obj[2],
            radVel: obj[3],
            SNR: obj[4]
        }));
    } catch (error) {
        console.warn("🚨 JSON Parse Error in Detected Objects:", error, dataString);
        return [];
    }
}

