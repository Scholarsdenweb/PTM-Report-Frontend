import React, { useState } from "react";
import Papa from "papaparse";
// import * as XLSX from "xlsx";
import axios from "../../api/axios";
import Breadcrumb from "../../utils/Breadcrumb";


const REQUIRED_COLUMNS = ["Name", "ROLL NO", "Batch", "Strength"];

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [ptmDate, setPtmDate] = useState("");
  const [hasErrors, setHasErrors] = useState(false);
  const [hasOptionalWarnings, setHasOptionalWarnings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [dataPreview, setDataPreview] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [invalidCells, setInvalidCells] = useState([]);


  

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setWarnings([]);
    setResults([]);
    setInvalidCells([]);
    setDataPreview([]);

    if (!selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      alert("❌ File too large. Please upload a file smaller than 50MB.");
      return;
    }

    const reader = new FileReader();
    const ext = selectedFile.name.split(".").pop().toLowerCase();

    reader.onload = async (event) => {
      setUploading(true); // show spinner
      await new Promise((resolve) => setTimeout(resolve, 100)); // allow UI to update

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
          setWarnings(["❌ Unsupported file format"]);
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
  const normalize = (str) =>
    str
      ?.toString()
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, "");

  const validateAndPreview = (data) => {
    const requiredIssues = new Set();
    const optionalWarnings = new Set();
    const invalids = [];

    if (!data || !data.length) {
      requiredIssues.add("❌ No data found in file.");
      setWarnings([...requiredIssues]);
      setHasErrors(true);
      return;
    }

    const rawHeaders = Object.keys(data[0]);
    const normalizedHeaders = rawHeaders.map(normalize);

    // Map required columns to actual header names in the file
    const headerMap = {};
    REQUIRED_COLUMNS.forEach((reqCol) => {
      const normalizedReq = normalize(reqCol);
      const index = normalizedHeaders.findIndex((h) => h === normalizedReq);
      if (index !== -1) {
        headerMap[reqCol] = rawHeaders[index]; // e.g., "ROLL NO" => "Roll No."
      }
    });

    // Check for missing headers
    const missing = REQUIRED_COLUMNS.filter((col) => !headerMap[col]);
    if (missing.length) {
      requiredIssues.add(`❌ Missing required columns: ${missing.join(", ")}`);
    }

    const seenRollNos = new Set();

    data.forEach((row, rowIndex) => {
      const rollNoKey = headerMap["ROLL NO"];
      const rollNo = row[rollNoKey];

      rawHeaders.forEach((col) => {
        const value = row[col];
        const isRequired = Object.values(headerMap).includes(col);

        console.log(" row: , field: ", rowIndex, col, value);

        if (!value || value.toString().trim() === "") {
          invalids.push({ row: rowIndex, field: col });

          const message = isRequired
            ? `Row ${rowIndex + 1}: "${col}" is required.`
            : `Row ${rowIndex + 1}: "${col}" is empty.`;

          if (isRequired) {
            requiredIssues.add(message);
          } else {
            optionalWarnings.add(message);
          }
        }
      });

      // Duplicate Roll No. check
      if (rollNoKey) {
        if (seenRollNos.has(rollNo)) {
          requiredIssues.add(
            `Row ${rowIndex + 1}: ⚠️ Duplicate "Roll No." detected.`
          );
        } else {
          seenRollNos.add(rollNo);
        }
      }
    });

    setInvalidCells(invalids);
    setWarnings([...requiredIssues, ...optionalWarnings]);
    setDataPreview(data.slice(0, 100));
    setHeaders(rawHeaders);
    setHasErrors(requiredIssues.size > 0);
    setHasOptionalWarnings(optionalWarnings.size > 0);
  };

  const isCellInvalid = (rowIndex, header) =>
    invalidCells.some((cell) => cell.row === rowIndex && cell.field === header);

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

    if (hasErrors) {
      alert(
        "❌ Submission blocked: Required fields are missing or duplicated value."
      );
      return;
    }

    if (hasOptionalWarnings) {
      const confirmProceed = window.confirm(
        "⚠️ Some optional fields are empty.\nDo you want to continue without them?"
      );
      if (!confirmProceed) return;
    }

    const formData = new FormData();
    formData.append("csvFile", file);
    formData.append("ptmDate", ptmDate);
    formData.append("type", "generate");

    try {
      setUploading(true);
      const res = await axios.post(`/ptm/upload`, formData);
      setResults(res.data.results || []);
    } catch (err) {
      alert("❌ Error uploading file");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center max-w-6xl p-6    mx-auto gap-4">
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
            disabled={uploading || hasErrors}
            className={`px-5 py-2 text-white rounded-md font-medium transition ${
              uploading || hasErrors
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {uploading ? "Uploading..." : "Generate Reports"}
          </button>
        </form>

        {warnings.length > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded text-left">
            <h4 className="font-semibold mb-2">⚠️ Validation Warnings:</h4>

            {/* Scrollable container */}
            <div className="max-h-52 overflow-y-auto pr-2">
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {warnings.map((warn, idx) => (
                  <li key={idx}>{warn}</li>
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
                  {headers.map((header, i) => (
                    <th key={i} className="bg-gray-100 px-2 py-1 border">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataPreview.map((row, i) => (
                  <tr key={i}>
                    {headers.map((header, j) => (
                      <td
                        key={j}
                        className={`border px-2 py-1 ${
                          isCellInvalid(i, header)
                            ? "bg-red-100 text-red-600"
                            : ""
                        }`}
                      >
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {results?.length > 0 && (
          <div className="mt-8 text-left">
            <h3 className="text-lg font-medium text-slate-700 mb-4">
              📄 Generated Reports
            </h3>
            <ul className="space-y-2 list-disc pl-5 text-slate-600">
              {results.map((r, index) => (
                <li key={index}>
                  <strong>{r.name}</strong> –{" "}
                  <a
                    href={r.cloudinaryUrl.secure_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadForm;

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
