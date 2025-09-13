// import React, { useState, useEffect } from "react";
// import axios from "../../../api/axios";

// const ReportList = ({
//   reports,
//   filter,
//   setFilter,
//   page,
//   setPage,
//   totalPages,
//   batchId,
//   date,
//   fetchReports,
// }) => {
//   const [downloading, setDownloading] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [reportIds, setReportIds] = useState([]);

//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       try {
//         await fetchReports();
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadData();
//   }, [page, filter, fetchReports]);

//   useEffect(() => {
//     // Collect report IDs or necessary data once reports are fetched
//     const ids = reports.map((r) => {
//       console.log("data from useEffect ", r);
//       return r.student._id;
//     }); // or r.student._id or r.student.whatsappNumber
//     setReportIds(ids);
//   }, [reports]);

//   const handleDownloadAll = async () => {
//     try {
//       setDownloading(true);
//       const response = await axios.get(`/batches/reports/download`, {
//         params: { batch: batchId, date },
//         responseType: "blob",
//       });

//       const blob = new Blob([response.data], { type: "application/zip" });
//       const link = document.createElement("a");
//       link.href = URL.createObjectURL(blob);
//       link.download = `PTM_Reports_${batchId}_${date}.zip`;
//       link.click();
//     } catch (err) {
//       console.log("Error downloading reports", err);
//       alert("Download failed. Make sure data exists for selected batch/date.");
//     } finally {
//       setDownloading(false);
//     }
//   };

//   const handleSendMessagesOnWhatsapp = async () => {
//     try {
//       const response = await axios.post("/ptm/send-whatsapp-message", {
//         reportIds,
//         date,
//       });

//       console.log("WhatsApp send response:", response.data);
//       alert("Messages sent successfully!");
//     } catch (error) {
//       console.error("Error sending messages on WhatsApp:", error);
//       alert("Failed to send messages.");
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Top Bar */}
//       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//         {/* Filters */}
//         <div className="flex flex-col sm:flex-row gap-3 w-full">
//           <input
//             type="text"
//             placeholder="Filter by Name"
//             value={filter?.name}
//             onChange={(e) =>
//               setFilter((prev) => ({ ...prev, name: e.target.value }))
//             }
//             className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64"
//           />
//           <input
//             type="text"
//             placeholder="Filter by Roll No"
//             value={filter?.rollNo}
//             onChange={(e) =>
//               setFilter((prev) => ({ ...prev, rollNo: e.target.value }))
//             }
//             className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64"
//           />
//         </div>

//         {/* Buttons */}
//         <div className="flex gap-2">
//           <button
//             disabled={downloading}
//             onClick={handleDownloadAll}
//             className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
//           >
//             {downloading ? "Downloading..." : "⬇ Download All (.zip)"}
//           </button>

//           <button
//             disabled={reportIds.length === 0}
//             onClick={handleSendMessagesOnWhatsapp}
//             className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
//           >
//             Send via WhatsApp
//           </button>
//         </div>
//       </div>

