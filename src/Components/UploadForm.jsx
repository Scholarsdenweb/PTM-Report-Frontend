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

// Map "normalized key" → array of possible header aliases
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
};

// Define which normalized keys are *required*
const REQUIRED_NORMALIZED = ["name", "rollno", "batch", "strength"];

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [ptmDate, setPtmDate] = useState("");
  const [uploading, setUploading] = useState(false);

  const [allErrors, setAllErrors] = useState([]);
  const [allWarnings, setAllWarnings] = useState([]);
  const [dataPreview, setDataPreview] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [invalidCells, setInvalidCells] = useState([]);
  const [validationSummary, setValidationSummary] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setAllErrors([]);
    setAllWarnings([]);
    setInvalidCells([]);
    setDataPreview([]);
    setHeaders([]);
    setValidationSummary(null);

    if (!selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      alert("❌ File too large. Please upload a file smaller than 50MB.");
      return;
    }

    const reader = new FileReader();
    const ext = selectedFile.name.split(".").pop().toLowerCase();

    reader.onload = async (event) => {
      setUploading(true);
      await new Promise((r) => setTimeout(r, 100));

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
          setAllErrors([
            { type: "ERROR", message: "❌ Unsupported file format" },
          ]);
          return;
        }

        validateAndPreview(data);
      } catch (err) {
        console.error("Parsing error:", err);
        setAllErrors([
          {
            type: "ERROR",
            message: "❌ Error reading the file. Please try again.",
          },
        ]);
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
    const criticalErrors = [];
    const warnings = [];
    const invalidCells = [];

    if (!data || data.length === 0) {
      criticalErrors.push({
        type: "CRITICAL",
        message:
          "❌ No data found in the file. Please upload a valid Excel file with student data.",
      });
      setAllErrors(criticalErrors);
      setAllWarnings([]);
      setInvalidCells([]);
      setValidationSummary(null);
      return { isValid: false, errors: criticalErrors };
    }

    // Clean headers: remove leading/trailing spaces and double spaces
    const rawHeaders = Object.keys(data[0]).map((h) =>
      h.trim().replace(/\s+/g, " ")
    );

    // Check for duplicate headers
    const headerCounts = {};
    const duplicateHeaders = [];
    rawHeaders.forEach((header) => {
      headerCounts[header] = (headerCounts[header] || 0) + 1;
      if (headerCounts[header] === 2) {
        duplicateHeaders.push(header);
      }
    });

    if (duplicateHeaders.length > 0) {
      criticalErrors.push({
        type: "DUPLICATE_HEADERS",
        message: `❌ Found ${duplicateHeaders.length} duplicate column name(s)`,
        details: duplicateHeaders
          .map((h) => `Column "${h}" appears ${headerCounts[h]} times`)
          .join("\n"),
        fix: "Each column must have a unique name. Please rename or remove duplicate columns.",
      });
    }

    // Remap data with cleaned headers
    data = data.map((row) => {
      const cleanedRow = {};
      const originalHeaders = Object.keys(row);
      originalHeaders.forEach((oldHeader, index) => {
        const cleanHeader = rawHeaders[index];
        cleanedRow[cleanHeader] = row[oldHeader];
      });
      return cleanedRow;
    });

    const normalizedHeaders = rawHeaders.map(normalize);

    console.log("📋 Detected headers:", rawHeaders);
    console.log("📋 Normalized headers:", normalizedHeaders);

    // ============================================
    // STEP 1: VALIDATE REQUIRED HEADERS
    // ============================================
    const headerMap = {};
    const missingRequired = [];

    REQUIRED_NORMALIZED.forEach((normKey) => {
      const aliases = HEADER_ALIASES[normKey] || [];
      const normAliases = aliases.map(normalize);

      let found = false;
      for (let i = 0; i < normalizedHeaders.length; i++) {
        if (normAliases.includes(normalizedHeaders[i])) {
          headerMap[normKey] = rawHeaders[i];
          found = true;
          break;
        }
      }

      if (!found) {
        missingRequired.push({
          field: normKey,
          expectedNames: aliases.join(" / "),
          suggestion: `Add a column named "${aliases[0]}" to your Excel file`,
        });
      }
    });

    if (missingRequired.length > 0) {
      criticalErrors.push({
        type: "MISSING_HEADERS",
        message: `❌ Missing ${missingRequired.length} required column(s)`,
        details: missingRequired,
      });
    }

    // ============================================
    // STEP 2: VALIDATE HEADER PATTERNS & NAMING
    // ============================================

    const invalidHeaders = [];
    const attendanceMonths = new Set();
    const resultDates = new Set();
    const boardResultDates = new Set();
    const jeeAdvDates = new Set();
    const objectivePatternDates = new Set();
    const subjectivePatternDates = new Set();

    // Valid subject names for different patterns
    const VALID_RESULT_SUBJECTS = [
      "Physics",
      "Phy",
      "Chemistry",
      "Chem",
      "Mathematics",
      "Maths",
      "Math",
      "Biology",
      "Bio",
      "Abs",
      "Total",
      "Tot",
      "Rank",
      "High",
      "Highest_Marks",
      "Highest Marks",
    ];
    const VALID_OBJECTIVE_SUBJECTS = [
      "Phy(10)",
      "Chem(10)",
      "Bio(10)",
      "Math(25)",
      "Maths(25)",
      "Eng(15)",
      "Eng(10)",
      "SST(30)",
      "Total(100)",
      "Total(120)",
      "Total",
      "Rank",
      "Highest_Marks",
      "High",
    ];
    const VALID_SUBJECTIVE_SUBJECTS = [
      "Phy(14)",
      "Chem(13)",
      "Bio(13)",
      "Maths(20)",
      "Math(20)",
      "Total(40)",
      "Rank",
      "Highest_Marks",
      "High",
    ];
    const VALID_BOARD_SUBJECTS = [
      "Physics",
      "Chemistry",
      "Mathematics",
      "Biology",
      "English",
      "Hindi",
      "Computer Science",
      "Rank",
      "Highest marks",
      "Highest_Marks",
      "Highest Marks",
    ];
    const VALID_FEEDBACK_SUBJECTS = [
      "Physics",
      "Chemistry",
      "Mathematics",
      "Maths",
      "Math",
      "Biology",
      "Botany",
      "Zoology",
      "Physical Chemistry",
      "Organic Chemistry",
      "English",
      "Total",
    ];

    rawHeaders.forEach((header) => {
      // Skip known required headers
      if (Object.values(headerMap).includes(header)) return;

      // Check Attendance pattern: Attendance_March_P or Attendance_March__P
      if (header.startsWith("Attendance_")) {
        const attMatch = header.match(
          /^Attendance_([A-Za-z]+)(_*)([PA]|Per|PER|per)$/i
        );
        if (attMatch) {
          const month = attMatch[1];
          attendanceMonths.add(month);
        } else if (header.match(/^Attendance_([A-Za-z]+)$/)) {
          // This is the base attendance column (total held)
          const month = header.match(/^Attendance_([A-Za-z]+)$/)[1];
          attendanceMonths.add(month);
        } else {
          // Invalid attendance pattern
          invalidHeaders.push({
            header: header,
            issue: "Invalid attendance column format",
            expected:
              "Format should be: Attendance_MonthName_P, Attendance_MonthName_A, or Attendance_MonthName_Per",
            example:
              "Attendance_March_P, Attendance_March__P, Attendance_March_Per",
          });
        }
        return;
      }

      // Check Result pattern: Result_DATE_Subject
      if (header.startsWith("Result_")) {
        const parts = header.split("_");
        if (parts.length < 3) {
          invalidHeaders.push({
            header: header,
            issue: "Incomplete Result column format",
            expected:
              "Format should be: Result_Date_Subject (e.g., Result_07 July_Physics)",
            fix: "Ensure date and subject are separated by underscores",
          });
          return;
        }

        // Date should be in format "DD Month" (e.g., "07 July") or "YYYY" (e.g., "2024")
        const date = parts[1];
        const subject = parts.slice(2).join("_");

        // Valid date formats: "07 July", "13 September", "2024"
        const validDatePattern = /^(\d{1,2}\s+[A-Za-z]+|\d{4})$/;

        if (!validDatePattern.test(date)) {
          // Check if date is in wrong format like "07July" or "07_July"
          const missingSpacePattern = /^(\d{1,2})([A-Za-z]+)$/;
          const match = date.match(missingSpacePattern);

          if (match) {
            invalidHeaders.push({
              header: header,
              issue: `Invalid date format: "${date}"`,
              expected:
                "Date should be in format 'DD Month' with a space (e.g., '07 July', '13 September')",
              example: `Use 'Result_${match[1]} ${match[2]}_${subject}' instead of '${header}'`,
              fix: `Correct format: Result_${match[1]} ${match[2]}_${subject}`,
            });
            return;
          } else {
            invalidHeaders.push({
              header: header,
              issue: `Invalid date format: "${date}"`,
              expected:
                "Date should be in format 'DD Month' (e.g., '07 July') or 'YYYY' (e.g., '2024')",
              example: "Result_07 July_Physics or Result_2024_Physics",
              fix: "Use proper date format with space between day and month",
            });
            return;
          }
        }

        // Check if subject is valid
        if (!VALID_RESULT_SUBJECTS.includes(subject)) {
          // Check if it's a typo (e.g., Bio1 instead of Bio)

          const similarSubject = VALID_RESULT_SUBJECTS.find((valid) =>
            subject.toLowerCase().startsWith(valid.toLowerCase())
          );

          invalidHeaders.push({
            header: header,
            issue: `Invalid subject name: "${subject}"`,
            expected: `Valid subjects: ${VALID_RESULT_SUBJECTS.join(", ")}`,
            fix: similarSubject
              ? `Did you mean "Result_${date}_${similarSubject}"?`
              : `Use one of the valid subject names`,
          });
          return;
        }

        resultDates.add(date);
        return;
      }

      // Check Objective Pattern: Objective_Pattern_DATE_Subject
      if (header.startsWith("Objective_Pattern_")) {
        const parts = header.split("_");
        if (parts.length < 4) {
          invalidHeaders.push({
            header: header,
            issue: "Incomplete Objective Pattern column format",
            expected: "Format should be: Objective_Pattern_Date_Subject(Marks)",
            example:
              "Objective_Pattern_07 July_Phy(10) or Objective_Pattern_2024_Phy(10)",
          });
          return;
        }

        const date = parts[2];
        const subject = parts.slice(3).join("_");

        const validDatePattern = /^(\d{1,2}\s+[A-Za-z]+|\d{4})$/;

        if (!validDatePattern.test(date)) {
          const missingSpacePattern = /^(\d{1,2})([A-Za-z]+)$/;
          const match = date.match(missingSpacePattern);

          if (match) {
            invalidHeaders.push({
              header: header,
              issue: `Invalid date format: "${date}"`,
              expected: "Date should be in format 'DD Month' with a space",
              fix: `Correct format: Objective_Pattern_${match[1]} ${match[2]}_${subject}`,
            });
            return;
          } else {
            invalidHeaders.push({
              header: header,
              issue: `Invalid date format: "${date}"`,
              expected:
                "Date should be in format 'DD Month' (e.g., '07 July') or 'YYYY'",
              example: "Objective_Pattern_07 July_Phy(10)",
            });
            return;
          }
        }

        // Check if subject is valid
        if (!VALID_OBJECTIVE_SUBJECTS.includes(subject)) {
          invalidHeaders.push({
            header: header,
            issue: `Invalid subject name: "${subject}"`,
            expected: `Valid subjects: ${VALID_OBJECTIVE_SUBJECTS.join(", ")}`,
            example: "Objective_Pattern_2024_Phy(10)",
          });
          return;
        }

        objectivePatternDates.add(date);
        return;
      }

      // Check Subjective Pattern: Subjective_Pattern_DATE_Subject
      if (header.startsWith("Subjective_Pattern_")) {
        const parts = header.split("_");
        if (parts.length < 4) {
          invalidHeaders.push({
            header: header,
            issue: "Incomplete Subjective Pattern column format",
            expected:
              "Format should be: Subjective_Pattern_Date_Subject(Marks)",
            example:
              "Subjective_Pattern_07 July_Phy(14) or Subjective_Pattern_2024_Phy(14)",
          });
          return;
        }

        const date = parts[2];
        const subject = parts.slice(3).join("_");

        const validDatePattern = /^(\d{1,2}\s+[A-Za-z]+|\d{4})$/;

        if (!validDatePattern.test(date)) {
          const missingSpacePattern = /^(\d{1,2})([A-Za-z]+)$/;
          const match = date.match(missingSpacePattern);

          if (match) {
            invalidHeaders.push({
              header: header,
              issue: `Invalid date format: "${date}"`,
              expected: "Date should be in format 'DD Month' with a space",
              fix: `Correct format: Subjective_Pattern_${match[1]} ${match[2]}_${subject}`,
            });
            return;
          } else {
            invalidHeaders.push({
              header: header,
              issue: `Invalid date format: "${date}"`,
              expected:
                "Date should be in format 'DD Month' (e.g., '07 July') or 'YYYY'",
              example: "Subjective_Pattern_07 July_Phy(14)",
            });
            return;
          }
        }

        if (!VALID_SUBJECTIVE_SUBJECTS.includes(subject)) {
          invalidHeaders.push({
            header: header,
            issue: `Invalid subject name: "${subject}"`,
            expected: `Valid subjects: ${VALID_SUBJECTIVE_SUBJECTS.join(", ")}`,
          });
          return;
        }

        subjectivePatternDates.add(date);
        return;
      }

      // Check Board Result: Board_Result_DATE_Subject
      if (header.startsWith("Board_Result_")) {
        const parts = header.split("_");
        if (parts.length < 4) {
          invalidHeaders.push({
            header: header,
            issue: "Incomplete Board Result column format",
            expected: "Format should be: Board_Result_Date_Subject",
            example:
              "Board_Result_07 July_Physics or Board_Result_2024_Physics",
          });
          return;
        }

        const date = parts[2];
        const subject = parts.slice(3).join("_");

        const validDatePattern = /^(\d{1,2}\s+[A-Za-z]+|\d{4})$/;

        if (!validDatePattern.test(date)) {
          const missingSpacePattern = /^(\d{1,2})([A-Za-z]+)$/;
          const match = date.match(missingSpacePattern);

          if (match) {
            invalidHeaders.push({
              header: header,
              issue: `Invalid date format: "${date}"`,
              expected: "Date should be in format 'DD Month' with a space",
              fix: `Correct format: Board_Result_${match[1]} ${match[2]}_${subject}`,
            });
            return;
          } else {
            invalidHeaders.push({
              header: header,
              issue: `Invalid date format: "${date}"`,
              expected:
                "Date should be in format 'DD Month' (e.g., '07 July') or 'YYYY'",
              example: "Board_Result_07 July_Physics",
            });
            return;
          }
        }

        boardResultDates.add(date);
        return;
      }

      // Check JEE Advanced: JEE_ADV_Result_Paper N_Result_DATE_Subject
      if (header.startsWith("JEE_ADV_Result_")) {
        // Pattern: JEE_ADV_Result_Paper 1_Result_07 July_Phy
        // or: JEE_ADV_Result_07 July_Grand_Total
        const parts = header.split("_");

        // Try to find the date part - it comes after "Result"
        let datePartIndex = -1;
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] === "Result" && i + 1 < parts.length) {
            datePartIndex = i + 1;
            break;
          }
        }

        if (datePartIndex === -1) {
          // No "Result" found, date might be at index 2
          datePartIndex = 2;
        }

        if (datePartIndex < parts.length) {
          const date = parts[datePartIndex];
          const validDatePattern = /^(\d{1,2}\s+[A-Za-z]+|\d{4})$/;

          if (!validDatePattern.test(date)) {
            const missingSpacePattern = /^(\d{1,2})([A-Za-z]+)$/;
            const match = date.match(missingSpacePattern);

            if (match) {
              invalidHeaders.push({
                header: header,
                issue: `Invalid date format: "${date}"`,
                expected: "Date should be in format 'DD Month' with a space",
                example: "JEE_ADV_Result_Paper 1_Result_07 July_Phy",
                fix: `Use proper date format with space`,
              });
              return;
            }
          }

          jeeAdvDates.add(date);
        } else {
          invalidHeaders.push({
            header: header,
            issue: "Invalid JEE Advanced Result format",
            expected:
              "Format should be: JEE_ADV_Result_Paper 1_Result_Date_Subject",
            example: "JEE_ADV_Result_Paper 1_Result_07 July_Phy",
          });
        }
        return;
      }

      // Check Feedback columns: Subject_CR, Subject_D, Subject_CA, Subject_HW
      const feedbackMatch = header.match(/^(.+)_(CR|D|CA|HW)$/);
      if (feedbackMatch) {
        const subject = feedbackMatch[1];

        // Normalize subject name for comparison
        const normalizedSubject = subject
          .replace(/[^a-zA-Z]/g, "")
          .toLowerCase();
        const validNormalized = VALID_FEEDBACK_SUBJECTS.map((s) =>
          s.replace(/[^a-zA-Z]/g, "").toLowerCase()
        );

        if (!validNormalized.includes(normalizedSubject)) {
          invalidHeaders.push({
            header: header,
            issue: `Unknown subject in feedback column: "${subject}"`,
            expected: `Valid subjects: ${VALID_FEEDBACK_SUBJECTS.join(", ")}`,
            example: "Physics_CR, Chemistry_D, Mathematics_CA",
          });
        }
        return;
      }
    });

    // Report invalid headers
    if (invalidHeaders.length > 0) {
      invalidHeaders.forEach((invalid) => {
        criticalErrors.push({
          type: "INVALID_HEADER",
          message: `❌ Invalid column name: "${invalid.header}"`,
          details: invalid.issue,
          expected: invalid.expected,
          example: invalid.example,
          fix: invalid.fix,
        });
      });
    }

    console.log("📊 Detected valid patterns:", {
      attendanceMonths: Array.from(attendanceMonths),
      resultDates: Array.from(resultDates),
      boardResultDates: Array.from(boardResultDates),
      objectivePatternDates: Array.from(objectivePatternDates),
      subjectivePatternDates: Array.from(subjectivePatternDates),
      jeeAdvDates: Array.from(jeeAdvDates),
    });

    // ============================================
    // STEP 3: VALIDATE EACH ROW
    // ============================================
    const seenRollNos = new Set();
    const duplicateRollNos = [];
    const emptyRowIndices = [];

    data.forEach((row, rowIndex) => {
      const rowNum = rowIndex + 2; // Excel row number (header is row 1)
      let isRowEmpty = true;

      // Check if entire row is empty
      Object.values(row).forEach((val) => {
        if (val !== undefined && val !== null && val.toString().trim() !== "") {
          isRowEmpty = false;
        }
      });

      if (isRowEmpty) {
        emptyRowIndices.push(rowNum);
        return; // Skip empty rows
      }

      // ============================================
      // 3.1: VALIDATE REQUIRED FIELDS
      // ============================================
      REQUIRED_NORMALIZED.forEach((normKey) => {
        const headerName = headerMap[normKey];
        if (headerName) {
          const val = row[headerName];
          if (
            val === undefined ||
            val === null ||
            val.toString().trim() === ""
          ) {
            criticalErrors.push({
              type: "EMPTY_REQUIRED",
              message: `❌ Row ${rowNum}: "${headerName}" is required but empty`,
              row: rowNum,
              column: headerName,
              fix: `Please add a value for "${headerName}" in row ${rowNum}`,
            });
            invalidCells.push({ row: rowIndex, field: headerName });
          }
        }
      });

      // ============================================
      // 3.2: CHECK FOR DUPLICATE ROLL NUMBERS
      // ============================================

      console.log("HeaderMap ", headerMap);
      const rollNoHeader = headerMap["rollno"];
      if (rollNoHeader) {
        console.log("rollNoHeader from rollNoHeader", rollNoHeader);
        console.log("rollNoHeader from rollNoHeader", row[rollNoHeader]);
        const rollNo = row[rollNoHeader]?.toString().replace(/,/g, "").trim();
        if (rollNo) {
          console.log("rollNo from rollNoHeader", rollNo);
          if (seenRollNos.has(rollNo)) {
            if (!duplicateRollNos.includes(rollNo)) {
              duplicateRollNos.push(rollNo);
              criticalErrors.push({
                type: "DUPLICATE_ROLL_NO",
                message: `❌ Duplicate Roll No "${rollNo}" found`,
                details: `This Roll No appears multiple times in the file. Each student must have a unique Roll No`,
                fix: `Check rows with Roll No "${rollNo}" and ensure each student has a unique number`,
              });
            }
            invalidCells.push({ row: rowIndex, field: rollNoHeader });
          } else {
            seenRollNos.add(rollNo);
          }
        }
      }

      // ============================================
      // 3.3: VALIDATE ATTENDANCE DATA
      // ============================================
      attendanceMonths.forEach((month) => {
        const presentKey = rawHeaders.find(
          (h) => h === `Attendance_${month}_P`
        );
        const absentKey = rawHeaders.find((h) => h === `Attendance_${month}_A`);
        const heldKey = `Attendance_${month}`;

        // Helper to check if value is empty or "-"
        const isEmptyOrDash = (val) =>
          val === undefined ||
          val === null ||
          val === "" ||
          val.toString().trim() === "-";

        // Check if attendance data exists for this month (excluding "-")
        const hasAttendanceData =
          (row[presentKey] !== undefined &&
            row[presentKey] !== "" &&
            row[presentKey]?.toString().trim() !== "-") ||
          (row[absentKey] !== undefined &&
            row[absentKey] !== "" &&
            row[absentKey]?.toString().trim() !== "-") ||
          (row[heldKey] !== undefined &&
            row[heldKey] !== "" &&
            row[heldKey]?.toString().trim() !== "-");

        if (hasAttendanceData) {
          // If present is filled, check if held is also filled
          if (
            row[presentKey] !== undefined &&
            row[presentKey] !== "" &&
            row[presentKey]?.toString().trim() !== "-" &&
            isEmptyOrDash(row[heldKey])
          ) {
            warnings.push({
              type: "INCOMPLETE_ATTENDANCE",
              message: `⚠️ Row ${rowNum}: Attendance for ${month} has Present data but missing Total Held classes`,
              row: rowNum,
              fix: `Add the total number of classes held in ${month}`,
            });
            invalidCells.push({ row: rowIndex, field: heldKey });
          }

          // Validate numeric values
          if (
            presentKey &&
            row[presentKey] !== undefined &&
            row[presentKey] !== "" &&
            row[presentKey]?.toString().trim() !== "-"
          ) {
            const present = parseFloat(row[presentKey]);
            if (isNaN(present) || present < 0) {
              warnings.push({
                type: "INVALID_ATTENDANCE",
                message: `⚠️ Row ${rowNum}: Invalid Present value "${row[presentKey]}" for ${month}`,
                row: rowNum,
                fix: "Present days must be a positive number or '-' for no data",
              });
            }
          }
        }
      });

      // ============================================
      // 3.4: VALIDATE RESULT DATA
      // ============================================
      resultDates.forEach((date) => {
        const possibleSubjects = [
          "Physics",
          "Phy",
          "Chemistry",
          "Chem",
          "Maths",
          "Math",
          "Biology",
          "Bio",
        ];
        const totalKey = rawHeaders.find(
          (h) => h === `Result_${date}_Total` || h === `Result_${date}_Tot`
        );
        const rankKey = rawHeaders.find((h) => h === `Result_${date}_Rank`);

        // Check if student was absent for this exam by checking Rank column for "ABS" or "abs"
        const isAbsent =
          rankKey && row[rankKey]?.toString().trim().toLowerCase() === "abs";

        let hasAnySubjectData = false;
        possibleSubjects.forEach((subject) => {
          const key = `Result_${date}_${subject}`;
          if (
            rawHeaders.includes(key) &&
            row[key] !== undefined &&
            row[key] !== "" &&
            row[key]?.toString().trim() !== "-"
          ) {
            // If student was absent, don't count this as actual data
            if (!isAbsent) {
              hasAnySubjectData = true;
            }

            // Validate numeric (skip if student was absent or value is "-")
            if (!isAbsent) {
              const marks = parseFloat(row[key]);
              if (isNaN(marks)) {
                warnings.push({
                  type: "INVALID_MARKS",
                  message: `⚠️ Row ${rowNum}: Invalid marks "${row[key]}" for ${subject} in ${date} exam`,
                  row: rowNum,
                  fix: "Marks must be a number or '-' for absent/no data",
                });
              }
            }
          }
        });

        // If there's subject data but no total, warn (unless total is "-" or student was absent)
        if (
          hasAnySubjectData &&
          !isAbsent &&
          totalKey &&
          (row[totalKey] === undefined ||
            row[totalKey] === "" ||
            row[totalKey]?.toString().trim() === "-")
        ) {
          // Only warn if total is truly missing, not if it's "-"
          if (row[totalKey]?.toString().trim() !== "-") {
            warnings.push({
              type: "MISSING_TOTAL",
              message: `⚠️ Row ${rowNum}: Result for ${date} has subject marks but missing Total`,
              row: rowNum,
              fix: `Add the total marks for ${date} exam or use '-' for no data`,
            });
          }
        }
      });
      // ============================================
      // 3.5: VALIDATE OBJECTIVE PATTERN DATA
      // ============================================
      objectivePatternDates.forEach((date) => {
        const possibleFields = [
          "Phy(10)",
          "Chem(10)",
          "Bio(10)",
          "Math(25)",
          "Eng(15)",
          "Eng(10)",
          "SST(30)",
        ];
        let hasData = false;

        possibleFields.forEach((field) => {
          const key = `Objective_Pattern_${date}_${field}`;
          if (
            rawHeaders.includes(key) &&
            row[key] !== undefined &&
            row[key] !== ""
          ) {
            hasData = true;
            const marks = parseFloat(row[key]);
            if (isNaN(marks)) {
              warnings.push({
                type: "INVALID_MARKS",
                message: `⚠️ Row ${rowNum}: Invalid marks "${row[key]}" for ${field} in Objective Pattern ${date}`,
                row: rowNum,
              });
            }
          }
        });

        if (hasData) {
          const totalKey = rawHeaders.find(
            (h) =>
              h === `Objective_Pattern_${date}_Total(100)` ||
              h === `Objective_Pattern_${date}_Total(120)` ||
              h === `Objective_Pattern_${date}_Total`
          );
          if (
            totalKey &&
            (row[totalKey] === undefined || row[totalKey] === "")
          ) {
            warnings.push({
              type: "MISSING_TOTAL",
              message: `⚠️ Row ${rowNum}: Objective Pattern ${date} has subject marks but missing Total`,
              row: rowNum,
            });
          }
        }
      });
    });

    // ============================================
    // 3.7: REPORT EMPTY ROWS
    // ============================================
    if (emptyRowIndices.length > 0) {
      warnings.push({
        type: "EMPTY_ROWS",
        message: `⚠️ Found ${emptyRowIndices.length} empty row(s)`,
        details: `Empty rows at: ${emptyRowIndices.slice(0, 10).join(", ")}${
          emptyRowIndices.length > 10 ? "..." : ""
        }`,
        fix: "Empty rows will be skipped during processing",
      });
    }

    // ============================================
    // STEP 4: GENERATE SUMMARY
    // ============================================
    console.log("✅ Validation complete:", {
      totalRows: data.length,
      validRows: data.length - emptyRowIndices.length,
      criticalErrors: criticalErrors.length,
      warnings: warnings.length,
      invalidCells: invalidCells.length,
      invalidHeaders: invalidHeaders.length,
    });

    // ============================================
    // STEP 5: SET STATE AND RETURN
    // ============================================
    setInvalidCells(invalidCells);
    setDataPreview(data.slice(0, 100));
    setHeaders(rawHeaders);
    setAllErrors(criticalErrors);
    setAllWarnings(warnings);
    setValidationSummary({
      totalRows: data.length,
      validRows: data.length - emptyRowIndices.length,
      emptyRows: emptyRowIndices.length,
      criticalErrors: criticalErrors.length,
      warnings: warnings.length,
      invalidHeaders: invalidHeaders.length,
    });

    const isValid = criticalErrors.length === 0;

    // Return validation result
    return {
      isValid,
      errors: criticalErrors,
      warnings: warnings,
      summary: {
        totalRows: data.length,
        validRows: data.length - emptyRowIndices.length,
        emptyRows: emptyRowIndices.length,
        criticalErrors: criticalErrors.length,
        warnings: warnings.length,
        invalidHeaders: invalidHeaders.length,
      },
    };
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
      alert(
        "❌ Cannot submit due to validation errors. Please fix the errors shown below and try again."
      );
      return;
    }

    if (allWarnings.length > 0) {
      const proceed = window.confirm(
        `⚠️ ${allWarnings.length} warning(s) detected.\n\nThese are non-critical issues but should be reviewed.\n\nDo you want to proceed with the upload?`
      );
      if (!proceed) return;
    }

    const formData = new FormData();
    formData.append("csvFile", file);
    formData.append("ptmDate", ptmDate);
    formData.append("type", "generate");

    try {
      setUploading(true);
      const res = await axios.post(`/ptm/upload`, formData);
      alert("✅ File uploaded successfully!");
      console.log("Upload response:", res.data);
      // Handle success - you can add more logic here
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
      <div className="flex flex-col bg-white shadow-lg rounded-lg p-8 w-full">
        <h2 className="text-2xl font-semibold text-slate-800 mb-2 text-center">
          📤 PTM Report Uploader
        </h2>
        <p className="text-slate-500 text-sm mb-6 text-center">
          Supported formats:{" "}
          <code className="bg-slate-100 px-2 py-1 rounded">.xlsx</code>,{" "}
          <code className="bg-slate-100 px-2 py-1 rounded">.csv</code>
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-full max-w-md">
            <label className="block text-sm text-slate-700 font-medium mb-2">
              Select PTM Date:
            </label>
            <input
              id="ptmDate"
              type="date"
              value={ptmDate}
              onChange={(e) => setPtmDate(e.target.value)}
              required
              className="border border-slate-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-full max-w-md">
            <label className="block text-sm text-slate-700 font-medium mb-2">
              Upload Excel File:
            </label>
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              className="border border-slate-300 rounded-md px-3 py-2 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={uploading || allErrors.length > 0}
            className={`px-6 py-2.5 text-white rounded-md font-medium transition mt-2 ${
              uploading || allErrors.length > 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-md"
            }`}
          >
            {uploading ? "Processing..." : "Generate Reports"}
          </button>
        </form>

        {/* Validation Summary */}
        {validationSummary && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              📊 Validation Summary
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white rounded p-2">
                <span className="text-gray-600">Total Rows:</span>
                <span className="font-semibold ml-2">
                  {validationSummary.totalRows}
                </span>
              </div>
              <div className="bg-white rounded p-2">
                <span className="text-gray-600">Valid Rows:</span>
                <span className="font-semibold ml-2 text-green-600">
                  {validationSummary.validRows}
                </span>
              </div>
              <div className="bg-white rounded p-2">
                <span className="text-gray-600">Critical Errors:</span>
                <span className="font-semibold ml-2 text-red-600">
                  {validationSummary.criticalErrors}
                </span>
              </div>
              <div className="bg-white rounded p-2">
                <span className="text-gray-600">Warnings:</span>
                <span className="font-semibold ml-2 text-yellow-600">
                  {validationSummary.warnings}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Display Errors */}
        {allErrors.length > 0 && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-red-800 mb-2">
                  ❌ Critical Errors Found ({allErrors.length})
                </h3>
                <p className="text-xs text-red-700 mb-3">
                  These errors must be fixed before uploading the file.
                </p>
                <div className="max-h-64 overflow-y-auto pr-2">
                  <div className="space-y-3">
                    {allErrors.map((err, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded p-3 shadow-sm border-l-2 border-red-400"
                      >
                        <p className="font-medium text-red-900 text-sm">
                          {err.message}
                        </p>
                        {err.details && typeof err.details === "string" && (
                          <p className="text-xs text-red-700 mt-1 whitespace-pre-line">
                            {err.details}
                          </p>
                        )}
                        {err.details && Array.isArray(err.details) && (
                          <ul className="mt-2 space-y-1">
                            {err.details.map((detail, i) => (
                              <li key={i} className="text-xs text-red-700">
                                •{" "}
                                <span className="font-medium">
                                  {detail.expectedNames}
                                </span>
                                <br />
                                <span className="ml-4 text-gray-600">
                                  {detail.suggestion}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {err.expected && (
                          <p className="text-xs text-gray-700 mt-1">
                            <span className="font-semibold">Expected:</span>{" "}
                            {err.expected}
                          </p>
                        )}
                        {err.example && (
                          <p className="text-xs text-blue-700 mt-1">
                            <span className="font-semibold">Example:</span>{" "}
                            {err.example}
                          </p>
                        )}
                        {err.row && (
                          <p className="text-xs text-gray-600 mt-1">
                            📍 Location: Row {err.row}
                            {err.column && `, Column "${err.column}"`}
                          </p>
                        )}
                        {err.fix && (
                          <p className="text-xs text-green-700 mt-1 italic bg-green-50 p-2 rounded">
                            💡 Fix: {err.fix}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display Warnings */}
        {allWarnings.length > 0 && (
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                  ⚠️ Warnings ({allWarnings.length})
                </h3>
                <p className="text-xs text-yellow-700 mb-3">
                  These issues won't block the upload but should be reviewed.
                </p>
                <div className="max-h-64 overflow-y-auto pr-2">
                  <div className="space-y-2">
                    {allWarnings.map((warn, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded p-3 shadow-sm border-l-2 border-yellow-400"
                      >
                        <p className="font-medium text-yellow-900 text-sm">
                          {warn.message}
                        </p>
                        {warn.details && (
                          <p className="text-xs text-yellow-700 mt-1">
                            {warn.details}
                          </p>
                        )}
                        {warn.row && (
                          <p className="text-xs text-gray-600 mt-1">
                            📍 Location: Row {warn.row}
                          </p>
                        )}
                        {warn.fix && (
                          <p className="text-xs text-blue-700 mt-1 italic">
                            💡 Suggestion: {warn.fix}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Preview Table */}
        {dataPreview.length > 0 && (
          <div className="mt-8">
            <h4 className="font-semibold text-slate-800 mb-3">
              📋 Data Preview (First 100 rows)
            </h4>
            <div className="overflow-auto max-h-[400px] border border-gray-300 rounded-lg shadow-sm">
              <table className="min-w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr>
                    <th className="px-3 py-2 border-b border-gray-300 font-semibold text-gray-700">
                      #
                    </th>
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        className="px-3 py-2 border-b border-gray-300 font-semibold text-gray-700 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataPreview.map((row, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-3 py-2 border-b border-gray-200 text-gray-500 font-medium">
                        {i + 2}
                      </td>
                      {headers.map((h, j) => (
                        <td
                          key={j}
                          className={`px-3 py-2 border-b border-gray-200 ${
                            isCellInvalid(i, h)
                              ? "bg-red-100 text-red-700 font-medium"
                              : "text-gray-800"
                          }`}
                        >
                          {row[h] || <span className="text-gray-400">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadForm;
