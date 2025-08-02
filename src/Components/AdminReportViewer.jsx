import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../api/axios";
import BatchList from "./ReportViewer/BatchList";
import DateList from "./ReportViewer/DateList";
import ReportList from "./ReportViewer/ReportList";
import BackButton from "./ReportViewer/BackButton";

const AdminReportViewer = () => {
  const { batchId, date } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromQuery = parseInt(searchParams.get("page")) || 1;

  const [batches, setBatches] = useState([]);
  const [dates, setDates] = useState([]);
  const [reports, setReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(pageFromQuery);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({ name: "", rollNumber: "" });

  useEffect(() => {
    axios.get("/batches")
      .then((res) => setBatches(res.data.batches))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (batchId) {
      axios.get(`/batches/${batchId}/dates`)
        .then((res) => setDates(res.data.dates))
        .catch(console.error);
    }
  }, [batchId]);

  useEffect(() => {
    if (batchId && date) {
      axios
        .get(`/batches/reports`, {
          params: {
            batch: batchId,
            date,
            page: currentPage,
            name: filter.name,
            rollNumber: filter.rollNumber,
          },
        })
        .then((res) => {
          setReports(res.data.reports);
          setCurrentPage(res.data.currentPage);
          setTotalPages(res.data.totalPages);
        })
        .catch(console.error);
    }
  }, [batchId, date, currentPage, filter]);

  const handleBatchSelect = (batch) => {
    navigate(`/admin/reports/${batch}`);
  };





  

  const handleDateSelect = (selectedDate) => {
    navigate(`/admin/reports/${batchId}/${selectedDate}?page=1`);
    setCurrentPage(1);
  };

  const handleBack = () => {
    if (date) {
      navigate(`/admin/reports/${batchId}`);
    } else if (batchId) {
      navigate(`/admin/reports`);
    }
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Admin Report Viewer
      </h2>

      {(batchId || date) && <BackButton onClick={handleBack} />}

      {!batchId && (
        <BatchList
          batches={batches}
          onSelect={handleBatchSelect}
          selected={batchId}
        />
      )}

      {batchId && !date && (
        <DateList
          dates={dates}
          onSelect={handleDateSelect}
          selected={date}
        />
      )}

      {batchId && date && (
        <ReportList
          reports={reports}
          filter={filter}
          setFilter={handleFilterChange}
          page={currentPage}
          setPage={handlePageChange}
          totalPages={totalPages}
          batchId= {batchId}
          date={date}
        />
      )}
    </div>
  );
};

export default AdminReportViewer;
