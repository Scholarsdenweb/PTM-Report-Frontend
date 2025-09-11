import React from "react";

const StudentList = ({ students, selectedStudent, onSelect }) => {
  console.log("Students from studentBatch", students);
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Select Student
      </h3>

      <div className="flex flex-wrap gap-3  ">
        {students?.map((student) => {
          const isSelected = student === selectedStudent;

          return (
            <button
              key={student._id}
              onClick={() => onSelect(student)}
              className={` w-1/4 justify-center items-center rounded-lg border text-sm font-medium shadow-sm transition-all duration-200
                ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-800 hover:bg-blue-50 hover:border-blue-400"
                }`}
            >
              {student.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StudentList;
