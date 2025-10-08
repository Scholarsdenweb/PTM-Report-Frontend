// import React, { useState } from "react";
// import Papa from "papaparse";
// import * as XLSX from "xlsx";
// import axios from "../../api/axios";
// import Breadcrumb from "../../utils/Breadcrumb";

// const REQUIRED_COLUMNS = ["Name", "ROLL NO", "Batch", "Strength"];

// const UploadForm = () => {
//   const [file, setFile] = useState(null);
//   const [ptmDate, setPtmDate] = useState("");
//   const [hasErrors, setHasErrors] = useState(false);
//   const [hasOptionalWarnings, setHasOptionalWarnings] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [results, setResults] = useState([]);
//   const [warnings, setWarnings] = useState([]);
//   const [dataPreview, setDataPreview] = useState([]);
//   const [headers, setHeaders] = useState([]);
//   const [invalidCells, setInvalidCells] = useState([]);

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     setFile(selectedFile);
//     setWarnings([]);
//     setResults([]);
//     setInvalidCells([]);
//     setDataPreview([]);

//     if (!selectedFile) return;

//     if (selectedFile.size > 50 * 1024 * 1024) {
//       alert("❌ File too large. Please upload a file smaller than 50MB.");
//       return;
//     }

//     const reader = new FileReader();
//     const ext = selectedFile.name.split(".").pop().toLowerCase();

//     reader.onload = async (event) => {
//       setUploading(true); // show spinner
//       await new Promise((resolve) => setTimeout(resolve, 100)); // allow UI to update

//       let data = [];

//       try {
//         if (ext === "csv") {
//           const parsed = Papa.parse(event.target.result, {
//             header: true,
//             skipEmptyLines: true,
//           });
//           data = parsed.data;
//         } else if (ext === "xlsx") {
//           const workbook = XLSX.read(event.target.result, { type: "array" });
//           const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//           data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
//         } else {
//           setWarnings(["❌ Unsupported file format"]);
//           return;
//         }

//         validateAndPreview(data);
//       } catch (err) {
//         console.error("Parsing error:", err);
//         alert("❌ Error reading the file. Please try again.");
//       } finally {
//         setUploading(false);
//       }
//     };

//     if (ext === "csv") {
//       reader.readAsText(selectedFile);
//     } else if (ext === "xlsx") {
//       reader.readAsArrayBuffer(selectedFile);
//     }
//   };
//   const normalize = (str) =>
//     str
//       ?.toString()
//       .toLowerCase()
//       .replace(/[^a-z0-9]/gi, "");

//   const validateAndPreview = (data) => {
//     const requiredIssues = new Set();
//     const optionalWarnings = new Set();
//     const invalids = [];

//     if (!data || !data.length) {
//       requiredIssues.add("❌ No data found in file.");
//       setWarnings([...requiredIssues]);
//       setHasErrors(true);
//       return;
//     }

//     const rawHeaders = Object.keys(data[0]);
//     const normalizedHeaders = rawHeaders.map(normalize);

//     // Map required columns to actual header names in the file
//     const headerMap = {};
//     REQUIRED_COLUMNS.forEach((reqCol) => {
//       const normalizedReq = normalize(reqCol);
//       const index = normalizedHeaders.findIndex((h) => h === normalizedReq);
//       if (index !== -1) {
//         headerMap[reqCol] = rawHeaders[index]; // e.g., "ROLL NO" => "Roll No."
//       }
//     });

//     // Check for missing headers
//     const missing = REQUIRED_COLUMNS.filter((col) => !headerMap[col]);
//     if (missing.length) {
//       requiredIssues.add(`❌ Missing required columns: ${missing.join(", ")}`);
//     }

//     const seenRollNos = new Set();

//     data.forEach((row, rowIndex) => {
//       const rollNoKey = headerMap["ROLL NO"];
//       const rollNo = row[rollNoKey];

//       rawHeaders.forEach((col) => {
//         const value = row[col];
//         const isRequired = Object.values(headerMap).includes(col);

//         console.log(" row: , field: ", rowIndex, col, value);

//         if (!value || value.toString().trim() === "") {
//           invalids.push({ row: rowIndex, field: col });

//           const message = isRequired
//             ? `Row ${rowIndex + 1}: "${col}" is required.`
//             : `Row ${rowIndex + 1}: "${col}" is empty.`;

