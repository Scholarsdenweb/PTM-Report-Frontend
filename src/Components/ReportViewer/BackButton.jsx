// BackButton.jsx
import React from "react";
import { ArrowLeft } from "lucide-react";

const BackButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-white hover:text-black"
    >
      <ArrowLeft size={16} /> Back
    </button>
  );
};

export default BackButton;
