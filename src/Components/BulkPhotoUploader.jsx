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
  });

  const [message, setMessage] = useState("");

  const ALLOWED_FORMATS = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFile = (file) => {
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return { valid: false, reason: `Invalid format: ${file.name}` };
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      return {
        valid: false,
        reason: `File too large: ${file.name} (${sizeMB}MB > 10MB)`,
      };
    }
    return { valid: true };
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = [];
    const invalidFiles = [];

    selectedFiles.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) validFiles.push(file);
      else invalidFiles.push(validation.reason);
    });

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
    });
    setMessage(
      invalidFiles.length
        ? `⚠️ ${invalidFiles.length} invalid file(s) skipped.`
        : validFiles.length
        ? `✓ ${validFiles.length} valid image(s) ready to upload.`
        : "No valid images selected."
    );
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
    });

    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));

    let eventSource = null;
    try {
      const backendURL = axios.defaults.baseURL;
      eventSource = new EventSource(
        `${backendURL}/students/bulk-upload-photos-stream`
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

        if (data.type === "progress") {
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