//           if (isRequired) {
//             requiredIssues.add(message);
//           } else {
//             optionalWarnings.add(message);
//           }
//         }
//       });

//       // Duplicate Roll No. check
//       if (rollNoKey) {
//         if (seenRollNos.has(rollNo)) {
//           requiredIssues.add(
//             `Row ${rowIndex + 1}: ⚠️ Duplicate "Roll No." detected.`
//           );
//         } else {
//           seenRollNos.add(rollNo);
//         }
//       }
//     });

//     setInvalidCells(invalids);
//     setWarnings([...requiredIssues, ...optionalWarnings]);
//     setDataPreview(data.slice(0, 100));
//     setHeaders(rawHeaders);
//     setHasErrors(requiredIssues.size > 0);
//     setHasOptionalWarnings(optionalWarnings.size > 0);
//   };

//   const isCellInvalid = (rowIndex, header) =>
//     invalidCells.some((cell) => cell.row === rowIndex && cell.field === header);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!file) {
//       alert("Please select a file.");
//       return;
//     }

//     if (!ptmDate) {
//       alert("Please select PTM date.");
//       return;
//     }

//     if (hasErrors) {
//       alert(
//         "❌ Submission blocked: Required fields are missing or duplicated value."
//       );
//       return;
//     }

//     if (hasOptionalWarnings) {
//       const confirmProceed = window.confirm(
//         "⚠️ Some optional fields are empty.\nDo you want to continue without them?"
//       );
//       if (!confirmProceed) return;
//     }

//     const formData = new FormData();
//     formData.append("csvFile", file);
//     formData.append("ptmDate", ptmDate);
//     formData.append("type", "generate");

//     try {
//       setUploading(true);
//       const res = await axios.post(`/ptm/upload`, formData);
//       setResults(res.data.results || []);
//     } catch (err) {
//       alert("❌ Error uploading file");
//       console.error(err);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col justify-center max-w-6xl p-6 mx-auto gap-4">
//       <Breadcrumb />
//       <div className="flex flex-col bg-white shadow-lg rounded-lg p-8 w-full text-center">
//         <h2 className="text-2xl font-semibold text-slate-800 mb-2">
//           📤 PTM Report Uploader
//         </h2>
//         <p className="text-slate-500 text-sm mb-4">
//           Supported formats: <code>.xlsx</code>, <code>.csv</code>
//         </p>

//         <form
//           onSubmit={handleSubmit}
//           className="flex flex-col items-center gap-4"
//         >
//           <label className="w-full flex justify-center text-sm text-slate-700 font-medium self-start">
//             <div className="w-1/2 flex justify-start">Select PTM Date:</div>
//           </label>
//           <input
//             id="ptmDate"
//             type="date"
//             value={ptmDate}
//             onChange={(e) => setPtmDate(e.target.value)}
//             required
//             className="border border-slate-300 rounded-md px-3 py-2 w-full max-w-sm text-sm"
//           />

//           <input
//             type="file"
//             accept=".xlsx,.csv"
//             onChange={handleFileChange}
//             className="border border-slate-300 rounded-md px-3 py-2 w-full max-w-sm text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//           />

//           <button
//             type="submit"
//             disabled={uploading || hasErrors}
//             className={`px-5 py-2 text-white rounded-md font-medium transition ${
//               uploading || hasErrors
//                 ? "bg-blue-300 cursor-not-allowed"
//                 : "bg-blue-600 hover:bg-blue-700"
//             }`}
//           >
//             {uploading ? "Uploading..." : "Generate Reports"}
//           </button>
//         </form>

//         {warnings.length > 0 && (
//           <div className="mt-6 bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded text-left">
//             <h4 className="font-semibold mb-2">⚠️ Validation Warnings:</h4>

//             {/* Scrollable container */}
//             <div className="max-h-52 overflow-y-auto pr-2">
//               <ul className="list-disc pl-5 space-y-1 text-sm">
//                 {warnings.map((warn, idx) => (
//                   <li key={idx}>{warn}</li>
//                 ))}
//               </ul>
//             </div>
//           </div>
//         )}

