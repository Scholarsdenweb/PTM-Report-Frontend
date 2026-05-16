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
  totalReports = 0,
  loading = false,
  params,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [localFilter, setLocalFilter] = useState(filter || { name: "", rollNo: "" });

  const { date } = useParams();

  const location = useLocation();
  const path = location.pathname.split("/")[1];

  const [showSendWhatsappMessage, setShowSendWhatsappMessage] = useState(false);

  const [currentReport, setCurrentReport] = useState("");

  const [showReportSendConfirmation, setShowReportSendConfirmation] =
    useState(false);

  const [whatsAppResults, setWhatsAppResults] = useState([]);
  const [reportIds, setReportIds] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sending, setSending] = useState(false); // for WhatsApp sending loading

  useEffect(() => {
    setLocalFilter(filter || { name: "", rollNo: "" });
  }, [filter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        localFilter.name !== (filter?.name || "") ||
        localFilter.rollNo !== (filter?.rollNo || "")
      ) {
        setFilter(localFilter);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filter, localFilter, setFilter]);

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

      if (params?.session) {
        fileName += `_Session_${params.session}`;
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
      console.log("params", params);
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
    setSending(true);

    try {
      console.log("handleSendSingleReportOnWhatsapp function is");
      const response = await axios.post(
        "/ptm/send-single-message-on-whatsapp",
        {
          rollNo: currentReport.student.rollNo,
          date,
        }
      );

      console.log("response from handelSendSingleReportOnWhatsapp", response);

      console.log("response from sendReportOnWhatsappMessage", response);
      // setShowReportSendConfirmation(false);

      console.log("current Report", currentReport);
    } catch (error) {
      console.error("Error sending messages on WhatsApp:", error);
      toast.error("Failed to send messages. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, idx) => (
        <div key={idx} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="h-48 animate-pulse bg-slate-100" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">Generated Reports</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
              {totalReports} total results
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              {reports.length} shown on this page
            </span>
            {loading && (
              <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
                Updating...
              </span>
            )}
          </div>
        </div>

        {filter && (
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl">
            <input
              type="text"
              placeholder="Search by name"
              value={localFilter?.name || ""}
              onChange={(e) => setLocalFilter((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="text"
              placeholder="Search by roll no"
              value={localFilter?.rollNo || ""}
              onChange={(e) => setLocalFilter((prev) => ({ ...prev, rollNo: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        )}

        {path === "send-whatsapp-message" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              disabled={downloading}
              onClick={handleDownloadAll}
              className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
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
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              Send via WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* Reports */}
      {loading && reports.length === 0 ? (
        renderSkeletons()
      ) : reports.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm text-slate-500">
          No reports found for the selected batch/date/filter.
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-6 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : "opacity-100"}`}>
          {reports.map((report) => (
            <div
              key={report._id}
              className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative h-64 sm:h-48 bg-gray-50 flex items-center justify-center">
                <iframe
                  src={`${report.secure_url}#toolbar=0&navpanes=0&scrollbar=0`}
                  title={`PDF for ${report.student.name}`}
                  className="w-full h-full appearance-none"
                />
              </div>

              <div className="space-y-2 p-4">
                <div className="text-base font-semibold text-slate-900">
                  {report.student.name}
                </div>
                <div className="text-sm text-slate-600">
                  Roll No: {report.student.rollNo}
                </div>
                <div className="text-xs text-slate-500">
                  Report Date:{" "}
                  {new Date(report.reportDate).toLocaleDateString()}
                </div>
                <div className="flex justify-between">
                  <a
                    href={report.secure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
                  >
                    🔗 Open Full PDF
                  </a>

                  {path === "send-whatsapp-message" && (
                    <button
                      type="button"
                      className="rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                      onClick={() => {
                        setShowReportSendConfirmation(true);
                        setCurrentReport(report);
                      }}
                    >
                      send
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            ⬅ Previous
          </button>

          <span className="text-sm font-medium text-slate-700">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
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
