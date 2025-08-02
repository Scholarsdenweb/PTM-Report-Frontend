// AdminReportViewer.jsx

import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import BatchList from "./ReportViewer/BatchList";
import DateList from "./ReportViewer/DateList";
import ReportList from "./ReportViewer/ReportList";
import BackButton from "./ReportViewer/BackButton";

const AdminReportViewer = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    axios
      .get("/batches")
      .then((res) => setBatches(res.data.batches))
      .catch(console.error);
  }, []);

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    setSelectedDate(null);
    setReports([]);
    axios
      .get(`/batches/${batch}/dates`)
      .then((res) => setDates(res.data.dates))
      .catch(console.error);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    axios
      .get(`/batches/reports?batch=${selectedBatch}&date=${date}`)
      .then((res) => {
        setReports(res.data.reports);
        console.log(res.data.reports);
      })
      .catch(console.error);
  };

  const handleBack = () => {
    if (selectedDate) {
      setSelectedDate(null);
      setReports([]);
    } else if (selectedBatch) {
      setSelectedBatch(null);
      setDates([]);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Admin Report Viewer
      </h2>

      {(selectedBatch || selectedDate) && <BackButton onClick={handleBack} />}

      {!selectedBatch && (
        <BatchList
          batches={batches}
          onSelect={handleBatchSelect}
          selected={selectedBatch}
        />
      )}

      {selectedBatch && !selectedDate && (
        <DateList
          dates={dates}
          onSelect={handleDateSelect}
          selected={selectedDate}
        />
      )}

      {selectedBatch && selectedDate && <ReportList reports={reports} />}
    </div>
  );
};

export default AdminReportViewer;