//         {dataPreview.length > 0 && (
//           <div className="mt-8 overflow-auto max-h-[400px] border border-gray-300 rounded">
//             <p className="text-xs p-2 text-gray-500">
//               Showing first 100 rows for preview.
//             </p>
//             <table className="min-w-full text-left text-xs">
//               <thead>
//                 <tr>
//                   {headers.map((header, i) => (
//                     <th key={i} className="bg-gray-100 px-2 py-1 border">
//                       {header}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {dataPreview.map((row, i) => (
//                   <tr key={i}>
//                     {headers.map((header, j) => (
//                       <td
//                         key={j}
//                         className={`border px-2 py-1 ${
//                           isCellInvalid(i, header)
//                             ? "bg-red-100 text-red-600"
//                             : ""
//                         }`}
//                       >
//                         {row[header]}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {results?.length > 0 && (
//           <div className="mt-8 text-left">
//             <h3 className="text-lg font-medium text-slate-700 mb-4">
//               📄 Generated Reports
//             </h3>
//             <ul className="space-y-2 list-disc pl-5 text-slate-600">
//               {results.map((r, index) => (
//                 <li key={index}>
//                   <strong>{r.name}</strong> –{" "}
//                   <a
//                     href={r.cloudinaryUrl.secure_url}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="text-blue-600 hover:underline"
//                   >
//                     Download
//                   </a>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default UploadForm;

// import React, { useState } from "react";
// import Papa from "papaparse";
// import * as XLSX from "xlsx";
// import axios from "../../api/axios";
// import Breadcrumb from "../../utils/Breadcrumb";

// // import fileValidation from "../../utils/fileValidation";
// import { validateExcelHeaders } from "../../utils/fileValidation"; // adjust the path

// const REQUIRED_COLUMNS = ["Name", "ROLL NO", "Batch", "Strength"];

// const UploadForm = () => {
//   const [file, setFile] = useState(null);
//   const [ptmDate, setPtmDate] = useState("");
//   const [hasErrors, setHasErrors] = useState(false);
//   const [hasOptionalWarnings, setHasOptionalWarnings] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [results, setResults] = useState([]);
//   const [warnings, setWarnings] = useState([]);
//   const [dataPreview, setDataPreview] = useState([]);
//   const [headers, setHeaders] = useState([]);
//   const [invalidCells, setInvalidCells] = useState([]);
//   const [missingColumns, setMissingColumns] = useState([]);

//   // Validate file type, extension, and size
//   const validateFileBeforeParsing = (file) => {
//     const allowedExtensions = ["csv", "xlsx"];
//     const maxSize = 50 * 1024 * 1024; // 50MB

//     // validateExcelHeaders(file);

//     if (!file) {
//       return { valid: false, message: "❌ No file selected." };
//     }

//     const extension = file.name.split(".").pop().toLowerCase();

//     if (!allowedExtensions.includes(extension)) {
//       return {
//         valid: false,
//         message: `❌ Unsupported file type. Only ${allowedExtensions.join(
//           ", "
//         )} are allowed.`,
//       };
//     }

//     if (file.size > maxSize) {
//       return {
//         valid: false,
//         message: "❌ File too large. Maximum allowed size is 50MB.",
//       };
//     }

//     return { valid: true };
//   };

//   // const handleFileChange = (e) => {
//   //   const selectedFile = e.target.files[0];
//   //   setFile(selectedFile);
//   //   setWarnings([]);
//   //   setResults([]);
//   //   setInvalidCells([]);
//   //   setDataPreview([]);
//   //   setMissingColumns([]);

//   //   // ✅ Validate before reading
//   //   const validation = validateFileBeforeParsing(selectedFile);
//   //   if (!validation.valid) {
//   //     alert(validation.message);
//   //     return;
//   //   }

//   //   if (!selectedFile) return;

//   //   if (selectedFile.size > 50 * 1024 * 1024) {
//   //     alert("❌ File too large. Please upload a file smaller than 50MB.");
//   //     return;
//   //   }

//   //   const reader = new FileReader();
//   //   const ext = selectedFile.name.split(".").pop().toLowerCase();

//   //   reader.onload = async (event) => {
//   //     setUploading(true);
//   //     await new Promise((resolve) => setTimeout(resolve, 100));

//   //     let data = [];