//       {/* Reports */}
//       {loading ? (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {[...Array(6)].map((_, idx) => (
//             <div
//               key={idx}
//               className="h-64 bg-gray-200 animate-pulse rounded-lg"
//             />
//           ))}
//         </div>
//       ) : reports.length === 0 ? (
//         <div className="text-center text-gray-500 mt-10">
//           No reports found for the selected batch/date/filter.
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {reports.map((report) => (
//             <div
//               key={report._id}
//               className="bg-white border rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col"
//             >
//               {/* PDF Preview */}
//               <div className="relative h-64 sm:h-48 bg-gray-50 flex items-center justify-center">
//                 <iframe
//                   src={`${report.secure_url}#toolbar=0&navpanes=0&scrollbar=0`}
//                   title={`PDF for ${report.student.name}`}
//                   className="w-full h-full"
//                 />
//               </div>

//               {/* Report Details */}
//               <div className="p-4 space-y-2">
//                 <div className="text-lg font-semibold text-gray-800">
//                   {report.student.name}
//                 </div>
//                 <div className="text-sm text-gray-600">
//                   Roll No: {report.student.rollNo}
//                 </div>
//                 <div className="text-xs text-gray-500">
//                   Report Date:{" "}
//                   {new Date(report.reportDate).toLocaleDateString()}
//                 </div>
//                 <a
//                   href={report.secure_url}
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

//       {/* Pagination */}
//       <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t">
//         <button
//           onClick={() => setPage((prev) => Math.max(1, prev - 1))}
//           disabled={page === 1 || loading}
//           className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
//         >
//           ⬅ Previous
//         </button>

//         <span className="text-sm text-gray-700">
//           Page {page} of {totalPages}
//         </span>

//         <button
//           onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
//           disabled={page === totalPages || loading}
//           className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
//         >
//           Next ➡
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ReportList;

// import React, { useState, useEffect } from "react";
// import axios from "../../../api/axios";

// const ReportList = ({
//   reports,
//   filter,
//   setFilter,
//   page,
//   setPage,
//   totalPages,
//   batchId,
//   date,
//   fetchReports,
// }) => {
//   const [downloading, setDownloading] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [reportIds, setReportIds] = useState([]);
//   const [showConfirmModal, setShowConfirmModal] = useState(false); // Modal state

//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       try {
//         await fetchReports();
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadData();
//   }, [page, filter, fetchReports]);

//   useEffect(() => {
//     const ids = reports.map((r) => r.student._id);
//     setReportIds(ids);
//   }, [reports]);

//   useEffect(() => {
//     // Optional: disable body scroll when modal is open
//     document.body.style.overflow = showConfirmModal ? "hidden" : "auto";
//     return () => (document.body.style.overflow = "auto");
//   }, [showConfirmModal]);

//   const handleDownloadAll = async () => {
//     try {
//       setDownloading(true);
//       const response = await axios.get(`/batches/reports/download`, {
//         params: { batch: batchId, date },
//         responseType: "blob",
//       });

//       const blob = new Blob([response.data], { type: "application/zip" });
//       const link = document.createElement("a");
//       link.href = URL.createObjectURL(blob);
//       link.download = `PTM_Reports_${batchId}_${date}.zip`;
//       link.click();
//     } catch (err) {
//       console.log("Error downloading reports", err);
//       alert("Download failed. Make sure data exists for selected batch/date.");
//     } finally {
//       setDownloading(false);
//     }
//   };

//   const handleSendMessagesOnWhatsapp = async () => {
//     try {
//       const response = await axios.post("/ptm/send-whatsapp-message", {
//         reportIds,
//         date,
//       });

//       console.log("WhatsApp send response:", response.data);
//       // alert("Messages sent successfully!");
//     } catch (error) {
//       console.error("Error sending messages on WhatsApp:", error);
//       alert("Failed to send messages.");
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Top Bar */}
//       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//         {/* Filters */}
//         <div className="flex flex-col sm:flex-row gap-3 w-full">
//           <input
//             type="text"
//             placeholder="Filter by Name"
//             value={filter?.name}
//             onChange={(e) =>
//               setFilter((prev) => ({ ...prev, name: e.target.value }))
//             }
//             className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64"
//           />
//           <input
//             type="text"
//             placeholder="Filter by Roll No"
//             value={filter?.rollNo}
//             onChange={(e) =>
//               setFilter((prev) => ({ ...prev, rollNo: e.target.value }))
//             }
//             className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64"
//           />
//         </div>

//         {/* Buttons */}
//         <div className="flex gap-2">
//           <button
//             disabled={downloading}
//             onClick={handleDownloadAll}
//             className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
//           >
//             {downloading ? "Downloading..." : "⬇ Download All (.zip)"}
//           </button>

//           <button
//             disabled={reportIds.length === 0}
//             onClick={() => setShowConfirmModal(true)}
//             className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
//           >
//             Send via WhatsApp
//           </button>
//         </div>
//       </div>

//       {/* Reports */}
//       {loading ? (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {[...Array(6)].map((_, idx) => (
//             <div
//               key={idx}
//               className="h-64 bg-gray-200 animate-pulse rounded-lg"
//             />
//           ))}
//         </div>
//       ) : reports.length === 0 ? (
//         <div className="text-center text-gray-500 mt-10">
//           No reports found for the selected batch/date/filter.
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {reports.map((report) => (
//             <div
//               key={report._id}
//               className="bg-white border rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col"
//             >
//               {/* PDF Preview */}
//               <div className="relative h-64 sm:h-48 bg-gray-50 flex items-center justify-center">
//                 <iframe
//                   src={`${report.secure_url}#toolbar=0&navpanes=0&scrollbar=0`}
//                   title={`PDF for ${report.student.name}`}
//                   className="w-full h-full"
//                 />
//               </div>

//               {/* Report Details */}
//               <div className="p-4 space-y-2">
//                 <div className="text-lg font-semibold text-gray-800">
//                   {report.student.name}
//                 </div>
//                 <div className="text-sm text-gray-600">
//                   Roll No: {report.student.rollNo}
//                 </div>
//                 <div className="text-xs text-gray-500">
//                   Report Date:{" "}
//                   {new Date(report.reportDate).toLocaleDateString()}
//                 </div>
//                 <a
//                   href={report.secure_url}
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

//       {/* Pagination */}
//       <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t">
//         <button
//           onClick={() => setPage((prev) => Math.max(1, prev - 1))}
//           disabled={page === 1 || loading}
//           className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
//         >
//           ⬅ Previous
//         </button>

//         <span className="text-sm text-gray-700">
//           Page {page} of {totalPages}
//         </span>

//         <button
//           onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
//           disabled={page === totalPages || loading}
//           className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
//         >
//           Next ➡
//         </button>
//       </div>

//       {/* Confirmation Modal */}
//       {/* {showConfirmModal && (
//         <div className="fixed inset-0  bg-opacity-10   flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4">
//             <h2 className="text-lg font-semibold text-gray-800">
//               Confirm WhatsApp Send
//             </h2>
//             <p className="text-sm text-gray-600">
//               Are you sure you want to send WhatsApp messages to all students
//               listed in the report?
//             </p>

//             <div className="flex justify-end gap-4 pt-4">
//               <button
//                 onClick={() => setShowConfirmModal(false)}
//                 className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={async () => {
//                   await handleSendMessagesOnWhatsapp();
//                   setShowConfirmModal(false);
//                 }}
//                 className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
//               >
//                 Confirm & Send
//               </button>
//             </div>
//           </div>
//         </div>
//       )} */}

// {showConfirmModal && (
//   <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
//     <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4">
//       <h2 className="text-lg font-semibold text-gray-800">
//         Confirm WhatsApp Send
//       </h2>
//       <p className="text-sm text-gray-600">
//         Are you sure you want to send WhatsApp messages to all students listed in the report?
//       </p>

//       <div className="flex justify-end gap-4 pt-4">
//         <button
//           onClick={() => setShowConfirmModal(false)}
//           className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
//         >
//           Cancel
//         </button>
//         <button
//           onClick={async () => {
//             await handleSendMessagesOnWhatsapp();
//             setShowConfirmModal(false);
//           }}
//           className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
//         >
//           Confirm & Send
//         </button>
//       </div>
//     </div>
//   </div>
// )}

//     </div>
//   );
// };

// export default ReportList;

import React, { useState, useEffect } from "react";
import axios from "../../../api/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ReportList = ({
  reports,
  filter,
  setFilter,
  page,
  setPage,
  totalPages,
  // batchId,
  // date,
  params,

  // fetchReports,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportIds, setReportIds] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sending, setSending] = useState(false); // for WhatsApp sending loading

  console.log("reports from reportList", reports);

  // useEffect(() => {
  //   const loadData = async () => {
  //     setLoading(true);
  //     try {
  //       await fetchReports();
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   loadData();
  // }, [page, filter, fetchReports]);

  useEffect(() => {
    const ids = reports.map((r) => r.student._id);
    setReportIds(ids);
  }, [reports]);

  useEffect(() => {
    document.body.style.overflow = showConfirmModal ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [showConfirmModal]);

  const handleDownloadAll = async () => {
    try {
      setDownloading(true);
      const response = await axios.get(`/batches/admin/reports/download`, {
        params: params,
        responseType: "blob",
      });

      console.log("Response from handleDownloadAll", response);
      // Build dynamic filename based on available params
      let fileName = "PTM_Reports";

      if (params?.batchId) {
        fileName += `_Batch_${params.batchId}`;
      }

      if (params?.rollNo) {
        fileName += `_RollNo_${params.rollNo}`;
      }

      if (params?.date) {
        fileName += `_Date_${params.date}`;
      }

      fileName += `.zip`;

      const blob = new Blob([response.data], { type: "application/zip" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      // link.download = `PTM_Reports_${batchId}_${date}.zip`;
      link.download = fileName;

      link.click();

      toast.success("Download started!");
    } catch (err) {
      console.error("Error downloading reports", err);
      toast.error("Download failed. Please check your filters or try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleSendMessagesOnWhatsapp = async () => {
    try {
      setSending(true);
      const response = await axios.post("/ptm/send-whatsapp-message", {
        reportIds,
        params
      });

      console.log("WhatsApp send response:", response.data);
      toast.success("Messages sent successfully!");
    } catch (error) {
      console.error("Error sending messages on WhatsApp:", error);
      toast.error("Failed to send messages. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* Top Bar */}
      <div
        className={`flex flex-col lg:flex-row lg:items-center ${
          filter ? "lg:justify-between" : "lg:justify-end"
        } gap-4`}
      >
        {/* Filters */}

        {filter && (
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <input
              type="text"
              placeholder="Filter by Name"
              value={filter?.name}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, name: e.target.value }))
              }
              className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64"
            />
            <input
              type="text"
              placeholder="Filter by Roll No"
              value={filter?.rollNo}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, rollNo: e.target.value }))
              }
              className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            disabled={downloading}
            onClick={handleDownloadAll}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 flex items-center gap-2"
          >
            {downloading ? (
              <>
                <span className="animate-spin h-4 w-4 border-t-2 border-white rounded-full" />
                Downloading...
              </>
            ) : (
              "⬇ Download All (.zip)"
            )}
          </button>

          <button
            disabled={reportIds.length === 0}
            onClick={() => setShowConfirmModal(true)}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
          >
            Send via WhatsApp
          </button>
        </div>
      </div>

      {/* Reports */}
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
              <div className="relative h-64 sm:h-48 bg-gray-50 flex items-center justify-center">
                <iframe
                  src={`${report.secure_url}#toolbar=0&navpanes=0&scrollbar=0`}
                  title={`PDF for ${report.student.name}`}
                  className="w-full h-full"
                />
              </div>

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
      {totalPages && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            ⬅ Previous
          </button>

          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Next ➡
          </button>
        </div>
      )}

      {/* Confirmation Modal with backdrop blur */}
      {showConfirmModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Confirm WhatsApp Send
            </h2>
            <p className="text-sm text-gray-600">
              Are you sure you want to send WhatsApp messages to all students
              listed in the report?
            </p>

            <div className="flex justify-end gap-4 pt-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                disabled={sending}
                onClick={async () => {
                  await handleSendMessagesOnWhatsapp();
                  setShowConfirmModal(false);
                }}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-t-2 border-white rounded-full" />
                    Sending...
                  </>
                ) : (
                  "Confirm & Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportList;
