import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../css/GuestFeaturePage.css";

export default function LoanManagement() {
  return (
    <div className="guest-feature-page">
      <motion.header
        className="guest-feature-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h3>🏦 Loan Management</h3>
        <p>Automate loan approvals, disbursements, and repayment tracking.</p>
      </motion.header>

      <motion.main
        className="guest-feature-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Key Capabilities</h2>
        <ul className="feature-list">
          <li>📝 Submit and approve loan requests online</li>
          <li>⏳ Track repayment schedules and dues</li>
          <li>📤 Generate notifications for overdue loans</li>
        </ul>
        <div className="back-home">
          <Link to="/" className="btn-back">⬅ Back to Home</Link>
        </div>
      </motion.main>
    </div>
  );
}
