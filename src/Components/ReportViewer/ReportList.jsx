import React, { useState, useEffect } from "react";
import axios from "../../../api/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation, useParams } from "react-router-dom";

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

  const { batchId, date } = useParams();

  const location = useLocation();
  const path = location.pathname.split("/")[1];
  console.log("location from SendWhatsappMessage ", location);
  console.log("location from SendWhatsappMessage ", location.pathname);
  console.log(
    "location from SendWhatsappMessage split is used ",
    location.pathname.split("/")[1]
  );
  console.log("pathname from SendWhatsappMessage ", location.pathname.pathname);

  const [showSendWhatsappMessage, setShowSendWhatsappMessage] = useState(false);

  const [currentReport, setCurrentReport] = useState("");

  const [showReportSendConfirmation, setShowReportSendConfirmation] =
    useState(false);

  const [whatsAppResults, setWhatsAppResults] = useState([]);
  const [reportIds, setReportIds] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sending, setSending] = useState(false); // for WhatsApp sending loading

  console.log("reports from reportList", reports);

  console.log("page from the reportList", page);

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

  // const handleSendMessagesOnWhatsapp = async () => {
  //   try {
  //     setSending(true);
  //     const response = await axios.post("/ptm/send-whatsapp-message", {
  //       // reportIds,
  //       params,
  //     });

  //     console.log("WhatsApp send response:", response.data);

  //     setShowSendWhatsappMessage(true);
  //     setDetailOfSendMessage(response.data);
  //     toast.success("Messages sent successfully!");
  //   } catch (error) {
  //     console.error("Error sending messages on WhatsApp:", error);
  //     toast.error("Failed to send messages. Please try again.");
  //   } finally {
  //     setSending(false);
  //   }
  // };

  const handleSendMessagesOnWhatsapp = async () => {
    try {
      setSending(true);
      const response = await axios.post("/ptm/send-whatsapp-message", {
        params,
      });

      console.log("WhatsApp send response:", response.data);

      setWhatsAppResults(response.data.results || []);
      setShowSendWhatsappMessage(true);
      toast.success("WhatsApp messages processed!");
    } catch (error) {
      console.error("Error sending messages on WhatsApp:", error);
      toast.error("Failed to send messages. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSendSingleReportOnWhatsapp = async () => {
    console.log("handleSendSingleReportOnWhatsapp function is");
    const response = await axios.post("/ptm/send-single-message-on-whatsapp", {
      rollNo : currentReport.student.rollNo,
      date,
    });

    console.log("response from handelSendSingleReportOnWhatsapp", response);

    console.log("response from sendReportOnWhatsappMessage", response);
    // setShowReportSendConfirmation(false);

    console.log("current Report", currentReport);
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
              placeholder="Filter By Name"
              value={filter?.name}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, name: e.target.value }))
              }
              className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64"
            />
            <input
              type="text"
              placeholder="Filter By Roll No"
              value={filter?.rollNo}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, rollNo: e.target.value }))
              }
              className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64"
            />
          </div>
        )}

        {/* Buttons */}
        {path === "send-whatsapp-message" && (
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
        )}
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
                  className="w-full h-full appearance-none"
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
                <div className="flex justify-between">
                  <a
                    href={report.secure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                  >
                    🔗 Open Full PDF
                  </a>

                { path === "send-whatsapp-message" &&  <button
                    type="button"
                    onClick={() => {
                      setShowReportSendConfirmation(true);
                      setCurrentReport(report);
                    }}
                  >
                    send
                  </button>}
                </div>
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

      {showSendWhatsappMessage && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800">
              WhatsApp Message Status
            </h2>

            {whatsAppResults.length === 0 ? (
              <p className="text-gray-600">No data returned.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="border px-4 py-2">Student</th>
                      <th className="border px-4 py-2">Report Date</th>
                      <th className="border px-4 py-2">Mobile(s)</th>
                      <th className="border px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whatsAppResults.map((result, idx) => (
                      <tr
                        key={idx}
                        className={`${
                          result.status === "Sent"
                            ? "bg-green-50"
                            : result.status === "Partially Sent"
                            ? "bg-yellow-50"
                            : "bg-red-50"
                        }`}
                      >
                        <td className="border px-4 py-2">{result.student}</td>
                        <td className="border px-4 py-2">
                          {result.reportDate
                            ? new Date(result.reportDate).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="border px-4 py-2">
                          {result.mobile?.join(", ") || "—"}
                        </td>
                        <td className="border px-4 py-2 font-medium">
                          {result.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowSendWhatsappMessage(false)}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportSendConfirmation && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Send Report on WhatsApp
            </h2>
            <p className="text-gray-600">
              Are you sure you want to send this report on WhatsApp?
            </p>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowReportSendConfirmation(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSendSingleReportOnWhatsapp} // <-- your function to trigger API call
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Yes, Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportList;
