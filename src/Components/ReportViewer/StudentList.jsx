import React from "react";

// Generate a unique light pastel color based on index
const getLightColorByIndex = (index) => {
  const hue = (index * 47) % 360; // spread hues
  const saturation = 60; // soft pastel
  const lightness = 97; // very light
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const StudentList = ({ students, selectedStudent, onSelect }) => {
  const hasStudents = students && students.length > 0;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Select Student
      </h3>

      {hasStudents ? (
        <div className="flex flex-wrap gap-4">
          {students.map((student, index) => {
            const isSelected = student === selectedStudent;
            const profilePic =
              student.photoUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                student.name
              )}&background=cccccc&color=ffffff&size=128`;
            const bgColor = getLightColorByIndex(index);

            return (
              <div
                key={student._id}
                className={`flex-1 min-w-[200px] max-w-[250px] cursor-pointer transition-all duration-200 rounded-lg p-4 text-center border ${
                  isSelected
                    ? "border-2 border-blue-600 shadow-md"
                    : "border border-gray-200 hover:border-blue-400"
                }`}
                onClick={() => onSelect(student)}
                style={{ backgroundColor: bgColor }}
              >
                {/* Profile Picture */}
                <img
                  src={profilePic}
                  alt={student.name}
                  className="w-16 h-16 mx-auto rounded-full mb-3 object-cover"
                />

                {/* Name */}
                <h4 className="text-md font-semibold text-gray-900">
                  {student.name}
                </h4>

                {/* Roll Number */}
                <p className="text-sm text-gray-600">
                  Roll No: {student.rollNo}
                </p>
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
              d="M12 14l9-5-9-5-9 5 9 5zm0 0v7"
            />
          </svg>
          <p className="text-sm">No students available</p>
        </div>
      )}
    </div>
  );
};

export default StudentList;
