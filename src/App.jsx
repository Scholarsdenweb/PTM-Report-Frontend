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
// import { getCookie } from "../utils/getCookie";
import FacultyDashboard from "./Components/FacultyDashboard";
import StudentReport from "./Components/ReportViewer/StudentReport";
import BatchWiseStudentList from "./Components/ReportViewer/BatchWiseStudentList";
import ShowAllResultOfStudent from "./Components/ReportViewer/ShowAllResultOfStudent";
import SendWhatsappMessage from "./Components/SendWhatsappMessage";
import GlobalProgressBar from "./Components/GlobalProgressBar";
import { ProgressProvider } from "./context/ProgressContext";

// NEW: Protected route wrapper
const ProtectedRoute = ({ isLoggedIn, userRole, allowedRoles, children }) => {
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (!allowedRoles.includes(userRole)) return <Navigate to="/reports" />;
  return children;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = loading
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("/auth/me");
        setUser(res.data);
        setIsLoggedIn(true);
      } catch (err) {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  const role = localStorage.getItem("role");

  if (isLoggedIn === null) {
    return (
      <div className="flex justify-center items-center h-screen text-slate-600">
        <Loading />
      </div>
    );
  }

  return (
        <ProgressProvider>

    <Router>
      <Routes>
        {/* Login */}
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

        {/* Admin-only routes */}
        <Route
          path="/uploadForm"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userRole={role}
              allowedRoles={["Admin"]}
            >
              <SidebarLayout>
                <UploadForm  />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/uploadPhotos"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userRole={role}
              allowedRoles={["Admin"]}
            >
              <SidebarLayout>
                <BulkPhotoUploader />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reGenerate"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userRole={role}
              allowedRoles={["Admin"]}
            >
              <SidebarLayout>
                <UploadForm type="regenerate" />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />

        {/* Faculty-only route */}
        <Route
          path="/facultyDashboard"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userRole={role}
              allowedRoles={["Faculty"]}
            >
              <SidebarLayout>
                <FacultyDashboard />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />

        {/* Shared routes (Admin + Faculty) */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userRole={role}
              allowedRoles={["Admin", "Faculty"]}
            >
              <SidebarLayout>
                <AdminReportViewer />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/:batchId"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userRole={role}
              allowedRoles={["Admin", "Faculty"]}
            >
              <SidebarLayout>
                <AdminReportViewer />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/:batchId/:date"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userRole={role}
              allowedRoles={["Admin", "Faculty"]}
            >
              <SidebarLayout>
                <AdminReportViewer />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userRole={role}
              allowedRoles={["Admin", "Faculty"]}
            >
              <SidebarLayout>
                <StudentReport />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/:batchId"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userRole={role}
              allowedRoles={["Admin", "Faculty"]}
            >
              <SidebarLayout>
                <BatchWiseStudentList />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/:batchId/:rollNo"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userRole={role}
              allowedRoles={["Admin", "Faculty"]}
            >
              <SidebarLayout>
                <ShowAllResultOfStudent />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/send-whatsapp-message"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userRole={role}
              allowedRoles={["Admin", "Faculty"]}
            >
              <SidebarLayout>
                <SendWhatsappMessage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/send-whatsapp-message/:batchId"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userRole={role}
              allowedRoles={["Admin", "Faculty"]}
            >
              <SidebarLayout>
                <SendWhatsappMessage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
                <Route
          path="/send-whatsapp-message/:batchId/:date"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              userRole={role}
              allowedRoles={["Admin", "Faculty"]}
            >
              <SidebarLayout>
                <SendWhatsappMessage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />


        {/* Catch-all redirect */}
        <Route
          path="*"
          element={
            isLoggedIn ? (
              role === "Admin" ? (
                <Navigate to="/uploadForm" />
              ) : (
                <Navigate to="/reports" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
          <GlobalProgressBar />

        </ProgressProvider>

  );
}

export default App;
