import React, { useState } from 'react';
import axios from 'axios';

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
      const res = await axios.post('http://localhost:5000/api/ptm/upload', formData);
      setResults(res.data.results);
    } catch (err) {
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>PTM Report Uploader (.xlsx or .csv)</h2>
<form onSubmit={handleSubmit}>
  <input
    type="file"
    accept=".xlsx,.csv"
    onChange={(e) => setFile(e.target.files[0])}
  />
  <button type="submit" disabled={uploading}>
    {uploading ? 'Uploading...' : 'Generate Reports'}
  </button>
</form>


      {results.length > 0 && (
        <div>
          <h3>Generated Reports</h3>
          <ul>
            {results.map((r, index) => (
              <li key={index}>
                {r.name} – <a href={`http://localhost:5000/${r.file}`} target="_blank" rel="noreferrer">Download</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