//   //     try {
//   //       if (ext === "csv") {
//   //         const parsed = Papa.parse(event.target.result, {
//   //           header: true,
//   //           skipEmptyLines: true,
//   //         });
//   //         data = parsed.data;
//   //       } else if (ext === "xlsx") {
//   //         const workbook = XLSX.read(event.target.result, { type: "array" });
//   //         const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//   //         data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
//   //       } else {
//   //         setWarnings(["❌ Unsupported file format"]);
//   //         return;
//   //       }

//   //       validateAndPreview(data);
//   //     } catch (err) {
//   //       console.error("Parsing error:", err);
//   //       alert("❌ Error reading the file. Please try again.");
//   //     } finally {
//   //       setUploading(false);
//   //     }
//   //   };

//   //   if (ext === "csv") {
//   //     reader.readAsText(selectedFile);
//   //   } else if (ext === "xlsx") {
//   //     reader.readAsArrayBuffer(selectedFile);
//   //   }
//   // };

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     setFile(selectedFile);
//     setWarnings([]);
//     setResults([]);
//     setInvalidCells([]);
//     setDataPreview([]);
//     setMissingColumns([]);

//     const validation = validateFileBeforeParsing(selectedFile);

//     console.log("Validation from handleFileChange", validation);

//     if (!validation.valid) {
//       alert(validation.message);
//       return;
//     }

//     const reader = new FileReader();
//     const ext = selectedFile.name.split(".").pop().toLowerCase();

//     reader.onload = async (event) => {
//       setUploading(true);
//       await new Promise((resolve) => setTimeout(resolve, 100));

//       let data = [];

//       try {
//         if (ext === "csv") {
//           const parsed = Papa.parse(event.target.result, {
//             header: true,
//             skipEmptyLines: true,
//           });
//           data = parsed.data;
//         } else if (ext === "xlsx") {
//           const workbook = XLSX.read(event.target.result, { type: "array" });
//           const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//           data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

//           // ✅ Run Excel-specific header validation here
//           try {
//             const headersOnly = XLSX.utils.sheet_to_json(worksheet, {
//               header: 1,
//             });
//             const headerRow = headersOnly[0];
//             validateExcelHeaders(headerRow); // now takes headers directly
//           } catch (headerErr) {
//             console.log("HandleFileChange validateExcelHeaders", headerErr);
//             alert(headerErr.message);
//             setUploading(false);
//             return;
//           }
//         } else {
//           setWarnings(["❌ Unsupported file format"]);
//           return;
//         }

//         validateAndPreview(data);
//       } catch (err) {
//         console.error("Parsing error:", err);
//         alert("❌ Error reading the file. Please try again.");
//       } finally {
//         setUploading(false);
//       }
//     };

//     if (ext === "csv") {
//       reader.readAsText(selectedFile);
//     } else if (ext === "xlsx") {
//       reader.readAsArrayBuffer(selectedFile);
//     }
//   };

//   const normalize = (str) =>
//     str
//       ?.toString()
//       .toLowerCase()
//       .replace(/[^a-z0-9]/gi, "");

//   const validateAndPreview = (data) => {
//     const requiredIssues = new Set();
//     const optionalWarnings = new Set();
//     const invalids = [];

//     if (!data || !data.length) {
//       requiredIssues.add("❌ No data found in file.");
//       setWarnings([...requiredIssues]);
//       setHasErrors(true);
//       return;
//     }

//     const rawHeaders = Object.keys(data[0]);
//     const normalizedHeaders = rawHeaders.map(normalize);

//     const headerMap = {};
//     REQUIRED_COLUMNS.forEach((reqCol) => {
//       const normalizedReq = normalize(reqCol);
//       const index = normalizedHeaders.findIndex((h) => h === normalizedReq);
//       if (index !== -1) {
//         headerMap[reqCol] = rawHeaders[index];
//       }
//     });

//     const missing = REQUIRED_COLUMNS.filter((col) => !headerMap[col]);
//     setMissingColumns(missing);

//     if (missing.length) {
//       requiredIssues.add(`❌ Missing required columns: ${missing.join(", ")}`);
//     }

//     const seenRollNos = new Set();

//     data.forEach((row, rowIndex) => {
//       const rollNoKey = headerMap["ROLL NO"];
//       const rollNo = row[rollNoKey];

//       rawHeaders.forEach((col) => {
//         const value = row[col];
//         const isRequired = Object.values(headerMap).includes(col);

