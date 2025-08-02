import React, { useState } from "react";

const ReportList = ({ reports, filter, setFilter, page, setPage, totalPages }) => {
 const filteredReports = reports.filter(
  (r) =>
    r.student?.name?.toLowerCase().includes(filter?.name?.toLowerCase() || "") &&
    r.student?.rollNo?.toLowerCase().includes(filter?.rollNumber?.toLowerCase() || "")
);



  console.log("filteredReports", filteredReports);

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Filter by Name"
          value={filter?.name}
          onChange={(e) => setFilter((f) => ({ ...f, name: e.target.value }))}
          className="border rounded px-3 py-1"
        />
        <input
          type="text"
          placeholder="Filter by Roll No"
          value={filter?.rollNumber}
          onChange={(e) => setFilter((f) => ({ ...f, rollNumber: e.target.value }))}
          className="border rounded px-3 py-1"
        />
      </div>
      <ul className="space-y-2">
        {filteredReports.map((report) => (
          <li
            key={report._id}
            className="border p-3 rounded-lg shadow bg-white flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{report.student.name}</div>
              <div className="text-sm text-gray-600">Roll No: {report.student.rollNo}</div>
            </div>
            <a
              href={report.secure_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View Report
              
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded disabled:opacity-50 text-white"
        >
          Previous
        </button>
        <span className="text-sm">Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 border rounded disabled:opacity-50 text-white"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ReportList;