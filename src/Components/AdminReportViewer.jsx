import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../api/axios";
import BatchList from "./ReportViewer/BatchList";
import DateList from "./ReportViewer/DateList";
import ReportList from "./ReportViewer/ReportList";
import BackButton from "./ReportViewer/BackButton";
import Loading from "../../utils/Loading";
import { getCookie } from "../../utils/getCookie";
import Breadcrumb from "../../utils/Breadcrumb";

const AdminReportViewer = () => {
  const { batchId, date } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromQuery = parseInt(searchParams.get("page")) || 1;

  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [dates, setDates] = useState([]);
  const [reports, setReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(pageFromQuery);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({ name: "", rollNo: "" });

  // Fetch batches
  useEffect(() => {
    setLoading(true);
    axios
      .get("/batches")
      .then((res) => setBatches(res.data.batches))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch dates for selected batch
  useEffect(() => {
    if (!batchId) return;
    setLoading(true);
    axios
      .get(`/batches/${batchId}/dates`)
      .then((res) => setDates(res.data.dates))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [batchId]);

  // Fetch reports
  const fetchReports = useCallback(() => {
    if (!batchId || !date) return;
    const controller = new AbortController();
    setLoading(true);

    axios
      .get(`/batches/reports`, {
        params: {
          batch: batchId,
          date,
          page: currentPage,
          name: filter.name,
          rollNo: filter.rollNo,
        },
        signal: controller.signal,
      })
      .then((res) => {
        setReports(res.data.reports);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => {
        if (err.name !== "CanceledError") console.error(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [batchId, date, currentPage, filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleBatchSelect = (batch) => {
    navigate(`/reports/${batch}`);
  };

  const handleDateSelect = (selectedDate) => {
    navigate(`/reports/${batchId}/${selectedDate}?page=1`);
    setCurrentPage(1);
  };

  const handleBack = () => {
    if (date) navigate(`/reports/${batchId}`);
    else if (batchId) navigate(`/reports`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSearchParams({ page });
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    setSearchParams({ page: 1 });
  };

  const role = getCookie("role");

  return (
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
      {batchId && !date && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-4">
          <DateList dates={dates} onSelect={handleDateSelect} selected={date} />
        </div>
      )}

      {/* Step 3: Reports */}
      {batchId && date && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-4">
          <ReportList
            reports={reports}
            filter={filter}
            setFilter={handleFilterChange}
            page={currentPage}
            setPage={handlePageChange}
            totalPages={totalPages}
            batchId={batchId}
            date={date}
          />
        </div>
      )}
    </div>
  );
};

export default AdminReportViewer;
