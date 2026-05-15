import axios from "../../../api/axios";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentList from "./StudentList";
import Breadcrumb from "../../../utils/Breadcrumb";
import Loading from "../../../utils/Loading";
import { getCookie } from "../../../utils/getCookie";
import BackButton from "./BackButton";
import RollNoFilter from "../../../utils/Filters/RollNoFilter";

const BatchWiseStudentList = () => {
  const { batchId } = useParams();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterValue, setFilterValue] = useState();

  const navigate = useNavigate();

  const handleStudentSelect = (student) => {
    console.log("Student from handleStudentSelect", student);
    console.log("Student from handleStudentSelect", student.rollNo);
    navigate(`/students/${batchId}/${student.rollNo}`);
  };

  // const handleFilterValue = (data) => {
  //   console.log("data from handleFilterValue ", data);

  // };

  const fetchStudentByBatch = useCallback(async () => {
    const response = await axios.post("/students/student-by-batch", {
      batch: batchId,
    });

    console.log("response from fetchStudentByBatch", response);
    setStudents(response.data.student);
  }, [batchId]);

  const handleFilterValue = useCallback(
    async (rollNo) => {
      setFilterValue(rollNo);

      if (!rollNo || rollNo.trim() === "") {
        await fetchStudentByBatch();
        return;
      }

      try {
        setLoading(true);

        const response = await axios.get("/students/search", {
          params: {
            batch: batchId,
            rollNo: rollNo.trim(),
          },
        });

        console.log("Filtered students:", response.data);
        setStudents(response.data.students || []);
      } catch (err) {
        console.error("Error filtering students:", err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    },
    [batchId, fetchStudentByBatch]
  );

  const handleBack = () => {
    if (batchId) navigate(`/students`);
  };

useEffect(() => {
  if (batchId) {
    fetchStudentByBatch();
  }
}, [batchId, fetchStudentByBatch]);


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
      <div className="flex justify-between items-start">
        {batchId && (
          <div className="mb-4">
            <BackButton onClick={handleBack} />
          </div>
        )}

        {/* Filter By RollNo */}

        <RollNoFilter
          value={filterValue}
          onChange={handleFilterValue}
          debounceDelay={300}
        />
      </div>

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
