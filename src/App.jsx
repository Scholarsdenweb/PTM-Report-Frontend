import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Loading from "../utils/Loading";

import UploadForm from "./Components/UploadForm";
import LoginForm from "./Components/LoginForm";
import SidebarLayout from "./Components/SidebarLayout";
import axios from "../api/axios";
import AdminReportViewer from "./Components/AdminReportViewer";
import BulkPhotoUploader from "./Components/BulkPhotoUploader";
import { getCookie } from "../utils/getCookie";
import FacultyDashboard from "./Components/FacultyDashboard";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = loading
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("/auth/me"); // gets user from cookie
        console.log("res from chechAuth", res);
        setUser(res.data);
        setIsLoggedIn(true);
      } catch (err) {
        console.log("error", err);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    console.log("isLoggedIn", isLoggedIn);
  }, [isLoggedIn]);

  if (isLoggedIn === null) {
    return (
      <div className="flex justify-center items-center h-screen text-slate-600">
        <Loading />
      </div>
    );
  }

  // const role = getCookie("role");
  const role = localStorage.getItem("role");

  const tokenFormCookie = getCookie("token");
  console.log("role", role);
  console.log("tokenFormCookie", tokenFormCookie);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              role === "Faculty" ? (
                <Navigate to="/reports" />
              ) : (
                <Navigate to="/uploadForm" />
              )
            ) : (
              <LoginForm
                onLogin={(userData) => {
                  setIsLoggedIn(true);
                  setUser(userData);
                }}
              />
            )
          }
        />

        <Route
          path="/uploadForm"
          element={
            isLoggedIn ? (
              <SidebarLayout>
                <UploadForm />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/facultyDashboard"
          element={
            <SidebarLayout>
          

              <AdminReportViewer />
        
            </SidebarLayout>
          }
        />

        <Route
          path="/uploadPhotos"
          element={
            isLoggedIn ? (
              <SidebarLayout>
                <BulkPhotoUploader />
              </SidebarLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/reports"
          element={
            <SidebarLayout>
              <AdminReportViewer />
            </SidebarLayout>
          }
        />

        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? role==="Admin" ? "/uploadForm" : "/reports" : "/login"} />}
        />

        <Route
          path="/reports"
          element={
            <SidebarLayout>
              <AdminReportViewer />
            </SidebarLayout>
          }
        />
        {/* <Route
          path="/faculty/reports"
          element={
            <SidebarLayout>
              <AdminReportViewer />
            </SidebarLayout>
          }
        /> */}

        <Route
          path="/reports/:batchId"
          element={
            <SidebarLayout>
              <AdminReportViewer />
            </SidebarLayout>
          }
        />
        <Route
          path="/reports/:batchId/:date"
          element={
            <SidebarLayout>
              <AdminReportViewer />
            </SidebarLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
