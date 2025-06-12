import React, { useState } from "react";
import { Link } from "react-router-dom";
import Modal from "./Modal";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import Login from "../Auth/Login";
import { motion } from "framer-motion";
import "../CSS/Home.css";

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);

  const openModal = (type) => {
    setModalContent(type);
    setIsModalOpen(true);
    if (type === "login") setShowWelcomeOverlay(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setShowWelcomeOverlay(false);
  };

  // helper to create a URL slug
  const toSlug = (str) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const featureCards = [
    { title: "Member Management", desc: "Onboard, edit and manage members effortlessly." },
    { title: "Financial Management", desc: "Track contributions, loans and repayments in real‑time." },
    { title: "Fraud Detection", desc: "Detect anomalies and safeguard group funds." },
    { title: "Reporting & Analytics", desc: "Generate insightful charts and downloadable reports." },
    { title: "Loan Management", desc: "Automate loan prediction, approval and repayment tracking." },
    { title: "Event Time Scheduling", desc: "Define and manage schedules for Ikimina events by frequency." },
  ];

  return (
    <div className="home-container">
      {/* ---------- HEADER ---------- */}
      <header className="header shadow-sm">
        <div className="container header-wrapper">
          <h1 className="logo">
            <a href="#welcome">IMS&nbsp;</a>
          </h1>

          <nav className="nav-links">
            <a href="#welcome">Home</a>
            <a href="#about">About</a>
            <a href="#top-cards">Features</a>
            <a href="#modules">Additional</a>
          </nav>
        </div>
      </header>

      {/* ---------- MAIN CONTENT ---------- */}
      <main className="main-content">
        {/* HERO – WELCOME CARD */}
        <section id="welcome" className="section hero-section">
          <div className="container">
            <div className="welcome-card">
              <h1>
                Welcome to&nbsp;
                <span className="highlight">Ikimina Management System</span>
              </h1>
              <p>Manage your members, reports and finances with ease.</p>

              <div className="action-buttons">
                <button className="form-button" onClick={() => openModal("login")}>
                  Login
                </button>
                <button className="form-button green" onClick={() => openModal("register")}>
                  Register
                </button>
              </div>

              <p className="forgot-link">
                Forgot password?{" "}
                <button className="form-link" onClick={() => openModal("forgot-password")}>
                  Reset it here
                </button>
              </p>
            </div>
          </div>
        </section>

        {/* FEATURE CARD GRID */}
        <section id="top-cards" className="section animated-cards-section">
          <div className="container">
            <motion.div
              className="cards-grid"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
            >
              {featureCards.map((card) => (
                <motion.div
                  key={card.title}
                  className="card-item"
                  variants={{
                    hidden: { opacity: 0, y: 40 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <h2>{card.title}</h2>
                  <p>{card.desc}</p>
                  <Link
                    to={`/guest/${toSlug(card.title)}`}
                    className="card-btn"
                  >
                    Explore&nbsp;➜
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="section about-section">
          <h3>About the Project</h3>
          <p>
            The Ikimina Management System (IMS) streamlines community-based savings and lending groups with powerful modules, fraud protection, and mobile access — all within a clean, intuitive interface.
            It eliminates human error, enhances transparency, and automates everything from member registration to loan approvals and real-time financial reporting.
          </p>
        </section>


        {/* ADDITIONAL MODULES */}
        <section id="modules" className="section features-section">
          <div className="container">
            <h3>Additional Modules</h3>
            <div className="features-grid">
              {["Mobile Access", "Notification System", "API Integration"].map((f) => (
                <div className="feature-card" key={f}>
                  <h4>{f}</h4>
                  <p>
                    {f} ensures flexibility, real‑time alerts and seamless
                    integration with existing ecosystems.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="footer">
        <div className="container">
          © {new Date().getFullYear()} Ikimina&nbsp;IMS. All rights reserved.
        </div>
      </footer>

      {/* ---------- WELCOME OVERLAY ---------- */}
      {showWelcomeOverlay && (
        <div className="welcome-overlay" onClick={closeModal}>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Welcome to&nbsp;<span className="highlight">Ikimina Admin</span>
          </motion.h2>
        </div>
      )}



      {/* ---------- MODALS ---------- */}


      <Modal isOpen={isModalOpen} closeModal={closeModal}>
        {modalContent === "login" && (
          <Login
            switchToRegister={() => setModalContent("register")}
            onCancel={closeModal}
          />
        )}
        {modalContent === "register" && (
          <Register
            switchToLogin={() => setModalContent("login")}
            onCancel={closeModal}
          />
        )}
        {modalContent === "forgot-password" && (
          <ForgotPassword onCancel={closeModal} />
        )}
      </Modal>

    </div>
  );
}
