import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import axios from "../../api/axios";

const SidebarLayout = ({ children }) => {
  const location = useLocation();
  const sidebarRef = useRef(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [role, setRole] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // 👈 modal toggle

  const isReportsActive = location.pathname.startsWith("/reports");

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await axios.post(`/auth/logout`);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  // 🧠 Detect outside click to close sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isMobile = window.innerWidth < 1024;
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        isMobile
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSidebarOpen]);

  const menuItems = [
    ...(role === "Admin" ? [{ to: "/uploadForm", label: "📤 Upload" }] : []),
    ...(role === "Admin" || role === "Faculty"
      ? [
          {
            to: role === "Admin" ? "/reports" : "/facultyDashboard",
            label: "📑 Reports",
            isActive: isReportsActive,
          },
        ]
      : []),
    ...(role === "Admin"
      ? [{ to: "/uploadPhotos", label: "📷 Upload Photos" }]
      : []),
      ...(role === "Admin" ? [{ to: "/reGenerate", label: "📤 Regenerate PTM Report" }] : []),
      ...(role === "Admin" ? [{ to: "/students", label: "📤 Student PTM Report" }] : []),

  ];

  return (
    <div className="relative flex h-screen min-w-screen bg-slate-50 font-sans">
      {/* Toggle Menu Button (only on mobile when sidebar is closed) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 rounded-md shadow-md lg:hidden"
        >
          ☰ Menu
        </button>
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transform transition-transform duration-300 ease-in-out
          w-56 bg-slate-900 text-slate-100 p-6 flex flex-col justify-between
          shadow-lg h-screen fixed top-0 left-0 z-40
          lg:translate-x-0 lg:relative lg:block`}
      >
        {/* Close Button in Top-Right (only on small screens) */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 text-white text-xl lg:hidden"
        >
          ✖
        </button>

        <div className="mt-8">
          <div className="text-lg font-bold mb-8 text-sky-400 select-none">
            📁 PTM Dashboard
          </div>

          <nav>
            <ul className="space-y-2">
              {menuItems.map(({ to, label, isActive }, idx) => (
                <li key={idx}>
                  <NavLink
                    to={to}
                    className={({ isActive: navIsActive }) =>
                      `block px-3 py-2 rounded-md transition
                      focus:outline-none focus:ring-2 focus:ring-sky-400
                      ${
                        isActive || navIsActive
                          ? "bg-slate-700 text-white font-medium"
                          : "hover:bg-slate-700"
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)} // 👈 open modal
          disabled={isLoggingOut}
          className={`mt-6 px-3 py-2 rounded-md transition font-semibold
                      focus:outline-none focus:ring-2 focus:ring-red-500
                      ${
                        isLoggingOut
                          ? "bg-red-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
          aria-busy={isLoggingOut}
          aria-label="Logout"
          type="button"
        >
          {isLoggingOut ? "Logging out..." : "🚪 Logout"}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 bg-white max-w-screen overflow-auto min-h-screen ml-0  transition-all">
        {children || <p className="text-gray-500">No content available.</p>}
      </main>

      {/* 🔒 Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs   bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm Logout
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarLayout;
