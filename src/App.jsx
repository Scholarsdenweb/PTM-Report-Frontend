import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import UploadForm from './Components/UploadForm';
import LoginForm from './Components/LoginForm';
import SidebarLayout from './Components/SidebarLayout';
import axios from '../api/axios';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = loading
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/auth/me'); // gets user from cookie
        setUser(res.data);
        setIsLoggedIn(true);
      } catch (err) {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoggedIn === null) {
    return (
      <div className="flex justify-center items-center h-screen text-slate-600">
        Checking session...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/uploadForm" />
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
          path="*"
          element={<Navigate to={isLoggedIn ? "/uploadForm" : "/login"} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
