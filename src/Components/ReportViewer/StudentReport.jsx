import React from "react";
import { useState } from "react";

const StudentReport = () => {
  const [searchRollNo, setSearchRollNo] = useState("");

  const [loading, setLoading] = useState("");

  const [reports, setReports] = useState("");

  const handleFilterApply = async () => {
    console.log("call handkeFileter Applyb function");
  };

  return (
    <div className="space-y-6 ">
      <div className=" flex flex-col lg:flex-row lg:items-center lg:justify-center gap-4  ">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <input
            type="text"
            placeholder="Filter by Name"
            value={searchRollNo}
            onChange={(e) => setSearchRollNo(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64"
          />

          <button
            type="button"
            className="border-2 "
            onClick={handleFilterApply}
          >
            Apply Filter
          </button>
        </div>

        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="h-64 bg-gray-200 animate-pulse rounded-lg"
                />
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
                  className="bg-white border rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col"
                >
                  {/* PDF Preview */}
                  <div className="relative h-64 sm:h-48 bg-gray-50 flex items-center justify-center">
                    <iframe
                      src={`${report.secure_url}#toolbar=0&navpanes=0&scrollbar=0`}
                      title={`PDF for ${report.student.name}`}
                      className="w-full h-full"
                    />
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
        </div>
      </div>
    </div>
  );
};

export default StudentReport;
