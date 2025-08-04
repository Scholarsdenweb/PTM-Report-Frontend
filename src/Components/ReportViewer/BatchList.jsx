import React from "react";

const BatchList = ({ batches, selectedBatch, onSelect }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Select Batch
      </h3>

      <div className="flex flex-wrap gap-3">
        {batches?.map((batch) => {
          const isSelected = batch === selectedBatch;

          return (
            <button
              key={batch}
              onClick={() => onSelect(batch)}
              className={`px-5 py-2 rounded-lg border text-sm font-medium shadow-sm transition-all duration-200
                ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-800 hover:bg-blue-50 hover:border-blue-400"
                }`}
            >
              {batch}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BatchList;
