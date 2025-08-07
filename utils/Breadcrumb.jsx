// src/components/Breadcrumb.js
import React from "react";
import { Link, useLocation } from "react-router-dom";

const Breadcrumb = () => {
  const location = useLocation();

  // Split the current path into segments
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav className="text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
      <ol className="list-none p-0 inline-flex space-x-1">
        <li>
          <Link to="/" className="text-blue-600 hover:underline">
            🏠 Home
          </Link>
        </li>

        {pathnames.map((segment, index) => {
          const routeTo = "/" + pathnames.slice(0, index + 1).join("/");
          const isLast = index === pathnames.length - 1;
          const label = decodeURIComponent(segment);

          return (
            <li key={routeTo} className="flex items-center space-x-1">
              <span>/</span>
              {isLast ? (
                <span className="text-gray-500">{label}</span>
              ) : (
                <Link to={routeTo} className="text-blue-600 hover:underline">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
