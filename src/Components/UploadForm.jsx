import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import axios from '../../api/axios';

const REQUIRED_COLUMNS = ['Name']; // Customize this

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [ptmDate, setPtmDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [dataPreview, setDataPreview] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [invalidCells, setInvalidCells] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setWarnings([]);
    setResults([]);
    setInvalidCells([]);
    setDataPreview([]);

    if (!selectedFile) return;

    const reader = new FileReader();
    const ext = selectedFile.name.split('.').pop().toLowerCase();

    reader.onload = (event) => {
      let data = [];

      if (ext === 'csv') {
        const parsed = Papa.parse(event.target.result, {
          header: true,
          skipEmptyLines: true,
        });
        data = parsed.data;
      } else if (ext === 'xlsx') {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      } else {
        setWarnings(['❌ Unsupported file format']);
        return;
      }

      // validateAndPreview(data);
    };

    if (ext === 'csv') {
      reader.readAsText(selectedFile);
    } else if (ext === 'xlsx') {
      reader.readAsBinaryString(selectedFile);
    }
  };

  const validateAndPreview = (data) => {
    const issues = [];
    const invalids = [];
    const headers = Object.keys(data[0] || {});
    const seenRows = new Set();

    const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
    if (missing.length) {
      issues.push(`Missing required columns: ${missing.join(', ')}`);
    }

    data.forEach((row, rowIndex) => {
      let rowString = '';
      REQUIRED_COLUMNS.forEach((col) => {
        const value = row[col];
        rowString += `${col}:${value};`;

        if (!value || value.toString().trim() === '') {
          invalids.push({ row: rowIndex, field: col });
          issues.push(`Row ${rowIndex + 1}: "${col}" is empty.`);
        }
      });

      if (seenRows.has(rowString)) {
        issues.push(`Row ${rowIndex + 1}: Duplicate row detected.`);
      } else {
        seenRows.add(rowString);
      }
    });

    setInvalidCells(invalids);
    setWarnings([...new Set(issues)]);
    setDataPreview(data);
    setHeaders(headers);
  };

  const isCellInvalid = (rowIndex, header) =>
    invalidCells.some((cell) => cell.row === rowIndex && cell.field === header);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || warnings.length > 0 || !ptmDate) {
      alert('Please select PTM date and fix all issues before uploading.');
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('ptmDate', ptmDate);

    try {
      setUploading(true);
      const res = await axios.post(`/ptm/upload`, formData);
      setResults(res.data.results || []);
    } catch (err) {
      alert('❌ Error uploading file');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex justify-center p-8 bg-slate-50 max-h-screen overflow-auto ">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl text-center">
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">📤 PTM Report Uploader</h2>
        <p className="text-slate-500 text-sm mb-4">
          Supported formats: <code>.xlsx</code>, <code>.csv</code>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">

          {/* PTM Date Input */}
          <label className=" w-full flex justify-center text-sm text-slate-700 font-medium self-start" htmlFor="ptmDate">
            <div className='w-1/2 flex justify-start'>

            Select PTM Date:
            </div>
          </label>
          <input
            id="ptmDate"
            type="date"
            value={ptmDate}
            onChange={(e) => setPtmDate(e.target.value)}
            required
            className="border border-slate-300 rounded-md px-3 py-2 w-full max-w-sm text-sm"
          />

          {/* File Input */}
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
            className="border border-slate-300 rounded-md px-3 py-2 w-full max-w-sm text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || warnings.length > 0}
            className={`px-5 py-2 text-white rounded-md font-medium transition ${
              uploading || warnings.length > 0
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Uploading...' : 'Generate Reports'}
          </button>
        </form>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded text-left">
            <h4 className="font-semibold mb-2">⚠️ Validation Warnings:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {warnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Data preview */}
        {dataPreview.length > 0 && (
          <div className="mt-8 overflow-auto max-h-[400px] border border-gray-300 rounded">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr>
                  {headers.map((header, i) => (
                    <th key={i} className="bg-gray-100 px-2 py-1 border">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataPreview.map((row, i) => (
                  <tr key={i}>
                    {headers.map((header, j) => (
                      <td
                        key={j}
                        className={`border px-2 py-1 ${
                          isCellInvalid(i, header) ? 'bg-red-100 text-red-600' : ''
                        }`}
                      >
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Upload Results */}
        {results?.length > 0 && (
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
