import React from "react";
import { Outlet } from "react-router-dom";
import "../css/GuestLayout.css";

export default function GuestLayout() {
  return (
    <div className="guest-layout min-h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="guest-header">
        <p className="title">Ikimina Management System</p>
      </header>

      <div className="subtitle-wrapper">
        <p className="subtitle">Transparency, Savings & Collaboration</p>
      </div>

      {/* Main content */}
      <main className="guest-main-content container flex-1 px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="guest-footer bg-gray-100 border-t py-4 text-center text-sm text-gray-600">
        <footer className="guest-footer bg-gray-100 border-t py-4 text-center text-sm text-gray-600 w-full px-4">
          © 2025 Ikimina Group. All rights reserved.
        </footer>

      </footer>
    </div>
  );
}
