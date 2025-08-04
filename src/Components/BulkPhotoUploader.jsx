// import React, { useState } from "react";
// import axios from "../../api/axios";

// const BulkPhotoUploader = () => {
//   const [files, setFiles] = useState([]);

//   const handleUpload = async () => {
//     if (!files.length) return alert("Please select at least one image.");

//     const formData = new FormData();
//     for (let file of files) {
//       formData.append("photos", file);
//     }

//     try {
//       const res = await axios.post("/students/bulk-upload-photos", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       alert("Upload completed.");
//       console.log("Uploaded:", res.data.uploaded);
//       console.log("Failed:", res.data.failed);
//     } catch (err) {
//       console.error(err);
//       alert("Bulk upload failed.");
//     }
//   };

//   return (
//     <div className="p-6 bg-white shadow max-w-xl mx-auto rounded">
//       <h2 className="text-xl font-semibold mb-4">📁 Bulk Upload Student Photos</h2>
//       <input
//         type="file"
//         accept="image/*"
//         multiple
//         onChange={(e) => setFiles([...e.target.files])}
//         className="mb-4"
//       />
//       <button
//         onClick={handleUpload}
//         className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
//       >
//         Upload All
//       </button>
//     </div>
//   );
// };

// export default BulkPhotoUploader;
import React, { useState } from "react";
import axios from "../../api/axios";

const BulkPhotoUploader = () => {
  const [files, setFiles] = useState([]);

  const handleUpload = async () => {
    if (!files.length) return alert("Please select a folder with images.");

    const formData = new FormData();
    for (let file of files) {
      formData.append("photos", file);
    }

    try {
      const res = await axios.post("/students/bulk-upload-photos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Upload completed.");
      console.log("Uploaded:", res.data.uploaded);
      console.log("Failed:", res.data.failed);
    } catch (err) {
      console.error(err);
      alert("Bulk upload failed.");
    }
  };

  return (
    <div className="p-6 bg-white shadow max-w-xl mx-auto rounded">
      <h2 className="text-xl font-semibold mb-4">📁 Bulk Upload Student Photos</h2>
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
  );
};

export default BulkPhotoUploader;