//         if (!value || value.toString().trim() === "") {
//           invalids.push({ row: rowIndex, field: col });

//           const message = isRequired
//             ? `Row ${rowIndex + 1}: "${col}" is required.`
//             : `Row ${rowIndex + 1}: "${col}" is empty.`;

//           if (isRequired) {
//             requiredIssues.add(message);
//           } else {
//             optionalWarnings.add(message);
//           }
//         }
//       });

//       if (rollNoKey) {
//         if (seenRollNos.has(rollNo)) {
//           requiredIssues.add(
//             `Row ${rowIndex + 1}: ⚠️ Duplicate "Roll No." detected.`
//           );
//         } else {
//           seenRollNos.add(rollNo);
//         }
//       }
//     });

//     setInvalidCells(invalids);
//     setWarnings([...requiredIssues, ...optionalWarnings]);
//     setDataPreview(data.slice(0, 100));
//     setHeaders(rawHeaders);
//     setHasErrors(requiredIssues.size > 0);
//     setHasOptionalWarnings(optionalWarnings.size > 0);
//   };

//   const isCellInvalid = (rowIndex, header) =>
//     invalidCells.some((cell) => cell.row === rowIndex && cell.field === header);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!file) {
//       alert("Please select a file.");
//       return;
//     }

//     if (!ptmDate) {
//       alert("Please select PTM date.");
//       return;
//     }

//     if (hasErrors) {
//       alert(
//         "❌ Submission blocked: Required fields are missing or duplicated value."
//       );
//       return;
//     }

//     if (hasOptionalWarnings) {
//       const confirmProceed = window.confirm(
//         "⚠️ Some optional fields are empty.\nDo you want to continue without them?"
//       );
//       if (!confirmProceed) return;
//     }

//     const formData = new FormData();
//     formData.append("csvFile", file);
//     formData.append("ptmDate", ptmDate);
//     formData.append("type", "generate");

//     try {
//       setUploading(true);
//       const res = await axios.post(`/ptm/upload`, formData);
//       setResults(res.data.results || []);
//     } catch (err) {
//       alert("❌ Error uploading file");
//       console.error(err);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col justify-center max-w-6xl p-6 mx-auto gap-4">
//       <Breadcrumb />
//       <div className="flex flex-col bg-white shadow-lg rounded-lg p-8 w-full text-center">
//         <h2 className="text-2xl font-semibold text-slate-800 mb-2">
//           📤 PTM Report Uploader
//         </h2>
//         <p className="text-slate-500 text-sm mb-4">
//           Supported formats: <code>.xlsx</code>, <code>.csv</code> (Max size:
//           50MB)
//         </p>

//         {/* 🔒 File preparation rules */}
//         <div className="bg-gray-50 border border-gray-200 p-4 rounded text-left text-sm text-gray-700 mb-6">
//           <h3 className="font-semibold mb-2">
//             📋 File Preparation Guidelines:
//           </h3>
//           <ul className="list-disc pl-5 space-y-1">
//             <li>
//               ✅ Only <code>.xlsx</code> or <code>.csv</code> files are allowed.
//             </li>
//             <li>
//               ✅ Must contain required columns:{" "}
//               <strong>Name, ROLL NO, Batch, Strength</strong>
//             </li>
//             <li>❌ Avoid merged cells or hidden headers.</li>
//             <li>⚠️ No duplicate ROLL NO entries.</li>
//             <li>
//               ✅ Optional fields are allowed but must be named consistently.
//             </li>
//           </ul>
//         </div>

//         {/* Form */}
//         <form
//           onSubmit={handleSubmit}
//           className="flex flex-col items-center gap-4"
//         >
//           <label className="w-full flex justify-center text-sm text-slate-700 font-medium self-start">
//             <div className="w-1/2 flex justify-start">Select PTM Date:</div>
//           </label>
//           <input
//             id="ptmDate"
//             type="date"
//             value={ptmDate}
//             onChange={(e) => setPtmDate(e.target.value)}
//             required
//             className="border border-slate-300 rounded-md px-3 py-2 w-full max-w-sm text-sm"
//           />

//           <input
//             type="file"
//             accept=".xlsx,.csv"
//             onChange={handleFileChange}
//             className="border border-slate-300 rounded-md px-3 py-2 w-full max-w-sm text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//           />

