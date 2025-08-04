import React from "react";

const DateList = ({ dates, selectedDate, onSelect }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Select Report Date
      </h3>

      <div className="flex flex-wrap gap-3">
        {dates?.map((date) => {
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

          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg border shadow-sm text-sm font-medium transition
                ${
                  isSelected
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-white text-gray-800 hover:bg-green-50 hover:border-green-400"
                }`}
            >
              <span className="font-semibold">{formattedDate}</span>
              <span className="text-xs text-gray-500">{weekday}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DateList;
