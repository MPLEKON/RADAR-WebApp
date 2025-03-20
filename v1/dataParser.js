// dataParser.js

// Use this to parse the nested array in row[3].
export function parseNestedArray(dataString) {
  if (!dataString || typeof dataString !== "string") {
    console.warn("parseNestedArray: invalid dataString:", dataString);
    return [];
  }
  try {
    // Wrap the string to form a valid JSON array of arrays.
    let rawArray = JSON.parse(`[${dataString}]`);
    // Convert each element to an object with numeric fields.
    return rawArray
      .map(obj => ({
        x: parseFloat(obj[0]),
        y: parseFloat(obj[1]),
        z: parseFloat(obj[2]),
        radVel: parseFloat(obj[3]),
        snr: parseFloat(obj[4])
      }))
      // Keep only those points with valid x,y
      .filter(pt => !isNaN(pt.x) && !isNaN(pt.y));
  } catch (error) {
    console.warn("JSON Parse Error for dataString:", dataString, error);
    return [];
  }
}

// Cleans the parsed CSV rows into structured frames.
export function cleanParsedData(parsedData) {
  const frames = [];
  // Skip rows that are incomplete or invalid
  for (const row of parsedData) {
    // Expect row to have at least 4 columns
    if (!row || row.length < 4) continue;
    const frameNum = parseInt(row[0], 10);
    const timestamp = parseFloat(row[1]);
    const detectedObjectsNum = parseInt(row[2], 10);
    const rawPoints = row[3];

    // If frameNum or timestamp are invalid, skip
    if (isNaN(frameNum) || isNaN(timestamp)) continue;

    // Parse the nested array for points
    const points = parseNestedArray(rawPoints);

    // If points is empty, skip
    if (points.length === 0) continue;

    frames.push({
      frameNum,
      timestamp,
      detectedObjectsNum,
      points
    });
  }

  // If there's no valid frame, just return empty array
  if (frames.length === 0) {
    console.warn("No valid frames found in parsed CSV.");
    return [];
  }

  // Zero-based frameNum using the first valid frame
  const firstFrameNum = frames[0].frameNum;
  for (const f of frames) {
    f.frameNum = f.frameNum - firstFrameNum;
  }

  return frames;
}

// Parses raw CSV text with Papa Parse, then cleans the data
export function parseAndCleanCSV(raw_csv) {
  const config = {
    delimiter: ",",
    newline: "",  // auto-detect newlines
    quoteChar: '"',
    escapeChar: '"',
    header: false,
    dynamicTyping: true,
    skipEmptyLines: true,
    responsive: true,
    maintainAspectRatio: false
  };

  // Trim the CSV string to remove leading/trailing whitespace or BOM
  const results = Papa.parse(raw_csv.trim(), config);

  // Log raw parsing results for debugging
  console.log("Papa Parse Results:", results);

  return cleanParsedData(results.data);
}