//           <button
//             type="submit"
//             disabled={uploading || hasErrors}
//             className={`px-5 py-2 text-white rounded-md font-medium transition ${
//               uploading || hasErrors
//                 ? "bg-blue-300 cursor-not-allowed"
//                 : "bg-blue-600 hover:bg-blue-700"
//             }`}
//           >
//             {uploading ? "Uploading..." : "Generate Reports"}
//           </button>
//         </form>

//         {/* Missing columns alert */}
//         {missingColumns.length > 0 && (
//           <div className="mt-4 bg-red-50 border border-red-300 text-red-800 p-3 rounded text-sm text-left">
//             <strong>❌ Missing required columns:</strong>{" "}
//             {missingColumns.join(", ")}
//           </div>
//         )}

//         {/* Validation warnings */}
//         {warnings.length > 0 && (
//           <div className="mt-6 bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded text-left">
//             <h4 className="font-semibold mb-2">⚠️ Validation Warnings:</h4>
//             <div className="max-h-52 overflow-y-auto pr-2">
//               <ul className="list-disc pl-5 space-y-1 text-sm">
//                 {warnings.map((warn, idx) => (
//                   <li key={idx}>{warn}</li>
//                 ))}
//               </ul>
//             </div>
//           </div>
//         )}

//         {/* Preview table */}
//         {dataPreview.length > 0 && (
//           <div className="mt-8 overflow-auto max-h-[400px] border border-gray-300 rounded">
//             <p className="text-xs p-2 text-gray-500">
//               Showing first 100 rows for preview.
//             </p>
//             <table className="min-w-full text-left text-xs">
//               <thead>
//                 <tr>
//                   {headers.map((header, i) => (
//                     <th key={i} className="bg-gray-100 px-2 py-1 border">
//                       {header}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {dataPreview.map((row, i) => (
//                   <tr key={i}>
//                     {headers.map((header, j) => (
//                       <td
//                         key={j}
//                         className={`border px-2 py-1 ${
//                           isCellInvalid(i, header)
//                             ? "bg-red-100 text-red-600"
//                             : ""
//                         }`}
//                       >
//                         {row[header]}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Generated report links */}
//         {results?.length > 0 && (
//           <div className="mt-8 text-left">
//             <h3 className="text-lg font-medium text-slate-700 mb-4">
//               📄 Generated Reports
//             </h3>
//             <ul className="space-y-2 list-disc pl-5 text-slate-600">
//               {results.map((r, index) => (
//                 <li key={index}>
//                   <strong>{r.name}</strong> –{" "}
//                   <a
//                     href={r.cloudinaryUrl.secure_url}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="text-blue-600 hover:underline"
//                   >
//                     Download
//                   </a>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default UploadForm;

import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import axios from "../../api/axios";
import Breadcrumb from "../../utils/Breadcrumb";

// Normalize a string for matching (lowercase, remove non-alphanumerics)
const normalize = (str) =>
  str
    ?.toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "");

// Map “normalized key” → array of possible header aliases
const HEADER_ALIASES = {
  name: ["Name", "NAME", "Student Name"],
  rollno: ["ROLL NO", "Roll No", "Roll Number", "ROLLNO", "RollNo"],
  batch: ["Batch", "BATCH"],
  strength: ["Strength", "STRENGTH"],
  mothername: ["M_N", "Mother Name", "MotherName"],
  fathername: ["F_N", "Father Name", "FatherName"],
  studentcontactnumber: [
    "Students Contact No.",
    "Student Contact No.",
    "StudentContactNo",
  ],
  fathercontactnumber: [
    "Father Contact No.",
    "Father Contact Number",
    "FatherContactNo",
  ],
  mothercontactnumber: [
    "Mother Contact No.",
    "Mother Contact Number",
    "MotherContactNo",
  ],
  // You can expand with additional known aliases...
};

