// src/Components/Profile/Home.js
import React, { useState } from 'react';
import Modal from './Modal';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import Login from './Login'; // Import your custom Login form
import '../CSS/Home.css';
import '../CSS/Form.css';

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const openModal = (contentType) => {
    setModalContent(contentType);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <Login
              switchToRegister={() => setModalContent('register')}
              onCancel={closeModal}
            />
          </div>
        )}

        {modalContent === 'register' && (
          <div className="form-section">
            <Register onCancel={closeModal} />
          </div>
        )}

        {modalContent === 'forgot-password' && (
          <div className="form-section">
            <ForgotPassword onCancel={closeModal} />
          </div>
        )}
      </Modal>
    </div>
  );
}
