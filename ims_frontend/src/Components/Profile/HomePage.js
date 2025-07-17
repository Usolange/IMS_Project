import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Modal from "./Modal";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import Login from "../Auth/Login";
import { motion } from "framer-motion";
import '../CSS/Home.css';

// ScrollToHash component outside HomePage to handle scroll on hash change
export function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return null;
}

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

  const toSlug = (str) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const featureCards = [
    { title: "Member Management", desc: "Onboard, edit and manage members effortlessly.", emoji: "👥" },
    { title: "Financial Management", desc: "Track contributions, loans and repayments in real‑time.", emoji: "💰" },
    { title: "Fraud Detection", desc: "Detect anomalies and safeguard group funds.", emoji: "🛡️" },
    { title: "Reporting & Analytics", desc: "Generate insightful charts and downloadable reports.", emoji: "📊" },
    { title: "Loan Management", desc: "Automate loan prediction, approval and repayment tracking.", emoji: "📋" },
    { title: "Event Time Scheduling", desc: "Define and manage schedules for Ikimina events by frequency.", emoji: "⏰" },
  ];

  const additionalModules = ["Mobile Access", "Notification System", "API Integration"];

  return (
    <div className="home-page">
      <ScrollToHash />

      {/* ---------- HEADER ---------- */}
      <header className="header fixed top-0 left-0 right-0 bg-white shadow z-50">
        <div className="header-wrapper w-full flex justify-between items-center py-4 px-6">
          <h1 className="logo">
            <a href="#welcome">IMS</a>
          </h1>
          <nav className="nav-links">
            <a href="#welcome">Home</a>
            <a href="#about">About</a>
            <a href="#top-cards">Features</a>
            <a href="#modules">Additional</a>
          </nav>
        </div>
      </header>

      <main className="main-content pt-24">

        {/* HERO – WELCOME CARD */}
        <section id="welcome" className="section hero-section w-full px-6">
          <h1 className="welcome-title">
            Welcome to&nbsp;
            <span className="highlight">Ikimina Management System</span>
          </h1>
          <div className="welcome-card mx-auto max-w-lg text-center">
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
        </section>


        {/* === ABOUT SECTION === */}
        <section id="about" className="section animated-cards-section w-full px-6 text-center">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-2xl sm:text-3xl font-semibold mb-8">About the Project</h3>
           <p className="text-gray-700 text-base leading-relaxed">
  The <strong>Ikimina Management System (IMS)</strong> streamlines community-based savings and lending groups with powerful modules,
   <br /><br />
   Fraud protection, and mobile access all within a clean, intuitive interface.
  <br /><br />
  It eliminates human error, enhances transparency, and automates everything from member registration to loan approvals and 
   <br /><br />
  Real-time financial reporting.
</p>

          </div>

        </section>
        {/* SYSTEM FEATURES */}
        <section id="top-cards" className="section animated-cards-section w-full px-6 text-center">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-8">System Features</h3>

          <motion.div
            className="cards-grid max-w-7xl mx-auto grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          >
            {featureCards.map((card) => (
              <motion.div
                key={card.title}
                className="card-item bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col items-center text-center"
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                tabIndex={0}
                aria-label={`Explore feature: ${card.title}`}
              >
                <h2 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                  <span aria-hidden="true">{card.emoji}</span> {card.title}
                </h2>

                <p className="mb-4 text-gray-700">{card.desc}</p>

                <Link
                  to={`/guest/${toSlug(card.title)}`}
                  className="mt-auto inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold"
                  aria-label={`Explore ${card.title} feature`}
                >
                  Explore&nbsp;➜
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>




        {/* ADDITIONAL MODULES */}
        <section id="modules" className="section features-section w-full px-6 text-center">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-semibold mb-8">Additional Modules</h3>
            <div className="features-grid mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {additionalModules.map((f) => (
                <div
                  className="feature-card bg-white p-6 rounded-lg shadow-md"
                  key={f}
                >
                  <h4 className="text-lg font-semibold mb-2">{f}</h4>
                  <p className="text-gray-700">
                    {f} ensures flexibility, real‑time alerts and seamless integration with existing ecosystems.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

<footer className="footer">
  <div className="sub-container">
    © {new Date().getFullYear()} IMS. All rights reserved Developed by ElSol.
  </div>
</footer>


      {showWelcomeOverlay && (
        <div className="welcome-overlay" onClick={closeModal}>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Welcome to&nbsp;<span className="highlight">Ikimina&nbsp;Admin</span>
          </motion.h2>
        </div>
      )}

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
