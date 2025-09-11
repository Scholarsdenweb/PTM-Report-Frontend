import axios from "../../../api/axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentList from "./StudentList";
import Breadcrumb from "../../../utils/Breadcrumb";
import Loading from "../../../utils/Loading";
import { getCookie } from "../../../utils/getCookie";
import BackButton from "./BackButton";

const BatchWiseStudentList = () => {
  const { batchId } = useParams();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleStudentSelect = (student) => {
    console.log("Student from handleStudentSelect", student);
    console.log("Student from handleStudentSelect", student.rollNo);
    navigate(`/students/${batchId}/${student.rollNo}`);
  };

  const fetchStudentByBatch = async () => {
    const response = await axios.post("/students/student-by-batch", {
      batch: batchId,
    });

    console.log("response from fetchStudentByBatch", response);
    setStudents(response.data.student);
  };

  const handleBack = () => {
    if (batchId) navigate(`/students`);
  };

  useEffect(() => {
    console.log("batchId batchWiseStudentList", batchId);
    fetchStudentByBatch();
  }, []);

  const role = getCookie("role");

  //   return (
  //     <div>
  //       <StudentList students={students} onSelect={handleStudentSelect} />
  //     </div>
  //   );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {loading && (
        <div className="fixed inset-0 bg-white/60 flex items-center justify-center z-50">
          <Loading />
        </div>
      )}

      <Breadcrumb />

      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
        {role} Report Viewer
      </h2>

      {batchId && (
        <div className="mb-4">
          <BackButton onClick={handleBack} />
        </div>
      )}

      {/* Step 1: Batch Selection */}
      {batchId && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          {/* <BatchList
            batches={batches}
            onSelect={handleBatchSelect}
            selected={batchId}
          /> */}

          <StudentList students={students} onSelect={handleStudentSelect} />
        </div>
      )}

      {/* Step 2: Date Selection */}
    </div>
  );
};

export default BatchWiseStudentList;
