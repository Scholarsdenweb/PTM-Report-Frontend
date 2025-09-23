import React, { useCallback } from "react";
import { useEffect } from "react";
import axios from "../../api/axios";
import { useState } from "react";
import BatchList from "./ReportViewer/BatchList";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../../utils/Breadcrumb";
import DateList from "./ReportViewer/DateList";
import BackButton from "./ReportViewer/BackButton";
import ReportList from "./ReportViewer/ReportList";

const SendWhatsappMessage = () => {
  const [loading, setLoading] = useState(false);

  const [batches, setBatches] = useState([]);

  const [totalPages, setTotalPages] = useState(1);

  const { batchId, date } = useParams();

  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState({ name: "", rollNo: "" });

  const [currentPage, setCurrentPage] = useState(1);


  const [searchParams, setSearchParams] = useState();

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    setSearchParams({ page: 1 });
  };

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
        console.log("res of reports", res);
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

  console.log("BatchID from SendWhatsappMessage", batchId);
  console.log("BatchID from SendWhatsappMessage", date);

  const navigate = useNavigate();

  const [dates, setDates] = useState([]);

  //   const handleBatchSelect = () => {
  //     console.log("handleBatchSelect from data");
  //   };

  const handleBatchSelect = (batch) => {
    navigate(`/send-whatsapp-message/${batch}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSearchParams({ page });
  };

  const handleDateSelect = (selectedDate) => {
    navigate(`/send-whatsapp-message/${batchId}/${selectedDate}`);
    // setCurrentPage(1);
  };

  useEffect(() => {
    setLoading(true);
    axios
      .get("/batches")
      .then((res) => setBatches(res.data.batches))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    console.log("Branches for useEffect sendWHATSAPPMESSAGE", batches);
  }, [batches]);

  useEffect(() => {
    if (!batchId) return;
    setLoading(true);
    axios
      .get(`/batches/${batchId}/dates`)
      .then((res) => setDates(res.data.dates))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [batchId]);

  const handleBack = () => {
    if (date) navigate(`/send-whatsapp-message/${batchId}`);
    else if (batchId) navigate(`/send-whatsapp-message`);
  };




  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div>
        <Breadcrumb />
      </div>

      {(batchId || date) && (
        <div className="mb-4">
          <BackButton onClick={handleBack} />
        </div>
      )}
      {!batchId && (
        <BatchList
          batches={batches}
          selected={batchId}
          onSelect={handleBatchSelect}
        />
      )}
      {batchId && !date && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-4">
          <DateList dates={dates} onSelect={handleDateSelect} selected={date} />
        </div>
      )}

      {batchId && date && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-4">
          <ReportList
            reports={reports}
            filter={filter}
            setFilter={handleFilterChange}
            page={currentPage}
            setPage={handlePageChange}
            totalPages={totalPages}
            // batchId={batchId}
            // date={date}
            params={{ date, batchId }}
          />
        </div>
      )}
    </div>
  );
};

export default SendWhatsappMessage;
