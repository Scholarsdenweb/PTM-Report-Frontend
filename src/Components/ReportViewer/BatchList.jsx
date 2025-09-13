import React from "react";

// Generate soft pastel color based on index
const getLightColorByIndex = (index) => {
  const hue = (index * 47) % 360; // Spread hues using prime number
  const saturation = 60;
  const lightness = 95;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const BatchList = ({ batches, selectedBatch, onSelect }) => {
  const hasBatches = batches && batches.length > 0;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Select Batch</h3>

      {hasBatches ? (
        <div className="flex flex-wrap gap-4">
          {batches.map((batch, index) => {
            const isSelected = batch === selectedBatch;
            const bgColor = getLightColorByIndex(index);

            return (
              <div
                key={batch}
                className={`flex-1 min-w-[150px] max-w-[200px] text-center rounded-lg p-4 cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? "border-2 border-blue-600 shadow-md"
                    : "border border-gray-200 hover:border-blue-400"
                }`}
                onClick={() => onSelect(batch)}
                style={{ backgroundColor: bgColor }}
              >
                <p className="text-md font-medium text-gray-800">{batch}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg text-gray-500 bg-gray-50">
          <svg
            className="w-12 h-12 mb-3 text-gray-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V7a2 2 0 00-2-2h-1V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v1H6a2 2 0 00-2 2v6m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4"
            />
          </svg>
          <p className="text-sm">No batches available</p>
        </div>
      )}
    </div>
  );
};

export default BatchList;
