import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function FinancialManagement() {
  return (
    <motion.div
      className="Financialguest-feature-page"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <header className="Financialguest-header">
        <h3>Financial Management</h3>
        <p>Track contributions, loans, and repayments in real‑time.</p>
      </header>

      <main className="Financialguest-content">
        <h2>What You Can Do</h2>
        <ul>
          <li>💰 Monitor individual and group savings</li>
          <li>📊 View financial summaries and trends</li>
          <li>🔄 Sync contributions with member accounts</li>
        </ul>
        <div className="back-home">
          <Link to="/" className="btn-back">
            ⬅ Back to Home
          </Link>
        </div>
      </main>
    </motion.div>
  );
}
