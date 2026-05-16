// import React from "react";

// // Generate soft pastel color based on index
// const getLightColorByIndex = (index) => {
//   const hue = (index * 47) % 360; // Spread hues using prime number
//   const saturation = 60;
//   const lightness = 95;
//   return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
// };

// const BatchList = ({ batches, selectedBatch, onSelect }) => {
//   const hasBatches = batches && batches.length > 0;

//   return (
//     <div className="mb-6">
//       <h3 className="text-lg font-semibold mb-3 text-gray-800">Select Batch</h3>

//       {hasBatches ? (
//         <div className="flex flex-wrap gap-4">
//           {batches.map((batch, index) => {
//             const isSelected = batch === selectedBatch;
//             const bgColor = getLightColorByIndex(index);

//             return (
//               <div
//                 key={batch}
//                 className={`flex-1 min-w-[150px] max-w-[200px] text-center rounded-lg p-4 cursor-pointer transition-all duration-200 border ${
//                   isSelected
//                     ? "border-2 border-blue-600 shadow-md"
//                     : "border border-gray-200 hover:border-blue-400"
//                 }`}
//                 onClick={() => onSelect(batch)}
//                 style={{ backgroundColor: bgColor }}
//               >
//                 <p className="text-md font-medium text-gray-800">{batch}</p>
//               </div>
//             );
//           })}
//         </div>
//       ) : (
//         <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg text-gray-500 bg-gray-50">
//           <svg
//             className="w-12 h-12 mb-3 text-gray-300"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="1.5"
//             viewBox="0 0 24 24"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               d="M20 13V7a2 2 0 00-2-2h-1V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v1H6a2 2 0 00-2 2v6m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4"
//             />
//           </svg>
//           <p className="text-sm">No batches available</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default BatchList;

import React from "react";

const normalizeKey = (value) => String(value || "").trim().toLowerCase();

const getBatchLabel = (batch) => {
  if (typeof batch === "object" && batch !== null) {
    return batch.batch || batch.name || batch.label || "";
  }
  return batch;
};

const getBatchEmbeddedStats = (batch) => {
  if (typeof batch !== "object" || batch === null) return null;
  return batch.stats || batch;
};

// Generate soft pastel color based on index
const getLightColorByIndex = (index) => {
  const hue = (index * 47) % 360; // Spread hues using prime number
  const saturation = 60;
  const lightness = 95;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const BatchList = ({ batches, selectedBatch, selected, onSelect, batchStats = [] }) => {
  const hasBatches = batches && batches.length > 0;
  const selectedValue = selectedBatch || selected;
  const hasStats = batchStats.length > 0 || batches.some((batch) => {
    const stats = getBatchEmbeddedStats(batch);
    return stats?.reportCount !== undefined || stats?.studentCount !== undefined;
  });
  const statsByBatch = new Map(
    batchStats
      .filter((item) => item?.batch)
      .map((item) => [normalizeKey(item.batch), item])
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Select Batch</h3>
          <p className="text-sm text-slate-500">
            {hasBatches ? `${batches.length} batches with generated reports` : "No generated reports yet"}
          </p>
        </div>
      </div>

      {hasBatches ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {batches.map((batch, index) => {
            const batchLabel = getBatchLabel(batch);
            const isSelected = batchLabel === selectedValue;
            const bgColor = getLightColorByIndex(index);
            const embeddedStats = getBatchEmbeddedStats(batch);
            const stats = statsByBatch.get(normalizeKey(batchLabel)) || embeddedStats;
            const statsReady = Boolean(
              stats?.reportCount !== undefined || stats?.studentCount !== undefined
            );
            const studentCount = Number(stats?.studentCount || 0);

            return (
              <button
                type="button"
                key={batchLabel}
                className={`flex min-h-28 w-full flex-col justify-between rounded-lg border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200 sm:min-h-32 ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-100"
                    : "border-gray-200 hover:border-blue-400"
                }`}
                onClick={() => onSelect(batchLabel)}
                style={{ backgroundColor: bgColor }}
              >
                <p className="break-words text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                  {batchLabel}
                </p>
                {hasStats && statsReady ? (
                  <p className="mt-4 text-xs font-medium text-slate-500 sm:text-sm">
                    {studentCount} students
                  </p>
                ) : (
                  <p className="mt-4 text-xs font-medium text-slate-500 sm:text-sm">
                    Counts loading...
                  </p>
                )}
              </button>
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