// Define which normalized keys are *required*
const REQUIRED_NORMALIZED = ["name", "rollno", "batch", "strength"];

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [ptmDate, setPtmDate] = useState("");
  const [uploading, setUploading] = useState(false);

  const [allErrors, setAllErrors] = useState([]); // blocking errors
  const [allWarnings, setAllWarnings] = useState([]); // non-blocking
  const [dataPreview, setDataPreview] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [invalidCells, setInvalidCells] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setAllErrors([]);
    setAllWarnings([]);
    setInvalidCells([]);
    setDataPreview([]);
    setHeaders([]);

    if (!selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      alert("❌ File too large. Please upload a file smaller than 50MB.");
      return;
    }

    const reader = new FileReader();
    const ext = selectedFile.name.split(".").pop().toLowerCase();

    reader.onload = async (event) => {
      setUploading(true);
      await new Promise((r) => setTimeout(r, 100)); // yield UI

      let data = [];
      try {
        if (ext === "csv") {
          const parsed = Papa.parse(event.target.result, {
            header: true,
            skipEmptyLines: true,
          });
          data = parsed.data;
        } else if (ext === "xlsx") {
          const workbook = XLSX.read(event.target.result, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        } else {
          setAllErrors(["❌ Unsupported file format"]);
          return;
        }

        validateAndPreview(data);
      } catch (err) {
        console.error("Parsing error:", err);
        alert("❌ Error reading the file. Please try again.");
      } finally {
        setUploading(false);
      }
    };

    if (ext === "csv") {
      reader.readAsText(selectedFile);
    } else if (ext === "xlsx") {
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const validateAndPreview = (data) => {
    const requiredIssues = [];
    const optionalWarnings = [];
    const invalids = [];

    if (!data || data.length === 0) {
      requiredIssues.push("❌ No data found in file.");
      setAllErrors(requiredIssues);
      return;
    }

    const rawHeaders = Object.keys(data[0]);
    const normalizedHeaders = rawHeaders.map(normalize);

    console.log("normalizedHeaders from validateAndPreview".normalizedHeaders);

    // Build a map: normalizedKey → actual header name in file
    const headerMap = {};
    REQUIRED_NORMALIZED.forEach((normKey) => {
      const aliases = HEADER_ALIASES[normKey] || [];



      const normAliases = aliases.map(normalize);

      console.log("test data from validateAndPreview normAliases", normAliases);
      for (let i = 0; i < normalizedHeaders.length; i++) {
        if (normAliases.includes(normalizedHeaders[i])) {
          headerMap[normKey] = rawHeaders[i];
          break;
        }
      }
    });

    // Check missing required headers
    const missing = REQUIRED_NORMALIZED.filter((k) => !headerMap[k]);
    if (missing.length > 0) {
      requiredIssues.push(
        `❌ Missing required columns: ${missing
          .map((k) => HEADER_ALIASES[k]?.[0] || k)
          .join(", ")}`
      );
    }

    // Now for each row, validate each required and also dynamic patterns
    const seenRollNos = new Set();

    data.forEach((row, rowIndex) => {
      // Check required fields per row
      REQUIRED_NORMALIZED.forEach((normKey) => {
        const hdr = headerMap[normKey];
        if (hdr) {
          const val = row[hdr];
          if (val === undefined || val.toString().trim() === "") {
            invalids.push({ row: rowIndex, field: hdr });
            requiredIssues.push(
              `Row ${
                rowIndex + 1
              }: "${hdr}" (mapped from "${normKey}") is required but empty.`
            );
          }
        }
      });

      // Duplicate roll number
      const rollHdr = headerMap["rollno"];
      if (rollHdr) {
        const rollVal = row[rollHdr];
        if (seenRollNos.has(rollVal)) {
          requiredIssues.push(
            `Row ${rowIndex + 1}: ⚠️ Duplicate Roll No "${rollVal}" detected.`
          );
        } else {
          seenRollNos.add(rollVal);
        }
      }

      // Check dynamic / pattern‑based headers, e.g. Attendance_*, Result_*, Board_Result_*
      Object.keys(row).forEach((col) => {
        const val = row[col];
        // If a dynamic pattern column exists but value is empty (and is significant), warn
        // For example: Attendance_March_P or Result_2023_Physics etc.
        if (/^Attendance_[A-Za-z]+_[PA]$/i.test(col)) {
          if (val === "" || val === undefined) {
            optionalWarnings.push(
              `Row ${
                rowIndex + 1
              }: "${col}" is empty (attendance might be incomplete).`
            );
            invalids.push({ row: rowIndex, field: col });
          }
        }
        if (/^Result_[A-Za-z0-9]+_[A-Za-z]+$/i.test(col)) {
          // e.g. Result_2023_Physics, Result_2023_Total
          if (val === "" || val === undefined) {
            optionalWarnings.push(
              `Row ${rowIndex + 1}: "${col}" is empty (result field missing).`
            );
            invalids.push({ row: rowIndex, field: col });
          }
        }
        if (/^Board_Result_[A-Za-z0-9_]+_[A-Za-z]+$/i.test(col)) {
          if (val === "" || val === undefined) {
            optionalWarnings.push(
              `Row ${rowIndex + 1}: "${col}" is empty (board result missing).`
            );
            invalids.push({ row: rowIndex, field: col });
          }
        }
        // You can add more dynamic patterns here (JEE, Objective_Pattern, etc.)
      });
    });

    setInvalidCells(invalids);
    setDataPreview(data.slice(0, 100));
    setHeaders(rawHeaders);
    setAllErrors(requiredIssues);
    setAllWarnings(optionalWarnings);
  };

  const isCellInvalid = (rowIndex, header) =>
    invalidCells.some((c) => c.row === rowIndex && c.field === header);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file.");
      return;
    }
    if (!ptmDate) {
      alert("Please select PTM date.");
      return;
    }

    if (allErrors.length > 0) {
      const msg = [
        "❌ Cannot submit due to the following errors:",
        ...allErrors,
      ].join("\n");
      alert(msg);
      return;
    }

    if (allWarnings.length > 0) {
      const proceed = window.confirm(
        "⚠️ Some warnings were detected:\n" +
          allWarnings.join("\n") +
          "\n\nDo you still want to proceed?"
      );
      if (!proceed) {
        return;
      }
    }

    const formData = new FormData();
    formData.append("csvFile", file);
    formData.append("ptmDate", ptmDate);
    formData.append("type", "generate");

    try {
      setUploading(true);
      const res = await axios.post(`/ptm/upload`, formData);
      // handle res
      // e.g. set some “results” state
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center max-w-6xl p-6 mx-auto gap-4">
      <Breadcrumb />
      <div className="flex flex-col bg-white shadow-lg rounded-lg p-8 w-full text-center">
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">
          📤 PTM Report Uploader
        </h2>
        <p className="text-slate-500 text-sm mb-4">
          Supported formats: <code>.xlsx</code>, <code>.csv</code>
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-4"
        >
          <label className="w-full flex justify-center text-sm text-slate-700 font-medium self-start">
            <div className="w-1/2 flex justify-start">Select PTM Date:</div>
          </label>
          <input
            id="ptmDate"
            type="date"
            value={ptmDate}
            onChange={(e) => setPtmDate(e.target.value)}
            required
            className="border border-slate-300 rounded-md px-3 py-2 w-full max-w-sm text-sm"
          />

          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
            className="border border-slate-300 rounded-md px-3 py-2 w-full max-w-sm text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          <button
            type="submit"
            disabled={uploading}
            className={`px-5 py-2 text-white rounded-md font-medium transition ${
              uploading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {uploading ? "Uploading..." : "Generate Reports"}
          </button>
        </form>

        {/* Display allErrors in a popup-like box */}
        {allErrors.length > 0 && (
          <div className="mt-6 bg-red-50 border border-red-300 text-red-800 p-4 rounded text-left">
            <h4 className="font-semibold mb-2">❌ Validation Errors:</h4>
            <div className="max-h-52 overflow-y-auto pr-2 text-sm">
              <ul className="list-disc pl-5 space-y-1">
                {allErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {allWarnings.length > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded text-left">
            <h4 className="font-semibold mb-2">⚠️ Warnings:</h4>
            <div className="max-h-52 overflow-y-auto pr-2 text-sm">
              <ul className="list-disc pl-5 space-y-1">
                {allWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {dataPreview.length > 0 && (
          <div className="mt-8 overflow-auto max-h-[400px] border border-gray-300 rounded">
            <p className="text-xs p-2 text-gray-500">
              Showing first 100 rows for preview.
            </p>
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="bg-gray-100 px-2 py-1 border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataPreview.map((row, i) => (
                  <tr key={i}>
                    {headers.map((h, j) => (
                      <td
                        key={j}
                        className={`border px-2 py-1 ${
                          isCellInvalid(i, h) ? "bg-red-100 text-red-600" : ""
                        }`}
                      >
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadForm;
