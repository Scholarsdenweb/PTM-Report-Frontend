// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ isLoggedIn, userRole, allowedRoles, children }) => {
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/reports" />; // fallback if role not allowed
  }

  return children;
};

export default ProtectedRoute;
