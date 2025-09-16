import React, { useState, useEffect } from "react";

const RollNoFilter = ({
  value,
  onChange,
  placeholder = "Enter Roll No",
  debounceDelay = 300, // milliseconds
}) => {
  const [inputValue, setInputValue] = useState(value || "");

  // Update internal input when external value changes
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(inputValue);
    }, debounceDelay);

    return () => clearTimeout(handler); // cleanup if user keeps typing
  }, [inputValue]);

  return (
    <div className="w-full sm:w-64">
      <label className="block text-sm font-bold  text-gray-700 mb-1">
        Search By Roll No
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
    </div>
  );
};

export default RollNoFilter;
