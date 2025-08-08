// // src/workers/fileWorker.js
// import * as XLSX from "xlsx";

// self.importScripts(
//   "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
// );
// self.importScripts(
//   "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"
// );

// self.onmessage = function (e) {
//   console.log("onMessage", e.data);
//   const { file, fileType } = e.data;
//   const reader = new FileReader();

//   reader.onload = function (event) {
//     let data = [];

//     try {
//       if (fileType === "csv") {
//         const parsed = Papa.parse(event.target.result, {
//           header: true,
//           skipEmptyLines: true,
//         });
//         data = parsed.data;
//       } else if (fileType === "xlsx") {
//         const workbook = XLSX.read(event.target.result, { type: "binary" });
//         const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//         data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
//       } else {
//         self.postMessage({ error: "❌ Unsupported file format" });
//         return;
//       }

//       console.log("Data", data);

//       self.postMessage({ data });


//       console.log("FileWorkers working");
//     } catch (err) {
//         console.log("FileWorkers working");
//         self.postMessage({ error: "❌ Error while parsing file." });
//     }
// };

// console.log("FileWorkers working");
// if (fileType === "csv") {
//     reader.readAsText(file);
//     console.log("FileWorkers working");
// } else if (fileType === "xlsx") {
//       console.log("FileWorkers working");
//     reader.readAsBinaryString(file);
//   }
// };

import * as XLSX from "xlsx";

console.log("[Worker] ✅ Worker script loaded");

self.onmessage = (e) => {
  console.log("[Worker] 📩 Message received:", e.data);

  const { fileContent, fileType } = e.data;

  try {
    let workbook;

    if (fileType === "xlsx") {
      // Read binary string for XLSX files
      workbook = XLSX.read(fileContent, { type: "binary" });
    } else if (fileType === "csv") {
      // CSV is read as string
      workbook = XLSX.read(fileContent, { type: "string" });
    } else {
      throw new Error("Unsupported file type");
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const parsedData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    console.log("[Worker] Parsed data rows:", parsedData.length);

    self.postMessage({ data: parsedData });
  } catch (err) {
    console.error("[Worker] Error while parsing:", err);
    self.postMessage({ error: "❌ Failed to parse file content." });
  }
};
