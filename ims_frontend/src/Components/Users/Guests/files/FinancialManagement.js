import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../css/GuestFeaturePage.css";

export default function FinancialManagement() {
  return (
    <motion.div
      className="guest-feature-page"   // changed here
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <header className="guest-feature-header">  {/* changed here */}
        <h3>Financial Management</h3>
        <p>Track contributions, loans, and repayments in real‑time.</p>
      </header>

      <main className="guest-feature-content">  {/* changed here */}
        <h2>What You Can Do</h2>
        <ul className="feature-list"> {/* add this for consistent bullet styling */}
          <li>💰 Monitor individual and group savings</li>
          <li>📊 View financial summaries and trends</li>
          <li>🔄 Sync contributions with member accounts</li>
        </ul>
        <div className="back-home">
          <Link to="/#top-cards" className="btn-back">
            ⬅ Back to Home
          </Link>
        </div>
      </main>
    </motion.div>
  );
}
