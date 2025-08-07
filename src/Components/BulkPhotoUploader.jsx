import React, { useState } from "react";
import axios from "../../api/axios";
import { ToastContainer, toast } from "react-toastify";
import Loading from "../../utils/Loading";
import Breadcrumb from "../../utils/Breadcrumb";

const BulkPhotoUploader = () => {
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    setLoading(true);
    if (!files.length) {
      setLoading(false);

      return toast.error("Please select a folder with images.");
    }

    const formData = new FormData();
    for (let file of files) {
      formData.append("photos", file);
    }

    try {
      const res = await axios.post("/students/bulk-upload-photos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Upload completed.");
      console.log("Uploaded:", res.data.uploaded);
      console.log("Failed:", res.data.failed);
    } catch (err) {
      console.error(err);
      toast.error("Bulk upload failed.");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-6 max-w-6xl mx-auto">
      <ToastContainer />
      <Breadcrumb />

      <div className="p-6 bg-white  shadow max-w-xl mx-auto rounded">
        {loading && <Loading />}
        <h2 className="text-xl font-semibold mb-4">
          📁 Bulk Upload Student Photos
        </h2>
        <input
          type="file"
          accept="image/*"
          webkitdirectory="true" // key line!
          onChange={(e) => setFiles([...e.target.files])}
          className="mb-4"
        />
        <button
          onClick={handleUpload}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Upload Folder
        </button>
      </div>
    </div>
  );
};

export default BulkPhotoUploader;
