import React, { useState } from "react";
import axios from "../../../api/axios";

const ReportList = ({
  reports,
  filter,
  setFilter,
  page,
  setPage,
  totalPages,
  batchId,
  date,
}) => {
  const [downloading, setDownloading] = useState(false);

  // const handleDownloadAll = async () => {
  //   try {

  //     console.log("testdata", reports);
  //     setDownloading(true);

  //     const url = `/api/reports/download?batch=${batchId}&date=${date}&name=${encodeURIComponent(
  //       filter?.name || ""
  //     )}&rollNo=${encodeURIComponent(filter?.rollNo || "")}`;

  //     const response = await axios.post(url);

  //     console.log("response from download ", response.json());

  //     if (!response.ok) {
  //       throw new Error("Failed to download reports.");
  //     }

  //     const blob = await response.blob();
  //     const blobUrl = window.URL.createObjectURL(blob);
  //     const a = document.createElement("a");

  //     a.href = blobUrl;
  //     a.download = `Reports-${batchId}-${date}.zip`;
  //     document.body.appendChild(a);
  //     a.click();
  //     a.remove();
  //     window.URL.revokeObjectURL(blobUrl);
  //   } catch (err) {
  //     console.error("Download error:", err);
  //     alert("Failed to download reports.");
  //   } finally {
  //     setDownloading(false);
  //   }
  // };

  const handleDownloadAll = async () => {
    try {
      setDownloading(true);

      const url = `/api/reports/download?batch=${batchId}&date=${date}&name=${encodeURIComponent(
        filter?.name || ""
      )}&rollNo=${encodeURIComponent(filter?.rollNo || "")}`;

      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        alert(`Download failed: ${error.error}`);
        return;
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Reports-${batchId}-${date}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
      alert("Unexpected error occurred.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      {/* Top Bar: Filters + Download */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Filter by Name"
            value={filter?.name}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, name: e.target.value }))
            }
            className="border rounded px-4 py-2 w-full sm:w-64"
          />
          <input
            type="text"
            placeholder="Filter by Roll No"
            value={filter?.rollNumber}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, rollNumber: e.target.value }))
            }
            className="border rounded px-4 py-2 w-full sm:w-64"
          />
        </div>

        {/* Download Button */}
        <button
          disabled={downloading}
          onClick={handleDownloadAll}
          className="mb-6 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow"
        >
          {downloading ? "Downloading..." : "⬇ Download All Reports (.zip)"}
        </button>
      </div>

      {/* Report Cards Grid */}
      {reports.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          No reports found for the selected batch/date/filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-white border rounded-lg shadow hover:shadow-md transition overflow-hidden"
            >
              {/* PDF Preview */}
              <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                <a
                  href={report.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-full flex items-center justify-center hover:bg-gray-200"
                >
                  <iframe
                    src={`${report.secure_url}#toolbar=0&navpanes=0&scrollbar=0`}
                    title={`PDF for ${report.student.name}`}
                    className="w-full h-full object-contain"
                  />
                </a>
              </div>

              {/* Report Details */}
              <div className="p-4 space-y-2">
                <div className="text-lg font-semibold text-gray-800">
                  {report.student.name}
                </div>
                <div className="text-sm text-gray-600">
                  Roll No: {report.student.rollNo}
                </div>
                <div className="text-xs text-gray-500">
                  Report Date:{" "}
                  {new Date(report.reportDate).toLocaleDateString()}
                </div>
                <a
                  href={report.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                >
                  🔗 Open Full PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600"
        >
          ⬅ Previous
        </button>
        <span className="text-sm text-gray-700">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 border rounded disabled:opacity-50 bg-blue-500 text-white hover:bg-blue-600"
        >
          Next ➡
        </button>
      </div>
    </div>
  );
};

export default ReportList;
