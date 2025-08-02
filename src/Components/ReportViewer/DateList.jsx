import React from "react";

const DateList = ({ dates, selectedDate, onSelect }) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Select Date</h3>
      <div className="flex flex-wrap gap-2">
        {dates.map((date) => {
          const formatted = new Date(date).toLocaleDateString();
          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              className={`px-4 py-2 rounded-xl shadow text-sm font-medium transition-all duration-200 text-white
                ${date === selectedDate ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-green-100"}`}
            >
              {formatted}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DateList;