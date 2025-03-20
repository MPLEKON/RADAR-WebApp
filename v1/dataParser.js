// To import it use the following:
//import { parseAndCleanCSV } from "./dataParser.js";

      // Use the external csvData variable (from csv.js) as input.
//     const cleanedData = parseAndCleanCSV(csvData);
//     console.log("Cleaned Data:", cleanedData);
//


export function cleanParsedData(parsedData) {
    const firstFrameNum = parsedData[0][0];
    return parsedData.map(row => ({
      frameNum: row[0] - firstFrameNum, // Make frame number zero-based
      timestamp: row[1],
      detectedObjectsNum: row[2],
      points: parseNestedArray(row[3])
    }));
  }

  export function parseNestedArray(dataString) {
    if (!dataString || typeof dataString !== "string") return [];
    try {
      // Wrap the string to form a valid JSON array of arrays.
      let rawArray = JSON.parse(`[${dataString}]`);
      return rawArray.map(obj => ({
        x: obj[0],
        y: obj[1],
        z: obj[2],
        radVel: obj[3],
        snr: obj[4]
      }));
    } catch (error) {
      console.warn("JSON Parse Error:", error);
      return [];
    }
  }
  
  export function parseAndCleanCSV(raw_csv) {
    const config = {
      delimiter: ",",
      newline: "", // auto-detect newlines
      quoteChar: '"',
      escapeChar: '"',
      header: false,
      dynamicTyping: true,
      skipEmptyLines: false
    };
  
    const results = Papa.parse(raw_csv, config);
    return cleanParsedData(results.data);
  }