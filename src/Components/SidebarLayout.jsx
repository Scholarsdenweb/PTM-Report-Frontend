import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { getCookie } from "../../utils/getCookie"; // Adjust import as needed

const SidebarLayout = ({ children }) => {
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [role, setRole] = useState(null);

  const isReportsActive = location.pathname.startsWith("/reports");

  useEffect(() => {
    const roleFromCookie = getCookie("role");
    console.log("rolrFromCookie", roleFromCookie )
    setRole(roleFromCookie);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await axios.post(`/auth/logout`);
      window.location.href = "/login"; // full reload to clear state & cookies
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  // const navigate = useNavigate();
// 
//   const handleLogout = async () => {
//   // Remove both cookies
//   document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; ";
//   document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None;";

//   // Redirect
//   navigate("/");
// };


  useEffect(() => {
    console.log("role form sidebar", role);
  }, [role]);

  // Define role-based menu items
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
  ];

  return (
    <div className="flex min-h-screen max-w-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside
        className="w-56 bg-slate-900 text-slate-100 p-6 flex flex-col justify-between
                   shadow-lg
                   h-screen
                   sticky top-0"
      >
        <div>
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
          onClick={handleLogout}
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
      <main className="flex-1 p-8 bg-white min-h-screen">
        {children || <p className="text-gray-500">No content available.</p>}
      </main>
    </div>
  );
};

export default SidebarLayout;
