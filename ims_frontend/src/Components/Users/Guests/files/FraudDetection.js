import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function FraudDetection() {
  return (
    <div className="guest-feature-page">
      <motion.header
        className="guest-feature-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>🛡️ Fraud Detection</h1>
        <p>Detect anomalies, irregular transactions, and protect group funds.</p>
      </motion.header>

      <motion.main
        className="guest-feature-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Key Capabilities</h2>
        <ul className="feature-list">
          <li>🔍 Monitor suspicious contribution patterns</li>
          <li>⚠️ Receive alerts for financial inconsistencies</li>
          <li>📜 Maintain a history of flagged activities</li>
        </ul>
        <div className="back-home">
          <Link to="/" className="btn-back">⬅ Back to Home</Link>
        </div>
      </motion.main>
    </div>
  );
}
