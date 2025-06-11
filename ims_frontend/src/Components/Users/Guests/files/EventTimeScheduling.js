import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../css/GuestFeaturePage.css";

export default function EventTimeScheduling() {
  return (
    <div className="guest-feature-page">
      <motion.header
        className="guest-feature-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h3>⏰ Event Time Scheduling</h3>
        <p>Define and manage saving schedules by frequency (daily, weekly, monthly).</p>
      </motion.header>

      <motion.main
        className="guest-feature-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Key Capabilities</h2>
        <ul className="feature-list">
          <li>🗓️ Set up daily, weekly, or monthly event times</li>
          <li>⏱️ Define deadlines and attendance cutoffs</li>
          <li>🔔 Integrate event reminders with notifications</li>
        </ul>
        <div className="back-home">
          <Link to="/" className="btn-back">⬅ Back to Home</Link>
        </div>
      </motion.main>
    </div>
  );
}
