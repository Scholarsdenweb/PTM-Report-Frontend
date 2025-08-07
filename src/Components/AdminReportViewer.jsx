import React, { useEffect, useState } from "react";
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

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromQuery = parseInt(searchParams.get("page")) || 1;

  const [batches, setBatches] = useState([]);
  const [dates, setDates] = useState([]);
  const [reports, setReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(pageFromQuery);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({ name: "", rollNo: "" });

  useEffect(() => {
    try {
      setLoading(true);
      axios.get("/batches").then((res) => {
        console.log("batches", res);
        setBatches(res.data.batches);
      });
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      setLoading(true);
      if (batchId) {
        axios.get(`/batches/${batchId}/dates`).then((res) => {
          console.log("batches", res);
          setDates(res.data.dates);
        });
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    try {
      setLoading(true);
      if (batchId && date) {
        axios
          .get(`/batches/reports`, {
            params: {
              batch: batchId,
              date,
              page: currentPage,
              name: filter.name,
              rollNo: filter.rollNo,
            },
          })
          .then((res) => {
            console.log("batchesId and date", res);
            setReports(res.data.reports);
            setCurrentPage(res.data.currentPage);
            setTotalPages(res.data.totalPages);
          });
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  }, [batchId, date, currentPage, filter]);

  const handleBatchSelect = (batch) => {
    navigate(`/reports/${batch}`);
  };

  const handleDateSelect = (selectedDate) => {
    navigate(`/reports/${batchId}/${selectedDate}?page=1`);
    setCurrentPage(1);
  };

  const handleBack = () => {
    if (date) {
      navigate(`/reports/${batchId}`);
    } else if (batchId) {
      navigate(`/reports`);
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

  const role = getCookie("role");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {loading && <Loading />}
      <Breadcrumb/>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {role} Report Viewer
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
        <DateList dates={dates} onSelect={handleDateSelect} selected={date} />
      )}

      {batchId && date && (
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
      )}
    </div>
  );
};

export default AdminReportViewer;
