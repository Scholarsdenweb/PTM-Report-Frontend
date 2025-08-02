import JSZip from "jszip";
import { saveAs } from "file-saver";
import axios from "axios";

const handleDownloadAll = async () => {
  if (!batchId || !date) return;

  const zip = new JSZip();
  const folder = zip.folder("reports");

  try {
    // Fetch the reports list (just metadata)
    const { data } = await axios.get(`/api/reports`, {
      params: {
        batch: batchId,
        date,
        search: filter?.name || "",
        limit: 1000, // Ensure you get all reports (or paginate)
        page: 1,
      },
    });

    const reports = data.reports || [];

    if (!reports.length) {
      alert("No reports found to download.");
      return;
    }

    for (let report of reports) {
      try {
        const response = await axios.get(report.secure_url, {
          responseType: "blob",
        });

        const filename = `${report.student.rollNo}-${report.student.name}.pdf`
          .replace(/[\/\\:*?"<>| ]+/g, "_")
          .trim();

        folder.file(filename, response.data);
      } catch (err) {
        console.error(`Failed to fetch report for ${report.student.name}`, err);
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `PTM_Reports_${batchId}_${date}.zip`);
  } catch (err) {
    console.error("Error downloading all reports:", err);
    alert("Failed to download reports.");
  }
};
