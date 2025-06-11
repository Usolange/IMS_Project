import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../css/GuestFeaturePage.css";

export default function ReportingAnalytics() {
  return (
    <div className="guest-feature-page">
      <motion.header
        className="guest-feature-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="guest-feature-title">📊 Reporting & Analytics</p>
        <p  className="guest-feature-sub-title">Generate reports and analyze group performance and trends.</p>
      </motion.header>

      <motion.main
        className="guest-feature-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Key Capabilities</h2>
        <ul className="feature-list">
          <li>📈 View charts of member contributions and savings</li>
          <li>🧾 Download printable PDF or Excel reports</li>
          <li>📅 Filter data by date range, frequency, or group</li>
        </ul>
        <div className="back-home">
          <Link to="/" className="btn-back">⬅ Back to Home</Link>
        </div>
      </motion.main>
    </div>
  );
}
