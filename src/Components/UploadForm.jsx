import React, { useState } from 'react';
import axios from '../../api/axios';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      setUploading(true);
      const res = await axios.post(`/ptm/upload`, formData);
      console.log("res.data", res);
      setResults(res.data.results);
    } catch (err) {
      alert('Error uploading file');
      console.error("Upload error", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex justify-center p-8 bg-slate-50 max-h-screen overflow-auto ">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-xl text-center">
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">📤 PTM Report Uploader</h2>
        <p className="text-slate-500 text-sm mb-6">
          Supported formats: <code>.xlsx</code>, <code>.csv</code>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="border border-slate-300 rounded-md px-3 py-2 w-full max-w-sm text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            type="submit"
            disabled={uploading}
            className={`px-5 py-2 text-white rounded-md font-medium transition ${
              uploading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Uploading...' : 'Generate Reports'}
          </button>
        </form>

        {results.length > 0 && (
          <div className="mt-8 text-left">
            <h3 className="text-lg font-medium text-slate-700 mb-4">📄 Generated Reports</h3>
            <ul className="space-y-2 list-disc pl-5 text-slate-600">
              {results.map((r, index) => (
                <li key={index}>
                  <strong>{r.name}</strong> –{' '}
                  <a
                    href={r.cloudinaryUrl.secure_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadForm;
