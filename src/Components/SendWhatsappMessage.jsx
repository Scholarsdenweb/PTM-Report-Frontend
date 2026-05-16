import React, { useCallback } from "react";
import { useEffect } from "react";
import axios from "../../api/axios";
import { useState } from "react";
import BatchList from "./ReportViewer/BatchList";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Breadcrumb from "../../utils/Breadcrumb";
import DateList from "./ReportViewer/DateList";
import BackButton from "./ReportViewer/BackButton";
import ReportList from "./ReportViewer/ReportList";
import { fetchFallbackBatchStats } from "../../utils/reportStatsFallback";

const SendWhatsappMessage = () => {
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [batches, setBatches] = useState([]);
  const [batchStats, setBatchStats] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionStats, setSessionStats] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSession = searchParams.get("session") || "";

  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  const { batchId, date } = useParams();

  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState({ name: "", rollNo: "" });

  const [currentPage, setCurrentPage] = useState(1);


  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

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



  const navigate = useNavigate();

  const [dates, setDates] = useState([]);
  const [dateStats, setDateStats] = useState([]);

  //   const handleBatchSelect = () => {
  //     console.log("handleBatchSelect from data");
  //   };

  const handleBatchSelect = (batch) => {
    navigate(
      `/send-whatsapp-message/${encodeURIComponent(batch)}?session=${encodeURIComponent(selectedSession)}`
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDateSelect = (selectedDate) => {
    navigate(
      `/send-whatsapp-message/${encodeURIComponent(batchId)}/${selectedDate}?session=${encodeURIComponent(selectedSession)}`
    );
    // setCurrentPage(1);
  };

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

  useEffect(() => {
    console.log("Branches for useEffect sendWHATSAPPMESSAGE", batches);
  }, [batches]);

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

  const handleBack = () => {
    if (date) {
      navigate(
        `/send-whatsapp-message/${encodeURIComponent(batchId)}?session=${encodeURIComponent(selectedSession)}`
      );
    } else if (batchId) {
      navigate(`/send-whatsapp-message?session=${encodeURIComponent(selectedSession)}`);
    }
  };

  const handleSessionChange = (event) => {
    const nextSession = event.target.value;
    setBatches([]);
    setBatchStats([]);
    setDates([]);
    setDateStats([]);
    setReports([]);
    setCurrentPage(1);
    navigate(`/send-whatsapp-message?session=${encodeURIComponent(nextSession)}`);
  };




  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <Breadcrumb />

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Reports</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">Send WhatsApp Reports</h2>
        <p className="mt-1 text-sm text-slate-500">
          Filter generated reports, download selected batches, and send updates without leaving the page.
        </p>
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
              Send reports from the selected academic year only.
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

      {!batchId && selectedSession && (
        <BatchList
          batches={batches}
          batchStats={batchStats}
          selected={batchId}
          onSelect={handleBatchSelect}
        />
      )}
      {!batchId && loadingBatches && <div className="h-24 animate-pulse rounded bg-slate-100" />}
      {batchId && !date && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <DateList dates={dates} dateStats={dateStats} onSelect={handleDateSelect} selected={date} />
          {loadingDates && <div className="mt-4 h-24 animate-pulse rounded bg-slate-100" />}
        </div>
      )}

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
            params={{ date, batchId, session: selectedSession }}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default SendWhatsappMessage;
