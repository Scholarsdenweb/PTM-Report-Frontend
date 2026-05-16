import React, { useState } from "react";
import axios from "../../api/axios";
import Breadcrumb from "../../utils/Breadcrumb";

const BulkPhotoUploader = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({
    total: 0,
    uploaded: 0,
    failed: 0,
    skipped: 0,
    valid: 0,
    invalid: 0,
  });

  const [results, setResults] = useState({
    uploaded: [],
    failed: [],
    skipped: [],
    invalid: [],
    renamed: [],
    compressed: [],
  });

  const [message, setMessage] = useState("");

  const ALLOWED_FORMATS = [
    "image/jpeg",
    "image/jpg",
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const formatMB = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;

  const normalizeStudentPhotoFile = (file) => {
    const extension = file.name.match(/\.jpe?g$/i)?.[0] || ".jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const normalizedBase = baseName
      .replace(/[_-]+(?=\d)/g, "_")
      .replace(/\s+/g, " ")
      .trim();
    const match = normalizedBase.match(/^(.*?)_(\d+)$/);

    if (!match) return null;

    const cleanName = match[1].replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    const cleanRollNo = match[2].replace(/,/g, "").replace(/\s+/g, "").trim();

    if (!cleanName || !cleanRollNo) return null;

    const normalizedName = `${cleanName}_${cleanRollNo}.jpg`;
    const renamedFile =
      file.name === normalizedName
        ? file
        : new File([file], normalizedName, {
            type: "image/jpeg",
            lastModified: file.lastModified,
          });

    return {
      file: renamedFile,
      originalName: file.name,
      normalizedName,
      changed: file.name !== normalizedName || extension.toLowerCase() !== ".jpg",
    };
  };

  const canvasToBlob = (canvas, quality) =>
    new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

  const loadImage = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Could not read image: ${file.name}`));
      };
      image.src = url;
    });

  const compressImageUnderLimit = async (file) => {
    if (file.size <= MAX_FILE_SIZE) {
      return { file, compressed: false };
    }

    const image = await loadImage(file);
    const originalMaxDimension = Math.max(image.width, image.height);
    const dimensionCaps = [
      Math.min(originalMaxDimension, 2400),
      2000,
      1600,
      1200,
      900,
      700,
    ].filter((value, index, arr) => value > 0 && arr.indexOf(value) === index);
    const qualities = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25];
    let smallestFile = null;

    for (const maxDimension of dimensionCaps) {
      const scale = Math.min(1, maxDimension / originalMaxDimension);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, width, height);

      for (const quality of qualities) {
        const blob = await canvasToBlob(canvas, quality);
        if (!blob) continue;

        const compressedFile = new File([blob], file.name, {
          type: "image/jpeg",
          lastModified: file.lastModified,
        });

        if (!smallestFile || compressedFile.size < smallestFile.size) {
          smallestFile = compressedFile;
        }

        if (compressedFile.size <= MAX_FILE_SIZE) {
          return { file: compressedFile, compressed: true };
        }
      }
    }

    return { file: smallestFile, compressed: !!smallestFile };
  };

  const validateFile = (file) => {
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return { valid: false, reason: `Invalid format: ${file.name}. Use JPG only.` };
    }
    if (!/\.jpe?g$/i.test(file.name)) {
      return { valid: false, reason: `Invalid extension: ${file.name}. Use .jpg or .jpeg.` };
    }

    const normalized = normalizeStudentPhotoFile(file);
    if (!normalized) {
      return {
        valid: false,
        reason: `Invalid filename: ${file.name}. Expected firstname secondname_rollnumber.jpg`,
      };
    }
    return { valid: true, normalized };
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = [];
    const invalidFiles = [];
    const renamedFiles = [];
    const compressedFiles = [];

    setLoading(true);
    setMessage("Checking and compressing images...");

    for (const file of selectedFiles) {
      const validation = validateFile(file);
      if (validation.valid) {
        try {
          const normalizedFile = validation.normalized.file;
          const compression = await compressImageUnderLimit(normalizedFile);

          if (!compression.file || compression.file.size > MAX_FILE_SIZE) {
            invalidFiles.push(
              `Could not compress below 10MB: ${file.name}${
                compression.file ? ` (best: ${formatMB(compression.file.size)})` : ""
              }`
            );
            continue;
          }

          validFiles.push(compression.file);
          if (compression.compressed) {
            compressedFiles.push({
              name: compression.file.name,
              from: formatMB(file.size),
              to: formatMB(compression.file.size),
            });
          }
        } catch (error) {
          invalidFiles.push(error.message);
          continue;
        }

        if (validation.normalized.changed) {
          renamedFiles.push({
            from: validation.normalized.originalName,
            to: validation.normalized.normalizedName,
          });
        }
      } else {
        invalidFiles.push(validation.reason);
      }
    }

    setFiles(validFiles);
    setUploadStats({
      total: selectedFiles.length,
      valid: validFiles.length,
      invalid: invalidFiles.length,
      uploaded: 0,
      failed: 0,
      skipped: 0,
    });

    setResults({
      uploaded: [],
      failed: [],
      skipped: [],
      invalid: invalidFiles,
      renamed: renamedFiles,
      compressed: compressedFiles,
    });
    setMessage(
      invalidFiles.length
        ? `⚠️ ${invalidFiles.length} invalid file(s) skipped.${renamedFiles.length ? `\n✓ ${renamedFiles.length} filename(s) will be renamed automatically.` : ""}${compressedFiles.length ? `\n✓ ${compressedFiles.length} image(s) compressed below 10MB.` : ""}`
        : validFiles.length
        ? `✓ ${validFiles.length} valid image(s) ready to upload.${renamedFiles.length ? `\n✓ ${renamedFiles.length} filename(s) will be renamed automatically.` : ""}${compressedFiles.length ? `\n✓ ${compressedFiles.length} image(s) compressed below 10MB.` : ""}`
        : "No valid images selected."
    );
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!files.length) {
      setMessage("Please select at least one valid image to upload.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setMessage("Uploading in progress...");
    setResults({
      uploaded: [],
      failed: [],
      skipped: [],
      invalid: results.invalid,
      renamed: results.renamed,
      compressed: results.compressed,
    });

    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));

    let eventSource = null;
    try {
      const backendURL = axios.defaults.baseURL;
      eventSource = new EventSource(
        `${backendURL}/students/bulk-upload-photos-stream`,
        { withCredentials: true }
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        console.log("data from onMessage start ", data);

        if (data.type === "file_success") {
          setResults((prev) => ({
            ...prev,
            uploaded: [...prev.uploaded, data.fileName],
          }));
          setUploadStats((prev) => ({ ...prev, uploaded: prev.uploaded + 1 }));
        }

        if (data.type === "file_error") {
          setResults((prev) => ({
            ...prev,
            failed: [...prev.failed, data.fileName],
          }));
          setUploadStats((prev) => ({ ...prev, failed: prev.failed + 1 }));
        }

        if (data.type === "file_skipped") {
          setResults((prev) => ({
            ...prev,
            skipped: [...prev.skipped, data.fileName],
          }));
          setUploadStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
        }

        if (data.total && typeof data.completed === "number") {
          setProgress(Math.round((data.completed / data.total) * 100));
        }

        if (data.type === "complete") {
          setProgress(100);
          setMessage("✅ Upload complete!");
          setLoading(false);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setMessage("⚠️ Connection lost during upload.");
        setLoading(false);
        eventSource.close();
      };

      await new Promise((resolve) => setTimeout(resolve, 500));

      await axios.post("/students/bulk-upload-photos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("❌ Upload failed. Please try again.");
      if (eventSource) eventSource.close();
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-6 max-w-5xl mx-auto">
      <Breadcrumb />
      <div className="p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">
          📁 Bulk Upload Student Photos
        </h2>

        <input
          type="file"
          accept="image/*"
          webkitdirectory="true"
          onChange={handleFileSelect}
          disabled={loading}
          className="mb-4 w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        {message && (
          <div className="mb-4 p-3 rounded bg-gray-50 border text-sm text-gray-700 whitespace-pre-line">
            {message}
          </div>
        )}

        {uploadStats.total > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="flex justify-between text-gray-700 font-medium">
              <span>📦 Total: {uploadStats.total}</span>
              <span className="text-green-600">
                ✅ Uploaded: {uploadStats.uploaded}
              </span>
              <span className="text-yellow-600">
                ⚠️ Skipped: {uploadStats.skipped}
              </span>
              <span className="text-red-600">
                ❌ Failed: {uploadStats.failed}
              </span>
            </div>
          </div>
        )}

        {progress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold text-green-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-green-600 h-3 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!files.length || loading}
          className={`w-full mt-2 py-2 rounded font-medium transition ${
            !files.length || loading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {loading
            ? `Uploading ${progress}%...`
            : `Upload ${files.length} Photo${files.length !== 1 ? "s" : ""}`}
        </button>

        {/* Detailed Summary Section */}
        {(results.uploaded.length > 0 ||
          results.failed.length > 0 ||
          results.skipped.length > 0 ||
          results.renamed.length > 0 ||
          results.compressed.length > 0 ||
          results.invalid.length > 0) && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              📊 Upload Results
            </h3>

            {results?.uploaded?.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="font-semibold text-green-700 mb-2">
                  ✅ Uploaded ({results.uploaded.length})
                </p>
                <ul className="text-sm text-green-800 list-disc list-inside max-h-40 overflow-auto">
                  {results.uploaded.map((name, i) => {
                    // console.log("name from result uploaded", name);
                    return <li key={i}>{name}</li>;
                  })}
                </ul>
              </div>
            )}

            {results.renamed.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="font-semibold text-blue-700 mb-2">
                  Renamed Before Upload ({results.renamed.length})
                </p>
                <ol className="text-sm text-blue-800 list-decimal list-inside max-h-40 overflow-auto">
                  {results.renamed.map((item, i) => (
                    <li key={i}>
                      <span className="text-gray-600">{item.from}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{item.to}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {results.compressed.length > 0 && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded">
                <p className="font-semibold text-indigo-700 mb-2">
                  Compressed Before Upload ({results.compressed.length})
                </p>
                <ol className="text-sm text-indigo-800 list-decimal list-inside max-h-40 overflow-auto">
                  {results.compressed.map((item, i) => (
                    <li key={i}>
                      <span className="font-medium">{item.name}</span>
                      <span className="mx-2">:</span>
                      <span>{item.from}</span>
                      <span className="mx-2">→</span>
                      <span>{item.to}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {results?.failed?.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="font-semibold text-red-700 mb-2">
                  ❌ Failed Uploads ({results.failed.length})
                </p>
                <ol className="text-sm text-red-800 list-disc list-inside max-h-40 overflow-auto">
                  {results.failed.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                </ol>
              </div>
            )}

            {results.skipped.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-semibold text-yellow-700 mb-2">
                  ⚠️ Already Exist / Skipped ({results.skipped.length})
                </p>
                <ol className="text-sm text-yellow-800 list-disc list-inside max-h-40 overflow-auto">
                  {results.skipped.map((name, i) => {
                    // console.log("result from skipped ", name);
                    return <li key={i}>{name}</li>;
                  })}
                </ol>
              </div>
            )}

            {/* {console.log("result ", results)} */}

            {results.invalid.length > 0 && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="font-semibold text-gray-700 mb-2">
                  🚫 Invalid Files ({results.invalid.length})
                </p>
                <ol className="text-sm text-gray-700 list-disc list-inside max-h-40 overflow-auto">
                  {results.invalid.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkPhotoUploader;
