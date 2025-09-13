
import React from "react";

// Generate soft pastel color based on index
const getLightColorByIndex = (index) => {
  const hue = (index * 47) % 360;
  const saturation = 60;
  const lightness = 95;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const DateList = ({ dates, selectedDate, onSelect }) => {
  const hasDates = dates && dates.length > 0;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Select Report Date
      </h3>

      {hasDates ? (
        <div className="flex flex-wrap gap-4">
          {dates.map((date, index) => {
            const dateObj = new Date(date);

            const formattedDate = dateObj.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            const weekday = dateObj.toLocaleDateString(undefined, {
              weekday: "short",
            });

            const isSelected = date === selectedDate;
            const bgColor = getLightColorByIndex(index);

            return (
              <div
                key={date}
                onClick={() => onSelect(date)}
                className={`flex flex-col items-center justify-center text-center p-4 rounded-lg cursor-pointer transition-all duration-200 border text-sm font-medium min-w-[150px] max-w-[200px]
                  ${
                    isSelected
                      ? "border-2 border-green-600 shadow-md"
                      : "border border-gray-200 hover:border-green-400"
                  }`}
                style={{ backgroundColor: bgColor }}
              >
                <span className="text-base font-semibold text-gray-900">
                  {formattedDate}
                </span>
                <span className="text-xs text-gray-600">{weekday}</span>
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
              d="M8 7V3m8 4V3m-9 8h10m-12 9h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm">No report dates available</p>
        </div>
      )}
    </div>
  );
};

export default DateList;
