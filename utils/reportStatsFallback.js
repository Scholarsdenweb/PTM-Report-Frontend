const normalizeBatch = (batch) => String(batch || "").trim();

const getStudentKey = (report) => {
  const student = report?.student || {};
  return student._id || student.rollNo || student.rollNumber || student.name || null;
};

const fetchDateReports = async (axiosInstance, batch, date, session, signal) => {
  const firstPage = await axiosInstance.get("/batches/reports", {
    params: { batch, date, session, page: 1, limit: 500 },
    signal,
  });

  const reports = [...(firstPage.data?.reports || [])];
  const totalReports = Number(firstPage.data?.totalReports || reports.length || 0);
  const totalPages = Number(firstPage.data?.totalPages || 1);

  for (let page = 2; page <= totalPages; page += 1) {
    const pageRes = await axiosInstance.get("/batches/reports", {
      params: { batch, date, session, page, limit: 500 },
      signal,
    });
    reports.push(...(pageRes.data?.reports || []));
  }

  return { reports, totalReports };
};

const fetchBatchStat = async (axiosInstance, batch, session, signal) => {
  const normalizedBatch = normalizeBatch(batch);
  const datesRes = await axiosInstance.get(
    `/batches/${encodeURIComponent(normalizedBatch)}/dates`,
    { params: { session }, signal }
  );

  const dates = datesRes.data?.dates || [];
  const dateStats = datesRes.data?.dateStats || datesRes.data?.stats || [];
  const countByDate = new Map(
    dateStats.map((item) => [String(item.date || "").slice(0, 10), Number(item.count || 0)])
  );

  let reportCount = dateStats.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const studentKeys = new Set();

  for (const date of dates) {
    const dateKey = String(date || "").slice(0, 10);
    const { reports, totalReports } = await fetchDateReports(
      axiosInstance,
      normalizedBatch,
      date,
      session,
      signal
    );

    if (!countByDate.has(dateKey)) {
      reportCount += totalReports;
    }

    reports.forEach((report) => {
      const key = getStudentKey(report);
      if (key) studentKeys.add(String(key));
    });
  }

  return {
    batch: normalizedBatch,
    reportCount,
    studentCount: studentKeys.size,
  };
};

export const fetchFallbackBatchStats = async (
  axiosInstance,
  batches,
  { session, signal, onBatchStat } = {}
) => {
  const normalizedBatches = [...new Set(batches.map(normalizeBatch).filter(Boolean))];
  const stats = [];

  for (const batch of normalizedBatches) {
    const stat = await fetchBatchStat(axiosInstance, batch, session, signal);
    stats.push(stat);
    onBatchStat?.(stat);
  }

  return stats;
};
