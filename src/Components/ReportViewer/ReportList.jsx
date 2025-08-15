import React, { useState, useEffect } from "react";
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
  fetchReports,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchReports();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [page, filter, fetchReports]);

  const handleDownloadAll = async () => {
    try {
      setDownloading(true);
      const response = await axios.get(`/batches/admin/reports/download`, {
        params: { batch: batchId, date },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/zip" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `PTM_Reports_${batchId}_${date}.zip`;
      link.click();
    } catch (err) {
      alert("Download failed. Make sure data exists for selected batch/date.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <input
            type="text"
            placeholder="Filter by Name"
            value={filter?.name}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, name: e.target.value }))
            }
            className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Filter by Roll No"
            value={filter?.rollNo}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, rollNo: e.target.value }))
            }
            className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Download Button */}
        <button
          disabled={downloading}
          onClick={handleDownloadAll}
          className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow disabled:opacity-50 transition"
        >
          {downloading ? "Downloading..." : "⬇ Download All (.zip)"}
        </button>
      </div>

      {/* Reports */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="h-64 bg-gray-200 animate-pulse rounded-lg"
            ></div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          No reports found for the selected batch/date/filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-white border rounded-lg shadow hover:shadow-lg transition overflow-hidden"
            >
              {/* PDF Preview */}
              <div className="relative h-48 bg-gray-50 flex items-center justify-center">
                <a
                  href={report.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-full flex items-center justify-center hover:bg-gray-100"
                >
                  <iframe
                    src={`${report.secure_url}#toolbar=0&navpanes=0&scrollbar=0`}
                    title={`PDF for ${report.student.name}`}
                    className="w-full h-full"
                  />
                </a>
              </div>

              {/* Details */}
              <div className="p-4 space-y-1">
                <div className="text-lg font-semibold text-gray-800 truncate">
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t">
        <button
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1 || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition"
        >
          ⬅ Previous
        </button>

        <span className="text-sm text-gray-700">
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition"
        >
          Next ➡
        </button>
      </div>
    </div>
  );
};

export default ReportList;
