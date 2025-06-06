// src/Components/Profile/Home.js
import React, { useState } from 'react';
import Modal from './Modal';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import '../css/Home.css';
import '../css/Form.css';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const openModal = (contentType) => {
    setModalContent(contentType);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top when closing modal
  };

  return (
    <div className="home-container">
      <div className="welcome-card">
        <h1>Welcome to <span className="highlight">Ikimina Admin</span></h1>
        <p>Manage your members, reports, and finances with ease.</p>

        <div className="action-buttons">
          <button className="form-button" onClick={() => openModal('login')}>
            Login
          </button>
          <button className="form-button green" onClick={() => openModal('register')}>
            Register
          </button>
        </div>

        <div className="forgot-link">
          <p>
            Forgot password?{' '}
            <button className="form-link" onClick={() => openModal('forgot-password')}>
              Reset it here
            </button>
          </p>
        </div>
      </div>

      {/* Modal Area */}
      <Modal isOpen={isModalOpen} closeModal={closeModal}>
        {modalContent === 'login' && (
          <div className="form-section">
            <h2 className="form-title">Login</h2>
            <form className="form-container">
              <label className="form-label">Email</label>
              <input type="email" placeholder="Email" className="form-input" />
              <label className="form-label">Password</label>
              <input type="password" placeholder="Password" className="form-input" />
              <button type="submit" className="form-button">Submit</button>
            </form>
          </div>
        )}

        {modalContent === 'register' && (
          <div className="form-section">
            <h2 className="form-title">Register</h2>
            <Register />
          </div>
        )}

        {modalContent === 'forgot-password' && (
          <div className="form-section">
            <h2 className="form-title">Forgot Password</h2>
            <ForgotPassword />
          </div>
        )}
      </Modal>
    </div>
  );
}
