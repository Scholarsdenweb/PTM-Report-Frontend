import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import axios from "../../api/axios";
import Breadcrumb from "../../utils/Breadcrumb";
import { useProgress } from "../hooks";

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

const UploadForm = ({ type = "generate" }) => {
  const [file, setFile] = useState(null);
  const [ptmDate, setPtmDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  const [allErrors, setAllErrors] = useState([]);
  const [allWarnings, setAllWarnings] = useState([]);
  const [dataPreview, setDataPreview] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [invalidCells, setInvalidCells] = useState([]);
  const [validationSummary, setValidationSummary] = useState(null);

  // Progress tracking states
  // const [progress, setProgress] = useState({
  //   show: false,
  //   percentage: 0,
  //   current: 0,
  //   total: 0,
  //   message: "",
  //   status: "idle", // idle, processing, complete, error
  // });

  // const [progressLogs, setProgressLogs] = useState([]);

  const { updateProgress, addLog, setFinalSummaryData } = useProgress();

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

    const rawHeaders = Object.keys(data[0]);
    const normalizedHeaders = rawHeaders.map(normalize);

    console.log("📋 Detected headers:", rawHeaders);
    console.log("📋 Normalized headers:", normalizedHeaders);

    // ============================================
    // STEP 1: VALIDATE REQUIRED HEADERS
    // ============================================
    const headerMap = {};
    const missingRequired = [];
    const similarButInvalidHeaders = [];

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
        // Check if there's a similar but invalid header (e.g., "Roll No." instead of "Roll No")
        if (normKey === "rollno") {
          const invalidVariations = rawHeaders.filter(
            (h) => /^roll\s*no\.?$/i.test(h) && !aliases.includes(h)
          );

          if (invalidVariations.length > 0) {
            invalidVariations.forEach((invalidHeader) => {
              similarButInvalidHeaders.push({
                found: invalidHeader,
                expected: aliases,
                normKey: normKey,
                issue: `Found "${invalidHeader}" but it's not in the accepted format`,
              });
            });
          }
        }

        missingRequired.push({
          field: normKey,
          expectedNames: aliases.join(" / "),
          suggestion: `Add a column named "${aliases[0]}" to your Excel file`,
        });
      }
    });

    // Report similar but invalid headers first
    if (similarButInvalidHeaders.length > 0) {
      similarButInvalidHeaders.forEach((invalid) => {
        criticalErrors.push({
          type: "INVALID_HEADER_VARIATION",
          message: `❌ Invalid column name: "${invalid.found}"`,
          details: invalid.issue,
          expected: `Accepted formats: ${invalid.expected.join(", ")}`,
          fix: `Rename "${invalid.found}" to "${invalid.expected[0]}" (without period or extra characters)`,
        });
      });
    }

    // Report missing required headers
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

    // Valid months for attendance (SHORT NAMES ONLY)
    const VALID_MONTHS = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sept",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Helper function to validate date format "DD Month" or "YYYY"
    const isValidDate = (dateStr) => {
      // Check if it's a year (4 digits)
      if (/^\d{4}$/.test(dateStr)) {
        const year = parseInt(dateStr);
        return year >= 1900 && year <= 2100;
      }

      // Check if it's "DD Month" format
      const datePattern = /^(\d{1,2})\s+([A-Za-z]+)$/;
      const match = dateStr.match(datePattern);

      if (!match) return false;

      const day = parseInt(match[1]);
      const month = match[2];

      // Validate day (1-31)
      if (day < 1 || day > 31) {
        return {
          valid: false,
          error: `Invalid day: ${day}. Day must be between 1 and 31`,
        };
      }

      // Validate month name (SHORT NAMES ONLY)
      if (!VALID_MONTHS.includes(month)) {
        return {
          valid: false,
          error: `Invalid month: "${month}". Only short month names allowed: ${VALID_MONTHS.join(
            ", "
          )}`,
        };
      }

      // Check day range based on month
      const monthsWith30Days = ["Apr", "Jun", "Sept", "Nov"];
      const monthsWith31Days = [
        "Jan",
        "Mar",
        "May",
        "Jul",
        "Aug",
        "Oct",
        "Dec",
      ];

      if (monthsWith30Days.includes(month) && day > 30) {
        return {
          valid: false,
          error: `${month} has only 30 days, but got day ${day}`,
        };
      }

      if (month === "Feb") {
        if (day > 29) {
          return {
            valid: false,
            error: `Feb has maximum 29 days, but got day ${day}`,
          };
        }
      }

      return { valid: true };
    };

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
      "Botany",
      "Zoology",
      "Physical Chemistry",
      "Organic Chemistry",
      "Biology",
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

          // Validate month name (SHORT NAMES ONLY)
          if (!VALID_MONTHS.includes(month)) {
            invalidHeaders.push({
              header: header,
              issue: `Invalid month name: "${month}"`,
              expected: `Only short month names are allowed: ${VALID_MONTHS.join(
                ", "
              )}`,
              example: "Attendance_Mar_P, Attendance_Jan_A, Attendance_Apr_Per",
              fix: `Change "${month}" to a valid short month name (e.g., Jan, Feb, Mar)`,
            });
            return;
          }

          attendanceMonths.add(month);
        } else if (header.match(/^Attendance_([A-Za-z]+)$/)) {
          // This is the base attendance column (total held)
          const month = header.match(/^Attendance_([A-Za-z]+)$/)[1];

          // Validate month name (SHORT NAMES ONLY)
          if (!VALID_MONTHS.includes(month)) {
            invalidHeaders.push({
              header: header,
              issue: `Invalid month name: "${month}"`,
              expected: `Only short month names are allowed: ${VALID_MONTHS.join(
                ", "
              )}`,
              example: "Attendance_Mar, Attendance_Jan, Attendance_Apr",
              fix: `Change "${month}" to a valid short month name (e.g., Jan, Feb, Mar)`,
            });
            return;
          }

          attendanceMonths.add(month);
        } else {
          // Invalid attendance pattern
          invalidHeaders.push({
            header: header,
            issue: "Invalid attendance column format",
            expected:
              "Format should be: Attendance_MonthName_P, Attendance_MonthName_A, or Attendance_MonthName_Per",
            example: "Attendance_Mar_P, Attendance_Mar_P, Attendance_Mar_Per",
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

        // Valid date formats: "07 July", "13 Sept", "2024"
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
                "Date should be in format 'DD Month' with a space (e.g., '07 Jul', '13 Sept') using short month names only",
              example: `Use 'Result_${match[1]} Jul_${subject}' instead of '${header}'`,
              fix: `Correct format: Result_${match[1]} [ShortMonth]_${subject} (e.g., Jan, Feb, Mar)`,
            });
            return;
          } else {
            invalidHeaders.push({
              header: header,
              issue: `Invalid date format: "${date}"`,
              expected:
                "Date should be in format 'DD Month' (e.g., '07 Jul', '15 Mar') using short month names",
              example: "Result_07 Jul_Physics or Result_07 Jul_Physics",
              fix: "Use proper date format with space and SHORT month name (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sept, Oct, Nov, Dec)",
            });
            return;
          }
        }

        // Validate the date is actually valid (correct day/month)
        const dateValidation = isValidDate(date);
        if (dateValidation.valid === false) {
          invalidHeaders.push({
            header: header,
            issue: `Invalid date: "${date}"`,
            details: dateValidation.error,
            expected: "Date must have valid day (1-31) and valid month name",
            example: "Result_07 July_Physics, Result_31 March_Chemistry",
            fix: dateValidation.error,
          });
          return;
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
              "Objective_Pattern_07 July_Phy(10) or Objective_Pattern_09 Dec_Phy(10)",
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
              expected:
                "Date should be in format 'DD Month' with a space using short month names",
              fix: `Correct format: Objective_Pattern_${match[1]} [ShortMonth]_${subject} (e.g., Jan, Feb, Mar)`,
            });
            return;
          } else {
            invalidHeaders.push({
              header: header,
              issue: `Invalid date format: "${date}"`,
              expected:
                "Date should be in format 'DD Month' (e.g., '07 Jul') using short month names or 'YYYY'",
              example: "Objective_Pattern_07 Jul_Phy(10)",
            });
            return;
          }
        }

        // Validate the date is actually valid
        const dateValidation = isValidDate(date);
        if (dateValidation.valid === false) {
          invalidHeaders.push({
            header: header,
            issue: `Invalid date: "${date}"`,
            details: dateValidation.error,
            expected:
              "Date must have valid day (1-31) and valid SHORT month name",
            fix: dateValidation.error,
          });
          return;
        }

        // Check if subject is valid
        if (!VALID_OBJECTIVE_SUBJECTS.includes(subject)) {
          invalidHeaders.push({
            header: header,
            issue: `Invalid subject name: "${subject}"`,
            expected: `Valid subjects: ${VALID_OBJECTIVE_SUBJECTS.join(", ")}`,
            example: "Objective_Pattern_17 Jul_Phy(10)",
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
              "Subjective_Pattern_07 July_Phy(14) or Subjective_Pattern_17 Jul_Phy(14)",
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
              expected:
                "Date should be in format 'DD Month' with a space using short month names",
              fix: `Correct format: Subjective_Pattern_${match[1]} [ShortMonth]_${subject} (e.g., Jan, Feb, Mar)`,
            });
            return;
          } else {
            invalidHeaders.push({
              header: header,
              issue: `Invalid date format: "${date}"`,
              expected:
                "Date should be in format 'DD Month' (e.g., '07 Jul') using short month names or 'YYYY'",
              example: "Subjective_Pattern_07 Jul_Phy(14)",
            });
            return;
          }
        }

        // Validate the date is actually valid
        const dateValidation = isValidDate(date);
        if (dateValidation.valid === false) {
          invalidHeaders.push({
            header: header,
            issue: `Invalid date: "${date}"`,
            details: dateValidation.error,
            expected: "Date must have valid day (1-31) and valid month name",
            fix: dateValidation.error,
          });
          return;
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
              "Board_Result_07 July_Physics or Board_Result_17 Jul_Physics",
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
              expected:
                "Date should be in format 'DD Month' with a space using short month names",
              fix: `Correct format: Board_Result_${match[1]} [ShortMonth]_${subject} (e.g., Jan, Feb, Mar)`,
            });
            return;
          } else {
            invalidHeaders.push({
              header: header,
              issue: `Invalid date format: "${date}"`,
              expected:
                "Date should be in format 'DD Month' (e.g., '07 Jul') using short month names or 'YYYY'",
              example: "Board_Result_07 Jul_Physics",
            });
            return;
          }
        }

        // Validate the date is actually valid
        const dateValidation = isValidDate(date);
        if (dateValidation.valid === false) {
          invalidHeaders.push({
            header: header,
            issue: `Invalid date: "${date}"`,
            details: dateValidation.error,
            expected: "Date must have valid day (1-31) and valid month name",
            fix: dateValidation.error,
          });
          return;
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
                expected:
                  "Date should be in format 'DD Month' with a space using short month names",
                example: "JEE_ADV_Result_Paper 1_Result_07 Jul_Phy",
                fix: `Use proper date format with space and short month name (Jan, Feb, Mar, etc.)`,
              });
              return;
            }
          }

          // Validate the date is actually valid
          const dateValidation = isValidDate(date);
          if (dateValidation.valid === false) {
            invalidHeaders.push({
              header: header,
              issue: `Invalid date: "${date}"`,
              details: dateValidation.error,
              expected:
                "Date must have valid day (1-31) and valid SHORT month name",
              fix: dateValidation.error,
            });
            return;
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

      // Check for invalid feedback field suffixes (e.g., Botany_OD, Physics_XYZ)
      // Pattern: Subject_Something (but Something is not CR, D, CA, or HW)
      const potentialFeedbackMatch = header.match(/^(.+)_([A-Z]+)$/);
      if (potentialFeedbackMatch) {
        const subject = potentialFeedbackMatch[1];
        const field = potentialFeedbackMatch[2];

        // Check if subject looks like a feedback subject
        const normalizedSubject = subject
          .replace(/[^a-zA-Z]/g, "")
          .toLowerCase();
        const validNormalized = VALID_FEEDBACK_SUBJECTS.map((s) =>
          s.replace(/[^a-zA-Z]/g, "").toLowerCase()
        );

        // If it's a known subject but invalid field, or looks like a feedback column
        if (
          validNormalized.includes(normalizedSubject) ||
          /^(Physics|Chemistry|Mathematics|Math|Maths|Biology|Botany|Zoology|English)/i.test(
            subject
          )
        ) {
          invalidHeaders.push({
            header: header,
            issue: `Invalid feedback field: "${field}"`,
            expected: `Feedback columns must end with: CR, D, CA, or HW`,
            example: `${subject}_CR, ${subject}_D, ${subject}_CA, ${subject}_HW`,
            fix: `Change "${header}" to use one of the valid feedback fields (CR, D, CA, HW)`,
          });
          return;
        }
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
    // STEP 2.5: VALIDATE COMPLETE FIELD SETS
    // ============================================

    // Validate complete attendance sets
    attendanceMonths.forEach((month) => {
      const requiredFields = [
        `Attendance_${month}`, // Total held
        `Attendance_${month}_P`, // Present
        `Attendance_${month}_A`, // Absent
        `Attendance_${month}_Per`, // Percentage
      ];

      const missingFields = requiredFields.filter(
        (field) => !rawHeaders.includes(field)
      );

      if (missingFields.length > 0) {
        criticalErrors.push({
          type: "INCOMPLETE_ATTENDANCE_SET",
          message: `❌ Incomplete attendance fields for ${month}`,
          details: `Missing ${
            missingFields.length
          } required field(s): ${missingFields.join(", ")}`,
          expected: `All 4 fields required: ${requiredFields.join(", ")}`,
          fix: `Add the missing attendance columns for ${month}`,
        });
      }
    });

    // Validate complete result sets
    resultDates.forEach((date) => {
      const baseFields = [
        `Result_${date}_Rank`,
        `Result_${date}_Total`,
        `Result_${date}_Highest_Marks`,
      ];

      // Check for at least one subject
      const subjectFields = [
        "Phy",
        "Chem",
        "Maths",
        "Math",
        "Bio",
        "Physics",
        "Chemistry",
        "Mathematics",
        "Biology",
      ];
      const hasSubject = subjectFields.some((subject) =>
        rawHeaders.includes(`Result_${date}_${subject}`)
      );

      const missingFields = baseFields.filter(
        (field) => !rawHeaders.includes(field)
      );

      if (missingFields.length > 0 || !hasSubject) {
        const issues = [];
        if (missingFields.length > 0) {
          issues.push(`Missing: ${missingFields.join(", ")}`);
        }
        if (!hasSubject) {
          issues.push(
            `Missing at least one subject column (e.g., Result_${date}_Phy, Result_${date}_Chem, Result_${date}_Bio)`
          );
        }

        criticalErrors.push({
          type: "INCOMPLETE_RESULT_SET",
          message: `❌ Incomplete result fields for ${date}`,
          details: issues.join("; "),
          expected: `Required: Rank, at least one subject, Total, and Highest_Marks`,
          example: `Result_${date}_Rank, Result_${date}_Phy, Result_${date}_Chem, Result_${date}_Bio, Result_${date}_Total, Result_${date}_Highest_Marks`,
          fix: `Add the missing result columns for ${date}`,
        });
      }
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
      const rollNoHeader = headerMap["rollno"];
      if (rollNoHeader) {
        const rollNo = row[rollNoHeader]?.toString().replace(/,/g, "").trim();
        if (rollNo) {
          if (seenRollNos.has(rollNo)) {
            if (!duplicateRollNos.includes(rollNo)) {
              duplicateRollNos.push(rollNo);
              criticalErrors.push({
                type: "DUPLICATE_ROLL_NO",
                message: `❌ Duplicate Roll No "${rollNo}" found`,
                details: `This Roll No appears multiple times in the file. Each student must have a unique Roll No.`,
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
          (h) => h === `Attendance_${month}_P` || h === `Attendance_${month}_P`
        );
        const absentKey = rawHeaders.find(
          (h) => h === `Attendance_${month}_A` || h === `Attendance_${month}_A`
        );
        const heldKey = `Attendance_${month}`;

        // Check if attendance data exists for this month
        const hasAttendanceData =
          (row[presentKey] !== undefined && row[presentKey] !== "") ||
          (row[absentKey] !== undefined && row[absentKey] !== "") ||
          (row[heldKey] !== undefined && row[heldKey] !== "");

        if (hasAttendanceData) {
          // If present is filled, check if held is also filled
          if (
            row[presentKey] !== undefined &&
            row[presentKey] !== "" &&
            (row[heldKey] === undefined || row[heldKey] === "")
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
            row[presentKey] !== ""
          ) {
            const present = parseFloat(row[presentKey]);
            if (isNaN(present) || present < 0) {
              warnings.push({
                type: "INVALID_ATTENDANCE",
                message: `⚠️ Row ${rowNum}: Invalid Present value "${row[presentKey]}" for ${month}`,
                row: rowNum,
                fix: "Present days must be a positive number",
              });
            }
          }
        }
      });

      // ============================================
      // 3.4: VALIDATE RESULT DATA
      // ============================================
      resultDates.forEach((date) => {
        const rankKey = `Result_${date}_Rank`;
        const totalKey = `Result_${date}_Total`;
        const highestKey = `Result_${date}_Highest_Marks`;

        // Check if rank is ABS/ABSENT
        const isAbsent =
          row[rankKey]?.toString().toUpperCase() === "ABS" ||
          row[rankKey]?.toString().toUpperCase() === "ABSENT" ||
          row[rankKey]?.toString().trim() === "-";

        if (isAbsent) {
          // If marked as ABS, allow "-" in other fields
          return; // Skip further validation for this date
        }

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

        let hasAnySubjectData = false;
        possibleSubjects.forEach((subject) => {
          const key = `Result_${date}_${subject}`;
          if (
            rawHeaders.includes(key) &&
            row[key] !== undefined &&
            row[key] !== "" &&
            row[key] !== "-"
          ) {
            hasAnySubjectData = true;

            // Validate numeric
            const marks = parseFloat(row[key]);
            if (isNaN(marks)) {
              warnings.push({
                type: "INVALID_MARKS",
                message: `⚠️ Row ${rowNum}: Invalid marks "${row[key]}" for ${subject} in ${date} exam`,
                row: rowNum,
                fix: "Marks must be a number or '-' if absent",
              });
            }
          }
        });

        // If there's subject data but no total, warn
        if (
          hasAnySubjectData &&
          (row[totalKey] === undefined ||
            row[totalKey] === "" ||
            row[totalKey] === "-")
        ) {
          warnings.push({
            type: "MISSING_TOTAL",
            message: `⚠️ Row ${rowNum}: Result for ${date} has subject marks but missing Total`,
            row: rowNum,
            fix: `Add the total marks for ${date} exam`,
          });
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
    setDataPreview(data.slice(0, 10));
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

  //  const handleSubmit = async (e) => {
  //     e.preventDefault();

  //     if (!file) {
  //       alert("Please select a file.");
  //       return;
  //     }
  //     if (!ptmDate) {
  //       alert("Please select PTM date.");
  //       return;
  //     }

  //     if (allErrors.length > 0) {
  //       alert(
  //         "❌ Cannot submit due to validation errors. Please fix the errors shown below and try again."
  //       );
  //       return;
  //     }

  //     // alert("✅ File uploaded successfully!");

  //     if (allWarnings.length > 0) {
  //       const proceed = window.confirm(
  //         `⚠️ ${allWarnings.length} warning(s) detected.\n\nThese are non-critical issues but should be reviewed.\n\nDo you want to proceed with the upload?`
  //       );
  //       if (!proceed) return;
  //     }

  //     const formData = new FormData();
  //     formData.append("csvFile", file);
  //     formData.append("ptmDate", ptmDate);
  //     formData.append("type", "regenerate");

  //     try {
  //       setUploading(true);
  //       const res = await axios.post(`/ptm/upload`, formData);
  //       // alert("✅ File uploaded successfully!");
  //       setUploading(false);
  //       setDataPreview([]);
  //       setPtmDate("");
  //       setAllErrors([]);
  //       setAllWarnings([]);
  //       setInvalidCells([]);
  //       // setShowResponse(res.data.results);
  //       setValidationSummary(null);
  //       console.log("Upload response:fron on Submit", res.data);

  //       // Handle success - you can add more logic here
  //     } catch (err) {
  //       console.error("Upload error:", err);
  //       alert("❌ Error uploading file");
  //     } finally {
  //       setUploading(false);
  //     }
  //   };

  // Add this function in your UploadForm component

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
    formData.append("type", type);

    const startTime = Date.now();

    try {
      setUploading(true);

      // Show progress modal immediately
      updateProgress({
        show: true,
        percentage: 0,
        current: 0,
        total: 0,
        message: "Initializing...",
        status: "processing",
      });
      addLog([]); // Clear previous logs

      const response = await fetch(`${axios.defaults.baseURL}/ptm/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      let totalProcessed = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("Stream complete");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              console.log("Received SSE data:", data);

              // Update progress state
              updateProgress({
                show: true,
                percentage: data.percentage || 0,
                current: data.current || 0,
                total: data.total || 0,
                message: data.message || "",
                status:
                  data.type === "complete"
                    ? "complete"
                    : data.type === "error"
                    ? "processing"
                    : "processing",
              });

              // Track counts
              if (data.type === "success") successCount++;
              if (data.type === "error") errorCount++;
              if (data.type === "skipped") skippedCount++;
              if (data.type !== "complete" && data.type !== "info")
                totalProcessed++;

              // Add to progress logs (don't pass function, pass object)
              if (data.type !== "info") {
                addLog({
                  type: data.type,
                  message: data.message,
                  studentName: data.studentName,
                  rollNo: data.rollNo,
                });
              }

              // Handle completion
              if (data.type === "complete") {
                const duration = ((Date.now() - startTime) / 1000).toFixed(1);

                // Set final summary
                setFinalSummaryData({
                  total: data.total || totalProcessed,
                  success: data.success || successCount,
                  errors: data.errors || errorCount,
                  skipped: data.skipped || skippedCount,
                  duration: `${duration}s`,
                });

                setTimeout(() => {
                  // Reset form
                  setFile(null);
                  setPtmDate("");
                  setAllErrors([]);
                  setAllWarnings([]);
                  setInvalidCells([]);
                  setValidationSummary(null);
                  setDataPreview([]);
                  setUploading(false);
                }, 1000);
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError, line);
            }
          }
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(`❌ Error uploading file: ${err.message}`);

      updateProgress({
        show: true,
        message: `Error: ${err.message}`,
        status: "error",
      });
    } finally {
      setUploading(false);
      setFile(null);
      setPtmDate("");
    }
  };

  return (
    <div className="flex flex-col justify-center max-w-6xl p-6 mx-auto gap-4">
      <Breadcrumb />
      <div className="flex flex-col bg-white shadow-lg rounded-lg p-8 w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-slate-800 mb-2 text-center">
              📤 PTM Report Uploader
            </h2>
            <p className="text-slate-500 text-sm text-center">
              Supported formats:{" "}
              <code className="bg-slate-100 px-2 py-1 rounded">.xlsx</code>,{" "}
              <code className="bg-slate-100 px-2 py-1 rounded">.csv</code>
            </p>
          </div>
          <button
            onClick={() => setShowRulesModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium text-sm shadow-md flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            File Rules
          </button>
        </div>

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

        {/* Data Preview Table */}
        {dataPreview.length > 0 && (
          <div className="mt-8">
            <h4 className="font-semibold text-slate-800 mb-3">
              📋 Data Preview (First 10 rows)
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
                        {i + 1}
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

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">📋 File Formatting Rules</h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Required Columns */}
              <section>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">
                    REQUIRED
                  </span>
                  Required Columns
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-sm">Name</p>
                      <p className="text-xs text-gray-600">
                        Accepted: Name, NAME, Student Name
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Roll No</p>
                      <p className="text-xs text-gray-600">
                        Accepted: ROLL NO, Roll No, Roll Number, ROLLNO, RollNo
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Batch</p>
                      <p className="text-xs text-gray-600">
                        Accepted: Batch, BATCH
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Strength</p>
                      <p className="text-xs text-gray-600">
                        Accepted: Strength, STRENGTH
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Optional Contact Columns */}
              <section>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm">
                    OPTIONAL
                  </span>
                  Contact Information
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>
                      • <strong>Mother Name:</strong> M_N, Mother Name,
                      MotherName
                    </li>
                    <li>
                      • <strong>Father Name:</strong> F_N, Father Name,
                      FatherName
                    </li>
                    <li>
                      • <strong>Student Contact:</strong> Students Contact No.,
                      Student Contact No., StudentContactNo
                    </li>
                    <li>
                      • <strong>Father Contact:</strong> Father Contact No.,
                      Father Contact Number, FatherContactNo
                    </li>
                    <li>
                      • <strong>Mother Contact:</strong> Mother Contact No.,
                      Mother Contact Number, MotherContactNo
                    </li>
                  </ul>
                </div>
              </section>

              {/* Attendance Columns */}
              <section>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Attendance Columns
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-3">
                    Format:{" "}
                    <code className="bg-white px-2 py-1 rounded">
                      Attendance_MonthName_Field
                    </code>
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">
                      Valid Month Names (SHORT NAMES ONLY):
                    </p>
                    <p className="text-gray-600">
                      Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sept, Oct, Nov,
                      Dec
                    </p>
                    <p className="font-semibold mt-3">
                      Required Fields for Each Month:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>
                        <code>Attendance_Mar</code> - Total classes held
                      </li>
                      <li>
                        <code>Attendance_Mar_P</code> - Present days
                      </li>
                      <li>
                        <code>Attendance_Mar_A</code> - Absent days
                      </li>
                      <li>
                        <code>Attendance_Mar_Per</code> - Attendance percentage
                      </li>
                    </ul>
                    <p className="text-blue-600 mt-3">
                      ✓ Example: Attendance_Mar_P, Attendance_Jan_A,
                      Attendance_Apr_Per
                    </p>
                    <p className="text-red-600">
                      ✗ Invalid: Attendance_March_P, Attendance_January_A (no
                      full month names)
                    </p>
                  </div>
                </div>
              </section>

              {/* Result Columns */}
              <section>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Result Columns
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-3">
                    Format:{" "}
                    <code className="bg-white px-2 py-1 rounded">
                      Result_Date_Subject
                    </code>
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Date Format:</p>
                    <p className="text-gray-600">
                      • "DD Month" (e.g., 07 Jul, 15 Mar) - Use SHORT month
                      names
                    </p>
                    <p className="text-gray-600">• "YYYY" (e.g., 2024)</p>

                    <p className="font-semibold mt-3">Valid Subjects:</p>
                    <p className="text-gray-600">
                      Physics, Phy, Chemistry, Chem, Mathematics, Maths, Math,
                      Biology, Bio, Total, Tot, Rank, Highest_Marks, High
                    </p>

                    <p className="font-semibold mt-3">
                      Required for Each Date:
                    </p>
                    <ul className="list-disc list-inside text-gray-700">
                      <li>At least one subject column</li>
                      <li>Result_Date_Total</li>
                      <li>Result_Date_Rank</li>
                      <li>Result_Date_Highest_Marks</li>
                    </ul>

                    <p className="text-blue-600 mt-3">
                      ✓ Example: Result_07 Jul_Physics, Result_2024_Chemistry
                    </p>
                    <p className="text-red-600">
                      ✗ Invalid: Result_07July_Physics (missing space),
                      Result_07 July_Bio1 (invalid subject)
                    </p>
                  </div>
                </div>
              </section>

              {/* Objective Pattern */}
              <section>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Objective Pattern Columns
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-3">
                    Format:{" "}
                    <code className="bg-white px-2 py-1 rounded">
                      Objective_Pattern_Date_Subject(Marks)
                    </code>
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Valid Subjects:</p>
                    <p className="text-gray-600">
                      Phy(10), Chem(10), Bio(10), Math(25), Maths(25), Eng(15),
                      Eng(10), SST(30), Total(100), Total(120), Total, Rank,
                      Highest_Marks
                    </p>

                    <p className="text-blue-600 mt-3">
                      ✓ Example: Objective_Pattern_07 Jul_Phy(10),
                      Objective_Pattern_2024_Math(25)
                    </p>
                  </div>
                </div>
              </section>

              {/* Subjective Pattern */}
              <section>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Subjective Pattern Columns
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-3">
                    Format:{" "}
                    <code className="bg-white px-2 py-1 rounded">
                      Subjective_Pattern_Date_Subject(Marks)
                    </code>
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Valid Subjects:</p>
                    <p className="text-gray-600">
                      Phy(14), Chem(13), Bio(13), Maths(20), Math(20),
                      Total(40), Rank, Highest_Marks
                    </p>

                    <p className="text-blue-600 mt-3">
                      ✓ Example: Subjective_Pattern_07 Jul_Phy(14),
                      Subjective_Pattern_2024_Chem(13)
                    </p>
                  </div>
                </div>
              </section>

              {/* Board Result */}
              <section>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Board Result Columns
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-3">
                    Format:{" "}
                    <code className="bg-white px-2 py-1 rounded">
                      Board_Result_Date_Subject
                    </code>
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Valid Subjects:</p>
                    <p className="text-gray-600">
                      Physics, Chemistry, Mathematics, Biology, English, Hindi,
                      Computer Science, Rank, Highest marks
                    </p>

                    <p className="text-blue-600 mt-3">
                      ✓ Example: Board_Result_07 Jul_Physics,
                      Board_Result_2024_Mathematics
                    </p>
                  </div>
                </div>
              </section>

              {/* JEE Advanced */}
              <section>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  JEE Advanced Result Columns
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-3">
                    JEE Advanced has multiple column formats:
                  </p>

                  <div className="space-y-4 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="font-semibold text-indigo-800 mb-2">
                        📝 Paper 1 Columns:
                      </p>
                      <p className="text-xs mb-1">
                        Format:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          JEE_ADV_Result_Paper 1_Result_Date_Subject
                        </code>
                      </p>
                      <p className="text-gray-600 mb-2">
                        Valid Subjects:{" "}
                        <strong>Phy, Chem, Maths, Total_Marks</strong>
                      </p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>JEE_ADV_Result_Paper 1_Result_07 Jul_Phy</li>
                        <li>JEE_ADV_Result_Paper 1_Result_07 Jul_Chem</li>
                        <li>JEE_ADV_Result_Paper 1_Result_07 Jul_Maths</li>
                        <li>
                          JEE_ADV_Result_Paper 1_Result_07 Jul_Total_Marks
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="font-semibold text-indigo-800 mb-2">
                        📝 Paper 2 Columns:
                      </p>
                      <p className="text-xs mb-1">
                        Format:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          JEE_ADV_Result_Paper 2_Result_Date_Subject
                        </code>
                      </p>
                      <p className="text-gray-600 mb-2">
                        Valid Subjects:{" "}
                        <strong>Phy, Chem, Maths, Total_Marks</strong>
                      </p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>JEE_ADV_Result_Paper 2_Result_07 Jul_Phy</li>
                        <li>JEE_ADV_Result_Paper 2_Result_07 Jul_Chem</li>
                        <li>JEE_ADV_Result_Paper 2_Result_07 Jul_Maths</li>
                        <li>
                          JEE_ADV_Result_Paper 2_Result_07 Jul_Total_Marks
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="font-semibold text-indigo-800 mb-2">
                        📝 Common Columns:
                      </p>
                      <p className="text-xs mb-1">
                        Format:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          JEE_ADV_Result_Date_Field
                        </code>
                      </p>
                      <p className="text-gray-600 mb-2">
                        Valid Fields:{" "}
                        <strong>Grand_Total, Rank, High, Highest_Marks</strong>
                      </p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>JEE_ADV_Result_07 Jul_Grand_Total</li>
                        <li>JEE_ADV_Result_07 Jul_Rank</li>
                        <li>JEE_ADV_Result_07 Jul_High (or Highest_Marks)</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-300">
                      <p className="font-semibold text-yellow-800 mb-2">
                        ⚠️ Important Requirements:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1 text-xs">
                        <li>
                          <strong>All Paper 1 columns are required</strong>{" "}
                          (Phy, Chem, Maths, Total_Marks)
                        </li>
                        <li>
                          <strong>All Paper 2 columns are required</strong>{" "}
                          (Phy, Chem, Maths, Total_Marks)
                        </li>
                        <li>
                          <strong>Common columns required:</strong> Grand_Total,
                          Rank, and either High or Highest_Marks
                        </li>
                        <li>
                          Date format must be "DD Month" (e.g., 07 Jul) with
                          SHORT month names or "YYYY"
                        </li>
                        <li>Note the space in "Paper 1" and "Paper 2"</li>
                      </ul>
                    </div>

                    <p className="text-blue-600 mt-3">
                      ✓ Complete Example for one JEE Advanced exam on 07 Jul:
                    </p>
                    <div className="bg-blue-50 rounded p-2 mt-1 text-xs">
                      <p className="font-mono">
                        JEE_ADV_Result_Paper 1_Result_07 Jul_Phy
                      </p>
                      <p className="font-mono">
                        JEE_ADV_Result_Paper 1_Result_07 Jul_Chem
                      </p>
                      <p className="font-mono">
                        JEE_ADV_Result_Paper 1_Result_07 Jul_Maths
                      </p>
                      <p className="font-mono">
                        JEE_ADV_Result_Paper 1_Result_07 Jul_Total_Marks
                      </p>
                      <p className="font-mono">
                        JEE_ADV_Result_Paper 2_Result_07 Jul_Phy
                      </p>
                      <p className="font-mono">
                        JEE_ADV_Result_Paper 2_Result_07 Jul_Chem
                      </p>
                      <p className="font-mono">
                        JEE_ADV_Result_Paper 2_Result_07 Jul_Maths
                      </p>
                      <p className="font-mono">
                        JEE_ADV_Result_Paper 2_Result_07 Jul_Total_Marks
                      </p>
                      <p className="font-mono">
                        JEE_ADV_Result_07 Jul_Grand_Total
                      </p>
                      <p className="font-mono">JEE_ADV_Result_07 Jul_Rank</p>
                      <p className="font-mono">JEE_ADV_Result_07 Jul_High</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Feedback Columns */}
              <section>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Feedback Columns
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-3">
                    Format:{" "}
                    <code className="bg-white px-2 py-1 rounded">
                      Subject_Field
                    </code>
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Valid Feedback Fields:</p>
                    <p className="text-gray-600">
                      CR (Class Response), D (Discipline), CA (Class Activity),
                      HW (Homework)
                    </p>

                    <p className="font-semibold mt-3">Valid Subjects:</p>
                    <p className="text-gray-600">
                      Physics, Chemistry, Mathematics, Maths, Math, Botany,
                      Zoology, Physical Chemistry, Organic Chemistry, Biology,
                      English, Total
                    </p>

                    <p className="text-blue-600 mt-3">
                      ✓ Example: Physics_CR, Chemistry_D, Mathematics_CA,
                      Biology_HW
                    </p>
                    <p className="text-red-600">
                      ✗ Invalid: Physics_OD, Chemistry_XYZ (invalid feedback
                      fields)
                    </p>
                  </div>
                </div>
              </section>

              {/* General Rules */}
              <section>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  ⚠️ General Rules
                </h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">1.</span>
                      <span>
                        <strong>All dates must use SHORT month names:</strong>{" "}
                        Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sept, Oct, Nov,
                        Dec (never use full names like January, February, etc.)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">2.</span>
                      <span>
                        <strong>Date format must include space:</strong> "07
                        Jul" not "07Jul" or "07_Jul"
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">3.</span>
                      <span>
                        <strong>Roll numbers must be unique:</strong> No
                        duplicate roll numbers allowed
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">4.</span>
                      <span>
                        <strong>Required fields cannot be empty:</strong> Name,
                        Roll No, Batch, and Strength must have values for all
                        students
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">5.</span>
                      <span>
                        <strong>Complete field sets required:</strong> If you
                        include attendance for a month, all 4 fields must be
                        present (Total, P, A, Per). For JEE Advanced, all Paper
                        1, Paper 2, and common fields must be present.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">6.</span>
                      <span>
                        <strong>Valid days and months:</strong> Days must be
                        1-31, months must match actual calendar (e.g., Feb max
                        29, Apr max 30)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">7.</span>
                      <span>
                        <strong>Subject names must match exactly:</strong> Use
                        only the subjects listed in each category
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">8.</span>
                      <span>
                        <strong>Empty rows will be skipped:</strong> Rows with
                        all empty cells are ignored during processing
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">9.</span>
                      <span>
                        <strong>Use "-" or "ABS" for absent students:</strong>{" "}
                        For students absent from exams, use "-" or "ABS" in
                        marks fields
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">10.</span>
                      <span>
                        <strong>File size limit:</strong> Maximum file size is
                        50MB
                      </span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Quick Reference */}
              <section>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  📝 Quick Reference Examples
                </h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold text-green-800">
                        ✓ Correct Examples:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 mt-1 space-y-1">
                        <li>Attendance_Mar_P (March Present)</li>
                        <li>
                          Result_07 Jul_Physics (Result on July 7th for Physics)
                        </li>
                        <li>
                          Objective_Pattern_2024_Phy(10) (Objective pattern
                          2024, Physics 10 marks)
                        </li>
                        <li>
                          Board_Result_15 Mar_Mathematics (Board result March
                          15th, Mathematics)
                        </li>
                        <li>
                          JEE_ADV_Result_Paper 1_Result_07 Jul_Phy (JEE Advanced
                          Paper 1 Physics)
                        </li>
                        <li>
                          JEE_ADV_Result_07 Jul_Grand_Total (JEE Advanced Grand
                          Total)
                        </li>
                        <li>Physics_CR (Physics Class Response feedback)</li>
                      </ul>
                    </div>

                    <div className="mt-4">
                      <p className="font-semibold text-red-800">
                        ✗ Incorrect Examples:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 mt-1 space-y-1">
                        <li>Attendance_March_P (use "Mar" not "March")</li>
                        <li>
                          Result_07July_Physics (missing space: should be "07
                          Jul")
                        </li>
                        <li>
                          Result_07 July_Bio1 (invalid subject: use "Bio")
                        </li>
                        <li>
                          Objective_Pattern_32 Jan_Phy(10) (invalid day: 32)
                        </li>
                        <li>
                          JEE_ADV_Result_Paper1_Result_07 Jul_Phy (missing space
                          in "Paper 1")
                        </li>
                        <li>
                          JEE_ADV_Result_Paper 1_Result_07July_Phy (missing
                          space in date)
                        </li>
                        <li>
                          Physics_OD (invalid feedback field: use CR, D, CA, or
                          HW)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
    </div>
  );
};

export default UploadForm;
