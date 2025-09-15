import axios from "../../../api/axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "./BackButton";
import ReportList from "./ReportList";
import { getCookie } from "../../../utils/getCookie";
import Breadcrumb from "../../../utils/Breadcrumb";
import Loading from "../../../utils/Loading";

const ShowAllResultOfStudent = () => {
  const [reports, setReports] = useState([]);

  const { batchId, rollNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  console.log("batch rollNo", batchId, rollNo);
    const role = getCookie("role");
  

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/students/get-all-student-reports", {
        rollNo,
      });

      console.log("fetchAllreport from showAllResultOfStudent", response);

      setReports(response.data.reports);
      console.log("fetchAllreport", response.data);
    } catch (error) {
      console.log("error from fetchAllReports", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (batchId) navigate(`/students/${batchId}`);
  };

  useEffect(() => {
    console.log("testdata ");
    fetchAllReports();
  }, []);

  return (
    // <div className="mb-6">
    //   {batchId && (
    //     <div className="mb-4">
    //       <BackButton onClick={handleBack} />
    //     </div>
    //   )}
    //   <h3 className="text-lg font-semibold mb-3 text-gray-800">
    //     Select Student
    //   </h3>

    //   <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    //     {/* Filters */}
    //     <div className="flex flex-col sm:flex-row gap-3 w-full"></div>

    //     {/* Buttons */}
    //     <div className="flex gap-2"></div>
    //   </div>

    //   <div className="flex flex-wrap gap-3 ">
    //     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    //       {reports.map((report) => (
    //         <div
    //           key={report._id}
    //           className="bg-white border rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col"
    //         >
    //           {/* PDF Preview */}
    //           <div className="relative h-64 sm:h-48 bg-gray-50 flex items-center justify-center">
    //             <iframe
    //               src={`${report.secure_url}#toolbar=0&navpanes=0&scrollbar=0`}
    //               title={`PDF for ${report.student.name}`}
    //               className="w-full h-full"
    //             />
    //           </div>

    //           {/* Report Details */}
    //           <div className="p-4 space-y-2">
    //             <div className="text-lg font-semibold text-gray-800">
    //               {report.student.name}
    //             </div>
    //             <div className="text-sm text-gray-600">
    //               Roll No: {report.student.rollNo}
    //             </div>
    //             <div className="text-xs text-gray-500">
    //               Report Date:{" "}
    //               {new Date(report.reportDate).toLocaleDateString()}
    //             </div>
    //             <a
    //               href={report.secure_url}
    //               target="_blank"
    //               rel="noopener noreferrer"
    //               className="inline-block mt-2 text-sm text-blue-600 hover:underline"
    //             >
    //               🔗 Open Full PDF
    //             </a>
    //           </div>
    //         </div>
    //       ))}
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
        {(batchId || rollNo) && (
        <div className="mb-4">
          <BackButton onClick={handleBack} />
        </div>
      )}
      {batchId && rollNo && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-4">
          <ReportList
            reports={reports}
            // filter={filter}
            // setFilter={handleFilterChange}
            // page={currentPage}
            // setPage={handlePageChange}
            // totalPages={totalPages}
            
            params={{batchId, rollNo}}
            // fetchReports={fetchAllReports}
          />
        </div>
      )}
    </div>
  );
};

export default ShowAllResultOfStudent;
