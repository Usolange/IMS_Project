import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../css/GuestFeaturePage.css";

export default function MemberManagement() {
  return (
    <div className="guest-feature-page">
      <header className="guest-header">
        <div className="container">
          <h3>Member Management</h3>
          <p>
            Seamlessly register, update, track, and manage every member in your
            Ikimina group.
          </p>
        </div>
      </header>

      <main className="guest-content container">
        <motion.section
          className="guest-section"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2>Key Features</h2>
          <ul className="feature-list">
            <li>📋 Register new members with full contact information</li>
            <li>🔍 Search and filter members by name, ID, type or group</li>
            <li>✏️ Edit or update member records at any time</li>
            <li>🗑️ Remove members when they leave or are inactive</li>
            <li>📎 Attach guardian info for minor or special members</li>
          </ul>
        </motion.section>

        <motion.section
          className="guest-section"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2>Benefits</h2>
          <p>
            The member management system is designed for speed, accuracy, and
            simplicity. Whether you're onboarding new users or reviewing
            details, everything is just a click away.
          </p>
          <ul className="benefits-list">
            <li>✅ Avoid paper errors and missing records</li>
            <li>✅ Track member history and changes over time</li>
            <li>✅ Integrate with financial and attendance modules</li>
          </ul>
        </motion.section>

        <motion.section
          className="guest-section"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2>How It Works</h2>
          <ol className="step-list">
            <li>
              📝 <strong>Register:</strong> Fill in name, ID, phone, email,
              group and type.
            </li>
            <li>
              🔐 <strong>Assign:</strong> Link to specific Ikimina group and
              type (e.g., active, guardian).
            </li>
            <li>
              🧾 <strong>Update:</strong> Make changes when needed — all edits
              are saved instantly.
            </li>
          </ol>
        </motion.section>

        <div className="back-home">
          <Link to="/#top-cards" className="btn-back">
            ⬅ Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
