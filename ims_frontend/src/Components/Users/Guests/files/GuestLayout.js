import React from "react";
import { Outlet } from "react-router-dom";
import "../css/GuestLayout.css";

export default function GuestLayout() {
  return (
    <div className="guest-layout">
      <header className="guest-header">

          <p className="title">
            Ikimina Management System
          </p>
          <p>Transparency, Savings & Collaboration</p>
      
      </header>

      <main className="guest-main-content container">
        <Outlet />
      </main>

      <footer className="guest-footer">
        <div className="container">
          <p>© 2025 Ikimina Group. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
