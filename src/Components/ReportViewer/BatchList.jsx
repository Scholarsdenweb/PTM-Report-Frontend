// BatchList.jsx
import React from "react";

const BatchList = ({ batches, selectedBatch, onSelect }) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Select Batch</h3>
      <div className="flex flex-wrap gap-2">
        {batches.map((batch) => (
          <button
            key={batch}
            onClick={() => onSelect(batch)}
            className={`px-4 py-2 rounded-xl shadow text-sm font-medium transition-all duration-200 text-white
              ${batch === selectedBatch ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-blue-100"}`}
          >
            {batch}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BatchList;