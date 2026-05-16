import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../api/axios";
import BatchList from "./ReportViewer/BatchList";
import DateList from "./ReportViewer/DateList";
import ReportList from "./ReportViewer/ReportList";
import BackButton from "./ReportViewer/BackButton";
import { getCookie } from "../../utils/getCookie";
import Breadcrumb from "../../utils/Breadcrumb";
import { fetchFallbackBatchStats } from "../../utils/reportStatsFallback";

const AdminReportViewer = () => {
  const { batchId, date } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromQuery = parseInt(searchParams.get("page")) || 1;
  const selectedSession = searchParams.get("session") || "";

  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [batches, setBatches] = useState([]);
  const [batchStats, setBatchStats] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionStats, setSessionStats] = useState([]);
  const [dates, setDates] = useState([]);
  const [dateStats, setDateStats] = useState([]);
  const [reports, setReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(pageFromQuery);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [filter, setFilter] = useState({ name: "", rollNo: "" });

  useEffect(() => {
    const controller = new AbortController();

    setLoadingSessions(true);
    axios
      .get("/batches/sessions", { signal: controller.signal })
      .then((res) => {
        const nextSessions = res.data.sessions || [];
        setSessions(nextSessions);
        setSessionStats(res.data.sessionStats || res.data.stats || []);

        if (!selectedSession && nextSessions.length) {
          setSearchParams((params) => {
            const next = new URLSearchParams(params);
            next.set("session", nextSessions[0]);
            return next;
          });
        }
      })
      .catch((err) => {
        if (err.name !== "CanceledError") console.error(err);
      })
      .finally(() => setLoadingSessions(false));

    return () => controller.abort();
  }, [selectedSession, setSearchParams]);

  // Fetch batches
  useEffect(() => {
    if (!selectedSession) return;
    const controller = new AbortController();

    setLoadingBatches(true);
    axios
      .get("/batches", {
        params: { session: selectedSession },
        signal: controller.signal,
      })
      .then(async (res) => {
        setBatches(res.data.batches || []);
        const stats = res.data.batchStats || res.data.stats || [];
        setBatchStats(stats);

        if (!stats.length && res.data.batches?.length) {
          await fetchFallbackBatchStats(axios, res.data.batches, {
            session: selectedSession,
            signal: controller.signal,
            onBatchStat: (stat) => {
              setBatchStats((currentStats) => {
                const withoutCurrent = currentStats.filter((item) => item.batch !== stat.batch);
                return [...withoutCurrent, stat];
              });
            },
          });
        }
      })
      .catch((err) => {
        if (err.name !== "CanceledError") console.error(err);
      })
      .finally(() => setLoadingBatches(false));

    return () => controller.abort();
  }, [selectedSession]);

  // Fetch dates for selected batch
  useEffect(() => {
    if (!batchId || !selectedSession) return;
    setLoadingDates(true);
    axios
      .get(`/batches/${encodeURIComponent(batchId)}/dates`, {
        params: { session: selectedSession },
      })
      .then((res) => {
        setDates(res.data.dates || []);
        setDateStats(res.data.dateStats || res.data.stats || []);
      })
      .catch(console.error)
      .finally(() => setLoadingDates(false));
  }, [batchId, selectedSession]);

  // Fetch reports
  const fetchReports = useCallback(() => {
    if (!batchId || !date) return;
    const controller = new AbortController();
    setLoadingReports(true);

    axios
      .get(`/batches/reports`, {
        params: {
          batch: batchId,
          date,
          session: selectedSession,
          page: currentPage,
          name: filter.name,
          rollNo: filter.rollNo,
        },
        signal: controller.signal,
      })
      .then((res) => {
        console.log("res of reports", res);
        setReports(res.data.reports || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalReports(res.data.totalReports || 0);
      })
      .catch((err) => {
        if (err.name !== "CanceledError") console.error(err);
      })
      .finally(() => setLoadingReports(false));

    return () => controller.abort();
  }, [batchId, date, selectedSession, currentPage, filter]);

  useEffect(() => {
    if (!selectedSession) return;
    return fetchReports();
  }, [fetchReports, selectedSession]);

  const handleBatchSelect = (batch) => {
    navigate(`/reports/${encodeURIComponent(batch)}?session=${encodeURIComponent(selectedSession)}`);
  };

  const handleDateSelect = (selectedDate) => {
    navigate(
      `/reports/${encodeURIComponent(batchId)}/${selectedDate}?session=${encodeURIComponent(selectedSession)}&page=1`
    );
    setCurrentPage(1);
  };

  const handleBack = () => {
    if (date) navigate(`/reports/${encodeURIComponent(batchId)}?session=${encodeURIComponent(selectedSession)}`);
    else if (batchId) navigate(`/reports?session=${encodeURIComponent(selectedSession)}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSearchParams({ session: selectedSession, page });
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    setSearchParams({ session: selectedSession, page: 1 });
  };

  const handleSessionChange = (event) => {
    const nextSession = event.target.value;
    setBatches([]);
    setBatchStats([]);
    setDates([]);
    setDateStats([]);
    setReports([]);
    setCurrentPage(1);
    navigate(`/reports?session=${encodeURIComponent(nextSession)}`);
  };



  // const student = {
  //   name: "Aakarshi Agarwal",
  //   rollNo: "2024110009",
  //   originalPdfUrl:
  //     "./assets/testPdf.pdf"
  // };


  const role = getCookie("role");

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="[&>nav]:mb-0">
          <Breadcrumb />
        </div>
        <div className="lg:max-w-xl lg:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{role}</p>
          <div className="mt-0.5 flex flex-col gap-1 lg:items-end">
            <h2 className="text-lg font-semibold leading-tight text-slate-950">Report Viewer</h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              Browse generated PTM reports by batch, report date, student name, or roll number.
            </p>
          </div>
        </div>
      </div>

      {(batchId || date) && (
        <div>
          <BackButton onClick={handleBack} />
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Academic Session</h3>
            <p className="text-xs text-slate-500">
              Separate current-year reports from previous-year reports with the same batch name.
            </p>
          </div>
          <select
            value={selectedSession}
            onChange={handleSessionChange}
            disabled={loadingSessions || !sessions.length}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 sm:min-w-44"
          >
            {!selectedSession && <option value="">Loading sessions...</option>}
            {sessions.map((session) => {
              const stat = sessionStats.find((item) => item.session === session);
              return (
                <option key={session} value={session}>
                  {session}{stat ? ` (${stat.reportCount} reports)` : ""}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Step 1: Batch Selection */}
      {!batchId && selectedSession && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <BatchList
            batches={batches}
            batchStats={batchStats}
            onSelect={handleBatchSelect}
            selected={batchId}
          />
          {loadingBatches && <div className="mt-4 h-24 animate-pulse rounded bg-slate-100" />}
        </div>
      )}

      {/* Step 2: Date Selection */}
      {batchId && !date && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <DateList dates={dates} dateStats={dateStats} onSelect={handleDateSelect} selected={date} />
          {loadingDates && <div className="mt-4 h-24 animate-pulse rounded bg-slate-100" />}
        </div>
      )}

      {/* Step 3: Reports */}
      {batchId && date && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <ReportList
            reports={reports}
            filter={filter}
            setFilter={handleFilterChange}
            page={currentPage}
            setPage={handlePageChange}
            totalPages={totalPages}
            totalReports={totalReports}
            loading={loadingReports}
            params={{date, batchId, session: selectedSession}}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminReportViewer;
