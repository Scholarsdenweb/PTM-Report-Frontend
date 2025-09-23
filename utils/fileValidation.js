// import * as xlsx from "xlsx";

// /**
//  * Validates headers of an Excel file.
//  * @param {string} filePath - Path to the uploaded Excel file.
//  * @throws Will throw an error if required headers are missing or unexpected headers are found.
//  */
// export function validateExcelHeaders(filePath) {
//   const workbook = xlsx.readFile(filePath);
//   const sheet = workbook.Sheets[workbook.SheetNames[0]];
//   const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

//   if (!rows || rows.length === 0) {
//     throw new Error("❌ Excel file is empty or invalid.");
//   }

//   const headersInFile = rows[0].map((h) => h.trim());

//   // ✅ Required headers
//   const requiredHeaders = [
//     "Name",
//     "Roll No",
//     "Batch",
//     "Mother Name",
//     "Father Name",
//     "Father Contact No.",
//     "Mother Contact No.",
//     "Students Contact No.",
//     "Strength",
//     // Add any expected dynamic patterns like Attendance_, Result_ etc. below
//   ];

//   // ❗ Optional: Define allowed patterns (for dynamic columns)
//   const allowedHeaderPatterns = [
//     /^Attendance_[A-Za-z]+(_|__)?[PA]$/,
//     /^Attendance_[A-Za-z]+$/,
//     /^Attendance_[A-Za-z]+_Per$/,
//     /^Result_.+$/,
//     /^Board_Result_.+$/,
//     /^JEE_Advanced_Result_.+$/,
//     /^JEE_Advanced_Paper_1_Result_.+$/,
//     /^JEE_Advanced_Paper_2_Result_.+$/,
//     /^SubjectiveResult_.+$/,
//     /^[A-Za-z ._()+-]+_(CR|OD|CA|HW)$/,
//   ];

//   // Check missing required headers
//   const missingHeaders = requiredHeaders.filter(
//     (header) => !headersInFile.includes(header)
//   );

//   if (missingHeaders.length > 0) {
//     throw new Error(
//       `❌ Missing required headers: ${missingHeaders.join(", ")}`
//     );
//   }

//   // Check for unknown (unexpected) headers
//   const unexpectedHeaders = headersInFile.filter((header) => {
//     if (requiredHeaders.includes(header)) return false;
//     return !allowedHeaderPatterns.some((pattern) => pattern.test(header));
//   });

//   if (unexpectedHeaders.length > 0) {
//     throw new Error(
//       `❌ Unexpected headers found: ${unexpectedHeaders.join(", ")}`
//     );
//   }

//   console.log("✅ Header validation passed.");
// }

export function validateExcelHeaders(headersRow) {
  const headersInFile = headersRow.map((h) => (h || "").trim());

  const requiredHeaders = [
    "Name",
    "Roll No",
    "Batch",
    "Mother Name",
    "Father Name",
    "Father Contact No.",
    "Mother Contact No.",
    "Students Contact No.",
    "Strength",
  ];

  const allowedHeaderPatterns = [
    /^Attendance_[A-Za-z]+(_|__)?[PA]$/,
    /^Attendance_[A-Za-z]+$/,
    /^Attendance_[A-Za-z]+_Per$/,
    /^Result_.+$/,
    /^Board_Result_.+$/,
    /^JEE_Advanced_Result_.+$/,
    /^JEE_Advanced_Paper_1_Result_.+$/,
    /^JEE_Advanced_Paper_2_Result_.+$/,
    /^SubjectiveResult_.+$/,
    /^[A-Za-z ._()+-]+_(CR|OD|CA|HW)$/,
  ];

  const missingHeaders = requiredHeaders.filter(
    (header) => !headersInFile.includes(header)
  );

  console.log("missingHeaders from validateExcelHeaders", missingHeaders);

  if (missingHeaders.length > 0) {
    throw new Error(
      `❌ Missing required headers: ${missingHeaders.join(", ")}`
    );
  }

  const unexpectedHeaders = headersInFile.filter((header) => {
    if (requiredHeaders.includes(header)) return false;
    return !allowedHeaderPatterns.some((pattern) => pattern.test(header));
  });

  if (unexpectedHeaders.length > 0) {
    throw new Error(
      `❌ Unexpected headers found: ${unexpectedHeaders.join(", ")}`
    );
  }

  console.log("✅ Header validation passed.");
}
