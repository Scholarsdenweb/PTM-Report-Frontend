import React from "react";
import { NavLink } from "react-router-dom";

const SidebarLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className="w-56 bg-slate-900 text-slate-100 p-6 flex flex-col">
        <div className="text-lg font-bold mb-8 text-sky-400">
          📁 PTM Dashboard
        </div>
        <nav className="flex-grow">
          <ul className="space-y-2">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition ${
                    isActive
                      ? "bg-slate-700 text-white font-medium"
                      : "hover:bg-slate-700"
                  }`
                }
              >
                🏠 Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/uploadForm"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition ${
                    isActive
                      ? "bg-slate-700 text-white font-medium"
                      : "hover:bg-slate-700"
                  }`
                }
              >
                📤 Upload
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition ${
                    isActive
                      ? "bg-slate-700 text-white font-medium"
                      : "hover:bg-slate-700"
                  }`
                }
              >
                📑 Reports
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 p-8 bg-white">{children}</main>
    </div>
  );
};

export default SidebarLayout;
