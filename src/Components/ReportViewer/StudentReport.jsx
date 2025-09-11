import axios from "../../../api/axios";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import Breadcrumb from "../../../utils/Breadcrumb";
import { getCookie } from "../../../utils/getCookie";
import { useNavigate, useParams } from "react-router-dom";
import BatchList from "./BatchList";
import Loading from "../../../utils/Loading";

import BackButton from "./BackButton";

const StudentReport = () => {
  const [searchRollNo, setSearchRollNo] = useState("");
  const { batchId, date } = useParams();

  const [loading, setLoading] = useState("");

  const [batches, setBatches] = useState([]);

  const navigate = useNavigate();

  const handleFilterApply = async () => {
    console.log("call handkeFileter Applyb function");

    console.log("Test data from. handleFileterApply");
  };

  const role = getCookie("role");

  const handleBack = () => {
    if (date) navigate(`/reports/${batchId}`);
    else if (batchId) navigate(`/reports`);
  };

  const handleBatchSelect = (batch) => {
    navigate(`/students/${batch}`);
  };

  useEffect(() => {
    setLoading(true);
    axios
      .get("/batches")
      .then((res) => {
        console.log("res from batches from the useEffect", res.data.batches);
        setBatches(res.data.batches);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    // <div className="space-y-6 ">
    //         <Breadcrumb />

    //   <div className=" flex flex-col lg:flex-col lg:items-center lg:justify-center gap-4 ">
    //     <div className="flex flex-col sm:flex-row gap-3 w-full">
    //       <input
    //         type="text"
    //         placeholder="Filter by Roll No"
    //         value={searchRollNo}
    //         onChange={(e) => setSearchRollNo(e.target.value)}
    //         className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64"
    //       />
    //       <button
    //         type="button"
    //         className="border border-black px-4 py-2 rounded-full appearance-none "
    //         onClick={handleFilterApply}
    //       >
    //         Apply Filter
    //       </button>
    //     </div>

    //     <div>
    //       {loading ? (
    //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    //           {[...Array(6)].map((_, idx) => (
    //             <div
    //               key={idx}
    //               className="h-64 bg-gray-200 animate-pulse rounded-lg"
    //             />
    //           ))}
    //         </div>
    //       ) : batches.length === 0 ? (
    //         <div className="text-center text-gray-500 mt-10">
    //           No reports found for the selected batch/date/filter.
    //         </div>
    //       ) : (
    //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    //           {batches.map((report) => (
    //             <div
    //               key={report._id}
    //               className="bg-white border rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col"
    //             >
    //               {/* PDF Preview */}
    //               <div className="relative h-64 sm:h-48 bg-gray-50 flex items-center justify-center">
    //                 {/* <iframe
    //                   src={`${report.secure_url}#toolbar=0&navpanes=0&scrollbar=0`}
    //                   title={`PDF for ${report.student.name}`}
    //                   className="w-full h-full"
    //                 /> */}
    //               </div>

    //               {/* Report Details */}
    //               <div className="p-4 space-y-2">
    //                 {/* <div className="text-lg font-semibold text-gray-800">
    //                   {report.student.name}
    //                 </div> */}
    //                 <div className="text-sm text-gray-600">
    //                   {/* Roll No: {report.student.rollNo} */}
    //                 </div>
    //                 <div className="text-xs text-gray-500">
    //                   Report Date:{" "}
    //                   {/* {new Date(report.reportDate).toLocaleDateString()} */}
    //                 </div>
    //                 <a
    //                   // href={report.secure_url}
    //                   target="_blank"
    //                   rel="noopener noreferrer"
    //                   className="inline-block mt-2 text-sm text-blue-600 hover:underline"
    //                 >
    //                   🔗 Open Full PDF
    //                 </a>
    //               </div>
    //             </div>
    //           ))}
    //         </div>
    //       )}
    //     </div>
    //   </div>
    // </div>

    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {loading && (
        <div className="fixed inset-0 bg-white/60 flex items-center justify-center z-50">
          <Loading />
        </div>
      )}

      <Breadcrumb />

      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
        {role} Report Viewer
      </h2>

      {(batchId || date) && (
        <div className="mb-4">
          <BackButton onClick={handleBack} />
        </div>
      )}

      {/* Step 1: Batch Selection */}
      {!batchId && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <BatchList
            batches={batches}
            onSelect={handleBatchSelect}
            selected={batchId}
          />
        </div>
      )}

      {/* Step 2: Date Selection */}
    </div>
  );
};

export default StudentReport;
